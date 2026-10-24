import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CATEGORIES,
  calculateNextOccurrence,
  calculateSnoozeUntil,
  computeDashboardMetrics,
  filterAndSortReminders,
  formatRepeatRule,
  isReminderOverdue,
  validateReminderInput,
} from './reminderLogic';
import { Reminder } from '../types/reminder';

test('DEFAULT_CATEGORIES includes all 13 required default categories', () => {
  assert.equal(DEFAULT_CATEGORIES.length, 13);
  const names = DEFAULT_CATEGORIES.map((c) => c.name);
  assert.ok(names.includes('Water Drinking'));
  assert.ok(names.includes('Medicine'));
  assert.ok(names.includes('Study'));
  assert.ok(names.includes('Work'));
  assert.ok(names.includes('Fitness'));
  assert.ok(names.includes('Food'));
  assert.ok(names.includes('Birthdays'));
  assert.ok(names.includes('Bills and Payments'));
  assert.ok(names.includes('Shopping'));
  assert.ok(names.includes('Personal Care'));
  assert.ok(names.includes('Appointments'));
  assert.ok(names.includes('Family'));
  assert.ok(names.includes('Other'));
});

test('validateReminderInput rejects empty titles and invalid dates', () => {
  const emptyTitle = validateReminderInput({
    title: '   ',
    scheduledAt: '2026-10-25T10:00:00.000Z',
    repeatType: 'ONCE',
  });
  assert.equal(emptyTitle.valid, false);

  const missingWeekdays = validateReminderInput({
    title: 'Morning Standup',
    scheduledAt: '2026-10-25T10:00:00.000Z',
    repeatType: 'WEEKDAYS',
    selectedWeekdays: [],
  });
  assert.equal(missingWeekdays.valid, false);

  const endBeforeStart = validateReminderInput({
    title: 'Antibiotic Course',
    scheduledAt: '2026-10-25T10:00:00.000Z',
    repeatType: 'DAILY',
    endDate: '2026-10-20T00:00:00.000Z',
  });
  assert.equal(endBeforeStart.valid, false);

  const valid = validateReminderInput({
    title: 'Drink 500ml Water',
    scheduledAt: '2026-10-25T10:00:00.000Z',
    repeatType: 'HOURLY',
  });
  assert.equal(valid.valid, true);
});

test('calculateNextOccurrence computes hourly, daily, weekly, monthly, yearly, and custom intervals', () => {
  const baseIso = '2026-10-24T14:00:00.000Z';
  const refNow = '2026-10-24T14:00:01.000Z';

  assert.equal(calculateNextOccurrence(baseIso, 'ONCE', { referenceNowIso: refNow }), null);

  const nextHour = calculateNextOccurrence(baseIso, 'HOURLY', { referenceNowIso: refNow });
  assert.equal(nextHour, '2026-10-24T15:00:00.000Z');

  const nextDay = calculateNextOccurrence(baseIso, 'DAILY', { referenceNowIso: refNow });
  assert.equal(nextDay, '2026-10-25T14:00:00.000Z');

  const nextWeek = calculateNextOccurrence(baseIso, 'WEEKLY', { referenceNowIso: refNow });
  assert.equal(nextWeek, '2026-10-31T14:00:00.000Z');

  const customEvery3Days = calculateNextOccurrence(baseIso, 'CUSTOM', {
    customIntervalValue: 3,
    customIntervalUnit: 'DAYS',
    referenceNowIso: refNow,
  });
  assert.equal(customEvery3Days, '2026-10-27T14:00:00.000Z');
});

test('calculateNextOccurrence respects optional endDate and selectedWeekdays', () => {
  // 2026-10-24 is Saturday (day 6). If selectedWeekdays is [1, 3, 5] (Mon, Wed, Fri), next is Mon 2026-10-26
  const baseIso = '2026-10-24T09:00:00.000Z';
  const nextMon = calculateNextOccurrence(baseIso, 'WEEKDAYS', {
    selectedWeekdays: [1, 3, 5],
    referenceNowIso: '2026-10-24T09:05:00.000Z',
  });
  assert.equal(nextMon, '2026-10-26T09:00:00.000Z');

  // Exceeding endDate returns null
  const expired = calculateNextOccurrence(baseIso, 'DAILY', {
    endDate: '2026-10-24T23:59:59.000Z',
    referenceNowIso: '2026-10-24T09:05:00.000Z',
  });
  assert.equal(expired, null);
});

test('calculateSnoozeUntil adds exact snooze minutes (5, 10, 15, 30, 60)', () => {
  const ref = '2026-10-24T10:00:00.000Z';
  assert.equal(calculateSnoozeUntil(5, ref), '2026-10-24T10:05:00.000Z');
  assert.equal(calculateSnoozeUntil(15, ref), '2026-10-24T10:15:00.000Z');
  assert.equal(calculateSnoozeUntil(60, ref), '2026-10-24T11:00:00.000Z');
});

