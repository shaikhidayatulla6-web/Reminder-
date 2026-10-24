import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Code2,
  Download,
  History,
  Layers,
  Moon,
  Plus,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react';
import {
  CompletionLog,
  Reminder,
  ReminderCategory,
  SnoozeDuration,
} from '../types/reminder';
import {
  computeDashboardMetrics,
  formatReminderDate,
  formatReminderTime,
  getEffectiveTriggerTime,
  getSmartNotificationPreset,
  isReminderOverdue,
  toLocalDateKey,
} from '../utils/reminderLogic';
import { SOUND_LABELS, HapticInteractionType } from '../utils/soundAndNotifications';
import { ReminderCard } from './ReminderCard';
import { UpcomingTimerWidget } from './UpcomingTimerWidget';

interface DashboardViewProps {
  reminders: Reminder[];
  categories: ReminderCategory[];
  completionLogs: CompletionLog[];
  use24Hour: boolean;
  theme: 'light' | 'dark';
  defaultCategoryId: string;
  vibrationEnabled: boolean;
  lastHapticEvent: { type: HapticInteractionType; label: string; timestamp: number } | null;
  onToggleTheme: () => void;
  onOpenAddModal: (presetCategoryId?: string) => void;
  onQuickCreateReminder: (title: string, categoryId: string, minutesFromNow: number) => void;
  onToggleComplete: (reminder: Reminder) => void;
  onSelectDetail: (reminder: Reminder) => void;
  onEdit: (reminder: Reminder) => void;
  onDuplicate: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onSnooze: (reminder: Reminder, minutes: SnoozeDuration) => void;
  onTriggerTestAlarm: (reminder: Reminder) => void;
  onNavigateToCategoryFilter: (categoryId: string) => void;
  onOpenAndroidSource: () => void;
  onOpenTour: () => void;
  onOpenApkModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  reminders,
  categories,
  completionLogs,
  use24Hour,
  theme,
  defaultCategoryId,
  vibrationEnabled,
  lastHapticEvent,
  onToggleTheme,
  onOpenAddModal,
  onQuickCreateReminder,
  onToggleComplete,
  onSelectDetail,
  onEdit,
  onDuplicate,
  onDelete,
  onSnooze,
  onTriggerTestAlarm,
  onNavigateToCategoryFilter,
  onOpenAndroidSource,
  onOpenTour,
  onOpenApkModal,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCatId, setQuickCatId] = useState(defaultCategoryId || 'cat-work');
  const [quickOffsetMins, setQuickOffsetMins] = useState<number>(60);
  const [activeDashboardSection, setActiveDashboardSection] = useState<
    'ALL' | 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED'
  >('ALL');

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const formattedCurrentDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const metrics = computeDashboardMetrics(reminders);
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const todayKey = toLocalDateKey(now.toISOString());

  // Categorize reminders
  const overdueList = reminders
    .filter((r) => !r.isCompleted && isReminderOverdue(r))
    .sort((a, b) => Date.parse(getEffectiveTriggerTime(a)) - Date.parse(getEffectiveTriggerTime(b)));

  const todayPendingList = reminders
    .filter(
      (r) =>
        !r.isCompleted &&
        !isReminderOverdue(r) &&
        toLocalDateKey(getEffectiveTriggerTime(r)) === todayKey
    )
    .sort((a, b) => Date.parse(getEffectiveTriggerTime(a)) - Date.parse(getEffectiveTriggerTime(b)));

  const upcomingList = reminders
    .filter(
      (r) =>
        !r.isCompleted &&
        !isReminderOverdue(r) &&
        toLocalDateKey(getEffectiveTriggerTime(r)) !== todayKey &&
        Date.parse(getEffectiveTriggerTime(r)) > now.getTime()
    )
    .sort((a, b) => Date.parse(getEffectiveTriggerTime(a)) - Date.parse(getEffectiveTriggerTime(b)));

  const completedList = reminders
    .filter((r) => r.isCompleted)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  const nextScheduledReminder = todayPendingList[0] || upcomingList[0] || overdueList[0] || null;
  const quickPreset = getSmartNotificationPreset(quickCatId, quickTitle);

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickCreateReminder(quickTitle.trim(), quickCatId, quickOffsetMins);
    setQuickTitle('');
  };

  return (
    <div className="space-y-8">
      {/* Greeting & Daily Progress Banner (OriginOS 7 Realistic Glassy Liquid Hero Surface) */}
      <section className="rounded-[32px] liquid-glass p-6 sm:p-8 space-y-6">
        {/* OriginOS 7 Atomic Liquid Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/60 dark:border-white/10">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full origin-atomic-capsule text-white text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-semibold">Auto-Notifications Active</span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span className="text-slate-300 hidden sm:inline">
              Exact Alarm + Sound + Vibration Auto-Configured
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {nextScheduledReminder && (
              <button
                type="button"
                onClick={() => onTriggerTestAlarm(nextScheduledReminder)}
                className="px-3 py-1.5 rounded-xl liquid-btn-secondary text-xs font-semibold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>
                  Next: {nextScheduledReminder.title.slice(0, 22)}
                  {nextScheduledReminder.title.length > 22 ? '…' : ''} (
                  {formatReminderTime(getEffectiveTriggerTime(nextScheduledReminder), use24Hour)})
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} glass mode`}
              className="px-3 py-1.5 rounded-xl liquid-btn-secondary text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Glass</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dark Glass</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wide">
              {formattedCurrentDate}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {greeting}, stay on top of everything today.
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              You have{' '}
              <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                {metrics.todayCount}
              </span>{' '}
              scheduled for today and{' '}
              <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                {metrics.upcomingCount}
              </span>{' '}
              upcoming reminders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenApkModal}
              className="px-3.5 py-2.5 rounded-xl liquid-btn-secondary text-xs font-semibold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Get Android APK
            </button>
            <button
              type="button"
              onClick={onOpenTour}
              className="px-3.5 py-2.5 rounded-xl liquid-btn-secondary text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              App Walkthrough
            </button>
            <button
              type="button"
              onClick={onOpenAndroidSource}
              className="px-3.5 py-2.5 rounded-xl liquid-btn-secondary text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Code2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Android Studio Kotlin Code
            </button>
            <button
              type="button"
              onClick={() => onOpenAddModal()}
              className="px-4 py-2.5 rounded-xl liquid-btn-primary text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Create Reminder
            </button>
          </div>
        </div>

        {/* 5 Summary Stat Cards + Daily Progress */}
        <div className="pt-2 border-t border-white/60 dark:border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <button
            type="button"
            onClick={() => setActiveDashboardSection('ALL')}
            className={`text-left p-4 rounded-2xl liquid-glass-interactive ${
              activeDashboardSection === 'ALL'
                ? 'ring-2 ring-blue-500/80'
                : ''
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Total</span>
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {metrics.total}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveDashboardSection('TODAY')}
            className={`text-left p-4 rounded-2xl liquid-glass-interactive ${
              activeDashboardSection === 'TODAY'
                ? 'ring-2 ring-blue-500/80'
                : ''
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Today</span>
              <CalendarCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {metrics.todayCount}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveDashboardSection('UPCOMING')}
            className={`text-left p-4 rounded-2xl liquid-glass-interactive ${
              activeDashboardSection === 'UPCOMING'
                ? 'ring-2 ring-blue-500/80'
                : ''
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Upcoming</span>
              <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {metrics.upcomingCount}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveDashboardSection('OVERDUE')}
            className={`text-left p-4 rounded-2xl liquid-glass-interactive ${
              activeDashboardSection === 'OVERDUE'
                ? 'ring-2 ring-rose-500/80'
                : ''
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Overdue</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              {metrics.overdueCount}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveDashboardSection('COMPLETED')}
            className={`text-left p-4 rounded-2xl liquid-glass-interactive ${
              activeDashboardSection === 'COMPLETED'
                ? 'ring-2 ring-emerald-500/80'
                : ''
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {metrics.completedCount}
            </p>
          </button>

          {/* Daily Progress Card */}
          <div className="p-4 rounded-2xl liquid-glass-interactive flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Daily Progress
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                {metrics.todayCompletionRate}%
              </span>
            </div>
            <div className="mt-3 w-full h-2 rounded-full bg-slate-200/70 dark:bg-slate-800/80 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-300"
                style={{ width: `${metrics.todayCompletionRate}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* OriginOS 7 Atomic Liquid Live Countdown Widget Deck */}
      <UpcomingTimerWidget
        reminders={reminders}
        categories={categories}
        use24Hour={use24Hour}
        vibrationEnabled={vibrationEnabled}
        lastHapticEvent={lastHapticEvent}
        onToggleComplete={onToggleComplete}
        onSnooze={onSnooze}
        onTriggerTestAlarm={onTriggerTestAlarm}
        onSelectDetail={onSelectDetail}
        onOpenAddModal={() => onOpenAddModal()}
      />

      {/* Quick Reminder Creation Bar with Automatic Smart Notification Tuning */}
      <section className="rounded-[26px] liquid-glass p-4 sm:p-5 space-y-2.5">
        <form
          onSubmit={handleQuickAddSubmit}
          className="flex flex-col md:flex-row items-stretch md:items-center gap-3"
        >
          <div className="flex-1">
            <label htmlFor="quick-add-input" className="sr-only">
              Quick Reminder Title
            </label>
            <input
              id="quick-add-input"
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Quick add: Type anything to remember (e.g., Drink water, Take vitamin, Urgent call)..."
              className="w-full rounded-xl liquid-glass-input px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-2 focus:outline-blue-600"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <label htmlFor="quick-add-category" className="sr-only">
              Quick Category
            </label>
            <select
              id="quick-add-category"
              value={quickCatId}
              onChange={(e) => setQuickCatId(e.target.value)}
              className="rounded-xl liquid-glass-input px-3 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>

            <label htmlFor="quick-add-offset" className="sr-only">
              Quick Time Offset
            </label>
            <select
              id="quick-add-offset"
              value={quickOffsetMins}
              onChange={(e) => setQuickOffsetMins(Number(e.target.value))}
              className="rounded-xl liquid-glass-input px-3 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 tabular-nums"
            >
              <option value={1}>In 1 min</option>
              <option value={15}>In 15 mins</option>
              <option value={30}>In 30 mins</option>
              <option value={60}>In 1 hour</option>
              <option value={180}>In 3 hours</option>
              <option value={1440}>Tomorrow</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl liquid-btn-primary text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Quick Add
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 px-1">
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            Auto-Set Notification:
          </span>
          <span>{SOUND_LABELS[quickPreset.sound].label}</span>
          <span aria-hidden="true">·</span>
          <span>{quickPreset.priority} Priority</span>
          <span aria-hidden="true">·</span>
          <span>{quickPreset.vibrationEnabled ? 'Vibration On' : 'Silent Vibration'}</span>
          <span aria-hidden="true">·</span>
          <span>Channel: {quickPreset.channelName}</span>
        </div>
      </section>

      {/* Category Shortcuts Strip */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Category Shortcuts ({categories.length})
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Tap any category to filter reminders
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {categories.map((cat) => {
            const count = reminders.filter(
              (r) => r.categoryId === cat.id && !r.isCompleted
            ).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onNavigateToCategoryFilter(cat.id)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl liquid-glass-interactive min-w-0"
              >
                <span
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 origin-droplet-badge"
                  style={{ backgroundColor: `${cat.colorHex}22`, color: cat.colorHex }}
                >
                  {cat.emoji}
                </span>
                <div className="text-left min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {cat.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums truncate">
                    {count} active
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main 2-Column Content Split: Left 8 cols Reminders, Right 4 cols Completion History & Smart Alarm Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Overdue Section */}
          {(activeDashboardSection === 'ALL' || activeDashboardSection === 'OVERDUE') &&
            overdueList.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Overdue Reminders ({overdueList.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {overdueList.map((r) => (
                    <ReminderCard
                      key={r.id}
                      reminder={r}
                      category={categoryMap.get(r.categoryId)}
                      use24Hour={use24Hour}
                      onToggleComplete={onToggleComplete}
                      onSelectDetail={onSelectDetail}
                      onEdit={onEdit}
                      onDuplicate={onDuplicate}
                      onDelete={onDelete}
                      onSnooze={onSnooze}
                      onTriggerTestAlarm={onTriggerTestAlarm}
                    />
                  ))}
                </div>
              </div>
            )}

          {/* Today's Reminders Section */}
          {(activeDashboardSection === 'ALL' || activeDashboardSection === 'TODAY') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Today’s Schedule ({todayPendingList.length})
                </h2>
              </div>
              {todayPendingList.length === 0 ? (
                <div className="rounded-[24px] liquid-glass p-8 text-center">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    All caught up for today!
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Schedule a new reminder whenever something comes up.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayPendingList.map((r) => (
                    <ReminderCard
                      key={r.id}
                      reminder={r}
                      category={categoryMap.get(r.categoryId)}
                      use24Hour={use24Hour}
                      onToggleComplete={onToggleComplete}
                      onSelectDetail={onSelectDetail}
                      onEdit={onEdit}
                      onDuplicate={onDuplicate}
                      onDelete={onDelete}
                      onSnooze={onSnooze}
                      onTriggerTestAlarm={onTriggerTestAlarm}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upcoming Reminders Section */}
          {(activeDashboardSection === 'ALL' || activeDashboardSection === 'UPCOMING') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Upcoming Reminders ({upcomingList.length})
                </h2>
              </div>
              {upcomingList.length === 0 ? (
                <div className="rounded-[24px] liquid-glass p-8 text-center">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    No upcoming reminders scheduled after today.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingList.map((r) => (
                    <ReminderCard
                      key={r.id}
                      reminder={r}
                      category={categoryMap.get(r.categoryId)}
                      use24Hour={use24Hour}
                      onToggleComplete={onToggleComplete}
                      onSelectDetail={onSelectDetail}
                      onEdit={onEdit}
                      onDuplicate={onDuplicate}
                      onDelete={onDelete}
                      onSnooze={onSnooze}
                      onTriggerTestAlarm={onTriggerTestAlarm}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Completed Section */}
          {(activeDashboardSection === 'ALL' || activeDashboardSection === 'COMPLETED') &&
            completedList.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Completed ({completedList.length})
                </h2>
                <div className="space-y-3">
                  {completedList.map((r) => (
                    <ReminderCard
                      key={r.id}
                      reminder={r}
                      category={categoryMap.get(r.categoryId)}
                      use24Hour={use24Hour}
                      onToggleComplete={onToggleComplete}
                      onSelectDetail={onSelectDetail}
                      onEdit={onEdit}
                      onDuplicate={onDuplicate}
                      onDelete={onDelete}
                      onSnooze={onSnooze}
                    />
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Right Column: Recent Completion History & Smart Alarm Quick Test */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-[26px] liquid-glass p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Smart Alarm Preview
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              RemindMe monitors due times every second and dispatches local notifications with
              sound, vibration, Mark as Done, and 5–60m Snooze controls.
            </p>
            {reminders.find((r) => !r.isCompleted) && (
              <button
                type="button"
                onClick={() => {
                  const target = reminders.find((r) => !r.isCompleted);
                  if (target) onTriggerTestAlarm(target);
                }}
                className="w-full py-2.5 px-4 rounded-xl liquid-btn-secondary text-blue-600 dark:text-blue-400 text-xs font-semibold"
              >
                Simulate Next Reminder Alert Now
              </button>
            )}
          </div>

          <div className="rounded-[26px] liquid-glass p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Completion Activity Log
              </h3>
              <span className="text-xs text-slate-500 tabular-nums">
                {completionLogs.length} logged
              </span>
            </div>

            {completionLogs.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Complete any reminder to track your daily streak and history here.
              </p>
            ) : (
              <div className="divide-y divide-white/50 dark:divide-white/10">
                {completionLogs.slice(0, 8).map((log) => {
                  const cat = categoryMap.get(log.categoryId);
                  return (
                    <div key={log.id} className="py-2.5 flex items-start gap-2.5">
                      <span className="text-base shrink-0 mt-0.5">{cat?.emoji || '✅'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {log.reminderTitle}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                          Done {formatReminderDate(log.completedAt)},{' '}
                          {formatReminderTime(log.completedAt, use24Hour)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
