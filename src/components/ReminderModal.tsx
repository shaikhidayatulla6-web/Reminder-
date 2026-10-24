import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Repeat,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import {
  CustomIntervalUnit,
  Priority,
  Reminder,
  ReminderCategory,
  RepeatType,
  SoundOption,
} from '../types/reminder';
import { getSmartNotificationPreset, validateReminderInput } from '../utils/reminderLogic';
import { playNotificationSound, SOUND_LABELS } from '../utils/soundAndNotifications';

interface ReminderModalProps {
  isOpen: boolean;
  editingReminder: Reminder | null;
  initialDateIso?: string | null;
  categories: ReminderCategory[];
  defaultCategoryId: string;
  defaultSound: SoundOption;
  defaultVibration: boolean;
  autoConfigureNotifications?: boolean;
  onClose: () => void;
  onSave: (data: {
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
  }) => void;
  onCreateCustomCategory: (name: string, emoji: string, colorHex: string) => ReminderCategory;
}

const WEEKDAY_LABELS = [
  { day: 0, short: 'Sun' },
  { day: 1, short: 'Mon' },
  { day: 2, short: 'Tue' },
  { day: 3, short: 'Wed' },
  { day: 4, short: 'Thu' },
  { day: 5, short: 'Fri' },
  { day: 6, short: 'Sat' },
];

