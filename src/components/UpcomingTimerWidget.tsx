import React, { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Layers,
  Radio,
  Repeat,
  Sparkles,
  Timer,
  Vibrate,
  Zap,
} from 'lucide-react';
import {
  Reminder,
  ReminderCategory,
  SnoozeDuration,
} from '../types/reminder';
import {
  computeCountdownParts,
  formatReminderDate,
  formatReminderTime,
  formatRepeatRule,
  getEffectiveTriggerTime,
} from '../utils/reminderLogic';
import {
  HAPTIC_PATTERNS,
  HapticInteractionType,
  SOUND_LABELS,
  triggerHapticFeedback,
} from '../utils/soundAndNotifications';

interface UpcomingTimerWidgetProps {
  reminders: Reminder[];
  categories: ReminderCategory[];
  use24Hour: boolean;
  vibrationEnabled: boolean;
  lastHapticEvent: { type: HapticInteractionType; label: string; timestamp: number } | null;
  onToggleComplete: (reminder: Reminder) => void;
  onSnooze: (reminder: Reminder, minutes: SnoozeDuration) => void;
  onTriggerTestAlarm: (reminder: Reminder) => void;
  onSelectDetail: (reminder: Reminder) => void;
  onOpenAddModal: () => void;
}

type WidgetStyleMode = 'reactor' | 'chrono' | 'radar';

