package com.remindme.app.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.remindme.app.data.local.AppDatabase
import com.remindme.app.domain.RecurrenceCalculator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != AlarmScheduler.ACTION_FIRE_REMINDER) return
        val reminderId = intent.getStringExtra(AlarmScheduler.EXTRA_REMINDER_ID) ?: return

        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val db = AppDatabase.getInstance(context)
                val dao = db.reminderDao()
                val reminder = dao.getReminderById(reminderId) ?: return@launch
                if (reminder.isCompleted) return@launch

                val category = dao.getCategoriesSync().find { it.id == reminder.categoryId }
                NotificationHelper(context).showReminderNotification(reminder, category)

                // If recurring, calculate and schedule next occurrence automatically
                val nextTrigger = RecurrenceCalculator.computeNextTriggerMillis(reminder)
                if (nextTrigger != null) {
                    val updated = reminder.copy(
                        scheduledAtEpochMillis = nextTrigger,
                        snoozedUntilEpochMillis = null,
                        updatedAtEpochMillis = System.currentTimeMillis()
                    )
                    dao.upsertReminder(updated)
                    AlarmScheduler(context).schedule(updated)
                }
            } finally {
                pendingResult.finish()
            }
        }
    }
}
