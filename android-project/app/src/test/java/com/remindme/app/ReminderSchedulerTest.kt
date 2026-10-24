package com.remindme.app

import com.remindme.app.data.local.CustomIntervalUnit
import com.remindme.app.data.local.Priority
import com.remindme.app.data.local.ReminderEntity
import com.remindme.app.data.local.RepeatType
import com.remindme.app.domain.RecurrenceCalculator
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test
import java.time.ZonedDateTime

class ReminderSchedulerTest {

    private fun sampleReminder(
        scheduledAtMillis: Long,
        repeatType: RepeatType,
        weekdaysCsv: String = "",
        customVal: Int = 1,
        customUnit: CustomIntervalUnit = CustomIntervalUnit.DAYS,
        endDateMillis: Long? = null
    ) = ReminderEntity(
        id = "test-rem-1",
        title = "Hydrate",
        description = "Drink water",
        categoryId = "cat-water",
        scheduledAtEpochMillis = scheduledAtMillis,
        timeZoneId = "UTC",
        repeatType = repeatType,
        selectedWeekdaysCsv = weekdaysCsv,
        customIntervalValue = customVal,
        customIntervalUnit = customUnit,
        endDateEpochMillis = endDateMillis,
        priority = Priority.MEDIUM
    )

    @Test
    fun oneTimeReminder_returnsNullNextTrigger() {
        val base = ZonedDateTime.parse("2026-10-24T10:00:00Z").toInstant().toEpochMilli()
        val reminder = sampleReminder(base, RepeatType.ONCE)
        val next = RecurrenceCalculator.computeNextTriggerMillis(reminder, base + 1000L)
        assertNull(next)
    }

    @Test
    fun hourlyReminder_advancesByOneHour() {
        val base = ZonedDateTime.parse("2026-10-24T10:00:00Z").toInstant().toEpochMilli()
        val expected = ZonedDateTime.parse("2026-10-24T11:00:00Z").toInstant().toEpochMilli()
        val reminder = sampleReminder(base, RepeatType.HOURLY)
        val next = RecurrenceCalculator.computeNextTriggerMillis(reminder, base + 1000L)
        assertEquals(expected, next)
    }

    @Test
    fun selectedWeekdays_skipsWeekendToMonday() {
        // 2026-10-24 is Saturday (day 6). Selected Mon,Wed,Fri ("1,3,5")
        val satMorning = ZonedDateTime.parse("2026-10-24T09:00:00Z").toInstant().toEpochMilli()
        val monMorning = ZonedDateTime.parse("2026-10-26T09:00:00Z").toInstant().toEpochMilli()
        val reminder = sampleReminder(satMorning, RepeatType.WEEKDAYS, weekdaysCsv = "1,3,5")
        val next = RecurrenceCalculator.computeNextTriggerMillis(reminder, satMorning + 5000L)
        assertEquals(monMorning, next)
    }

    @Test
    fun recurringReminder_stopsWhenExceedingEndDate() {
        val base = ZonedDateTime.parse("2026-10-24T10:00:00Z").toInstant().toEpochMilli()
        val endLimit = ZonedDateTime.parse("2026-10-24T23:59:59Z").toInstant().toEpochMilli()
        val reminder = sampleReminder(base, RepeatType.DAILY, endDateMillis = endLimit)
        val next = RecurrenceCalculator.computeNextTriggerMillis(reminder, base + 1000L)
        assertNull(next)
    }

    @Test
    fun customInterval_advancesByThreeDays() {
        val base = ZonedDateTime.parse("2026-10-24T10:00:00Z").toInstant().toEpochMilli()
        val expected = ZonedDateTime.parse("2026-10-27T10:00:00Z").toInstant().toEpochMilli()
        val reminder = sampleReminder(
            base,
            RepeatType.CUSTOM,
            customVal = 3,
            customUnit = CustomIntervalUnit.DAYS
        )
        val next = RecurrenceCalculator.computeNextTriggerMillis(reminder, base + 1000L)
        assertNotNull(next)
        assertEquals(expected, next)
    }
}
