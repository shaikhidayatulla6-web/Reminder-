import {
  CustomIntervalUnit,
  FilterCriteria,
  Priority,
  Reminder,
  ReminderCategory,
  RepeatType,
  SnoozeDuration,
  SoundOption,
} from '../types/reminder';

export interface SmartNotificationPreset {
  sound: SoundOption;
  priority: Priority;
  vibrationEnabled: boolean;
  snoozeMinutes: SnoozeDuration;
  channelName: string;
  reason: string;
}

/**
 * Automatically determines optimal notification sound, priority, vibration,
 * snooze duration, and Android notification channel based on category and title.
 */
export function getSmartNotificationPreset(
  categoryId: string,
  title = ''
): SmartNotificationPreset {
  const lower = title.toLowerCase();
  const isUrgentKeyword =
    lower.includes('urgent') ||
    lower.includes('asap') ||
    lower.includes('emergency') ||
    lower.includes('critical') ||
    lower.includes('deadline');

  let preset: SmartNotificationPreset;

  switch (categoryId) {
    case 'cat-water':
      preset = {
        sound: 'CRYSTAL',
        priority: 'MEDIUM',
        vibrationEnabled: true,
        snoozeMinutes: 15,
        channelName: 'Hydration & Wellness',
        reason: 'Crystal Drop tone + 15m snooze auto-tuned for hydration',
      };
      break;
    case 'cat-medicine':
      preset = {
        sound: 'PULSE',
        priority: 'HIGH',
        vibrationEnabled: true,
        snoozeMinutes: 5,
        channelName: 'Medical & Dosage Alerts',
        reason: 'Digital Pulse + High Priority + 5m snooze for timely medication',
      };
      break;
    case 'cat-bills':
      preset = {
        sound: 'PULSE',
        priority: 'HIGH',
        vibrationEnabled: true,
        snoozeMinutes: 30,
        channelName: 'Bills & Financial Deadlines',
        reason: 'Digital Pulse + High Priority so payments are never missed',
      };
      break;
    case 'cat-work':
    case 'cat-appointments':
      preset = {
        sound: 'CHIME',
        priority: 'HIGH',
        vibrationEnabled: true,
        snoozeMinutes: 10,
        channelName: 'Work & Schedule',
        reason: 'Harmonic Chime + High Priority + Vibration for schedule accuracy',
      };
      break;
    case 'cat-study':
    case 'cat-personal':
      preset = {
        sound: 'GENTLE_BELL',
        priority: 'MEDIUM',
        vibrationEnabled: false,
        snoozeMinutes: 15,
        channelName: 'Focus & Mindfulness',
        reason: 'Gentle Sanctuary Bell with silent vibration for calm focus',
      };
      break;
    case 'cat-birthdays':
    case 'cat-family':
    case 'cat-fitness':
      preset = {
        sound: 'MARIMBA',
        priority: 'HIGH',
        vibrationEnabled: true,
        snoozeMinutes: 15,
        channelName: 'Life, Fitness & Celebrations',
        reason: 'Upbeat Sunrise Marimba + Vibration for active events',
      };
      break;
    default:
      preset = {
        sound: 'CHIME',
        priority: 'MEDIUM',
        vibrationEnabled: true,
        snoozeMinutes: 10,
        channelName: 'General Smart Reminders',
        reason: 'Balanced Harmonic Chime + Vibration auto-configured',
      };
      break;
  }

  // Keyword overrides from title
  if (lower.includes('water') || lower.includes('hydrate') || lower.includes('drink')) {
    preset.sound = 'CRYSTAL';
    preset.channelName = 'Hydration & Wellness';
  } else if (
    lower.includes('medicine') ||
    lower.includes('vitamin') ||
    lower.includes('pill') ||
    lower.includes('tablet') ||
    lower.includes('insulin')
  ) {
    preset.sound = 'PULSE';
    preset.priority = 'HIGH';
    preset.vibrationEnabled = true;
    preset.snoozeMinutes = 5;
    preset.channelName = 'Medical & Dosage Alerts';
  }

  if (isUrgentKeyword) {
    preset.priority = 'URGENT';
    preset.sound = 'PULSE';
    preset.vibrationEnabled = true;
    preset.snoozeMinutes = 5;
    preset.reason = 'Urgent keyword detected — upgraded to Urgent Pulse + 5m snooze';
  }

  return preset;
}

