/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  FolderKanban,
  Home,
  Plus,
  Search,
  Settings as SettingsIcon,
} from 'lucide-react';
import {
  ActiveTab,
  AppSettings,
  CompletionLog,
  CustomIntervalUnit,
  FilterCriteria,
  Priority,
  Reminder,
  ReminderCategory,
  RepeatType,
  SnoozeDuration,
  SoundOption,
} from './types/reminder';
import {
  calculateNextOccurrence,
  calculateSnoozeUntil,
  getEffectiveTriggerTime,
  getSmartNotificationPreset,
} from './utils/reminderLogic';
import {
  createSeedReminders,
  loadCategories,
  loadCompletionHistory,
  loadReminders,
  loadSettings,
  saveCategories,
  saveCompletionHistory,
  saveReminders,
  saveSettings,
} from './utils/storageRepository';
import {
  autoInitializeNotificationEngine,
  HapticInteractionType,
  playNotificationSound,
  sendSystemNotification,
  triggerDeviceVibration,
  triggerHapticFeedback,
} from './utils/soundAndNotifications';
import { DashboardView } from './components/DashboardView';
import { CalendarView } from './components/CalendarView';
import { CategoriesView } from './components/CategoriesView';
import { SearchFilterView } from './components/SearchFilterView';
import { SettingsView } from './components/SettingsView';
import { AndroidProjectExplorer } from './components/AndroidProjectExplorer';
import { ReminderModal } from './components/ReminderModal';
import { ReminderDetailDrawer } from './components/ReminderDetailDrawer';
import { SmartNotificationBanner } from './components/SmartNotificationBanner';
import { OnboardingModal } from './components/OnboardingModal';
import { ApkDownloadModal } from './components/ApkDownloadModal';
import { SystemNotificationBar } from './components/SystemNotificationBar';

const DEFAULT_FILTER: FilterCriteria = {
  query: '',
  categoryId: 'ALL',
  priority: 'ALL',
  status: 'ALL',
  dateFilter: 'ALL',
  sortBy: 'UPCOMING_TIME',
};

