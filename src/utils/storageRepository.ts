import {
  AppSettings,
  CompletionLog,
  Reminder,
  ReminderCategory,
} from '../types/reminder';
import { DEFAULT_CATEGORIES } from './reminderLogic';

const STORAGE_KEYS = {
  REMINDERS: 'remindme_room_reminders_v1',
  CATEGORIES: 'remindme_room_categories_v1',
  SETTINGS: 'remindme_datastore_settings_v1',
  HISTORY: 'remindme_room_history_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  use24HourFormat: false,
  defaultSound: 'CHIME',
  defaultVibration: true,
  defaultSnoozeMinutes: 10,
  defaultCategoryId: 'cat-work',
  onboardingCompleted: true,
  autoConfigureNotifications: true,
  notificationsPermissionGranted: true,
  exactAlarmPermissionGranted: true,
  batteryOptimizationIgnored: true,
  hideContentOnLockScreen: false,
  enableLiquidFluidAnimations: true,
};

export function createSeedReminders(now = new Date()): Reminder[] {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // Helper to offset from today's date
  const makeDate = (dayOffset: number, hours: number, minutes: number): string => {
    const d = new Date(now.getTime());
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  // Make one slightly overdue today (2 hours ago, or 08:00 AM)
  const overdueTime = new Date(now.getTime() - 45 * 60_000).toISOString();
  // Make one later today (+2 hours)
  const upcomingToday1 = new Date(now.getTime() + 90 * 60_000).toISOString();
  // Make another later today (+4 hours)
  const upcomingToday2 = new Date(now.getTime() + 210 * 60_000).toISOString();

  return [
    {
      id: 'rem-seed-1',
      title: 'Drink 500ml Electrolytes & Water',
      description: 'Stay hydrated during morning focus block',
      categoryId: 'cat-water',
      scheduledAt: upcomingToday1,
      timeZone: tz,
      repeatType: 'HOURLY',
      selectedWeekdays: [],
      customIntervalValue: 2,
      customIntervalUnit: 'HOURS',
      endDate: null,
      priority: 'MEDIUM',
      sound: 'CRYSTAL',
      vibrationEnabled: true,
      isCompleted: false,
      snoozedUntil: null,
      createdAt: makeDate(-3, 9, 0),
      updatedAt: makeDate(-1, 9, 0),
    },
    {
      id: 'rem-seed-2',
      title: 'Take Morning Vitamin D3 + Omega-3',
      description: 'Take with breakfast for optimal absorption',
      categoryId: 'cat-medicine',
      scheduledAt: overdueTime,
      timeZone: tz,
      repeatType: 'DAILY',
      selectedWeekdays: [],
      customIntervalValue: 1,
      customIntervalUnit: 'DAYS',
      endDate: null,
      priority: 'HIGH',
      sound: 'CHIME',
      vibrationEnabled: true,
      isCompleted: false,
      snoozedUntil: null,
      createdAt: makeDate(-5, 8, 0),
      updatedAt: makeDate(-1, 8, 0),
    },
    {
      id: 'rem-seed-3',
      title: 'Android Architecture Sprint Review',
      description: 'Review Room DAO queries, AlarmManager exact scheduling, and Compose UI states',
      categoryId: 'cat-work',
      scheduledAt: upcomingToday2,
      timeZone: tz,
      repeatType: 'WEEKDAYS',
      selectedWeekdays: [1, 2, 3, 4, 5],
      customIntervalValue: 1,
      customIntervalUnit: 'DAYS',
      endDate: null,
      priority: 'URGENT',
      sound: 'PULSE',
      vibrationEnabled: true,
      isCompleted: false,
      snoozedUntil: null,
      createdAt: makeDate(-4, 10, 0),
      updatedAt: makeDate(-2, 10, 0),
    },
    {
      id: 'rem-seed-4',
      title: '45-Min Upper Body Strength & Mobility',
      description: 'Warm up shoulders, pull-ups, overhead press, and thoracic stretches',
      categoryId: 'cat-fitness',
      scheduledAt: makeDate(0, 7, 0),
      timeZone: tz,
      repeatType: 'WEEKLY',
      selectedWeekdays: [1, 3, 5, 6],
      customIntervalValue: 1,
      customIntervalUnit: 'WEEKS',
      endDate: null,
      priority: 'MEDIUM',
      sound: 'MARIMBA',
      vibrationEnabled: true,
      isCompleted: true,
      snoozedUntil: null,
      createdAt: makeDate(-7, 7, 0),
      updatedAt: makeDate(0, 7, 45),
    },
    {
      id: 'rem-seed-5',
      title: 'Pay Monthly Fiber Internet & Cloud Bill',
      description: 'Verify auto-debit statement and download tax invoice PDF',
      categoryId: 'cat-bills',
      scheduledAt: makeDate(1, 11, 0),
      timeZone: tz,
      repeatType: 'MONTHLY',
      selectedWeekdays: [],
      customIntervalValue: 1,
      customIntervalUnit: 'DAYS',
      endDate: null,
      priority: 'HIGH',
      sound: 'CHIME',
      vibrationEnabled: true,
      isCompleted: false,
      snoozedUntil: null,
      createdAt: makeDate(-10, 11, 0),
      updatedAt: makeDate(-10, 11, 0),
    },
    {
      id: 'rem-seed-6',
      title: 'Kotlin Coroutines & Flow Deep Dive Chapter 6',
      description: 'Complete structured concurrency exercises and write unit tests',
      categoryId: 'cat-study',
      scheduledAt: makeDate(2, 19, 30),
      timeZone: tz,
      repeatType: 'CUSTOM',
      selectedWeekdays: [],
      customIntervalValue: 2,
      customIntervalUnit: 'DAYS',
      endDate: null,
      priority: 'MEDIUM',
      sound: 'GENTLE_BELL',
      vibrationEnabled: false,
      isCompleted: false,
      snoozedUntil: null,
      createdAt: makeDate(-2, 19, 30),
      updatedAt: makeDate(-2, 19, 30),
    },
    {
      id: 'rem-seed-7',
      title: 'Order Mom’s Birthday Flowers & Card',
      description: 'Fresh pastel bouquet delivery for Saturday morning',
      categoryId: 'cat-birthdays',
      scheduledAt: makeDate(3, 14, 0),
      timeZone: tz,
      repeatType: 'YEARLY',
      selectedWeekdays: [],
      customIntervalValue: 1,
      customIntervalUnit: 'DAYS',
      endDate: null,
      priority: 'URGENT',
      sound: 'MARIMBA',
      vibrationEnabled: true,
      isCompleted: false,
      snoozedUntil: null,
      createdAt: makeDate(-6, 12, 0),
      updatedAt: makeDate(-6, 12, 0),
    },
    {
      id: 'rem-seed-8',
      title: 'Weekly Farmers Market Grocery Run',
      description: 'Avocados, wild salmon, Greek yogurt, berries, oat milk, and sourdough',
      categoryId: 'cat-shopping',
      scheduledAt: makeDate(4, 10, 30),
      timeZone: tz,
      repeatType: 'WEEKLY',
      selectedWeekdays: [0],
      customIntervalValue: 1,
      customIntervalUnit: 'WEEKS',
      endDate: null,
      priority: 'LOW',
      sound: 'CHIME',
      vibrationEnabled: true,
      isCompleted: false,
      snoozedUntil: null,
      createdAt: makeDate(-3, 10, 30),
      updatedAt: makeDate(-3, 10, 30),
    },
  ];
}

export function loadReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (!raw) {
      const seeded = createSeedReminders();
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : createSeedReminders();
  } catch {
    return createSeedReminders();
  }
}

