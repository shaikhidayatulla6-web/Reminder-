export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type RepeatType =
  | 'ONCE'
  | 'HOURLY'
  | 'DAILY'
  | 'WEEKDAYS'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'YEARLY'
  | 'CUSTOM';

export type CustomIntervalUnit = 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS';

export type SoundOption = 'CHIME' | 'CRYSTAL' | 'PULSE' | 'GENTLE_BELL' | 'MARIMBA' | 'SILENT';

export type SnoozeDuration = 5 | 10 | 15 | 30 | 60;

export interface ReminderCategory {
  id: string;
  name: string;
  emoji: string;
  colorHex: string;
  isDefault: boolean;
}

export interface CompletionLog {
  id: string;
  reminderId: string;
  reminderTitle: string;
  categoryId: string;
  completedAt: string; // ISO string
  scheduledFor: string; // ISO string
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  scheduledAt: string; // ISO string
  timeZone: string;
  repeatType: RepeatType;
  selectedWeekdays: number[]; // 0 (Sun) - 6 (Sat)
  customIntervalValue: number;
  customIntervalUnit: CustomIntervalUnit;
  endDate?: string | null; // YYYY-MM-DD or ISO string
  priority: Priority;
  sound: SoundOption;
  vibrationEnabled: boolean;
  isCompleted: boolean;
  snoozedUntil?: string | null; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface AppSettings {
  theme: 'light' | 'dark';
  use24HourFormat: boolean;
  defaultSound: SoundOption;
  defaultVibration: boolean;
  defaultSnoozeMinutes: SnoozeDuration;
  defaultCategoryId: string;
  onboardingCompleted: boolean;
  autoConfigureNotifications: boolean;
  notificationsPermissionGranted: boolean;
  exactAlarmPermissionGranted: boolean;
  batteryOptimizationIgnored: boolean;
  hideContentOnLockScreen: boolean;
  enableLiquidFluidAnimations: boolean;
}

export type ActiveTab =
  | 'dashboard'
  | 'calendar'
  | 'categories'
  | 'search'
  | 'settings'
  | 'android-source';

export interface FilterCriteria {
  query: string;
  categoryId: string | 'ALL';
  priority: Priority | 'ALL';
  status: 'ALL' | 'PENDING' | 'COMPLETED' | 'OVERDUE';
  dateFilter: string | 'ALL'; // YYYY-MM-DD or 'ALL'
  sortBy: 'UPCOMING_TIME' | 'CREATED_DATE' | 'PRIORITY';
}
