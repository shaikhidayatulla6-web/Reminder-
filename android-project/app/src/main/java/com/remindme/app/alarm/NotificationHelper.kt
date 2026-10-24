package com.remindme.app.alarm

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.remindme.app.MainActivity
import com.remindme.app.data.local.CategoryEntity
import com.remindme.app.data.local.Priority
import com.remindme.app.data.local.ReminderEntity

class NotificationHelper(private val context: Context) {

    fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val highChannel = NotificationChannel(
                CHANNEL_HIGH_PRIORITY,
                "Urgent & High Priority Reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Time-sensitive reminders with sound and heads-up banner"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 250, 150, 250)
            }

            val standardChannel = NotificationChannel(
                CHANNEL_DEFAULT_PRIORITY,
                "Standard Reminders",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Daily & routine reminders"
                enableVibration(true)
            }

            manager.createNotificationChannels(listOf(highChannel, standardChannel))
        }
    }

    fun showReminderNotification(
        reminder: ReminderEntity,
        category: CategoryEntity?,
        defaultSnoozeMinutes: Int = 10
    ) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ActivityCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) return
        }

        val channelId = if (reminder.priority == Priority.URGENT || reminder.priority == Priority.HIGH) {
            CHANNEL_HIGH_PRIORITY
        } else {
            CHANNEL_DEFAULT_PRIORITY
        }

        val openAppIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("reminderId", reminder.id)
        }
        val contentPendingIntent = PendingIntent.getActivity(
            context,
            reminder.id.hashCode(),
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action 1: Mark as Done
        val doneIntent = Intent(context, NotificationActionReceiver::class.java).apply {
            action = NotificationActionReceiver.ACTION_MARK_DONE
            putExtra(AlarmScheduler.EXTRA_REMINDER_ID, reminder.id)
        }
        val donePendingIntent = PendingIntent.getBroadcast(
            context,
            (reminder.id + "_done").hashCode(),
            doneIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action 2: Snooze for Default Duration (5, 10, 15, 30, or 60m)
        val snoozeIntent = Intent(context, NotificationActionReceiver::class.java).apply {
            action = NotificationActionReceiver.ACTION_SNOOZE
            putExtra(AlarmScheduler.EXTRA_REMINDER_ID, reminder.id)
            putExtra(NotificationActionReceiver.EXTRA_SNOOZE_MINUTES, defaultSnoozeMinutes)
        }
        val snoozePendingIntent = PendingIntent.getBroadcast(
            context,
            (reminder.id + "_snooze").hashCode(),
            snoozeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val categoryLabel = category?.let { "${it.emoji} ${it.name}" } ?: "Reminder"
        val builder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setSubText(categoryLabel)
            .setContentTitle(reminder.title)
            .setContentText(reminder.description.ifBlank { "Scheduled reminder due now" })
            .setStyle(NotificationCompat.BigTextStyle().bigText(reminder.description.ifBlank { reminder.title }))
            .setPriority(
                if (reminder.priority == Priority.URGENT || reminder.priority == Priority.HIGH)
                    NotificationCompat.PRIORITY_HIGH
                else NotificationCompat.PRIORITY_DEFAULT
            )
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(contentPendingIntent)
            .addAction(android.R.drawable.checkbox_on_background, "Mark as Done", donePendingIntent)
            .addAction(android.R.drawable.ic_lock_idle_alarm, "Snooze ${defaultSnoozeMinutes}m", snoozePendingIntent)

        if (reminder.soundUri != "SILENT") {
            builder.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
        }
        if (reminder.vibrationEnabled) {
            builder.setVibrate(longArrayOf(0, 220, 120, 220))
        }

        NotificationManagerCompat.from(context).notify(reminder.id.hashCode(), builder.build())
    }

    companion object {
        const val CHANNEL_HIGH_PRIORITY = "remindme_channel_high"
        const val CHANNEL_DEFAULT_PRIORITY = "remindme_channel_default"
    }
}
