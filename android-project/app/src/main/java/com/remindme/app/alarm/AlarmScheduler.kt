package com.remindme.app.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.remindme.app.data.local.ReminderEntity

class AlarmScheduler(private val context: Context) {

    private val alarmManager: AlarmManager =
        context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    /**
     * Checks whether the OS currently permits scheduling exact alarms.
     * On Android 12+ (API 31+), apps targeting SCHEDULE_EXACT_ALARM must check canScheduleExactAlarms().
     */
    fun canScheduleExactAlarms(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            alarmManager.canScheduleExactAlarms()
        } else {
            true
        }
    }

    /**
     * Schedules an alarm for the given reminder.
     * - If exact alarms are permitted, uses setExactAndAllowWhileIdle so alarms fire even in Doze mode.
     * - If exact alarm permission was revoked by the user, falls back to setAndAllowWhileIdle
     *   (windowed delivery subject to OS battery optimization) rather than crashing with SecurityException.
     */
    fun schedule(reminder: ReminderEntity) {
        if (reminder.isCompleted) {
            cancel(reminder.id)
            return
        }

        val triggerAtMillis = reminder.effectiveTriggerMillis
        if (triggerAtMillis <= System.currentTimeMillis() - 60_000L) {
            // Do not schedule past one-shot alarms that are already stale
            return
        }

        val pendingIntent = buildPendingIntent(reminder)
        try {
            if (canScheduleExactAlarms()) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis,
                    pendingIntent
                )
            } else {
                alarmManager.setAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis,
                    pendingIntent
                )
            }
        } catch (se: SecurityException) {
            // Graceful fallback if permission changes mid-flight
            alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
        }
    }

    fun cancel(reminderId: String) {
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = ACTION_FIRE_REMINDER
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            reminderId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        alarmManager.cancel(pendingIntent)
    }

    private fun buildPendingIntent(reminder: ReminderEntity): PendingIntent {
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = ACTION_FIRE_REMINDER
            putExtra(EXTRA_REMINDER_ID, reminder.id)
        }
        return PendingIntent.getBroadcast(
            context,
            reminder.id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    companion object {
        const val ACTION_FIRE_REMINDER = "com.remindme.app.ACTION_FIRE_REMINDER"
        const val EXTRA_REMINDER_ID = "extra_reminder_id"
    }
}