export const DEFAULT_CATEGORIES: ReminderCategory[] = [
  { id: 'cat-water', name: 'Water Drinking', emoji: '💧', colorHex: '#06B6D4', isDefault: true },
  { id: 'cat-medicine', name: 'Medicine', emoji: '💊', colorHex: '#EF4444', isDefault: true },
  { id: 'cat-study', name: 'Study', emoji: '📚', colorHex: '#8B5CF6', isDefault: true },
  { id: 'cat-work', name: 'Work', emoji: '💼', colorHex: '#2563EB', isDefault: true },
  { id: 'cat-fitness', name: 'Fitness', emoji: '🏋️', colorHex: '#22C55E', isDefault: true },
  { id: 'cat-food', name: 'Food', emoji: '🍽️', colorHex: '#F59E0B', isDefault: true },
  { id: 'cat-birthdays', name: 'Birthdays', emoji: '🎂', colorHex: '#EC4899', isDefault: true },
  { id: 'cat-bills', name: 'Bills and Payments', emoji: '💰', colorHex: '#10B981', isDefault: true },
  { id: 'cat-shopping', name: 'Shopping', emoji: '🛒', colorHex: '#F97316', isDefault: true },
  { id: 'cat-personal', name: 'Personal Care', emoji: '🧘', colorHex: '#14B8A6', isDefault: true },
  { id: 'cat-appointments', name: 'Appointments', emoji: '📅', colorHex: '#6366F1', isDefault: true },
  { id: 'cat-family', name: 'Family', emoji: '❤️', colorHex: '#F43F5E', isDefault: true },
  { id: 'cat-other', name: 'Other', emoji: '🔔', colorHex: '#64748B', isDefault: true },
];

export const PRIORITY_WEIGHT: Record<Priority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

/**
 * Validates reminder input before saving.
 */
export function validateReminderInput(input: {
  title: string;
  scheduledAt: string;
  repeatType: RepeatType;
  selectedWeekdays?: number[];
  customIntervalValue?: number;
  endDate?: string | null;
}): { valid: boolean; error?: string } {
  const trimmedTitle = input.title.trim();
  if (!trimmedTitle) {
    return { valid: false, error: 'Reminder title is required.' };
  }
  if (trimmedTitle.length > 140) {
    return { valid: false, error: 'Reminder title must be 140 characters or fewer.' };
  }
  const scheduledMs = Date.parse(input.scheduledAt);
  if (Number.isNaN(scheduledMs)) {
    return { valid: false, error: 'Please select a valid date and time.' };
  }
  if (input.repeatType === 'WEEKDAYS') {
    if (!input.selectedWeekdays || input.selectedWeekdays.length === 0) {
      return { valid: false, error: 'Select at least one weekday for weekday repetition.' };
    }
  }
  if (input.repeatType === 'CUSTOM') {
    if (!input.customIntervalValue || input.customIntervalValue < 1) {
      return { valid: false, error: 'Custom repeat interval must be at least 1.' };
    }
  }
  if (input.endDate) {
    const endMs = Date.parse(input.endDate);
    if (!Number.isNaN(endMs) && endMs < scheduledMs) {
      return { valid: false, error: 'End date cannot be earlier than the scheduled start date.' };
    }
  }
  return { valid: true };
}

/**
 * Computes the next scheduled ISO timestamp for a recurring reminder.
 * Returns null if the reminder does not repeat ('ONCE') or if the next occurrence exceeds endDate.
 */
