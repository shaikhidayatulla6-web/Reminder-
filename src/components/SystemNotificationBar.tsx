import React, { useEffect, useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Play,
  Radio,
  Timer,
  Vibrate,
  Volume2,
  Wifi,
  X,
} from 'lucide-react';
import { Reminder, ReminderCategory, SnoozeDuration } from '../types/reminder';
import {
  computeCountdownParts,
  formatReminderTime,
  getEffectiveTriggerTime,
} from '../utils/reminderLogic';
import { SOUND_LABELS } from '../utils/soundAndNotifications';

interface SystemNotificationBarProps {
  reminders: Reminder[];
  categories: ReminderCategory[];
  firingReminder: Reminder | null;
  use24Hour: boolean;
  hideContentOnLockScreen: boolean;
  onMarkDone: (reminder: Reminder) => void;
  onSnooze: (reminder: Reminder, minutes: SnoozeDuration) => void;
  onDismissFiring: () => void;
  onTriggerNow: (reminder: Reminder) => void;
  onScheduleInSeconds: (seconds: number) => void;
}

const SNOOZE_OPTIONS: SnoozeDuration[] = [5, 10, 15, 30, 60];

export const SystemNotificationBar: React.FC<SystemNotificationBarProps> = ({
  reminders,
  categories,
  firingReminder,
  use24Hour,
  hideContentOnLockScreen,
  onMarkDone,
  onSnooze,
  onDismissFiring,
  onTriggerNow,
  onScheduleInSeconds,
}) => {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [isShadeOpen, setIsShadeOpen] = useState<boolean>(false);
  const [simCountdownSec, setSimCountdownSec] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Automatically expand the notification bar drawer when a scheduled reminder fires
  useEffect(() => {
    if (firingReminder) {
      setIsShadeOpen(true);
      setSimCountdownSec(null);
    }
  }, [firingReminder]);

  // Visual 5-second countdown indicator when user clicks "Schedule 5s Test"
  useEffect(() => {
    if (simCountdownSec === null) return;
    if (simCountdownSec <= 0) {
      setSimCountdownSec(null);
      return;
    }
    const timer = setTimeout(() => {
      setSimCountdownSec((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [simCountdownSec]);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const pendingSorted = reminders
    .filter((r) => !r.isCompleted)
    .sort(
      (a, b) =>
        Date.parse(getEffectiveTriggerTime(a)) - Date.parse(getEffectiveTriggerTime(b))
    );

  const upcomingOnly = pendingSorted.filter(
    (r) => Date.parse(getEffectiveTriggerTime(r)) > nowMs
  );
  const nextScheduled = upcomingOnly[0] || pendingSorted[0] || null;
  const nextCountdown = nextScheduled
    ? computeCountdownParts(nextScheduled, nowMs)
    : null;

  const systemTimeStr = new Date(nowMs).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !use24Hour,
  });

  const firingCategory = firingReminder
    ? categoryMap.get(firingReminder.categoryId)
    : undefined;
  const nextCategory = nextScheduled
    ? categoryMap.get(nextScheduled.categoryId)
    : undefined;

  return (
    <div
      role="region"
      aria-label="Android System Notification Bar"
      className="sticky top-0 z-50 w-full"
    >
      {/* Top Android / OriginOS 7 System Notification Status Bar */}
      <div
        className={`w-full transition-colors duration-300 border-b ${
          firingReminder
            ? 'bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 border-cyan-400/50 text-white shadow-lg shadow-blue-950/50'
            : 'bg-slate-950/95 border-white/15 text-slate-200'
        } backdrop-blur-2xl`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-10 flex items-center justify-between gap-2 text-xs">
          {/* Left: System Clock + Active Notification Bar Status */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="font-mono font-bold text-[11px] text-white tabular-nums shrink-0">
              {systemTimeStr}
            </span>

            <span className="text-slate-600 shrink-0" aria-hidden="true">
              |
            </span>

            {firingReminder ? (
              <button
                type="button"
                onClick={() => setIsShadeOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 font-semibold truncate animate-pulse"
              >
                <BellRing className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                <span className="truncate">
                  🔔 SCHEDULED TIME NOW: {firingCategory?.emoji || '🔔'} {firingReminder.title}
                </span>
              </button>
            ) : simCountdownSec !== null ? (
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/25 border border-amber-400/40 text-amber-200 font-semibold truncate">
                <Timer className="w-3.5 h-3.5 text-amber-300 animate-spin shrink-0" />
                <span className="tabular-nums truncate">
                  Scheduled notification arriving in {simCountdownSec}s…
                </span>
              </div>
            ) : nextScheduled && nextCountdown ? (
              <button
                type="button"
                onClick={() => setIsShadeOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 text-left min-w-0 hover:text-white transition-colors truncate"
                title="Click to open Android Notification Bar Drawer"
              >
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 font-semibold text-[11px] shrink-0">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span className="tabular-nums">
                    {formatReminderTime(getEffectiveTriggerTime(nextScheduled), use24Hour)}
                  </span>
                </span>
                <span className="truncate text-slate-200 font-medium">
                  {nextCategory?.emoji || '🔔'} {nextScheduled.title}
                </span>
                <span className="hidden md:inline-block font-mono text-[11px] text-cyan-300 tabular-nums shrink-0">
                  ({nextCountdown.isOverdue ? 'OVERDUE' : `in ${nextCountdown.formattedClock}`})
                </span>
              </button>
            ) : (
              <span className="text-slate-400 truncate">
                No pending scheduled reminders in notification bar
              </span>
            )}
          </div>

          {/* Right: Live Scheduled Time Test Trigger + Pull-Down Notification Drawer Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSimCountdownSec(5);
                onScheduleInSeconds(5);
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
              title="Schedules a reminder for 5 seconds from now so you can watch it pop into the notification bar at the exact scheduled time"
            >
              <Timer className="w-3 h-3" />
              <span className="hidden sm:inline">Test Scheduled Time (5s)</span>
              <span className="sm:hidden">Test 5s</span>
            </button>

            {nextScheduled && !firingReminder && (
              <button
                type="button"
                onClick={() => onTriggerNow(nextScheduled)}
                className="hidden md:inline-flex px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/15 text-cyan-300 text-[11px] font-semibold items-center gap-1 transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3" />
                <span>Fire Now</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsShadeOpen((prev) => !prev)}
              aria-expanded={isShadeOpen}
              aria-label="Toggle Android Notification Bar Shade"
              className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-white/15 text-slate-200 text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bell className="w-3 h-3 text-cyan-400" />
              <span className="tabular-nums">{pendingSorted.length}</span>
              {isShadeOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <div className="hidden lg:flex items-center gap-1.5 pl-1 text-slate-400">
              <Wifi className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono text-emerald-400 font-bold">100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Pull-Down Notification Bar Drawer (Auto-Opens at Scheduled Time) */}
      {(isShadeOpen || firingReminder) && (
        <div className="w-full bg-slate-950/92 backdrop-blur-3xl border-b border-white/20 text-white shadow-2xl transition-all">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-4">
            {/* Drawer Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>OriginOS 7 · Android Notification Bar Shade</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-300">{systemTimeStr}</span>
              </div>

              <div className="flex items-center gap-2">
                {firingReminder && (
                  <button
                    type="button"
                    onClick={onDismissFiring}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 inline-flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Dismiss Active Alert
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsShadeOpen(false);
                    if (firingReminder) onDismissFiring();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 inline-flex items-center gap-1"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  Collapse Bar
                </button>
              </div>
            </div>

            {/* 1. Active Scheduled-Time Firing Notification Card */}
            {firingReminder && (
              <div
                role="alert"
                className="rounded-2xl bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-slate-900/90 border border-cyan-400/50 p-4 sm:p-5 shadow-xl space-y-3.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border border-white/20"
                      style={{
                        backgroundColor: `${firingCategory?.colorHex || '#2563EB'}33`,
                      }}
                    >
                      {firingCategory?.emoji || '🔔'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-300 font-semibold">
                        <BellRing className="w-3.5 h-3.5 animate-bounce" />
                        <span>RemindMe · Scheduled Alarm Due Now</span>
                        <span>·</span>
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-200 font-mono text-[11px] tabular-nums">
                          Scheduled:{' '}
                          {formatReminderTime(
                            getEffectiveTriggerTime(firingReminder),
                            use24Hour
                          )}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                        {firingReminder.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-200 mt-0.5">
                        {hideContentOnLockScreen
                          ? 'Reminder details hidden by Lock Screen privacy setting.'
                          : firingReminder.description ||
                            `Scheduled ${firingCategory?.name || 'Reminder'} alert has reached its scheduled time.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/10">
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{SOUND_LABELS[firingReminder.sound].label}</span>
                    <span>·</span>
                    <Vibrate className="w-3.5 h-3.5 text-purple-400" />
                    <span>{firingReminder.vibrationEnabled ? 'Vibrating' : 'Silent'}</span>
                  </div>
                </div>

                {/* Notification Bar Inline Action Buttons */}
                <div className="pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onMarkDone(firingReminder)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark as Done
                  </button>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-slate-300 inline-flex items-center gap-1 mr-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Snooze in Notification Bar:
                    </span>
                    {SNOOZE_OPTIONS.map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => onSnooze(firingReminder, mins)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold tabular-nums transition-colors cursor-pointer"
                      >
                        +{mins}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Ongoing Scheduled Reminders Pinned in Notification Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  Scheduled Reminders Pinned in Notification Bar ({ Math.min(pendingSorted.length, 3) } of {pendingSorted.length})
                </span>
                <span className="text-[11px]">
                  Auto-triggers sound, vibration & banner at exact scheduled time
                </span>
              </div>

              {pendingSorted.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/70 border border-white/10 text-xs text-slate-400 text-center">
                  All scheduled reminders are completed! Create a reminder to pin it to the notification bar.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {pendingSorted.slice(0, 3).map((rem) => {
                    const cat = categoryMap.get(rem.categoryId);
                    const cd = computeCountdownParts(rem, nowMs);
                    return (
                      <div
                        key={rem.id}
                        className="p-3 rounded-xl bg-slate-900/85 border border-white/10 flex flex-col justify-between gap-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base shrink-0">{cat?.emoji || '🔔'}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">
                                {rem.title}
                              </p>
                              <p className="text-[11px] text-slate-400 tabular-nums">
                                Scheduled: {formatReminderTime(getEffectiveTriggerTime(rem), use24Hour)}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold tabular-nums shrink-0 ${
                              cd.isOverdue
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-cyan-500/15 text-cyan-300'
                            }`}
                          >
                            {cd.isOverdue ? 'DUE / OVERDUE' : cd.formattedClock}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => onTriggerNow(rem)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/30 text-cyan-200 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <BellRing className="w-3 h-3" />
                            Fire Alert
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onSnooze(rem, 10)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium cursor-pointer"
                            >
                              +10m
                            </button>
                            <button
                              type="button"
                              onClick={() => onMarkDone(rem)}
                              className="px-2 py-1 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-300 text-[11px] font-semibold cursor-pointer"
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
