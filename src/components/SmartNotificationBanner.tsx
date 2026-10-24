import React from 'react';
import { BellRing, CheckCircle2, Clock, Volume2, X } from 'lucide-react';
import { Reminder, ReminderCategory, SnoozeDuration } from '../types/reminder';
import { SOUND_LABELS } from '../utils/soundAndNotifications';

interface SmartNotificationBannerProps {
  activeReminder: Reminder | null;
  category?: ReminderCategory;
  defaultSnooze: SnoozeDuration;
  hideContentOnLockScreen: boolean;
  onMarkDone: (reminder: Reminder) => void;
  onSnooze: (reminder: Reminder, minutes: SnoozeDuration) => void;
  onDismiss: () => void;
}

const SNOOZE_OPTIONS: SnoozeDuration[] = [5, 10, 15, 30, 60];

export const SmartNotificationBanner: React.FC<SmartNotificationBannerProps> = ({
  activeReminder,
  category,
  hideContentOnLockScreen,
  onMarkDone,
  onSnooze,
  onDismiss,
}) => {
  if (!activeReminder) return null;

  const soundInfo = SOUND_LABELS[activeReminder.sound];

  return (
    <div
      role="alertdialog"
      aria-labelledby="smart-notif-title"
      aria-describedby="smart-notif-desc"
      className="fixed top-16 right-4 sm:right-6 z-50 w-[calc(100%-2rem)] max-w-md rounded-[26px] liquid-glass-notification text-white p-4 sm:p-5 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{
              backgroundColor: `${category?.colorHex || '#2563EB'}28`,
              color: category?.colorHex || '#60A5FA',
            }}
          >
            {category?.emoji || '🔔'}
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <BellRing className="w-3.5 h-3.5 text-cyan-400" />
              <span>RemindMe Smart Notification</span>
              <span aria-hidden="true">·</span>
              <span>{category?.name || 'Reminder'}</span>
            </div>
            <h4 id="smart-notif-title" className="text-base font-bold text-white mt-0.5">
              {activeReminder.title}
            </h4>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p id="smart-notif-desc" className="mt-2 text-sm text-slate-300">
        {hideContentOnLockScreen
          ? 'Reminder content hidden by privacy preference.'
          : activeReminder.description || 'Scheduled reminder is due now.'}
      </p>

      <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-400">
        <Volume2 className="w-3.5 h-3.5 text-blue-400" />
        <span>Sound: {soundInfo.label}</span>
        <span aria-hidden="true">·</span>
        <span>Vibration: {activeReminder.vibrationEnabled ? 'Active' : 'Off'}</span>
      </div>

      {/* Primary Action + Snooze Bar */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onMarkDone(activeReminder)}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
        >
          <CheckCircle2 className="w-4 h-4" />
          Mark as Done
        </button>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 inline-flex items-center gap-1 mr-1">
            <Clock className="w-3.5 h-3.5" />
            Snooze:
          </span>
          {SNOOZE_OPTIONS.map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => onSnooze(activeReminder, mins)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors tabular-nums whitespace-nowrap shrink-0"
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