export default function App() {
  const [reminders, setReminders] = useState<Reminder[]>(() => loadReminders());
  const [categories, setCategories] = useState<ReminderCategory[]>(() => loadCategories());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [completionLogs, setCompletionLogs] = useState<CompletionLog[]>(() =>
    loadCompletionHistory()
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>(DEFAULT_FILTER);

  // Modals & Drawers
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [modalInitialDateIso, setModalInitialDateIso] = useState<string | null>(null);
  const [modalPresetCategoryId, setModalPresetCategoryId] = useState<string | null>(null);
  const [detailReminder, setDetailReminder] = useState<Reminder | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  // Active Smart Notification, Haptic Telemetry & Confirmation Toast
  const [firingReminder, setFiringReminder] = useState<Reminder | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [lastHapticEvent, setLastHapticEvent] = useState<{
    label: string;
    pattern: number[];
    timestamp: number;
  } | null>(null);
  const firedKeysRef = useRef<Set<string>>(new Set());

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  const emitHaptic = (type: HapticInteractionType, forceEnabled?: boolean) => {
    const enabled = forceEnabled !== undefined ? forceEnabled : settings.defaultVibration;
    const result = triggerHapticFeedback(type, enabled);
    setLastHapticEvent({
      label: result.label,
      pattern: result.pattern,
      timestamp: Date.now(),
    });
  };

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // Automatically initialize notification engine & permissions on startup
  useEffect(() => {
    autoInitializeNotificationEngine();
  }, []);

  // Sync persistence
  useEffect(() => {
    saveReminders(reminders);
  }, [reminders]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveSettings(settings);
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    saveCompletionHistory(completionLogs);
  }, [completionLogs]);

  // Update browser tab / status bar title when a scheduled reminder is firing
  useEffect(() => {
    if (firingReminder) {
      document.title = `🔔 [DUE NOW] ${firingReminder.title} — RemindMe`;
    } else {
      document.title = 'RemindMe — Complete Android Reminder App';
    }
  }, [firingReminder]);

  // Listen for action clicks from the native Android/Desktop Service Worker Notification Bar
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handleSwMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.type !== 'REMINDME_NOTIFICATION_ACTION') return;
      const target = reminders.find((r) => r.id === data.reminderId);
      if (!target) return;
      if (data.action === 'done') {
        handleToggleComplete(target);
      } else if (data.action === 'snooze-10') {
        handleSnoozeReminder(target, 10);
      } else {
        setFiringReminder(target);
      }
    };
    navigator.serviceWorker.addEventListener('message', handleSwMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleSwMessage);
  }, [reminders]);

  // Real-Time Alarm Scheduler Loop (checks every second for due reminders)
  useEffect(() => {
    const interval = setInterval(() => {
      const nowMs = Date.now();
      for (const r of reminders) {
        if (r.isCompleted) continue;
        const effectiveIso = getEffectiveTriggerTime(r);
        const triggerMs = Date.parse(effectiveIso);
        if (Number.isNaN(triggerMs)) continue;

        // Fire if due within the last 55 seconds and not yet fired for this exact timestamp
        const fireKey = `${r.id}::${effectiveIso}`;
        if (
          triggerMs <= nowMs &&
          nowMs - triggerMs < 55_000 &&
          !firedKeysRef.current.has(fireKey)
        ) {
          firedKeysRef.current.add(fireKey);
          triggerAlarmForReminder(r);
          break;
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [reminders, settings]);

  const triggerAlarmForReminder = (reminder: Reminder) => {
    setFiringReminder(reminder);
    playNotificationSound(reminder.sound);
    triggerDeviceVibration(reminder.vibrationEnabled);
    emitHaptic('alarm', reminder.vibrationEnabled);
    const cat = categories.find((c) => c.id === reminder.categoryId);
    sendSystemNotification(
      `${cat?.emoji || '🔔'} ${reminder.title}`,
      settings.hideContentOnLockScreen
        ? 'Scheduled reminder is due now'
        : reminder.description || 'Scheduled reminder is due now',
      reminder.id,
      reminder.vibrationEnabled
    );
  };

  const handleScheduleInSeconds = (seconds: number) => {
    emitHaptic('create');
    const now = new Date();
    const targetIso = new Date(now.getTime() + seconds * 1000).toISOString();
    const pending = reminders.filter((r) => !r.isCompleted);

    if (pending.length > 0) {
      const targetRem = pending[0];
      setReminders((prev) =>
        prev.map((r) =>
          r.id === targetRem.id
            ? {
                ...r,
                scheduledAt: targetIso,
                snoozedUntil: null,
                updatedAt: now.toISOString(),
              }
            : r
        )
      );
      showToast(
        `Scheduled "${targetRem.title}" to trigger in ${seconds} seconds — watch the Notification Bar!`
      );
    } else {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const newRem: Reminder = {
        id: `rem-live-${Date.now()}`,
        title: 'Scheduled Hydration & Posture Check',
        description: 'Triggered automatically at the exact scheduled time in the Notification Bar',
        categoryId: 'cat-water',
        scheduledAt: targetIso,
        timeZone: tz,
        repeatType: 'ONCE',
        selectedWeekdays: [],
        customIntervalValue: 1,
        customIntervalUnit: 'DAYS',
        endDate: null,
        priority: 'HIGH',
        sound: 'CRYSTAL',
        vibrationEnabled: true,
        isCompleted: false,
        snoozedUntil: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      setReminders((prev) => [newRem, ...prev]);
      showToast(`Scheduled reminder for ${seconds}s from now — watch the Notification Bar!`);
    }
  };

  // Handlers
  const handleSaveReminder = (data: {
    id?: string;
    title: string;
    description: string;
    categoryId: string;
    scheduledAt: string;
    repeatType: RepeatType;
    selectedWeekdays: number[];
    customIntervalValue: number;
    customIntervalUnit: CustomIntervalUnit;
    endDate: string | null;
    priority: Priority;
    sound: SoundOption;
    vibrationEnabled: boolean;
  }) => {
    const nowIso = new Date().toISOString();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    emitHaptic('create', data.vibrationEnabled);

    if (data.id) {
      setReminders((prev) =>
        prev.map((r) =>
          r.id === data.id
            ? {
                ...r,
                title: data.title,
                description: data.description,
                categoryId: data.categoryId,
                scheduledAt: data.scheduledAt,
                repeatType: data.repeatType,
                selectedWeekdays: data.selectedWeekdays,
                customIntervalValue: data.customIntervalValue,
                customIntervalUnit: data.customIntervalUnit,
                endDate: data.endDate,
                priority: data.priority,
                sound: data.sound,
                vibrationEnabled: data.vibrationEnabled,
                snoozedUntil: null,
                updatedAt: nowIso,
              }
            : r
        )
      );
      showToast(`Updated reminder "${data.title}"`);
    } else {
      const newReminder: Reminder = {
        id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        scheduledAt: data.scheduledAt,
        timeZone: tz,
        repeatType: data.repeatType,
        selectedWeekdays: data.selectedWeekdays,
        customIntervalValue: data.customIntervalValue,
        customIntervalUnit: data.customIntervalUnit,
        endDate: data.endDate,
        priority: data.priority,
        sound: data.sound,
        vibrationEnabled: data.vibrationEnabled,
        isCompleted: false,
        snoozedUntil: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setReminders((prev) => [newReminder, ...prev]);
      showToast(`Scheduled "${newReminder.title}"`);
    }
  };

  const handleQuickCreateReminder = (
    title: string,
    categoryId: string,
    minutesFromNow: number
  ) => {
    const now = new Date();
    const scheduledAt = new Date(now.getTime() + minutesFromNow * 60_000).toISOString();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const smartPreset = getSmartNotificationPreset(categoryId, 'MEDIUM');
    const newReminder: Reminder = {
      id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      description: '',
      categoryId,
      scheduledAt,
      timeZone: tz,
      repeatType: 'ONCE',
      selectedWeekdays: [],
      customIntervalValue: 1,
      customIntervalUnit: 'DAYS',
      endDate: null,
      priority: 'MEDIUM',
      sound: settings.autoConfigureNotifications ? smartPreset.sound : settings.defaultSound,
      vibrationEnabled: settings.autoConfigureNotifications
        ? smartPreset.vibrationEnabled
        : settings.defaultVibration,
      isCompleted: false,
      snoozedUntil: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    emitHaptic('create', newReminder.vibrationEnabled);
    setReminders((prev) => [newReminder, ...prev]);
    showToast(`Quick reminder "${title}" scheduled (${smartPreset.channelLabel})`);
  };

  const handleAutoOptimizeAllReminders = () => {
    const nowIso = new Date().toISOString();
    emitHaptic('complete');
    setReminders((prev) =>
      prev.map((r) => {
        const preset = getSmartNotificationPreset(r.categoryId, r.priority);
        return {
          ...r,
          sound: preset.sound,
          vibrationEnabled: preset.vibrationEnabled,
          updatedAt: nowIso,
        };
      })
    );
    showToast('Auto-configured smart notification sound & vibration across all reminders');
  };

  const handleToggleComplete = (reminder: Reminder) => {
    const nowIso = new Date().toISOString();
    emitHaptic(
      reminder.isCompleted ? 'uncomplete' : 'complete',
      reminder.vibrationEnabled && settings.defaultVibration
    );

    if (!reminder.isCompleted) {
      // Log completion history
      const newLog: CompletionLog = {
        id: `log-${Date.now()}`,
        reminderId: reminder.id,
        reminderTitle: reminder.title,
        categoryId: reminder.categoryId,
        completedAt: nowIso,
        scheduledFor: getEffectiveTriggerTime(reminder),
      };
      setCompletionLogs((prev) => [newLog, ...prev]);

      // Check if recurring reminder has a next occurrence
      if (reminder.repeatType !== 'ONCE') {
        const nextIso = calculateNextOccurrence(reminder.scheduledAt, reminder.repeatType, {
          selectedWeekdays: reminder.selectedWeekdays,
          customIntervalValue: reminder.customIntervalValue,
          customIntervalUnit: reminder.customIntervalUnit,
          endDate: reminder.endDate,
          referenceNowIso: nowIso,
        });

        if (nextIso) {
          setReminders((prev) =>
            prev.map((r) =>
              r.id === reminder.id
                ? {
                    ...r,
                    scheduledAt: nextIso,
                    snoozedUntil: null,
                    updatedAt: nowIso,
                  }
                : r
            )
          );
          if (firingReminder?.id === reminder.id) setFiringReminder(null);
          showToast(
            `Completed "${reminder.title}" — Rescheduled for next ${reminder.repeatType.toLowerCase()} occurrence`
          );
          return;
        }
      }
    }

    setReminders((prev) =>
      prev.map((r) =>
        r.id === reminder.id
          ? {
              ...r,
              isCompleted: !r.isCompleted,
              snoozedUntil: null,
              updatedAt: nowIso,
            }
          : r
      )
    );
    if (firingReminder?.id === reminder.id) setFiringReminder(null);
    showToast(
      reminder.isCompleted
        ? `Marked "${reminder.title}" as pending`
        : `Completed "${reminder.title}"`
    );
  };

  const handleSnoozeReminder = (reminder: Reminder, minutes: SnoozeDuration) => {
    emitHaptic('snooze', reminder.vibrationEnabled && settings.defaultVibration);
    const snoozedUntil = calculateSnoozeUntil(minutes);
    const nowIso = new Date().toISOString();
    setReminders((prev) =>
      prev.map((r) =>
        r.id === reminder.id
          ? {
              ...r,
              snoozedUntil,
              isCompleted: false,
              updatedAt: nowIso,
            }
          : r
      )
    );
    if (firingReminder?.id === reminder.id) {
      setFiringReminder(null);
    }
    showToast(`Snoozed "${reminder.title}" for ${minutes} minutes`);
  };

  const handleDuplicateReminder = (reminder: Reminder) => {
    emitHaptic('create', reminder.vibrationEnabled && settings.defaultVibration);
    const nowIso = new Date().toISOString();
    const copy: Reminder = {
      ...reminder,
      id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${reminder.title} (Copy)`,
      isCompleted: false,
      snoozedUntil: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setReminders((prev) => [copy, ...prev]);
    showToast(`Duplicated "${reminder.title}"`);
  };

  const handleDeleteReminder = (id: string) => {
    emitHaptic('delete');
    const target = reminders.find((r) => r.id === id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
    if (firingReminder?.id === id) setFiringReminder(null);
    if (detailReminder?.id === id) setDetailReminder(null);
    if (target) {
      showToast(`Deleted "${target.title}"`);
    }
  };

  const handleCreateCustomCategory = (
    name: string,
    emoji: string,
    colorHex: string
  ): ReminderCategory => {
    const newCat: ReminderCategory = {
      id: `cat-custom-${Date.now()}`,
      name,
      emoji,
      colorHex,
      isDefault: false,
    };
    setCategories((prev) => [...prev, newCat]);
    showToast(`Created category "${emoji} ${name}"`);
    return newCat;
  };

  const handleDeleteCustomCategory = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId || c.isDefault));
    setReminders((prev) =>
      prev.map((r) => (r.categoryId === catId ? { ...r, categoryId: 'cat-other' } : r))
    );
    showToast('Deleted custom category');
  };

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors relative overflow-x-hidden liquid-canvas-bg ${
        settings.theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
      } ${settings.enableLiquidFluidAnimations ? '' : 'liquid-motion-disabled'}`}
    >
      {/* OriginOS 7 Ambient Fluid Refractive Light Orbs behind Liquid Glass surfaces */}
      {settings.enableLiquidFluidAnimations && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-hidden z-0"
        >
          <div className="origin-fluid-orb absolute -top-28 -left-20 w-[26rem] h-[26rem] rounded-full bg-blue-500/20 dark:bg-blue-500/26 blur-3xl" />
          <div className="origin-fluid-orb-delayed absolute top-1/4 -right-24 w-[30rem] h-[30rem] rounded-full bg-purple-500/18 dark:bg-purple-500/24 blur-3xl" />
          <div className="origin-fluid-orb absolute -bottom-32 left-1/3 w-[28rem] h-[28rem] rounded-full bg-cyan-400/20 dark:bg-cyan-500/22 blur-3xl" />
        </div>
      )}

      {/* Android / OriginOS 7 Top System Notification Bar & Pull-Down Shade */}
      <SystemNotificationBar
        reminders={reminders}
        categories={categories}
        firingReminder={firingReminder}
        use24Hour={settings.use24HourFormat}
        hideContentOnLockScreen={settings.hideContentOnLockScreen}
        onMarkDone={handleToggleComplete}
        onSnooze={handleSnoozeReminder}
        onDismissFiring={() => setFiringReminder(null)}
        onTriggerNow={triggerAlarmForReminder}
        onScheduleInSeconds={handleScheduleInSeconds}
      />

      {/* Top Bar Contract (3 Zones: 1-line Brand Wordmark | 5 Concise Nav Links | 1 Primary CTA) */}
      <header className="sticky top-10 z-30 liquid-glass-bar">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 h-12 md:h-14">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('dashboard');
            }}
            className="text-lg font-bold tracking-tight text-blue-600 dark:text-blue-400 whitespace-nowrap shrink-0"
          >
            RemindMe
          </a>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'dashboard'
                  ? 'text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'calendar'
                  ? 'text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'categories'
                  ? 'text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Categories
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'search'
                  ? 'text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'settings'
                  ? 'text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Settings
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditingReminder(null);
                setModalInitialDateIso(null);
                setModalPresetCategoryId(null);
                setIsAddEditOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white rounded-xl liquid-btn-primary whitespace-nowrap shrink-0"
            >
              New Reminder
            </button>
          </div>
        </div>
      </header>

      {/* Confirmation Toast */}
      {toastMsg && (
        <div
          role="status"
          className="fixed bottom-20 md:bottom-6 right-4 z-40 rounded-2xl liquid-glass-notification text-white px-4 py-2.5 text-xs font-semibold"
        >
          {toastMsg}
        </div>
      )}

      {/* Main Content Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            reminders={reminders}
            categories={categories}
            completionLogs={completionLogs}
            use24Hour={settings.use24HourFormat}
            theme={settings.theme}
            defaultCategoryId={settings.defaultCategoryId}
            vibrationEnabled={settings.defaultVibration}
            lastHapticEvent={lastHapticEvent}
            onToggleTheme={() => {
              emitHaptic('tap');
              setSettings((prev) => ({
                ...prev,
                theme: prev.theme === 'dark' ? 'light' : 'dark',
              }));
            }}
            onOpenAddModal={(presetCat) => {
              setEditingReminder(null);
              setModalInitialDateIso(null);
              setModalPresetCategoryId(presetCat || null);
              setIsAddEditOpen(true);
            }}
            onQuickCreateReminder={handleQuickCreateReminder}
            onToggleComplete={handleToggleComplete}
            onSelectDetail={(r) => setDetailReminder(r)}
            onEdit={(r) => {
              setEditingReminder(r);
              setIsAddEditOpen(true);
            }}
            onDuplicate={handleDuplicateReminder}
            onDelete={handleDeleteReminder}
            onSnooze={handleSnoozeReminder}
            onTriggerTestAlarm={triggerAlarmForReminder}
            onNavigateToCategoryFilter={(catId) => {
              setFilterCriteria({ ...DEFAULT_FILTER, categoryId: catId });
              setActiveTab('search');
            }}
            onOpenAndroidSource={() => setActiveTab('android-source')}
            onOpenTour={() => setIsTourOpen(true)}
            onOpenApkModal={() => {
              emitHaptic('tap');
              setIsApkModalOpen(true);
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            reminders={reminders}
            categories={categories}
            use24Hour={settings.use24HourFormat}
            onOpenAddForDate={(dateIso) => {
              setEditingReminder(null);
              setModalInitialDateIso(dateIso);
              setIsAddEditOpen(true);
            }}
            onToggleComplete={handleToggleComplete}
            onSelectDetail={(r) => setDetailReminder(r)}
            onEdit={(r) => {
              setEditingReminder(r);
              setIsAddEditOpen(true);
            }}
            onDuplicate={handleDuplicateReminder}
            onDelete={handleDeleteReminder}
            onSnooze={handleSnoozeReminder}
            onTriggerTestAlarm={triggerAlarmForReminder}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesView
            categories={categories}
            reminders={reminders}
            onCreateCategory={handleCreateCustomCategory}
            onDeleteCustomCategory={handleDeleteCustomCategory}
            onSelectCategoryFilter={(catId) => {
              setFilterCriteria({ ...DEFAULT_FILTER, categoryId: catId });
              setActiveTab('search');
            }}
            onOpenAddWithCategory={(catId) => {
              setEditingReminder(null);
              setModalPresetCategoryId(catId);
              setIsAddEditOpen(true);
            }}
          />
        )}

        {activeTab === 'search' && (
          <SearchFilterView
            reminders={reminders}
            categories={categories}
            criteria={filterCriteria}
            use24Hour={settings.use24HourFormat}
            onChangeCriteria={setFilterCriteria}
            onResetCriteria={() => setFilterCriteria(DEFAULT_FILTER)}
            onToggleComplete={handleToggleComplete}
            onSelectDetail={(r) => setDetailReminder(r)}
            onEdit={(r) => {
              setEditingReminder(r);
              setIsAddEditOpen(true);
            }}
            onDuplicate={handleDuplicateReminder}
            onDelete={handleDeleteReminder}
            onSnooze={handleSnoozeReminder}
            onTriggerTestAlarm={triggerAlarmForReminder}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            categories={categories}
            reminders={reminders}
            completionLogs={completionLogs}
            onUpdateSettings={(next) => {
              emitHaptic('tap');
              setSettings((prev) => ({ ...prev, ...next }));
            }}
            onAutoOptimizeAllReminders={handleAutoOptimizeAllReminders}
            onRestoreBackup={({ reminders: rList, categories: cList, completionLogs: lList }) => {
              setReminders(rList);
              setCategories(cList);
              if (lList) setCompletionLogs(lList);
            }}
            onResetSampleData={() => {
              setReminders(createSeedReminders());
            }}
          />
        )}

        {activeTab === 'android-source' && <AndroidProjectExplorer />}
      </main>

      {/* Mobile Floating "+" Action Button (Thumb Zone) */}
      <button
        type="button"
        onClick={() => {
          setEditingReminder(null);
          setModalInitialDateIso(null);
          setModalPresetCategoryId(null);
          setIsAddEditOpen(true);
        }}
        aria-label="Create new reminder"
        className="md:hidden fixed right-4 bottom-20 z-30 w-13 h-13 rounded-2xl liquid-btn-primary text-white flex items-center justify-center transition-transform active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Mobile Bottom Navigation Bar (OriginOS 7 Floating Liquid Glass Dock) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 liquid-glass-bar border-t border-white/60 dark:border-white/10 grid grid-cols-5 items-center h-15"
      >
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center h-full ${
            activeTab === 'dashboard'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center h-full ${
            activeTab === 'calendar'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex flex-col items-center justify-center h-full ${
            activeTab === 'categories'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <FolderKanban className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Categories</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`flex flex-col items-center justify-center h-full ${
            activeTab === 'search'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Search</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center h-full ${
            activeTab === 'settings'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Settings</span>
        </button>
      </nav>

      {/* Modals & Drawers */}
      <ReminderModal
        isOpen={isAddEditOpen}
        editingReminder={editingReminder}
        initialDateIso={modalInitialDateIso}
        categories={categories}
        defaultCategoryId={modalPresetCategoryId || settings.defaultCategoryId}
        defaultSound={settings.defaultSound}
        defaultVibration={settings.defaultVibration}
        autoConfigureNotifications={settings.autoConfigureNotifications}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingReminder(null);
        }}
        onSave={handleSaveReminder}
        onCreateCustomCategory={handleCreateCustomCategory}
      />

      <ReminderDetailDrawer
        reminder={detailReminder}
        category={detailReminder ? categoryMap.get(detailReminder.categoryId) : undefined}
        use24Hour={settings.use24HourFormat}
        completionLogs={completionLogs}
        onClose={() => setDetailReminder(null)}
        onToggleComplete={handleToggleComplete}
        onSnooze={handleSnoozeReminder}
        onEdit={(r) => {
          setDetailReminder(null);
          setEditingReminder(r);
          setIsAddEditOpen(true);
        }}
        onDuplicate={handleDuplicateReminder}
        onDelete={handleDeleteReminder}
        onTriggerTestAlarm={triggerAlarmForReminder}
      />

      <OnboardingModal isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />

      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        onOpenAndroidSource={() => setActiveTab('android-source')}
      />
    </div>
  );
}
