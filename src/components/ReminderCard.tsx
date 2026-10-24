import React from 'react';
import {
  Bell,
  Check,
  Clock,
  Copy,
  Edit3,
  Repeat,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  Reminder,
  ReminderCategory,
  SnoozeDuration,
} from '../types/reminder';
import {
  formatReminderDate,
  formatReminderTime,
  formatRepeatRule,
  getEffectiveTriggerTime,
  isReminderOverdue,
} from '../utils/reminderLogic';

interface ReminderCardProps {
  reminder: Reminder;
  category?: ReminderCategory;
  use24Hour: boolean;
  onToggleComplete: (reminder: Reminder) => void;
  onSelectDetail: (reminder: Reminder) => void;
  onEdit: (reminder: Reminder) => void;
  onDuplicate: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onSnooze: (reminder: Reminder, minutes: SnoozeDuration) => void;
  onTriggerTestAlarm?: (reminder: Reminder) => void;
}

const PRIORITY_TEXT_MAP = {
  LOW: { label: 'Low Priority', colorClass: 'text-slate-500 dark:text-slate-400' },
  MEDIUM: { label: 'Medium Priority', colorClass: 'text-blue-600 dark:text-blue-400' },
  HIGH: { label: 'High Priority', colorClass: 'text-amber-600 dark:text-amber-400 font-semibold' },
  URGENT: { label: 'Urgent', colorClass: 'text-rose-600 dark:text-rose-400 font-semibold' },
};

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  category,
  use24Hour,
  onToggleComplete,
  onSelectDetail,
  onEdit,
  onDuplicate,
  onDelete,
  onTriggerTestAlarm,
}) => {
  const effectiveIso = getEffectiveTriggerTime(reminder);
  const overdue = isReminderOverdue(reminder);
  const priorityInfo = PRIORITY_TEXT_MAP[reminder.priority];
  const catColor = category?.colorHex || '#2563EB';

  return (
    <div
      className={`group relative rounded-[24px] p-4 sm:p-5 liquid-glass-interactive ${
        reminder.isCompleted
          ? 'opacity-70'
          : overdue
          ? 'ring-1 ring-rose-400/50 dark:ring-rose-500/50'
          : ''
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Completion Checkbox Button (44x44px hitbox for mobile ergonomics) */}
        <button
          type="button"
          onClick={() => onToggleComplete(reminder)}
          aria-label={
            reminder.isCompleted
              ? `Mark '${reminder.title}' as incomplete`
              : `Complete '${reminder.title}'`
          }
          className="min-w-[44px] min-h-[44px] -m-1.5 flex items-center justify-center shrink-0 rounded-xl focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <span
            className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-colors shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)] ${
              reminder.isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : overdue
                ? 'border-rose-400 dark:border-rose-500 bg-white/50 dark:bg-slate-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                : 'border-slate-300/90 dark:border-slate-600 bg-white/50 dark:bg-slate-900/50 hover:border-blue-600 dark:hover:border-blue-400'
            }`}
          >
            {reminder.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </span>
        </button>

        {/* Category Icon Box (OriginOS 7 3D Liquid Droplet Squircle) */}
        <div
          onClick={() => onSelectDetail(reminder)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectDetail(reminder);
            }
          }}
          aria-label={`View details for ${reminder.title}`}
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-lg cursor-pointer select-none origin-droplet-badge"
          style={{
            backgroundColor: `${catColor}22`,
            color: catColor,
          }}
        >
          <span>{category?.emoji || '🔔'}</span>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => onSelectDetail(reminder)}
              className="text-left focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
            >
              <h3
                className={`text-base font-semibold leading-snug ${
                  reminder.isCompleted
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {reminder.title}
              </h3>
            </button>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-0.5 shrink-0">
              {onTriggerTestAlarm && !reminder.isCompleted && (
                <button
                  type="button"
                  onClick={() => onTriggerTestAlarm(reminder)}
                  title="Trigger notification preview now"
                  aria-label={`Test notification for ${reminder.title}`}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onEdit(reminder)}
                title="Edit reminder"
                aria-label={`Edit ${reminder.title}`}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDuplicate(reminder)}
                title="Duplicate reminder"
                aria-label={`Duplicate ${reminder.title}`}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(reminder.id)}
                title="Delete reminder"
                aria-label={`Delete ${reminder.title}`}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {reminder.description && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {reminder.description}
            </p>
          )}

          {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            <span className="font-medium" style={{ color: catColor }}>
              {category?.name || 'Other'}
            </span>
            <span aria-hidden="true">·</span>
            <span
              className={`inline-flex items-center gap-1 ${
                overdue && !reminder.isCompleted
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 font-medium'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {overdue && !reminder.isCompleted ? 'Overdue: ' : ''}
              {formatReminderDate(effectiveIso)}, {formatReminderTime(effectiveIso, use24Hour)}
            </span>
            {reminder.snoozedUntil && !reminder.isCompleted && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  Snoozed
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Repeat className="w-3 h-3 shrink-0" />
              {formatRepeatRule(reminder)}
            </span>
            <span aria-hidden="true">·</span>
            <span className={priorityInfo.colorClass}>{priorityInfo.label}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              {reminder.sound === 'SILENT' ? (
                <VolumeX className="w-3 h-3" />
              ) : (
                <Volume2 className="w-3 h-3" />
              )}
              {reminder.sound === 'SILENT' ? 'Silent' : reminder.sound.toLowerCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