export function calculateNextOccurrence(
  currentScheduledIso: string,
  repeatType: RepeatType,
  options?: {
    selectedWeekdays?: number[];
    customIntervalValue?: number;
    customIntervalUnit?: CustomIntervalUnit;
    endDate?: string | null;
    referenceNowIso?: string;
  }
): string | null {
  if (repeatType === 'ONCE') {
    return null;
  }

  const baseDate = new Date(currentScheduledIso);
  if (Number.isNaN(baseDate.getTime())) {
    return null;
  }

  const refNow = options?.referenceNowIso ? new Date(options.referenceNowIso) : new Date();
  let nextDate = new Date(baseDate.getTime());

  const stepForwardOnce = (d: Date): Date => {
    const copy = new Date(d.getTime());
    switch (repeatType) {
      case 'HOURLY':
        copy.setHours(copy.getHours() + 1);
        break;
      case 'DAILY':
        copy.setDate(copy.getDate() + 1);
        break;
      case 'WEEKLY':
        copy.setDate(copy.getDate() + 7);
        break;
      case 'MONTHLY': {
        const originalDay = copy.getDate();
        copy.setMonth(copy.getMonth() + 1);
        // Handle month rollover (e.g. Jan 31 -> Feb 28)
        if (copy.getDate() !== originalDay) {
          copy.setDate(0);
        }
        break;
      }
      case 'YEARLY':
        copy.setFullYear(copy.getFullYear() + 1);
        break;
      case 'WEEKDAYS': {
        const weekdays =
          options?.selectedWeekdays && options.selectedWeekdays.length > 0
            ? [...options.selectedWeekdays].sort((a, b) => a - b)
            : [1, 2, 3, 4, 5];
        for (let i = 1; i <= 7; i++) {
          const candidate = new Date(copy.getTime());
          candidate.setDate(candidate.getDate() + i);
          if (weekdays.includes(candidate.getDay())) {
            return candidate;
          }
        }
        copy.setDate(copy.getDate() + 1);
        break;
      }
      case 'CUSTOM': {
        const val = Math.max(1, options?.customIntervalValue ?? 1);
        const unit = options?.customIntervalUnit ?? 'DAYS';
        if (unit === 'MINUTES') {
          copy.setMinutes(copy.getMinutes() + val);
        } else if (unit === 'HOURS') {
          copy.setHours(copy.getHours() + val);
        } else if (unit === 'DAYS') {
          copy.setDate(copy.getDate() + val);
        } else if (unit === 'WEEKS') {
          copy.setDate(copy.getDate() + val * 7);
        }
        break;
      }
      default:
        return copy;
    }
    return copy;
  };

  nextDate = stepForwardOnce(nextDate);

  // Advance past referenceNowIso if needed (capped at 500 iterations for safety)
  let safety = 0;
  while (nextDate.getTime() <= refNow.getTime() && safety < 500) {
    nextDate = stepForwardOnce(nextDate);
    safety++;
  }

  if (options?.endDate) {
    // End of the endDate day in local/ISO time
    const endLimit = new Date(options.endDate);
    if (!Number.isNaN(endLimit.getTime())) {
      // If endDate is YYYY-MM-DD (length 10), treat end of that day as limit
      if (options.endDate.length === 10) {
        endLimit.setHours(23, 59, 59, 999);
      }
      if (nextDate.getTime() > endLimit.getTime()) {
        return null;
      }
    }
  }

  return nextDate.toISOString();
}

/**
 * Computes snooze target timestamp from a reference timestamp.
 */
export function calculateSnoozeUntil(
  durationMinutes: SnoozeDuration,
  referenceNowIso?: string
): string {
  const base = referenceNowIso ? new Date(referenceNowIso) : new Date();
  return new Date(base.getTime() + durationMinutes * 60_000).toISOString();
}

/**
 * Returns the effective trigger time of a reminder (snoozedUntil if active, otherwise scheduledAt).
 */
export function getEffectiveTriggerTime(reminder: Reminder): string {
  if (reminder.snoozedUntil) {
    return reminder.snoozedUntil;
  }
  return reminder.scheduledAt;
}

/**
 * Determines whether a reminder is overdue relative to referenceNow.
 */
