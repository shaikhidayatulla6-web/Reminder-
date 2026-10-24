import { SoundOption } from '../types/reminder';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export const SOUND_LABELS: Record<SoundOption, { label: string; description: string }> = {
  CHIME: { label: 'Harmonic Chime', description: 'Warm two-tone harmonic bell' },
  CRYSTAL: { label: 'Crystal Drop', description: 'Crisp high-clarity arpeggio' },
  PULSE: { label: 'Digital Pulse', description: 'Rhythmic modern alert tone' },
  GENTLE_BELL: { label: 'Gentle Bell', description: 'Soft meditative sanctuary bell' },
  MARIMBA: { label: 'Sunrise Marimba', description: 'Upbeat wooden percussion melody' },
  SILENT: { label: 'Silent', description: 'Visual banner and optional vibration only' },
};

export function playNotificationSound(sound: SoundOption): void {
  if (sound === 'SILENT') return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const playTone = (
      freq: number,
      startOffset: number,
      duration: number,
      type: OscillatorType = 'sine',
      gainPeak = 0.16
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + startOffset);

      gain.gain.setValueAtTime(0.0001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(gainPeak, now + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.02);
    };

    switch (sound) {
      case 'CHIME':
        playTone(523.25, 0, 0.35, 'sine', 0.18); // C5
        playTone(659.25, 0.14, 0.45, 'sine', 0.18); // E5
        playTone(783.99, 0.28, 0.6, 'triangle', 0.15); // G5
        break;
      case 'CRYSTAL':
        playTone(880, 0, 0.22, 'sine', 0.15); // A5
        playTone(1108.73, 0.1, 0.25, 'sine', 0.15); // C#6
        playTone(1318.51, 0.2, 0.45, 'sine', 0.16); // E6
        break;
      case 'PULSE':
        playTone(587.33, 0, 0.12, 'triangle', 0.18);
        playTone(587.33, 0.16, 0.12, 'triangle', 0.18);
        playTone(880, 0.32, 0.28, 'triangle', 0.2);
        break;
      case 'GENTLE_BELL':
        playTone(440, 0, 0.85, 'sine', 0.18);
        playTone(880, 0.02, 0.65, 'sine', 0.07);
        break;
      case 'MARIMBA':
        playTone(392.0, 0, 0.15, 'triangle', 0.2); // G4
        playTone(493.88, 0.11, 0.15, 'triangle', 0.2); // B4
        playTone(587.33, 0.22, 0.15, 'triangle', 0.2); // D5
        playTone(783.99, 0.33, 0.32, 'triangle', 0.22); // G5
        break;
    }
  } catch {
    // Ignore audio context autoplay restrictions if triggered without gesture
  }
}

export type HapticInteractionType =
  | 'complete'
  | 'uncomplete'
  | 'snooze'
  | 'create'
  | 'delete'
  | 'tap'
  | 'alarm';

export const HAPTIC_PATTERNS: Record<
  HapticInteractionType,
  { pattern: number[]; label: string; description: string }
> = {
  complete: {
    pattern: [28, 45, 55],
    label: 'Double-Pulse Lock [28, 45, 55]ms',
    description: 'Crisp rising confirmation vibration when completing a reminder',
  },
  uncomplete: {
    pattern: [20],
    label: 'Soft Release [20]ms',
    description: 'Gentle single tap when restoring a reminder to pending',
  },
  snooze: {
    pattern: [35, 50, 25, 50, 20],
    label: 'Ripple Wave [35, 50, 25, 50, 20]ms',
    description: 'Decaying 3-step liquid wave vibration when snoozing an alert',
  },
  create: {
    pattern: [22, 35, 42],
    label: 'Droplet Snap [22, 35, 42]ms',
    description: 'Tactile lock-in pulse when scheduling or duplicating a reminder',
  },
  delete: {
    pattern: [45, 40, 30],
    label: 'Sharp Double-Tap [45, 40, 30]ms',
    description: 'Distinctive double-tap feedback when deleting an item',
  },
  tap: {
    pattern: [12],
    label: 'Micro-Tick [12]ms',
    description: 'Ultra-short crystal tick on widget mode or timer switches',
  },
  alarm: {
    pattern: [180, 90, 220, 90, 260],
    label: 'Resonant Alarm [180, 90, 220, 90, 260]ms',
    description: 'Full multi-burst device alarm vibration when a reminder is due',
  },
};