export const UpcomingTimerWidget: React.FC<UpcomingTimerWidgetProps> = ({
  reminders,
  categories,
  use24Hour,
  vibrationEnabled,
  lastHapticEvent,
  onToggleComplete,
  onSnooze,
  onTriggerTestAlarm,
  onSelectDetail,
  onOpenAddModal,
}) => {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [widgetMode, setWidgetMode] = useState<WidgetStyleMode>('reactor');
  const [localHapticLabel, setLocalHapticLabel] = useState<string>(
    HAPTIC_PATTERNS.complete.label
  );
  const [hapticPulseActive, setHapticPulseActive] = useState<boolean>(false);

  // Tick every 1000ms for live countdown precision
  useEffect(() => {
    const id = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Sync external haptic feedback events into the widget's live waveform indicator
  useEffect(() => {
    if (!lastHapticEvent) return;
    setLocalHapticLabel(lastHapticEvent.label);
    setHapticPulseActive(true);
    const t = setTimeout(() => setHapticPulseActive(false), 900);
    return () => clearTimeout(t);
  }, [lastHapticEvent]);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Prioritize upcoming future reminders first so the live timer is actively counting down,
  // followed by any overdue pending reminders.
  const pendingReminders = reminders.filter((r) => !r.isCompleted);
  const futureUpcoming = pendingReminders
    .filter((r) => Date.parse(getEffectiveTriggerTime(r)) > nowMs)
    .sort(
      (a, b) =>
        Date.parse(getEffectiveTriggerTime(a)) - Date.parse(getEffectiveTriggerTime(b))
    );
  const overduePending = pendingReminders
    .filter((r) => Date.parse(getEffectiveTriggerTime(r)) <= nowMs)
    .sort(
      (a, b) =>
        Date.parse(getEffectiveTriggerTime(b)) - Date.parse(getEffectiveTriggerTime(a))
    );

  const orderedQueue = [...futureUpcoming, ...overduePending];
  const safeIndex =
    orderedQueue.length > 0 ? Math.min(selectedIndex, orderedQueue.length - 1) : 0;
  const activeReminder = orderedQueue[safeIndex] || null;

  const fireLocalHaptic = (type: HapticInteractionType) => {
    const res = triggerHapticFeedback(type, vibrationEnabled);
    setLocalHapticLabel(res.label);
    setHapticPulseActive(true);
    setTimeout(() => setHapticPulseActive(false), 850);
  };

  if (!activeReminder) {
    return (
      <section
        aria-label="Upcoming Reminder Live Timer Widget"
        className="rounded-[32px] liquid-glass p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl origin-droplet-badge flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              OriginOS 7 Atomic Countdown Widget
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No pending reminders in queue. Schedule a reminder to activate the live hydro-glass countdown core.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            fireLocalHaptic('create');
            onOpenAddModal();
          }}
          className="px-4 py-2.5 rounded-xl liquid-btn-primary text-white text-xs font-semibold"
        >
          Schedule Reminder
        </button>
      </section>
    );
  }

  const countdown = computeCountdownParts(activeReminder, nowMs);
  const category = categoryMap.get(activeReminder.categoryId);
  const catColor = category?.colorHex || '#2563EB';
  const effectiveIso = getEffectiveTriggerTime(activeReminder);
  const pad = (n: number) => String(n).padStart(2, '0');

  // SVG Ring geometry (radius 54 -> circumference ~ 339.29)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (countdown.progressPercent / 100) * circumference;

  // Seconds progress (0..59) for smooth 60-tick pulse bar
  const secondsRatio = countdown.isOverdue
    ? 100
    : Math.round(((60 - countdown.seconds) / 60) * 100);

  return (
    <section
      aria-label="OriginOS 7 Live Upcoming Reminder Timer Widget"
      className="rounded-[32px] liquid-glass p-5 sm:p-7 space-y-5 relative overflow-hidden"
    >
      {/* Ambient Category Color Refraction Glow inside Widget */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-20 w-72 h-72 rounded-full blur-3xl opacity-25 dark:opacity-35 transition-colors duration-500"
        style={{ backgroundColor: catColor }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-20 w-72 h-72 rounded-full blur-3xl opacity-20 dark:opacity-30 bg-cyan-400"
      />

      {/* Top Widget Header Bar: OriginOS 7 Atomic Identity + Mode Switcher + Queue Cycler */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-white/60 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full origin-atomic-capsule text-white text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>OriginOS 7 Atomic Chrono Widget</span>
          </div>

          {/* Haptic Vibration API Live Telemetry Indicator */}
          <button
            type="button"
            onClick={() => fireLocalHaptic('complete')}
            title="Click to test tactile Vibration API pulse"
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
              hapticPulseActive
                ? 'bg-blue-600 text-white scale-[1.02] shadow-sm'
                : 'liquid-glass-input text-slate-600 dark:text-slate-300'
            }`}
          >
            <Vibrate
              className={`w-3.5 h-3.5 ${
                hapticPulseActive ? 'text-cyan-200 animate-bounce' : 'text-blue-600 dark:text-blue-400'
              }`}
            />
            <span className="tabular-nums">Haptic: {localHapticLabel}</span>
          </button>
        </div>

        {/* Right Controls: 3 Widget Visual Styles + Prev/Next Queue Cycler */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            role="group"
            aria-label="Widget visual style mode"
            className="inline-flex items-center p-1 rounded-xl liquid-glass-input gap-1"
          >
            <button
              type="button"
              onClick={() => {
                fireLocalHaptic('tap');
                setWidgetMode('reactor');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                widgetMode === 'reactor'
                  ? 'liquid-btn-primary text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hydro Core
            </button>
            <button
              type="button"
              onClick={() => {
                fireLocalHaptic('tap');
                setWidgetMode('chrono');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                widgetMode === 'chrono'
                  ? 'liquid-btn-primary text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Flip Chrono
            </button>
            <button
              type="button"
              onClick={() => {
                fireLocalHaptic('tap');
                setWidgetMode('radar');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                widgetMode === 'radar'
                  ? 'liquid-btn-primary text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Queue Radar
            </button>
          </div>

          {orderedQueue.length > 1 && (
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous upcoming reminder in timer widget"
                onClick={() => {
                  fireLocalHaptic('tap');
                  setSelectedIndex((prev) =>
                    prev <= 0 ? orderedQueue.length - 1 : prev - 1
                  );
                }}
                className="w-8 h-8 rounded-xl liquid-btn-secondary flex items-center justify-center text-slate-700 dark:text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-1.5 tabular-nums">
                {safeIndex + 1}/{orderedQueue.length}
              </span>
              <button
                type="button"
                aria-label="Next upcoming reminder in timer widget"
                onClick={() => {
                  fireLocalHaptic('tap');
                  setSelectedIndex((prev) =>
                    prev >= orderedQueue.length - 1 ? 0 : prev + 1
                  );
                }}
                className="w-8 h-8 rounded-xl liquid-btn-secondary flex items-center justify-center text-slate-700 dark:text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Widget Body: Adapts to 'reactor' | 'chrono' | 'radar' */}
      {widgetMode === 'reactor' && (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Col 1-3: 3D Liquid Hydro Sphere + SVG Orbital Progress Ring */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              {/* Outer Glowing SVG Orbital Ring */}
              <svg
                className="absolute inset-0 w-full h-full -rotate-90 transform pointer-events-none"
                viewBox="0 0 128 128"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="originLiquidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="50%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-200/70 dark:text-slate-800/80"
                />
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  fill="none"
                  stroke="url(#originLiquidGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              {/* Inner 3D Hydro-Glass Sphere with Rising Liquid Wave Fill */}
              <div className="w-24 h-24 rounded-full overflow-hidden origin-droplet-badge flex flex-col items-center justify-center bg-white/55 dark:bg-slate-900/65">
                <div
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out opacity-35 dark:opacity-45"
                  style={{
                    height: `${countdown.progressPercent}%`,
                    background: `linear-gradient(180deg, #06B6D4 0%, ${catColor} 100%)`,
                  }}
                />
                <span className="relative z-10 text-2xl select-none">
                  {category?.emoji || '🔔'}
                </span>
                <span className="relative z-10 text-xs font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {countdown.isOverdue ? 'DUE NOW' : `${countdown.progressPercent}%`}
                </span>
                <span className="relative z-10 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  {countdown.isOverdue ? 'Overdue' : 'Elapsed'}
                </span>
              </div>
            </div>
          </div>

          {/* Col 4-8: Live Ticking Digital Countdown Blocks + Reminder Details */}
          <div className="lg:col-span-5 space-y-3 text-center lg:text-left">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-2 gap-y-1 text-xs font-semibold">
                <span style={{ color: catColor }}>
                  {category?.emoji} {category?.name || 'Reminder'}
                </span>
                <span className="text-slate-400" aria-hidden="true">·</span>
                <span
                  className={
                    countdown.isOverdue
                      ? 'text-rose-600 dark:text-rose-400 font-bold'
                      : 'text-blue-600 dark:text-blue-400'
                  }
                >
                  {countdown.isOverdue ? 'Overdue Elapsed Timer' : 'Live Upcoming Countdown'}
                </span>
                <span className="text-slate-400" aria-hidden="true">·</span>
                <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                  {formatReminderDate(effectiveIso)}, {formatReminderTime(effectiveIso, use24Hour)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  fireLocalHaptic('tap');
                  onSelectDetail(activeReminder);
                }}
                className="text-left focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {activeReminder.title}
                </h2>
              </button>
            </div>

            {/* 4 Sculptural Frosted Liquid Time Capsules (DAYS / HRS / MIN / SEC) */}
            <div className="grid grid-cols-4 gap-2.5 max-w-md mx-auto lg:mx-0">
              <div className="p-2.5 sm:p-3 rounded-2xl liquid-glass-interactive text-center">
                <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {pad(countdown.days)}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                  Days
                </p>
              </div>

              <div className="p-2.5 sm:p-3 rounded-2xl liquid-glass-interactive text-center">
                <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {pad(countdown.hours)}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                  Hours
                </p>
              </div>

              <div className="p-2.5 sm:p-3 rounded-2xl liquid-glass-interactive text-center">
                <p className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums tracking-tight">
                  {pad(countdown.minutes)}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                  Mins
                </p>
              </div>

              <div className="p-2.5 sm:p-3 rounded-2xl liquid-glass-interactive text-center ring-1 ring-cyan-500/40">
                <p className="text-xl sm:text-2xl font-extrabold text-cyan-600 dark:text-cyan-400 tabular-nums tracking-tight">
                  {pad(countdown.seconds)}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mt-0.5">
                  Secs
                </p>
              </div>
            </div>

            {/* Unboxed Metadata Line */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                {formatRepeatRule(activeReminder)}
              </span>
              <span aria-hidden="true">·</span>
              <span>Priority: {activeReminder.priority}</span>
              <span aria-hidden="true">·</span>
              <span>Tone: {SOUND_LABELS[activeReminder.sound].label}</span>
            </div>
          </div>

          {/* Col 9-12: Tactile Haptic Quick-Control Deck */}
          <div className="lg:col-span-4 rounded-2xl liquid-glass-input p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Tactile Haptic Controls
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                {countdown.formattedClock}
              </span>
            </div>

            {/* Haptic Time-Shift / Snooze Buttons */}
            <div className="space-y-1.5">
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Shift / Snooze Countdown Timer (Haptic Ripple):
              </span>
              <div className="grid grid-cols-3 gap-2">
                {([5, 10, 15] as SnoozeDuration[]).map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      fireLocalHaptic('snooze');
                      onSnooze(activeReminder, mins);
                    }}
                    className="py-2 px-2.5 rounded-xl liquid-btn-secondary text-xs font-semibold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 tabular-nums"
                  >
                    +{mins}m
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  fireLocalHaptic('alarm');
                  onTriggerTestAlarm(activeReminder);
                }}
                className="py-2.5 px-3 rounded-xl liquid-btn-secondary text-xs font-semibold text-blue-600 dark:text-blue-400 inline-flex items-center justify-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                Fire Alert
              </button>

              <button
                type="button"
                onClick={() => {
                  fireLocalHaptic('complete');
                  onToggleComplete(activeReminder);
                }}
                className="py-2.5 px-3 rounded-xl liquid-btn-primary text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Split-Glass Chrono Flip Deck */}
      {widgetMode === 'chrono' && (
        <div className="relative z-10 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl origin-droplet-badge flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: `${catColor}22`, color: catColor }}
              >
                {category?.emoji || '🔔'}
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: catColor }}>
                  {category?.name} · Due {formatReminderDate(effectiveIso)} at{' '}
                  {formatReminderTime(effectiveIso, use24Hour)}
                </p>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {activeReminder.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {([5, 10, 15] as SnoozeDuration[]).map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    fireLocalHaptic('snooze');
                    onSnooze(activeReminder, mins);
                  }}
                  className="px-3 py-2 rounded-xl liquid-btn-secondary text-xs font-semibold text-slate-800 dark:text-slate-200 tabular-nums"
                >
                  Snooze +{mins}m
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  fireLocalHaptic('complete');
                  onToggleComplete(activeReminder);
                }}
                className="px-4 py-2 rounded-xl liquid-btn-primary text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Done
              </button>
            </div>
          </div>

          {/* Giant Split-Flap Frosted Glass Digital Chrono Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-[26px] liquid-glass-interactive p-5 text-center relative overflow-hidden">
              <div className="inset-x-0 top-1/2 h-px bg-slate-300/50 dark:bg-white/10 absolute" />
              <p className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight relative z-10">
                {pad(countdown.days * 24 + countdown.hours)}
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1.5">
                Total Hours
              </p>
            </div>

            <div className="rounded-[26px] liquid-glass-interactive p-5 text-center relative overflow-hidden">
              <div className="inset-x-0 top-1/2 h-px bg-slate-300/50 dark:bg-white/10 absolute" />
              <p className="text-3xl sm:text-5xl font-black text-blue-600 dark:text-blue-400 tabular-nums tracking-tight relative z-10">
                {pad(countdown.minutes)}
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1.5">
                Minutes
              </p>
            </div>

            <div className="rounded-[26px] liquid-glass-interactive p-5 text-center relative overflow-hidden ring-1 ring-cyan-500/40">
              <div className="inset-x-0 top-1/2 h-px bg-cyan-400/30 absolute" />
              <p className="text-3xl sm:text-5xl font-black text-cyan-600 dark:text-cyan-400 tabular-nums tracking-tight relative z-10">
                {pad(countdown.seconds)}
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mt-1.5">
                Seconds
              </p>
            </div>
          </div>

          {/* 60-Second Liquid Wave Progress Strip */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
              <span>Minute Cycle Sweep</span>
              <span>{60 - countdown.seconds}s / 60s</span>
            </div>
            <div className="w-full h-2.5 rounded-full liquid-glass-input overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-purple-500 transition-all duration-500"
                style={{ width: `${secondsRatio}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mode 3: Multi-Reminder Queue Radar Matrix */}
      {widgetMode === 'radar' && (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {orderedQueue.slice(0, 3).map((item, idx) => {
            const itemParts = computeCountdownParts(item, nowMs);
            const itemCat = categoryMap.get(item.categoryId);
            const isSelected = item.id === activeReminder.id;
            return (
              <div
                key={item.id}
                onClick={() => {
                  fireLocalHaptic('tap');
                  setSelectedIndex(idx);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fireLocalHaptic('tap');
                    setSelectedIndex(idx);
                  }
                }}
                className={`p-4 rounded-2xl liquid-glass-interactive cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected ? 'ring-2 ring-blue-500/80' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-9 h-9 rounded-xl origin-droplet-badge flex items-center justify-center text-base shrink-0"
                      style={{
                        backgroundColor: `${itemCat?.colorHex || '#2563EB'}22`,
                        color: itemCat?.colorHex || '#2563EB',
                      }}
                    >
                      {itemCat?.emoji || '🔔'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        {formatReminderDate(getEffectiveTriggerTime(item))},{' '}
                        {formatReminderTime(getEffectiveTriggerTime(item), use24Hour)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/50 dark:border-white/10">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      {itemParts.isOverdue ? 'Overdue By' : 'Time Remaining'}
                    </span>
                    <span
                      className={`text-lg font-extrabold tabular-nums ${
                        itemParts.isOverdue
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {itemParts.days > 0 ? `${itemParts.days}d ` : ''}
                      {itemParts.formattedClock}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fireLocalHaptic('snooze');
                        onSnooze(item, 10);
                      }}
                      className="px-2.5 py-1.5 rounded-lg liquid-btn-secondary text-[11px] font-semibold text-slate-700 dark:text-slate-200 tabular-nums"
                    >
                      +10m
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fireLocalHaptic('complete');
                        onToggleComplete(item);
                      }}
                      className="px-2.5 py-1.5 rounded-lg liquid-btn-primary text-white text-[11px] font-semibold"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
