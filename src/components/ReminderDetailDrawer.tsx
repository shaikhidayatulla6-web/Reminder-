import React from 'react';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  Globe,
  History,
  Repeat,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import {
  CompletionLog,
  Reminder,
  ReminderCategory,
  SnoozeDuration,
} from '../types/reminder';
import {
  formatReminderDate,
  formatReminderTime,
  formatRepeatRule,
  getEffectiveTriggerTime,
} from '../utils/reminderLogic';
import { SOUND_LABELS } from '../utils/soundAndNotifications';

interface ReminderDetailDrawerProps {
  reminder: Reminder | null;
  category?: ReminderCategory;
  use24Hour: boolean;
  completionLogs: CompletionLog[];
  onClose: () => void;
  onToggleComplete: (reminder: Reminder) => void;
  onSnooze: (reminder: Reminder, minutes: SnoozeDuration) => void;
  onEdit: (reminder: Reminder) => void;
  onDuplicate: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onTriggerTestAlarm: (reminder: Reminder) => void;
}

const SNOOZE_DURATIONS: SnoozeDuration[] = [5, 10, 15, 30, 60];

export const ReminderDetailDrawer: React.FC<ReminderDetailDrawerProps> = ({
  reminder,
  category,
  use24Hour,
  completionLogs,
  onClose,
  onToggleComplete,
  onSnooze,
  onEdit,
  onDuplicate,
  onDelete,
  onTriggerTestAlarm,
}) => {
  if (!reminder) return null;

  const effectiveIso = getEffectiveTriggerTime(reminder);
  const reminderLogs = completionLogs.filter((l) => l.reminderId === reminder.id);
  const catColor = category?.colorHex || '#2563EB';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-drawer-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/45 backdrop-blur-md p-0 sm:p-4"
    >
      <div className="w-full max-w-xl rounded-t-[28px] sm:rounded-[28px] liquid-glass max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/40 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border border-white/50 dark:border-white/15 shadow-xs"
              style={{ backgroundColor: `${catColor}22`, color: catColor }}
            >
              {category?.emoji || '🔔'}
            </div>
            <div>
              <span className="text-xs font-semibold" style={{ color: catColor }}>
                {category?.name || 'Other'}
              </span>
              <h2
                id="detail-drawer-title"
                className="text-base font-bold text-slate-900 dark:text-white tracking-tight"
              >
                Reminder Details
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close reminder details"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl liquid-btn-secondary text-slate-600 dark:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {reminder.title}
            </h3>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              {reminder.description || 'No additional description provided.'}
            </p>
          </div>

          {/* Metadata Table */}
          <div className="rounded-2xl liquid-glass-input divide-y divide-white/40 dark:divide-white/10 text-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Calendar className="w-4 h-4 text-blue-600" />
                Scheduled Time
              </span>
              <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                {formatReminderDate(effectiveIso)}, {formatReminderTime(effectiveIso, use24Hour)}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Repeat className="w-4 h-4 text-purple-600" />
                Repeat Rule
              </span>
              <span className="font-medium text-slate-900 dark:text-white">
                {formatRepeatRule(reminder)}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Volume2 className="w-4 h-4 text-cyan-600" />
                Alert Settings
              </span>
              <span className="font-medium text-slate-900 dark:text-white">
                {SOUND_LABELS[reminder.sound].label} ·{' '}
                {reminder.vibrationEnabled ? 'Vibrate On' : 'Vibrate Off'}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Globe className="w-4 h-4 text-emerald-600" />
                Time Zone & Priority
              </span>
              <span className="font-medium text-slate-900 dark:text-white tabular-nums">
                {reminder.timeZone} · {reminder.priority}
              </span>
            </div>
          </div>

          {/* Quick Snooze Bar */}
          {!reminder.isCompleted && (
            <div className="space-y-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Snooze Reminder
              </span>
              <div className="grid grid-cols-5 gap-2">
                {SNOOZE_DURATIONS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      onSnooze(reminder, mins);
                      onClose();
                    }}
                    className="py-2 px-3 rounded-xl liquid-btn-secondary hover:border-blue-500 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors tabular-nums"
                  >
                    +{mins}m
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Completion History for this Reminder */}
          <div className="space-y-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <History className="w-3.5 h-3.5 text-emerald-600" />
              Completion History ({reminderLogs.length})
            </span>
            {reminderLogs.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No completions logged for this reminder yet.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {reminderLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg liquid-glass-input text-slate-600 dark:text-slate-300 tabular-nums"
                  >
                    <span>Completed</span>
                    <span>
                      {formatReminderDate(log.completedAt)},{' '}
                      {formatReminderTime(log.completedAt, use24Hour)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/40 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onTriggerTestAlarm(reminder);
              }}
              className="px-3 py-2 rounded-xl liquid-btn-secondary text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Bell className="w-3.5 h-3.5 text-blue-600" />
              Test Alert
            </button>
            <button
              type="button"
              onClick={() => {
                onEdit(reminder);
              }}
              className="px-3 py-2 rounded-xl liquid-btn-secondary text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                onDuplicate(reminder);
                onClose();
              }}
              className="px-3 py-2 rounded-xl liquid-btn-secondary text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete(reminder.id);
                onClose();
              }}
              className="px-3 py-2 rounded-xl liquid-btn-secondary text-xs font-semibold text-rose-600 dark:text-rose-400 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onToggleComplete(reminder);
              onClose();
            }}
            className="px-4 py-2 rounded-xl liquid-btn-primary text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            {reminder.isCompleted ? 'Mark Pending' : 'Mark as Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