export function triggerHapticFeedback(
  type: HapticInteractionType,
  enabled = true
): { triggered: boolean; pattern: number[]; label: string } {
  const info = HAPTIC_PATTERNS[type] || HAPTIC_PATTERNS.tap;
  if (!enabled) {
    return { triggered: false, pattern: info.pattern, label: info.label };
  }

  let triggered = false;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      triggered = navigator.vibrate(info.pattern);
    }
  } catch {
    // Ignore unsupported vibration environments
  }

  // Also synthesize a subtle 18ms tactile sub-bass click via Web Audio so desktop/iOS users feel the tactile snap
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'running' && type !== 'alarm') {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const baseFreq =
        type === 'complete'
          ? 210
          : type === 'snooze'
          ? 165
          : type === 'delete'
          ? 125
          : 185;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.025);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  } catch {
    // Ignore audio context state
  }

  return { triggered, pattern: info.pattern, label: info.label };
}

export function triggerDeviceVibration(enabled: boolean): void {
  triggerHapticFeedback('alarm', enabled);
}

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch {
    return false;
  }
}

export function sendSystemNotification(
  title: string,
  body: string,
  tag: string,
  vibrationEnabled = true
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const vibratePattern = vibrationEnabled ? [180, 90, 220, 90, 260] : undefined;

  // Prefer ServiceWorkerRegistration.showNotification (required by Android Chrome Notification Bar)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        if (reg && typeof reg.showNotification === 'function') {
          return reg.showNotification(title, {
            body,
            tag,
            requireInteraction: true,
            vibrate: vibratePattern,
            data: { reminderId: tag },
            actions: [
              { action: 'done', title: '✓ Mark as Done' },
              { action: 'snooze-10', title: '⏰ Snooze 10m' },
            ],
          } as NotificationOptions);
        }
        // Fallback to standard desktop Notification constructor
        new Notification(title, {
          body,
          tag,
          requireInteraction: true,
        });
      })
      .catch(() => {
        try {
          new Notification(title, {
            body,
            tag,
            requireInteraction: true,
          });
        } catch {
          // Handled by in-app SystemNotificationBar
        }
      });
    return;
  }

  try {
    new Notification(title, {
      body,
      tag,
      requireInteraction: true,
    });
  } catch {
    // Fallback handled by in-app SystemNotificationBar
  }
}

let engineInitialized = false;

/**
 * Automatically initializes the RemindMe notification & audio engine.
 * Registers the Service Worker for Android Notification Bar support,
 * unlocks Web Audio API, and requests system notification permission on first interaction.
 */
export function autoInitializeNotificationEngine(
  onStatusReady?: (granted: boolean) => void
): void {
  if (typeof window === 'undefined' || engineInitialized) return;
  engineInitialized = true;

  // Register Service Worker for Android Notification Bar alerts
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignore if service worker registration is restricted in environment
    });
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    onStatusReady?.(true);
  }

  const unlockOnFirstGesture = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch {
      // Ignore
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
        .then((res) => {
          onStatusReady?.(res === 'granted');
        })
        .catch(() => {});
    } else {
      onStatusReady?.(true);
    }

    window.removeEventListener('pointerdown', unlockOnFirstGesture);
    window.removeEventListener('keydown', unlockOnFirstGesture);
  };

  window.addEventListener('pointerdown', unlockOnFirstGesture, { passive: true });
  window.addEventListener('keydown', unlockOnFirstGesture, { passive: true });
}

