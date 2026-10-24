package com.remindme.app.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationManagerCompat
import com.remindme.app.data.local.AppDatabase
import com.remindme.app.data.local.CompletionHistoryEntity
import com.remindme.app.data.local.RepeatType
import com.remindme.app.domain.RecurrenceCalculator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class NotificationActionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val reminderId = intent.getStringExtra(AlarmScheduler.EXTRA_REMINDER_ID) ?: return
        val pendingResult = goAsync()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val db = AppDatabase.getInstance(context)
                val dao = db.reminderDao()
                val scheduler = AlarmScheduler(context)
                val reminder = dao.getReminderById(reminderId) ?: return@launch

                NotificationManagerCompat.from(context).cancel(reminderId.hashCode())

                when (intent.action) {
                    ACTION_MARK_DONE -> {
                        val now = System.currentTimeMillis()
                        dao.insertCompletionLog(
                            CompletionHistoryEntity(
                                reminderId = reminder.id,
                                reminderTitle = reminder.title,
                                categoryId = reminder.categoryId,
                                completedAtEpochMillis = now,
                                scheduledForEpochMillis = reminder.effectiveTriggerMillis
                            )
                        )

                        if (reminder.repeatType == RepeatType.ONCE) {
                            val completed = reminder.copy(
                                isCompleted = true,
                                snoozedUntilEpochMillis = null,
                                updatedAtEpochMillis = now
                            )
                            dao.upsertReminder(completed)
                            scheduler.cancel(reminder.id)
                        } else {
                            val nextMillis = RecurrenceCalculator.computeNextTriggerMillis(reminder, now)
                            if (nextMillis != null) {
                                val nextReminder = reminder.copy(
                                    scheduledAtEpochMillis = nextMillis,
                                    snoozedUntilEpochMillis = null,
                                    updatedAtEpochMillis = now
                                )
                                dao.upsertReminder(nextReminder)
                                scheduler.schedule(nextReminder)
                            } else {
                                val finished = reminder.copy(
                                    isCompleted = true,
                                    snoozedUntilEpochMillis = null,
                                    updatedAtEpochMillis = now
                                )
                                dao.upsertReminder(finished)
                                scheduler.cancel(reminder.id)
                            }
                        }
                    }

                    ACTION_SNOOZE -> {
                        val minutes = intent.getIntExtra(EXTRA_SNOOZE_MINUTES, 10).coerceIn(5, 60)
                        val snoozeUntil = System.currentTimeMillis() + minutes * 60_000L
                        val snoozed = reminder.copy(
                            snoozedUntilEpochMillis = snoozeUntil,
                            updatedAtEpochMillis = System.currentTimeMillis()
                        )
                        dao.upsertReminder(snoozed)
                        scheduler.schedule(snoozed)
                    }
                }
            } finally {
                pendingResult.finish()
            }
        }
    }

    companion object {
        const val ACTION_MARK_DONE = "com.remindme.app.ACTION_MARK_DONE"
        const val ACTION_SNOOZE = "com.remindme.app.ACTION_SNOOZE"
        const val EXTRA_SNOOZE_MINUTES = "extra_snooze_minutes"
    }
}