export function isReminderOverdue(reminder: Reminder, referenceNowIso?: string): boolean {
  if (reminder.isCompleted) return false;
  const nowMs = referenceNowIso ? Date.parse(referenceNowIso) : Date.now();
  const triggerMs = Date.parse(getEffectiveTriggerTime(reminder));
  return !Number.isNaN(triggerMs) && triggerMs < nowMs;
}

/**
 * Checks if two ISO dates fall on the same local calendar day (YYYY-MM-DD).
 */
export function toLocalDateKey(isoString: string): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface DashboardMetrics {
  total: number;
  todayCount: number;
  upcomingCount: number;
  completedCount: number;
  overdueCount: number;
  todayCompletionRate: number;
}

/**
 * Calculates Dashboard counters and daily progress statistics.
 */
export function computeDashboardMetrics(
  reminders: Reminder[],
  referenceNowIso?: string
): DashboardMetrics {
  const nowIso = referenceNowIso ?? new Date().toISOString();
  const todayKey = toLocalDateKey(nowIso);

  let todayCount = 0;
  let upcomingCount = 0;
  let completedCount = 0;
  let overdueCount = 0;
  let todayTotalScheduled = 0;
  let todayCompletedScheduled = 0;

  for (const r of reminders) {
    const rDateKey = toLocalDateKey(getEffectiveTriggerTime(r));
    const isToday = rDateKey === todayKey;

    if (isToday) {
      todayTotalScheduled++;
      if (r.isCompleted) {
        todayCompletedScheduled++;
      }
    }

    if (r.isCompleted) {
      completedCount++;
      continue;
    }

    const overdue = isReminderOverdue(r, nowIso);
    if (overdue) {
      overdueCount++;
    }

    if (isToday) {
      todayCount++;
    } else if (Date.parse(getEffectiveTriggerTime(r)) > Date.parse(nowIso)) {
      upcomingCount++;
    }
  }

  const todayCompletionRate =
    todayTotalScheduled > 0
      ? Math.round((todayCompletedScheduled / todayTotalScheduled) * 100)
      : completedCount > 0
      ? 100
      : 0;

  return {
    total: reminders.length,
    todayCount,
    upcomingCount,
    completedCount,
    overdueCount,
    todayCompletionRate,
  };
}

/**
 * Filters and sorts reminders according to FilterCriteria.
 */
export function filterAndSortReminders(
  reminders: Reminder[],
  criteria: FilterCriteria,
  referenceNowIso?: string
): Reminder[] {
  const nowIso = referenceNowIso ?? new Date().toISOString();
  const queryLower = criteria.query.trim().toLowerCase();

  const filtered = reminders.filter((r) => {
    if (queryLower) {
      const matchTitle = r.title.toLowerCase().includes(queryLower);
      const matchDesc = r.description.toLowerCase().includes(queryLower);
      if (!matchTitle && !matchDesc) return false;
    }

    if (criteria.categoryId !== 'ALL' && r.categoryId !== criteria.categoryId) {
      return false;
    }

    if (criteria.priority !== 'ALL' && r.priority !== criteria.priority) {
      return false;
    }

    if (criteria.dateFilter !== 'ALL') {
      const dateKey = toLocalDateKey(getEffectiveTriggerTime(r));
      if (dateKey !== criteria.dateFilter) return false;
    }

    if (criteria.status !== 'ALL') {
      const overdue = isReminderOverdue(r, nowIso);
      if (criteria.status === 'COMPLETED' && !r.isCompleted) return false;
      if (criteria.status === 'OVERDUE' && !overdue) return false;
      if (criteria.status === 'PENDING' && (r.isCompleted || overdue)) return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    if (criteria.sortBy === 'CREATED_DATE') {
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    }
    if (criteria.sortBy === 'PRIORITY') {
      const diff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (diff !== 0) return diff;
    }
    // Default: UPCOMING_TIME
    return (
      Date.parse(getEffectiveTriggerTime(a)) - Date.parse(getEffectiveTriggerTime(b))
    );
  });
}

/**
 * Formats repeat rule into human-readable description.
 */
export function formatRepeatRule(reminder: Pick<
  Reminder,
  'repeatType' | 'selectedWeekdays' | 'customIntervalValue' | 'customIntervalUnit' | 'endDate'
>): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let base = 'One-time';
  switch (reminder.repeatType) {
    case 'ONCE':
      base = 'One-time';
      break;
    case 'HOURLY':
      base = 'Every hour';
      break;
    case 'DAILY':
      base = 'Every day';
      break;
    case 'WEEKLY':
      base = 'Every week';
      break;
    case 'MONTHLY':
      base = 'Every month';
      break;
    case 'YEARLY':
      base = 'Every year';
      break;
    case 'WEEKDAYS': {
      const days = (reminder.selectedWeekdays || [])
        .slice()
        .sort((a, b) => a - b)
        .map((d) => dayNames[d])
        .join(', ');
      base = days ? `Every ${days}` : 'Selected weekdays';
      break;
    }
    case 'CUSTOM': {
      const unitLabel = reminder.customIntervalUnit.toLowerCase();
      base = `Every ${reminder.customIntervalValue} ${
        reminder.customIntervalValue === 1 ? unitLabel.slice(0, -1) : unitLabel
      }`;
      break;
    }
  }
  if (reminder.endDate && reminder.repeatType !== 'ONCE') {
    return `${base} (until ${reminder.endDate.slice(0, 10)})`;
  }
  return base;
}