function toDateTimeLocalInputs(isoString: string): { date: string; time: string } {
  const d = new Date(isoString);
  const safe = Number.isNaN(d.getTime()) ? new Date(Date.now() + 30 * 60_000) : d;
  const year = safe.getFullYear();
  const month = String(safe.getMonth() + 1).padStart(2, '0');
  const day = String(safe.getDate()).padStart(2, '0');
  const hours = String(safe.getHours()).padStart(2, '0');
  const mins = String(safe.getMinutes()).padStart(2, '0');
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${mins}`,
  };
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  editingReminder,
  initialDateIso,
  categories,
  defaultCategoryId,
  defaultSound,
  defaultVibration,
  autoConfigureNotifications = true,
  onClose,
  onSave,
  onCreateCustomCategory,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [repeatType, setRepeatType] = useState<RepeatType>('ONCE');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [customIntervalValue, setCustomIntervalValue] = useState<number>(2);
  const [customIntervalUnit, setCustomIntervalUnit] = useState<CustomIntervalUnit>('DAYS');
  const [endDate, setEndDate] = useState<string>('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [sound, setSound] = useState<SoundOption>(defaultSound);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(defaultVibration);
  const [autoSmartAlert, setAutoSmartAlert] = useState<boolean>(autoConfigureNotifications);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick inline custom category creator state
  const [showNewCatForm, setShowNewCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('✨');
  const [newCatColor, setNewCatColor] = useState('#2563EB');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setShowNewCatForm(false);

    if (editingReminder) {
      setTitle(editingReminder.title);
      setDescription(editingReminder.description);
      setCategoryId(editingReminder.categoryId);
      const dt = toDateTimeLocalInputs(editingReminder.scheduledAt);
      setDateStr(dt.date);
      setTimeStr(dt.time);
      setRepeatType(editingReminder.repeatType);
      setSelectedWeekdays(
        editingReminder.selectedWeekdays.length > 0
          ? editingReminder.selectedWeekdays
          : [1, 2, 3, 4, 5]
      );
      setCustomIntervalValue(editingReminder.customIntervalValue || 1);
      setCustomIntervalUnit(editingReminder.customIntervalUnit || 'DAYS');
      setEndDate(editingReminder.endDate ? editingReminder.endDate.slice(0, 10) : '');
      setPriority(editingReminder.priority);
      setSound(editingReminder.sound);
      setVibrationEnabled(editingReminder.vibrationEnabled);
      setAutoSmartAlert(false);
    } else {
      const defaultTarget = initialDateIso
        ? new Date(initialDateIso)
        : new Date(Date.now() + 30 * 60_000);
      const dt = toDateTimeLocalInputs(defaultTarget.toISOString());
      const initCat = defaultCategoryId || categories[0]?.id || 'cat-work';
      const preset = getSmartNotificationPreset(initCat, '');
      setTitle('');
      setDescription('');
      setCategoryId(initCat);
      setDateStr(dt.date);
      setTimeStr(dt.time);
      setRepeatType('ONCE');
      setSelectedWeekdays([1, 2, 3, 4, 5]);
      setCustomIntervalValue(2);
      setCustomIntervalUnit('DAYS');
      setEndDate('');
      setAutoSmartAlert(autoConfigureNotifications);
      setPriority(autoConfigureNotifications ? preset.priority : 'MEDIUM');
      setSound(autoConfigureNotifications ? preset.sound : defaultSound);
      setVibrationEnabled(
        autoConfigureNotifications ? preset.vibrationEnabled : defaultVibration
      );
    }
  }, [
    isOpen,
    editingReminder,
    initialDateIso,
    defaultCategoryId,
    defaultSound,
    defaultVibration,
    autoConfigureNotifications,
    categories,
  ]);

  // Automatically tune notification sound, priority, and vibration when category or title changes
  useEffect(() => {
    if (!isOpen || !autoSmartAlert) return;
    const preset = getSmartNotificationPreset(categoryId, title);
    setSound(preset.sound);
    setPriority(preset.priority);
    setVibrationEnabled(preset.vibrationEnabled);
  }, [isOpen, autoSmartAlert, categoryId, title]);

  if (!isOpen) return null;

  const activePreset = getSmartNotificationPreset(categoryId, title);

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleQuickCreateCategory = () => {
    if (!newCatName.trim()) return;
    const created = onCreateCustomCategory(newCatName.trim(), newCatEmoji || '✨', newCatColor);
    setCategoryId(created.id);
    setNewCatName('');
    setShowNewCatForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const combinedIso = new Date(`${dateStr}T${timeStr || '09:00'}:00`).toISOString();

    const validation = validateReminderInput({
      title,
      scheduledAt: combinedIso,
      repeatType,
      selectedWeekdays,
      customIntervalValue,
      endDate: endDate || null,
    });

    if (!validation.valid) {
      setErrorMsg(validation.error || 'Please check the reminder inputs.');
      return;
    }

    onSave({
      id: editingReminder?.id,
      title: title.trim(),
      description: description.trim(),
      categoryId,
      scheduledAt: combinedIso,
      repeatType,
      selectedWeekdays: repeatType === 'WEEKDAYS' ? selectedWeekdays : [],
      customIntervalValue: Math.max(1, Number(customIntervalValue) || 1),
      customIntervalUnit,
      endDate: endDate ? endDate : null,
      priority,
      sound,
      vibrationEnabled,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/45 backdrop-blur-md p-0 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-t-[28px] sm:rounded-[28px] liquid-glass max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/40 dark:border-white/10 shrink-0">
          <h2
            id="reminder-modal-title"
            className="text-lg font-bold text-slate-900 dark:text-white tracking-tight"
          >
            {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close reminder form"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl liquid-btn-secondary text-slate-600 dark:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div
              role="alert"
              className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title & Description */}
          <div className="space-y-3">
            <div>
              <label
                htmlFor="reminder-title-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Reminder Title *
              </label>
              <input
                id="reminder-title-input"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="e.g., Drink 500ml water, Take blood pressure medicine, Call Mom"
                className="w-full rounded-xl liquid-glass-input px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-2 focus:outline-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="reminder-desc-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Notes / Description
              </label>
              <textarea
                id="reminder-desc-input"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional dosage, meeting link, shopping items, or context..."
                className="w-full rounded-xl liquid-glass-input px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-2 focus:outline-blue-600"
              />
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="reminder-date-input"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                Scheduled Date
              </label>
              <input
                id="reminder-date-input"
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full rounded-xl liquid-glass-input px-3.5 py-2.5 text-sm text-slate-900 dark:text-white tabular-nums focus:outline-2 focus:outline-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="reminder-time-input"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Scheduled Time
              </label>
              <input
                id="reminder-time-input"
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full rounded-xl liquid-glass-input px-3.5 py-2.5 text-sm text-slate-900 dark:text-white tabular-nums focus:outline-2 focus:outline-blue-600"
              />
            </div>
          </div>

          {/* Category Selector + Quick Custom Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="reminder-category-select"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Category
              </label>
              <button
                type="button"
                onClick={() => setShowNewCatForm((v) => !v)}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {showNewCatForm ? 'Cancel Custom Category' : 'New Custom Category'}
              </button>
            </div>

            {showNewCatForm ? (
              <div className="p-3.5 rounded-2xl liquid-glass-interactive space-y-3 mb-2">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label
                      htmlFor="quick-cat-emoji"
                      className="block text-[11px] font-medium text-slate-500 mb-1"
                    >
                      Icon
                    </label>
                    <input
                      id="quick-cat-emoji"
                      type="text"
                      maxLength={4}
                      value={newCatEmoji}
                      onChange={(e) => setNewCatEmoji(e.target.value)}
                      className="w-full rounded-lg liquid-glass-input px-3 py-1.5 text-sm text-center"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="quick-cat-name"
                      className="block text-[11px] font-medium text-slate-500 mb-1"
                    >
                      Category Name
                    </label>
                    <input
                      id="quick-cat-name"
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="e.g., Pet Care, Guitar"
                      className="w-full rounded-lg liquid-glass-input px-3 py-1.5 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="quick-cat-color"
                      className="block text-[11px] font-medium text-slate-500 mb-1"
                    >
                      Color
                    </label>
                    <input
                      id="quick-cat-color"
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="w-full h-9 rounded-lg liquid-glass-input p-1 cursor-pointer"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleQuickCreateCategory}
                  className="px-3.5 py-1.5 rounded-lg liquid-btn-primary text-xs font-semibold transition-colors"
                >
                  Add & Select Category
                </button>
              </div>
            ) : null}

            <select
              id="reminder-category-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl liquid-glass-input px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-2 focus:outline-blue-600"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Automatic Smart Notification Settings Banner */}
          <div className="p-3.5 rounded-2xl liquid-glass-interactive flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {autoSmartAlert
                    ? `Auto-Configured Alert: ${activePreset.channelName}`
                    : 'Manual Notification Settings'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {autoSmartAlert
                  ? `${activePreset.reason} (${SOUND_LABELS[sound].label} · ${priority} · ${
                      vibrationEnabled ? 'Vibrate On' : 'Vibrate Off'
                    })`
                  : 'Toggle Auto-Set to automatically pick the best sound, priority, and vibration for this category.'}
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoSmartAlert}
                onChange={(e) => setAutoSmartAlert(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
              Auto-Set Alerts
            </label>
          </div>

          {/* Priority Level Segmented Control */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Priority Level
            </span>
            <div className="grid grid-cols-4 gap-2 p-1 rounded-xl liquid-glass-input">
              {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as Priority[]).map((p) => {
                const active = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setAutoSmartAlert(false);
                      setPriority(p);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                      active
                        ? 'liquid-btn-primary text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Repeat & Scheduling Options */}
          <div className="space-y-3 pt-1 border-t border-white/40 dark:border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="reminder-repeat-select"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  <Repeat className="w-3.5 h-3.5 text-purple-600" />
                  Repeat Schedule
                </label>
                <select
                  id="reminder-repeat-select"
                  value={repeatType}
                  onChange={(e) => setRepeatType(e.target.value as RepeatType)}
                  className="w-full rounded-xl liquid-glass-input px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-2 focus:outline-blue-600"
                >
                  <option value="ONCE">One-time reminder</option>
                  <option value="HOURLY">Every hour</option>
                  <option value="DAILY">Every day</option>
                  <option value="WEEKDAYS">Selected weekdays</option>
                  <option value="WEEKLY">Every week</option>
                  <option value="MONTHLY">Every month</option>
                  <option value="YEARLY">Every year</option>
                  <option value="CUSTOM">Custom repeat interval</option>
                </select>
              </div>

              {repeatType !== 'ONCE' && (
                <div>
                  <label
                    htmlFor="reminder-end-date"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Optional End Date
                  </label>
                  <input
                    id="reminder-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl liquid-glass-input px-3.5 py-2.5 text-sm text-slate-900 dark:text-white tabular-nums focus:outline-2 focus:outline-blue-600"
                  />
                </div>
              )}
            </div>

            {/* Selected Weekdays Picker */}
            {repeatType === 'WEEKDAYS' && (
              <div>
                <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Choose Days of the Week
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {WEEKDAY_LABELS.map(({ day, short }) => {
                    const selected = selectedWeekdays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWeekday(day)}
                        className={`min-w-[44px] min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                          selected
                            ? 'liquid-btn-primary text-white'
                            : 'liquid-btn-secondary text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {short}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Interval Picker */}
            {repeatType === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="custom-interval-val"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                  >
                    Repeat Every
                  </label>
                  <input
                    id="custom-interval-val"
                    type="number"
                    min={1}
                    max={365}
                    value={customIntervalValue}
                    onChange={(e) => setCustomIntervalValue(Number(e.target.value))}
                    className="w-full rounded-xl liquid-glass-input px-3.5 py-2 text-sm text-slate-900 dark:text-white tabular-nums"
                  />
                </div>
                <div>
                  <label
                    htmlFor="custom-interval-unit"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                  >
                    Interval Unit
                  </label>
                  <select
                    id="custom-interval-unit"
                    value={customIntervalUnit}
                    onChange={(e) => setCustomIntervalUnit(e.target.value as CustomIntervalUnit)}
                    className="w-full rounded-xl liquid-glass-input px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="MINUTES">Minutes</option>
                    <option value="HOURS">Hours</option>
                    <option value="DAYS">Days</option>
                    <option value="WEEKS">Weeks</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Notification Sound & Vibration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/40 dark:border-white/10">
            <div>
              <label
                htmlFor="reminder-sound-select"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-600" />
                Notification Sound
              </label>
              <div className="flex items-center gap-2">
                <select
                  id="reminder-sound-select"
                  value={sound}
                  onChange={(e) => {
                    const nextSound = e.target.value as SoundOption;
                    setAutoSmartAlert(false);
                    setSound(nextSound);
                    playNotificationSound(nextSound);
                  }}
                  className="flex-1 rounded-xl liquid-glass-input px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                >
                  {(Object.keys(SOUND_LABELS) as SoundOption[]).map((sKey) => (
                    <option key={sKey} value={sKey}>
                      {SOUND_LABELS[sKey].label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => playNotificationSound(sound)}
                  aria-label="Preview selected notification sound"
                  className="px-3 py-2.5 rounded-xl liquid-btn-secondary text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap shrink-0"
                >
                  Test Tone
                </button>
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center justify-between p-3 rounded-xl liquid-glass-input cursor-pointer">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Bell className="w-4 h-4 text-blue-600" />
                  Device Vibration on Alarm
                </span>
                <input
                  type="checkbox"
                  checked={vibrationEnabled}
                  onChange={(e) => {
                    setAutoSmartAlert(false);
                    setVibrationEnabled(e.target.checked);
                  }}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Submit Footer */}
          <div className="pt-4 border-t border-white/40 dark:border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl liquid-btn-secondary text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl liquid-btn-primary text-white text-sm font-semibold transition-all whitespace-nowrap shrink-0"
            >
              {editingReminder ? 'Update Reminder' : 'Save Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
