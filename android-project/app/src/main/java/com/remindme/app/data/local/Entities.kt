package com.remindme.app.data.local

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import androidx.room.TypeConverter

enum class Priority(val label: String, val weight: Int) {
    LOW("Low", 1),
    MEDIUM("Medium", 2),
    HIGH("High", 3),
    URGENT("Urgent", 4)
}

enum class RepeatType(val label: String) {
    ONCE("One-time"),
    HOURLY("Every hour"),
    DAILY("Every day"),
    WEEKDAYS("Selected weekdays"),
    WEEKLY("Every week"),
    MONTHLY("Every month"),
    YEARLY("Every year"),
    CUSTOM("Custom repeat interval")
}

enum class CustomIntervalUnit {
    MINUTES, HOURS, DAYS, WEEKS
}

@Entity(tableName = "categories")
data class CategoryEntity(
    @PrimaryKey val id: String,
    val name: String,
    val emoji: String,
    val colorHex: Long,
    val isDefault: Boolean = false
)

@Entity(
    tableName = "reminders",
    indices = [
        Index(value = ["categoryId"]),
        Index(value = ["scheduledAtEpochMillis"]),
        Index(value = ["isCompleted"])
    ]
)
data class ReminderEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String,
    val categoryId: String,
    val scheduledAtEpochMillis: Long,
    val timeZoneId: String,
    val repeatType: RepeatType,
    val selectedWeekdaysCsv: String = "", // e.g., "1,2,3,4,5" (ISO-8601 1=Mon..7=Sun)
    val customIntervalValue: Int = 1,
    val customIntervalUnit: CustomIntervalUnit = CustomIntervalUnit.DAYS,
    val endDateEpochMillis: Long? = null,
    val priority: Priority = Priority.MEDIUM,
    val soundUri: String = "DEFAULT_CHIME",
    val vibrationEnabled: Boolean = true,
    val isCompleted: Boolean = false,
    val snoozedUntilEpochMillis: Long? = null,
    val createdAtEpochMillis: Long = System.currentTimeMillis(),
    val updatedAtEpochMillis: Long = System.currentTimeMillis()
) {
    val effectiveTriggerMillis: Long
        get() = snoozedUntilEpochMillis ?: scheduledAtEpochMillis
}

@Entity(
    tableName = "completion_history",
    foreignKeys = [
        ForeignKey(
            entity = ReminderEntity::class,
            parentColumns = ["id"],
            childColumns = ["reminderId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["reminderId"])]
)
data class CompletionHistoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val reminderId: String,
    val reminderTitle: String,
    val categoryId: String,
    val completedAtEpochMillis: Long,
    val scheduledForEpochMillis: Long
)

class RemindMeTypeConverters {
    @TypeConverter
    fun fromPriority(value: Priority): String = value.name

    @TypeConverter
    fun toPriority(value: String): Priority =
        runCatching { Priority.valueOf(value) }.getOrDefault(Priority.MEDIUM)

    @TypeConverter
    fun fromRepeatType(value: RepeatType): String = value.name

    @TypeConverter
    fun toRepeatType(value: String): RepeatType =
        runCatching { RepeatType.valueOf(value) }.getOrDefault(RepeatType.ONCE)

    @TypeConverter
    fun fromCustomUnit(value: CustomIntervalUnit): String = value.name

    @TypeConverter
    fun toCustomUnit(value: String): CustomIntervalUnit =
        runCatching { CustomIntervalUnit.valueOf(value) }.getOrDefault(CustomIntervalUnit.DAYS)
}