/**
 * Formats time respecting 12h or 24h user preference.
 */
export function formatReminderTime(isoString: string, use24Hour: boolean): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24Hour,
  });
}

/**
 * Formats date for cards.
 */
export function formatReminderDate(isoString: string, referenceNowIso?: string): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return 'Invalid Date';
  const now = referenceNowIso ? new Date(referenceNowIso) : new Date();
  const targetKey = toLocalDateKey(isoString);
  const todayKey = toLocalDateKey(now.toISOString());

  const tomorrow = new Date(now.getTime());
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = toLocalDateKey(tomorrow.toISOString());

  if (targetKey === todayKey) return 'Today';
  if (targetKey === tomorrowKey) return 'Tomorrow';

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export interface CountdownParts {
  totalRemainingMs: number;
  isOverdue: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formattedClock: string;
  progressPercent: number;
}

/**
 * Computes exact live countdown breakdown (days, hours, minutes, seconds, progressPercent)
 * from referenceNowMs to a reminder's effective trigger time.
 */
export function computeCountdownParts(
  reminder: Pick<Reminder, 'scheduledAt' | 'snoozedUntil' | 'createdAt'>,
  referenceNowMs = Date.now()
): CountdownParts {
  const effectiveIso = reminder.snoozedUntil || reminder.scheduledAt;
  const targetMs = Date.parse(effectiveIso);
  const createdMs = Date.parse(reminder.createdAt);

  if (Number.isNaN(targetMs)) {
    return {
      totalRemainingMs: 0,
      isOverdue: false,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formattedClock: '00:00:00',
      progressPercent: 100,
    };
  }

  const diffMs = targetMs - referenceNowMs;
  const isOverdue = diffMs < 0;
  const absSeconds = Math.floor(Math.abs(diffMs) / 1000);

  const days = Math.floor(absSeconds / 86400);
  const hours = Math.floor((absSeconds % 86400) / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const totalHoursWithDays = days * 24 + hours;
  const formattedClock = `${pad(totalHoursWithDays)}:${pad(minutes)}:${pad(seconds)}`;

  // Calculate progress between createdAt (or 24h window) and targetMs
  let windowDuration = targetMs - (Number.isNaN(createdMs) ? targetMs - 3600_000 : createdMs);
  if (windowDuration <= 0 || windowDuration > 86_400_000 * 7) {
    windowDuration = 4 * 3600_000; // Default 4-hour visual gauge window
  }
  const elapsed = windowDuration - Math.max(0, diffMs);
  const progressPercent = isOverdue
    ? 100
    : Math.max(6, Math.min(99, Math.round((elapsed / windowDuration) * 100)));

  return {
    totalRemainingMs: diffMs,
    isOverdue,
    days,
    hours,
    minutes,
    seconds,
    formattedClock,
    progressPercent,
  };
}

