package com.remindme.app.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.remindme.app.alarm.AlarmScheduler
import com.remindme.app.data.local.*
import com.remindme.app.domain.RecurrenceCalculator
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.ZoneId
import java.util.UUID

class ReminderViewModel(application: Application) : AndroidViewModel(application) {
    private val dao = AppDatabase.getInstance(application).reminderDao()
    private val scheduler = AlarmScheduler(application)

    val reminders: StateFlow<List<ReminderEntity>> = dao.observeAllReminders()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val categories: StateFlow<List<CategoryEntity>> = dao.observeCategories()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), AppDatabase.DEFAULT_CATEGORIES)

    val completionHistory: StateFlow<List<CompletionHistoryEntity>> = dao.observeCompletionHistory()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun saveReminder(
        existingId: String?,
        title: String,
        description: String,
        categoryId: String,
        scheduledAtMillis: Long,
        repeatType: RepeatType,
        selectedWeekdaysCsv: String,
        customIntervalValue: Int,
        customIntervalUnit: CustomIntervalUnit,
        endDateMillis: Long?,
        priority: Priority,
        soundUri: String,
        vibrationEnabled: Boolean
    ) {
        if (title.isBlank()) return
        viewModelScope.launch {
            val now = System.currentTimeMillis()
            val entity = ReminderEntity(
                id = existingId ?: UUID.randomUUID().toString(),
                title = title.trim(),
                description = description.trim(),
                categoryId = categoryId,
                scheduledAtEpochMillis = scheduledAtMillis,
                timeZoneId = ZoneId.systemDefault().id,
                repeatType = repeatType,
                selectedWeekdaysCsv = selectedWeekdaysCsv,
                customIntervalValue = customIntervalValue.coerceAtLeast(1),
                customIntervalUnit = customIntervalUnit,
                endDateEpochMillis = endDateMillis,
                priority = priority,
                soundUri = soundUri,
                vibrationEnabled = vibrationEnabled,
                isCompleted = false,
                snoozedUntilEpochMillis = null,
                createdAtEpochMillis = now,
                updatedAtEpochMillis = now
            )
            dao.upsertReminder(entity)
            scheduler.schedule(entity)
        }
    }

    fun toggleComplete(reminder: ReminderEntity) {
        viewModelScope.launch {
            val now = System.currentTimeMillis()
            if (!reminder.isCompleted) {
                dao.insertCompletionLog(
                    CompletionHistoryEntity(
                        reminderId = reminder.id,
                        reminderTitle = reminder.title,
                        categoryId = reminder.categoryId,
                        completedAtEpochMillis = now,
                        scheduledForEpochMillis = reminder.effectiveTriggerMillis
                    )
                )
                if (reminder.repeatType != RepeatType.ONCE) {
                    val nextTrigger = RecurrenceCalculator.computeNextTriggerMillis(reminder, now)
                    if (nextTrigger != null) {
                        val advanced = reminder.copy(
                            scheduledAtEpochMillis = nextTrigger,
                            snoozedUntilEpochMillis = null,
                            updatedAtEpochMillis = now
                        )
                        dao.upsertReminder(advanced)
                        scheduler.schedule(advanced)
                        return@launch
                    }
                }
            }
            val updated = reminder.copy(
                isCompleted = !reminder.isCompleted,
                snoozedUntilEpochMillis = null,
                updatedAtEpochMillis = now
            )
            dao.upsertReminder(updated)
            if (updated.isCompleted) scheduler.cancel(updated.id) else scheduler.schedule(updated)
        }
    }

    fun duplicateReminder(reminder: ReminderEntity) {
        viewModelScope.launch {
            val now = System.currentTimeMillis()
            val copy = reminder.copy(
                id = UUID.randomUUID().toString(),
                title = "${reminder.title} (Copy)",
                isCompleted = false,
                createdAtEpochMillis = now,
                updatedAtEpochMillis = now
            )
            dao.upsertReminder(copy)
            scheduler.schedule(copy)
        }
    }

    fun deleteReminder(reminderId: String) {
        viewModelScope.launch {
            scheduler.cancel(reminderId)
            dao.deleteReminderById(reminderId)
        }
    }

    fun addCustomCategory(name: String, emoji: String, colorHex: Long) {
        if (name.isBlank()) return
        viewModelScope.launch {
            val category = CategoryEntity(
                id = "custom-${UUID.randomUUID()}",
                name = name.trim(),
                emoji = emoji.ifBlank { "✨" },
                colorHex = colorHex,
                isDefault = false
            )
            dao.upsertCategory(category)
        }
    }
}
