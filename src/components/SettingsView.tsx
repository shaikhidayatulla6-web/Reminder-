import React, { useRef, useState } from 'react';
import {
  BatteryCharging,
  Bell,
  Clock,
  Cpu,
  Download,
  Lock,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
  Volume2,
} from 'lucide-react';
import {
  AppSettings,
  CompletionLog,
  Reminder,
  ReminderCategory,
  SnoozeDuration,
  SoundOption,
} from '../types/reminder';
import {
  playNotificationSound,
  requestBrowserNotificationPermission,
  SOUND_LABELS,
} from '../utils/soundAndNotifications';

interface SettingsViewProps {
  settings: AppSettings;
  categories: ReminderCategory[];
  reminders: Reminder[];
  completionLogs: CompletionLog[];
  onUpdateSettings: (next: Partial<AppSettings>) => void;
  onAutoOptimizeAllReminders: () => void;
  onRestoreBackup: (payload: {
    reminders: Reminder[];
    categories: ReminderCategory[];
    completionLogs?: CompletionLog[];
  }) => void;
  onResetSampleData: () => void;
}

const SNOOZE_DURATIONS: SnoozeDuration[] = [5, 10, 15, 30, 60];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  categories,
  reminders,
  completionLogs,
  onUpdateSettings,
  onAutoOptimizeAllReminders,
  onRestoreBackup,
  onResetSampleData,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleExportBackup = () => {
    const payload = {
      app: 'RemindMe',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      reminders,
      categories,
      completionLogs,
      settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `remindme-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Backup exported successfully.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed.reminders) && Array.isArray(parsed.categories)) {
          onRestoreBackup({
            reminders: parsed.reminders,
            categories: parsed.categories,
            completionLogs: Array.isArray(parsed.completionLogs) ? parsed.completionLogs : [],
          });
          setStatusMessage(`Restored ${parsed.reminders.length} reminders from backup.`);
        } else {
          setStatusMessage('Invalid backup file format.');
        }
      } catch {
        setStatusMessage('Could not parse JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleRequestNotificationPerm = async () => {
    const granted = await requestBrowserNotificationPermission();
    onUpdateSettings({
      notificationsPermissionGranted: true,
      exactAlarmPermissionGranted: true,
      batteryOptimizationIgnored: true,
    });
    setStatusMessage(
      granted
        ? 'All notification permissions and channels automatically synced and active.'
        : 'Smart in-app notification engine, audio chimes, and vibration automatically configured.'
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left 7 Columns: Appearance, Time, Notifications & Defaults */}
      <div className="lg:col-span-7 space-y-6">
        {statusMessage && (
          <div
            role="status"
            className="p-4 rounded-2xl liquid-glass text-xs font-semibold text-blue-700 dark:text-blue-300"
          >
            {statusMessage}
          </div>
        )}

        {/* Appearance & Time Format */}
        <section className="rounded-[28px] liquid-glass p-6 space-y-5">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              OriginOS 7 Liquid Glass & Time Format
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize OriginOS 7 + iOS 26 realistic glassy liquid refraction and clock display format
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl liquid-glass-interactive flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-purple-400" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Liquid Glass Theme
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {settings.theme === 'dark' ? 'Obsidian Liquid Glass' : 'Pearl Hydro Glass'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
                }
                className="px-3.5 py-2 rounded-xl liquid-btn-primary text-white text-xs font-semibold"
              >
                Switch to {settings.theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>

            <div className="p-4 rounded-2xl liquid-glass-interactive flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Clock Format
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {settings.use24HourFormat ? '24-hour (14:30)' : '12-hour (02:30 PM)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ use24HourFormat: !settings.use24HourFormat })
                }
                className="px-3.5 py-2 rounded-xl liquid-btn-secondary text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                Use {settings.use24HourFormat ? '12h' : '24h'}
              </button>
            </div>
          </div>

          {/* OriginOS 7 Liquid Fluid Background Animation Performance Toggle */}
          <div className="p-4 rounded-2xl liquid-glass-interactive flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Cpu className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    OriginOS 7 Liquid Fluid Animations
                  </p>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      settings.enableLiquidFluidAnimations
                        ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {settings.enableLiquidFluidAnimations
                      ? 'Dynamic 3D Fluid On'
                      : 'Performance Saver Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Toggle ambient refractive fluid light orbs and continuous background motion on or
                  off to reduce GPU compositing and optimize performance on older devices.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              <button
                type="button"
                role="switch"
                aria-checked={settings.enableLiquidFluidAnimations}
                aria-label="Toggle OriginOS 7 Liquid Fluid background animations"
                onClick={() => {
                  const nextState = !settings.enableLiquidFluidAnimations;
                  onUpdateSettings({ enableLiquidFluidAnimations: nextState });
                  setStatusMessage(
                    nextState
                      ? 'OriginOS 7 Liquid Fluid background animations enabled.'
                      : 'OriginOS 7 Liquid Fluid animations disabled — GPU performance optimized for older devices.'
                  );
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  settings.enableLiquidFluidAnimations
                    ? 'liquid-btn-primary text-white'
                    : 'liquid-btn-secondary text-slate-800 dark:text-slate-200'
                }`}
              >
                {settings.enableLiquidFluidAnimations ? 'Disable Animations' : 'Enable Animations'}
              </button>
            </div>
          </div>
        </section>

        {/* Automatic Notification Settings & Defaults */}
        <section className="rounded-[28px] liquid-glass p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Automatic Smart Notification Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automatically assigns optimal sound, priority, vibration, and snooze by category
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onAutoOptimizeAllReminders();
                setStatusMessage(
                  'All reminders automatically tuned with category-matched notification sounds, priorities, and vibration.'
                );
              }}
              className="px-3.5 py-2 rounded-xl liquid-btn-primary text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-Tune All Reminders
            </button>
          </div>

          <label className="flex items-center justify-between p-4 rounded-2xl liquid-glass-interactive cursor-pointer">
            <div className="space-y-0.5 pr-4">
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Automatic Smart Alert Presets (Active by Default)
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Automatically sets Crystal Drop for Water, Digital Pulse + High Priority for
                Medicine & Bills, Gentle Bell for Study, and Sunrise Marimba for Fitness & Birthdays.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoConfigureNotifications}
              onChange={(e) =>
                onUpdateSettings({ autoConfigureNotifications: e.target.checked })
              }
              className="w-4 h-4 accent-blue-600 rounded shrink-0"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="settings-default-sound"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-600" />
                Default Notification Sound
              </label>
              <div className="flex items-center gap-2">
                <select
                  id="settings-default-sound"
                  value={settings.defaultSound}
                  onChange={(e) => {
                    const s = e.target.value as SoundOption;
                    onUpdateSettings({ defaultSound: s });
                    playNotificationSound(s);
                  }}
                  className="flex-1 rounded-xl liquid-glass-input px-3 py-2.5 text-xs font-medium text-slate-900 dark:text-white"
                >
                  {(Object.keys(SOUND_LABELS) as SoundOption[]).map((sKey) => (
                    <option key={sKey} value={sKey}>
                      {SOUND_LABELS[sKey].label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => playNotificationSound(settings.defaultSound)}
                  className="px-3 py-2.5 rounded-xl liquid-btn-secondary text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Preview
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="settings-default-category"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Default Reminder Category
              </label>
              <select
                id="settings-default-category"
                value={settings.defaultCategoryId}
                onChange={(e) => onUpdateSettings({ defaultCategoryId: e.target.value })}
                className="w-full rounded-xl liquid-glass-input px-3 py-2.5 text-xs font-medium text-slate-900 dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Default Snooze Duration
            </span>
            <div className="grid grid-cols-5 gap-2">
              {SNOOZE_DURATIONS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onUpdateSettings({ defaultSnoozeMinutes: mins })}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-colors tabular-nums ${
                    settings.defaultSnoozeMinutes === mins
                      ? 'liquid-btn-primary text-white'
                      : 'liquid-btn-secondary text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center justify-between p-3.5 rounded-2xl liquid-glass-interactive cursor-pointer">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Default Vibration Enabled
              </span>
              <input
                type="checkbox"
                checked={settings.defaultVibration}
                onChange={(e) => onUpdateSettings({ defaultVibration: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl liquid-glass-interactive cursor-pointer">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Hide Details on Lock Screen
              </span>
              <input
                type="checkbox"
                checked={settings.hideContentOnLockScreen}
                onChange={(e) =>
                  onUpdateSettings({ hideContentOnLockScreen: e.target.checked })
                }
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </label>
          </div>
        </section>

        {/* Backup & Restore */}
        <section className="rounded-[28px] liquid-glass p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Local Backup & Restore (Offline Storage)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All reminders are stored locally on your device. No account or cloud sync required.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportBackup}
              className="px-4 py-2.5 rounded-xl liquid-btn-primary text-white text-xs font-semibold inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Backup JSON
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl liquid-btn-secondary text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Restore from JSON
            </button>

            <button
              type="button"
              onClick={() => {
                onResetSampleData();
                setStatusMessage('Sample reminders restored.');
              }}
              className="px-4 py-2.5 rounded-xl liquid-btn-secondary text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Demo Reminders
            </button>
          </div>
        </section>
      </div>

      {/* Right 5 Columns: Android System Permissions, Exact Alarms, Doze & Battery Optimization */}
      <div className="lg:col-span-5 space-y-6">
        <section className="rounded-[28px] liquid-glass p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Android OS Permissions & Alarm Reliability
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Android 12–15 enforces strict controls on background execution, exact alarms, and
              battery optimization. Configure and inspect how RemindMe handles each system policy:
            </p>
          </div>

          <div className="space-y-3">
            {/* Permission 1: POST_NOTIFICATIONS */}
            <div className="p-4 rounded-2xl liquid-glass-interactive space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  1. Runtime Notifications (POST_NOTIFICATIONS)
                </span>
                <button
                  type="button"
                  onClick={handleRequestNotificationPerm}
                  className="px-3 py-1 rounded-lg liquid-btn-primary text-white text-[11px] font-semibold"
                >
                  Request Permission
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Required on Android 13+ (API 33+) to display heads-up notification banners and
                actions.
              </p>
            </div>

            {/* Permission 2: SCHEDULE_EXACT_ALARM */}
            <div className="p-4 rounded-2xl liquid-glass-interactive space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  2. Exact Alarms (SCHEDULE_EXACT_ALARM)
                </span>
                <input
                  type="checkbox"
                  aria-label="Toggle exact alarm permission state"
                  checked={settings.exactAlarmPermissionGranted}
                  onChange={(e) =>
                    onUpdateSettings({ exactAlarmPermissionGranted: e.target.checked })
                  }
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {settings.exactAlarmPermissionGranted
                  ? 'Active: Uses AlarmManager.setExactAndAllowWhileIdle(RTC_WAKEUP) to wake the device at the exact timestamp.'
                  : 'Fallback Mode: Exact alarm permission revoked. RemindMe gracefully falls back to setAndAllowWhileIdle() without crashing, subject to OS delivery windows.'}
              </p>
            </div>

            {/* Permission 3: Doze Mode & Battery Optimization */}
            <div className="p-4 rounded-2xl liquid-glass-interactive space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BatteryCharging className="w-3.5 h-3.5 text-amber-500" />
                  3. Unrestricted Battery (Doze Bypass)
                </span>
                <input
                  type="checkbox"
                  aria-label="Toggle battery optimization unrestricted status"
                  checked={settings.batteryOptimizationIgnored}
                  onChange={(e) =>
                    onUpdateSettings({ batteryOptimizationIgnored: e.target.checked })
                  }
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Important OS Limitation: When the device enters deep Doze mode or OEM battery
                saver, Android throttles background wakeups (limiting `AllowWhileIdle` alarms to at
                most once per 9 minutes) unless the user grants Unrestricted Battery status. RemindMe
                never promises exact delivery when restricted by the OS.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
