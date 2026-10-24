package com.remindme.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import com.remindme.app.MainActivity
import com.remindme.app.R

/**
 * Android Home Screen Widget Provider for RemindMe.
 * Displays the upcoming agenda and provides 1-tap quick addition of new reminders.
 */
class RemindMeWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
        super.onUpdate(context, appWidgetManager, appWidgetIds)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_REFRESH_WIDGET) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = ComponentName(context, RemindMeWidgetProvider::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
            appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetIds, R.id.widget_reminder_list)
            for (id in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, id)
            }
        }
    }

    companion object {
        const val ACTION_QUICK_ADD = "com.remindme.app.action.QUICK_ADD"
        const val ACTION_REFRESH_WIDGET = "com.remindme.app.action.REFRESH_WIDGET"
        const val EXTRA_REMINDER_ID = "com.remindme.app.extra.REMINDER_ID"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_remindme_layout)

            // 1. Title click -> Open Main App
            val openAppIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val openAppPendingIntent = PendingIntent.getActivity(
                context,
                0,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.tv_widget_title, openAppPendingIntent)

            // 2. Quick Add Button (+) click -> Launch MainActivity with Quick-Add prompt
            val quickAddIntent = Intent(context, MainActivity::class.java).apply {
                action = ACTION_QUICK_ADD
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val quickAddPendingIntent = PendingIntent.getActivity(
                context,
                appWidgetId,
                quickAddIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.btn_widget_quick_add, quickAddPendingIntent)

            // 3. Bind RemoteViewsService for ListView
            val serviceIntent = Intent(context, RemindMeWidgetService::class.java).apply {
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                data = Uri.parse(toUri(Intent.URI_INTENT_SCHEME))
            }
            views.setRemoteAdapter(R.id.widget_reminder_list, serviceIntent)
            views.setEmptyView(R.id.widget_reminder_list, R.id.widget_empty_view)

            // 4. Set Item Click PendingIntent Template
            val clickItemIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            val clickItemPendingIntent = PendingIntent.getActivity(
                context,
                appWidgetId + 100,
                clickItemIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            )
            views.setPendingIntentTemplate(R.id.widget_reminder_list, clickItemPendingIntent)

            // Notify data change and update
            appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.widget_reminder_list)
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        /**
         * Broadcast helper to notify all active widgets to refresh data.
         * Call after Room Database insertions, updates, completions, or deletions.
         */
        fun sendRefreshBroadcast(context: Context) {
            val intent = Intent(context, RemindMeWidgetProvider::class.java).apply {
                action = ACTION_REFRESH_WIDGET
            }
            context.sendBroadcast(intent)
        }
    }
}