test('computeDashboardMetrics and filterAndSortReminders accurately classify reminders', () => {
  const nowIso = '2026-10-24T12:00:00.000Z';
  const sampleReminders: Reminder[] = [
    {
      id: 'r1',
      title: 'Morning Vitamin D',
      description: 'Take 2000 IU after breakfast',
      categoryId: 'cat-medicine',
      scheduledAt: '2026-10-24T08:00:00.000Z',
      timeZone: 'UTC',
      repeatType: 'DAILY',
      selectedWeekdays: [],
      customIntervalValue: 1,
      customIntervalUnit: 'DAYS',
      priority: 'HIGH',
      sound: 'CHIME',
      vibrationEnabled: true,
      isCompleted: false, // Overdue today
      createdAt: '2026-10-20T08:00:00.000Z',
      updatedAt: '2026-10-20T08:00:00.000Z',
    },
    {
      id: 'r2',
      title: 'Evening Gym Session',
      description: 'Strength training & cardio',
      categoryId: 'cat-fitness',
      scheduledAt: '2026-10-24T18:00:00.000Z',
      timeZone: 'UTC',
      repeatType: 'WEEKLY',
      selectedWeekdays: [6],
      customIntervalValue: 1,
      customIntervalUnit: 'WEEKS',
      priority: 'MEDIUM',
      sound: 'PULSE',
      vibrationEnabled: true,
      isCompleted: true, // Completed today
      createdAt: '2026-10-21T08:00:00.000Z',
      updatedAt: '2026-10-24T09:00:00.000Z',
    },
    {
      id: 'r3',
      title: 'Pay Electricity Bill',
      description: 'Monthly utility invoice',
      categoryId: 'cat-bills',
      scheduledAt: '2026-10-28T10:00:00.000Z',
      timeZone: 'UTC',
      repeatType: 'MONTHLY',
      selectedWeekdays: [],
      customIntervalValue: 1,
      customIntervalUnit: 'DAYS',
      priority: 'URGENT',
      sound: 'CRYSTAL',
      vibrationEnabled: true,
      isCompleted: false, // Upcoming
      createdAt: '2026-10-22T08:00:00.000Z',
      updatedAt: '2026-10-22T08:00:00.000Z',
    },
  ];

  assert.equal(isReminderOverdue(sampleReminders[0], nowIso), true);
  assert.equal(isReminderOverdue(sampleReminders[1], nowIso), false);
  assert.equal(isReminderOverdue(sampleReminders[2], nowIso), false);

  const metrics = computeDashboardMetrics(sampleReminders, nowIso);
  assert.equal(metrics.total, 3);
  assert.equal(metrics.completedCount, 1);
  assert.equal(metrics.overdueCount, 1);
  assert.equal(metrics.upcomingCount, 1);

  const urgentFiltered = filterAndSortReminders(
    sampleReminders,
    {
      query: 'bill',
      categoryId: 'ALL',
      priority: 'URGENT',
      status: 'PENDING',
      dateFilter: 'ALL',
      sortBy: 'UPCOMING_TIME',
    },
    nowIso
  );
  assert.equal(urgentFiltered.length, 1);
  assert.equal(urgentFiltered[0].id, 'r3');

  assert.equal(formatRepeatRule(sampleReminders[0]), 'Every day');
});

test('getSmartNotificationPreset automatically configures sound, priority, and vibration by category and title', async () => {
  const { getSmartNotificationPreset } = await import('./reminderLogic');

  const waterPreset = getSmartNotificationPreset('cat-water', 'Drink 500ml water');
  assert.equal(waterPreset.sound, 'CRYSTAL');
  assert.equal(waterPreset.vibrationEnabled, true);

  const medPreset = getSmartNotificationPreset('cat-medicine', 'Take Vitamin D');
  assert.equal(medPreset.sound, 'PULSE');
  assert.equal(medPreset.priority, 'HIGH');
  assert.equal(medPreset.snoozeMinutes, 5);

  const studyPreset = getSmartNotificationPreset('cat-study', 'Read Kotlin Coroutines chapter');
  assert.equal(studyPreset.sound, 'GENTLE_BELL');
  assert.equal(studyPreset.vibrationEnabled, false);

  const urgentOverride = getSmartNotificationPreset('cat-work', 'Urgent client deployment');
  assert.equal(urgentOverride.priority, 'URGENT');
  assert.equal(urgentOverride.sound, 'PULSE');
});

test('computeCountdownParts calculates exact hours, minutes, seconds and overdue status', async () => {
  const { computeCountdownParts } = await import('./reminderLogic');
  const nowMs = Date.parse('2026-10-24T12:00:00.000Z');
  const futureReminder = {
    scheduledAt: '2026-10-24T13:35:42.000Z',
    snoozedUntil: null,
    createdAt: '2026-10-24T11:00:00.000Z',
  };

  const parts = computeCountdownParts(futureReminder, nowMs);
  assert.equal(parts.isOverdue, false);
  assert.equal(parts.days, 0);
  assert.equal(parts.hours, 1);
  assert.equal(parts.minutes, 35);
  assert.equal(parts.seconds, 42);
  assert.equal(parts.formattedClock, '01:35:42');
  assert.ok(parts.progressPercent > 0 && parts.progressPercent < 100);
});


