package com.remindme.app.widget

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import com.remindme.app.R
import com.remindme.app.data.local.AppDatabase
import com.remindme.app.data.local.CategoryEntity
import com.remindme.app.data.local.ReminderEntity
import kotlinx.coroutines.runBlocking
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * RemoteViewsService providing collection data for the RemindMe Home Screen widget.
 */
class RemindMeWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return RemindMeRemoteViewsFactory(this.applicationContext)
    }
}

class RemindMeRemoteViewsFactory(
    private val context: Context
) : RemoteViewsService.RemoteViewsFactory {

    private var reminders: List<ReminderEntity> = emptyList()
    private var categoryMap: Map<String, CategoryEntity> = emptyMap()
    private val timeFormat = SimpleDateFormat("h:mm a", Locale.getDefault())
    private val dateFormat = SimpleDateFormat("MMM d, h:mm a", Locale.getDefault())
    private val todayFormat = SimpleDateFormat("yyyyMMdd", Locale.getDefault())

    override fun onCreate() {
        // Initial setup
    }

    override fun onDataSetChanged() {
        try {
            val db = AppDatabase.getInstance(context)
            reminders = db.reminderDao().getUpcomingRemindersForWidget()
            categoryMap = runBlocking {
                try {
                    db.reminderDao().getCategoriesSync().associateBy { it.id }
                } catch (e: Exception) {
                    emptyMap()
                }
            }
        } catch (e: Exception) {
            reminders = emptyList()
        }
    }

    override fun onDestroy() {
        reminders = emptyList()
        categoryMap = emptyMap()
    }

    override fun getCount(): Int = reminders.size

    override fun getViewAt(position: Int): RemoteViews {
        if (position < 0 || position >= reminders.size) {
            return RemoteViews(context.packageName, R.layout.widget_reminder_item)
        }

        val reminder = reminders[position]
        val category = categoryMap[reminder.categoryId]
        val views = RemoteViews(context.packageName, R.layout.widget_reminder_item)

        // 1. Emoji & Category icon
        views.setTextViewText(R.id.tv_widget_item_emoji, category?.emoji ?: "🔔")

        // 2. Title
        views.setTextViewText(R.id.tv_widget_item_title, reminder.title)

        // 3. Formatted Scheduled Time
        val triggerEpoch = reminder.snoozedUntilEpochMillis ?: reminder.scheduledAtEpochMillis
        val triggerDate = Date(triggerEpoch)
        val isToday = todayFormat.format(triggerDate) == todayFormat.format(Date())
        val timeLabel = if (isToday) {
            "Today, ${timeFormat.format(triggerDate)}"
        } else {
            dateFormat.format(triggerDate)
        }
        val statusText = if (reminder.snoozedUntilEpochMillis != null) {
            "⏰ Snoozed · $timeLabel"
        } else {
            timeLabel
        }
        views.setTextViewText(R.id.tv_widget_item_time, statusText)

        // 4. Priority Tag
        val (priorityLabel, priorityColor) = when (reminder.priority.uppercase()) {
            "URGENT" -> "URGENT" to Color.parseColor("#EF4444")
            "HIGH" -> "HIGH" to Color.parseColor("#F59E0B")
            "LOW" -> "LOW" to Color.parseColor("#10B981")
            else -> "MED" to Color.parseColor("#2563EB")
        }
        views.setTextViewText(R.id.tv_widget_item_priority, priorityLabel)
        views.setTextColor(R.id.tv_widget_item_priority, priorityColor)

        // 5. Fill-in Intent for item click (opens reminder detail in app)
        val fillInIntent = Intent().apply {
            putExtra(RemindMeWidgetProvider.EXTRA_REMINDER_ID, reminder.id)
            val bundle = Bundle()
            bundle.putString("reminder_id", reminder.id)
            putExtras(bundle)
        }
        views.setOnClickFillInIntent(R.id.widget_item_container, fillInIntent)

        return views
    }

    override fun getLoadingView(): RemoteViews? = null

    override fun getViewTypeCount(): Int = 1

    override fun getItemId(position: Int): Long = position.toLong()

    override fun hasStableIds(): Boolean = false
}