export function saveReminders(reminders: Reminder[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadCategories(): ReminderCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    const parsed: ReminderCategory[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CATEGORIES;
    // Ensure all 13 default categories are always present
    const existingIds = new Set(parsed.map((c) => c.id));
    const merged = [
      ...DEFAULT_CATEGORIES.filter((d) => !existingIds.has(d.id)),
      ...parsed,
    ];
    return merged;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: ReminderCategory[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    const merged: AppSettings = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      // Automatically ensure notification permissions and smart auto-config are active
      autoConfigureNotifications:
        parsed.autoConfigureNotifications !== undefined ? parsed.autoConfigureNotifications : true,
      notificationsPermissionGranted: true,
      exactAlarmPermissionGranted: true,
      batteryOptimizationIgnored: true,
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

export function loadCompletionHistory(): CompletionLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) {
      const initialHistory: CompletionLog[] = [
        {
          id: 'hist-seed-1',
          reminderId: 'rem-seed-4',
          reminderTitle: '45-Min Upper Body Strength & Mobility',
          categoryId: 'cat-fitness',
          completedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
          scheduledFor: new Date(Date.now() - 3 * 3600_000).toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(initialHistory));
      return initialHistory;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCompletionHistory(logs: CompletionLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(logs));
  } catch {
    // Ignore
  }
}
