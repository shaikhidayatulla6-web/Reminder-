package com.remindme.app.domain

import com.remindme.app.data.local.CustomIntervalUnit
import com.remindme.app.data.local.ReminderEntity
import com.remindme.app.data.local.RepeatType
import java.time.Instant
import java.time.ZoneId
import java.time.ZonedDateTime

object RecurrenceCalculator {

    /**
     * Computes the next occurrence in epoch millis for a recurring reminder,
     * or returns null if RepeatType.ONCE or if the next trigger exceeds endDateEpochMillis.
     */
    fun computeNextTriggerMillis(
        reminder: ReminderEntity,
        referenceNowMillis: Long = System.currentTimeMillis()
    ): Long? {
        if (reminder.repeatType == RepeatType.ONCE) return null

        val zoneId = runCatching { ZoneId.of(reminder.timeZoneId) }.getOrDefault(ZoneId.systemDefault())
        var candidate = ZonedDateTime.ofInstant(
            Instant.ofEpochMilli(reminder.scheduledAtEpochMillis),
            zoneId
        )
        val nowZoned = ZonedDateTime.ofInstant(Instant.ofEpochMilli(referenceNowMillis), zoneId)

        fun stepOnce(current: ZonedDateTime): ZonedDateTime {
            return when (reminder.repeatType) {
                RepeatType.ONCE -> current
                RepeatType.HOURLY -> current.plusHours(1)
                RepeatType.DAILY -> current.plusDays(1)
                RepeatType.WEEKLY -> current.plusWeeks(1)
                RepeatType.MONTHLY -> current.plusMonths(1)
                RepeatType.YEARLY -> current.plusYears(1)
                RepeatType.WEEKDAYS -> {
                    val allowedDays = reminder.selectedWeekdaysCsv
                        .split(",")
                        .mapNotNull { it.trim().toIntOrNull() }
                        .filter { it in 1..7 }
                        .toSet()
                        .ifEmpty { setOf(1, 2, 3, 4, 5) } // Default Mon..Fri

                    var probe = current.plusDays(1)
                    repeat(7) {
                        if (allowedDays.contains(probe.dayOfWeek.value)) {
                            return probe
                        }
                        probe = probe.plusDays(1)
                    }
                    probe
                }
                RepeatType.CUSTOM -> {
                    val step = reminder.customIntervalValue.coerceAtLeast(1).toLong()
                    when (reminder.customIntervalUnit) {
                        CustomIntervalUnit.MINUTES -> current.plusMinutes(step)
                        CustomIntervalUnit.HOURS -> current.plusHours(step)
                        CustomIntervalUnit.DAYS -> current.plusDays(step)
                        CustomIntervalUnit.WEEKS -> current.plusWeeks(step)
                    }
                }
            }
        }

        candidate = stepOnce(candidate)
        var safetyCounter = 0
        while (!candidate.isAfter(nowZoned) && safetyCounter < 1000) {
            candidate = stepOnce(candidate)
            safetyCounter++
        }

        val nextMillis = candidate.toInstant().toEpochMilli()
        val endLimit = reminder.endDateEpochMillis
        if (endLimit != null && nextMillis > endLimit) {
            return null
        }
        return nextMillis
    }
}
