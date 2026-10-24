import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  Reminder,
  ReminderCategory,
  SnoozeDuration,
} from '../types/reminder';
import { getEffectiveTriggerTime, toLocalDateKey } from '../utils/reminderLogic';
import { ReminderCard } from './ReminderCard';

interface CalendarViewProps {
  reminders: Reminder[];
  categories: ReminderCategory[];
  use24Hour: boolean;
  onOpenAddForDate: (dateIso: string) => void;
  onToggleComplete: (reminder: Reminder) => void;
  onSelectDetail: (reminder: Reminder) => void;
  onEdit: (reminder: Reminder) => void;
  onDuplicate: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onSnooze: (reminder: Reminder, minutes: SnoozeDuration) => void;
  onTriggerTestAlarm: (reminder: Reminder) => void;
}

const WEEKDAYS_HEADER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  reminders,
  categories,
  use24Hour,
  onOpenAddForDate,
  onToggleComplete,
  onSelectDetail,
  onEdit,
  onDuplicate,
  onDelete,
  onSnooze,
  onTriggerTestAlarm,
}) => {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0 - 11
  const [selectedDateKey, setSelectedDateKey] = useState<string>(
    toLocalDateKey(now.toISOString())
  );

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Map dateKey (YYYY-MM-DD) -> Reminder[]
  const remindersByDate = new Map<string, Reminder[]>();
  for (const r of reminders) {
    const key = toLocalDateKey(getEffectiveTriggerTime(r));
    if (!key) continue;
    const list = remindersByDate.get(key) || [];
    list.push(r);
    remindersByDate.set(key, list);
  }

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleTodayJump = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDateKey(toLocalDateKey(today.toISOString()));
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const selectedDayReminders = (remindersByDate.get(selectedDateKey) || []).sort(
    (a, b) => Date.parse(getEffectiveTriggerTime(a)) - Date.parse(getEffectiveTriggerTime(b))
  );

  const todayKey = toLocalDateKey(now.toISOString());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Monthly Calendar Grid (Left 7 Columns) */}
      <div className="lg:col-span-7 rounded-[28px] liquid-glass p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{monthLabel}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tap any date to inspect or schedule reminders
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleTodayJump}
              className="px-3 py-1.5 rounded-xl liquid-btn-secondary text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl liquid-btn-secondary text-slate-700 dark:text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl liquid-btn-secondary text-slate-700 dark:text-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
          {WEEKDAYS_HEADER.map((day) => (
            <div
              key={day}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 py-1.5"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-2xl" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(
              dayNum
            ).padStart(2, '0')}`;
            const dayItems = remindersByDate.get(dateKey) || [];
            const isSelected = selectedDateKey === dateKey;
            const isToday = todayKey === dateKey;

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setSelectedDateKey(dateKey)}
                aria-label={`Select date ${dateKey} (${dayItems.length} reminders)`}
                className={`h-16 sm:h-20 rounded-2xl p-2 flex flex-col items-center justify-between transition-all tabular-nums ${
                  isSelected
                    ? 'liquid-btn-primary text-white'
                    : isToday
                    ? 'liquid-glass-interactive ring-2 ring-blue-500/70 text-blue-700 dark:text-blue-300'
                    : dayItems.length > 0
                    ? 'liquid-glass-interactive text-slate-900 dark:text-white'
                    : 'bg-white/35 dark:bg-slate-900/30 border border-white/45 dark:border-white/5 hover:bg-white/60 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-sm font-bold">{dayNum}</span>

                {dayItems.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    <span
                      className={`text-[11px] font-semibold ${
                        isSelected
                          ? 'text-blue-100'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {dayItems.length} {dayItems.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Agenda (Right 5 Columns) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="rounded-[28px] liquid-glass p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                Selected Date Schedule
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {selectedDateKey}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onOpenAddForDate(`${selectedDateKey}T09:00:00`)}
              className="px-3.5 py-2 rounded-xl liquid-btn-primary text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add on Date
            </button>
          </div>

          {selectedDayReminders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300/80 dark:border-slate-700/80 p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No reminders scheduled for {selectedDateKey}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click &ldquo;Add on Date&rdquo; to schedule a reminder on this day.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayReminders.map((r) => (
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
      </div>
    </div>
  );
};
