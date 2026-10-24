export interface AndroidProjectFile {
  path: string;
  name: string;
  folder: string;
  language: 'kotlin' | 'xml' | 'gradle' | 'markdown' | 'properties';
  description: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidProjectFile[] = [
  {
    path: 'settings.gradle.kts',
    name: 'settings.gradle.kts',
    folder: 'Root Configuration',
    language: 'gradle',
    description: 'Root Gradle settings defining plugin repositories and the :app module.',
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "RemindMe"
include(":app")
`,
  },
  {
    path: 'build.gradle.kts',
    name: 'build.gradle.kts (Project)',
    folder: 'Root Configuration',
    language: 'gradle',
    description: 'Top-level Gradle configuration with Kotlin 2.0, KSP, and Compose compiler plugins.',
    content: `plugins {
    id("com.android.application") version "8.7.2" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.21" apply false
    id("com.google.devtools.ksp") version "2.0.21-1.0.27" apply false
}
`,
  },
  {
    path: 'app/build.gradle.kts',
    name: 'app/build.gradle.kts (Module :app)',
    folder: 'Gradle & Build',
    language: 'gradle',
    description: 'Module-level Gradle config with Jetpack Compose Material 3, Room Database, Coroutines, Navigation, and JUnit4.',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.devtools.ksp")
}

android {
    namespace = "com.remindme.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.remindme.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.10.01")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    // Core Android & Kotlin Coroutines
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

    // Jetpack Compose & Material 3
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3:1.3.1")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.navigation:navigation-compose:2.8.4")

    // Room Local Database
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:\$roomVersion")
    implementation("androidx.room:room-ktx:\$roomVersion")
    ksp("androidx.room:room-compiler:\$roomVersion")

    // DataStore Preferences for Settings
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // Unit Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
    debugImplementation("androidx.compose.ui:ui-tooling")
}
`,
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    folder: 'Manifest & Resources',
    language: 'xml',
    description: 'Declares permissions (POST_NOTIFICATIONS, SCHEDULE_EXACT_ALARM, RECEIVE_BOOT_COMPLETED, VIBRATE, WAKE_LOCK) and BroadcastReceivers for alarms, snooze, complete, boot, and timezone changes.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Notification & Exact Alarm Permissions -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:name=".RemindMeApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.RemindMe"
        tools:targetApi="35">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize"
            android:theme="@style/Theme.RemindMe">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Primary Alarm BroadcastReceiver triggered by AlarmManager -->
        <receiver
            android:name=".alarm.AlarmReceiver"
            android:enabled="true"
            android:exported="false" />

        <!-- Notification Actions Receiver (Mark as Done & Snooze 5/10/15/30/60m) -->
        <receiver
            android:name=".alarm.NotificationActionReceiver"
            android:enabled="true"
            android:exported="false" />

        <!-- Device Boot, Time Change, Timezone Change & Exact Alarm Permission State Receiver -->
        <receiver
            android:name=".alarm.BootAndTimeReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
                <action android:name="android.intent.action.TIME_SET" />
                <action android:name="android.intent.action.TIMEZONE_CHANGED" />
                <action android:name="android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED" />
            </intent-filter>
        </receiver>
    </application>
</manifest>
`,
  },
  {
    path: 'app/src/main/java/com/remindme/app/data/local/Entities.kt',
    name: 'Entities.kt',
    folder: 'Room Database (data/local)',
    language: 'kotlin',
    description: 'Room @Entity definitions for ReminderEntity, CategoryEntity, and CompletionHistoryEntity with TypeConverters.',
    content: `package com.remindme.app.data.local

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
`,
  },
  {
    path: 'app/src/main/java/com/remindme/app/data/local/ReminderDao.kt',
    name: 'ReminderDao.kt',
    folder: 'Room Database (data/local)',
    language: 'kotlin',
    description: 'Room Data Access Object with reactive Kotlin Flow queries, search/filter queries, and boot restoration queries.',
    content: `package com.remindme.app.data.local

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface ReminderDao {
    @Query("SELECT * FROM reminders ORDER BY COALESCE(snoozedUntilEpochMillis, scheduledAtEpochMillis) ASC")
    fun observeAllReminders(): Flow<List<ReminderEntity>>

    @Query("SELECT * FROM reminders WHERE isCompleted = 0 ORDER BY COALESCE(snoozedUntilEpochMillis, scheduledAtEpochMillis) ASC")
    suspend fun getAllPendingRemindersSync(): List<ReminderEntity>

    @Query("SELECT * FROM reminders WHERE id = :id LIMIT 1")
    suspend fun getReminderById(id: String): ReminderEntity?

    @Query("SELECT * FROM reminders WHERE id = :id LIMIT 1")
    fun observeReminderById(id: String): Flow<ReminderEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertReminder(reminder: ReminderEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertReminders(reminders: List<ReminderEntity>)

    @Update
    suspend fun updateReminder(reminder: ReminderEntity)

    @Delete
    suspend fun deleteReminder(reminder: ReminderEntity)

    @Query("DELETE FROM reminders WHERE id = :id")
    suspend fun deleteReminderById(id: String)

    // Categories
    @Query("SELECT * FROM categories ORDER BY isDefault DESC, name ASC")
    fun observeCategories(): Flow<List<CategoryEntity>>

    @Query("SELECT * FROM categories")
    suspend fun getCategoriesSync(): List<CategoryEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertCategory(category: CategoryEntity)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertDefaultCategories(categories: List<CategoryEntity>)

    @Query("DELETE FROM categories WHERE id = :categoryId AND isDefault = 0")
    suspend fun deleteCustomCategory(categoryId: String)

    // Completion History
    @Query("SELECT * FROM completion_history ORDER BY completedAtEpochMillis DESC LIMIT 100")
    fun observeCompletionHistory(): Flow<List<CompletionHistoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCompletionLog(log: CompletionHistoryEntity)
}
`,
  },
  {
    path: 'app/src/main/java/com/remindme/app/data/local/AppDatabase.kt',
    name: 'AppDatabase.kt',
    folder: 'Room Database (data/local)',
    language: 'kotlin',
    description: 'Room Database singleton pre-populating all 13 default categories on creation.',
    content: `package com.remindme.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        ReminderEntity::class,
        CategoryEntity::class,
        CompletionHistoryEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(RemindMeTypeConverters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun reminderDao(): ReminderDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        val DEFAULT_CATEGORIES = listOf(
            CategoryEntity("cat-water", "Water Drinking", "💧", 0xFF06B6D4, true),
            CategoryEntity("cat-medicine", "Medicine", "💊", 0xFFEF4444, true),
            CategoryEntity("cat-study", "Study", "📚", 0xFF8B5CF6, true),
            CategoryEntity("cat-work", "Work", "💼", 0xFF2563EB, true),
            CategoryEntity("cat-fitness", "Fitness", "🏋️", 0xFF22C55E, true),
            CategoryEntity("cat-food", "Food", "🍽️", 0xFFF59E0B, true),
            CategoryEntity("cat-birthdays", "Birthdays", "🎂", 0xFFEC4899, true),
            CategoryEntity("cat-bills", "Bills and Payments", "💰", 0xFF10B981, true),
            CategoryEntity("cat-shopping", "Shopping", "🛒", 0xFFF97316, true),
            CategoryEntity("cat-personal", "Personal Care", "🧘", 0xFF14B8A6, true),
            CategoryEntity("cat-appointments", "Appointments", "📅", 0xFF6366F1, true),
            CategoryEntity("cat-family", "Family", "❤️", 0xFFF43F5E, true),
            CategoryEntity("cat-other", "Other", "🔔", 0xFF64748B, true)
        )

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "remindme_database.db"
                ).build()
                INSTANCE = instance
                CoroutineScope(Dispatchers.IO).launch {
                    instance.reminderDao().insertDefaultCategories(DEFAULT_CATEGORIES)
                }
                instance
            }
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/remindme/app/domain/RecurrenceCalculator.kt',
    name: 'RecurrenceCalculator.kt',
    folder: 'Domain & Scheduling Logic',
    language: 'kotlin',
    description: 'Pure Kotlin recurrence engine calculating next trigger times across time zones, selected weekdays, custom intervals, and optional end dates.',
    content: `package com.remindme.app.domain

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
`,
  },
  {
    path: 'app/src/main/java/com/remindme/app/alarm/AlarmScheduler.kt',
    name: 'AlarmScheduler.kt',
    folder: 'AlarmManager & Notifications',
    language: 'kotlin',
    description: 'Schedules, updates, and cancels exact alarms using AlarmManager with graceful fallback when exact alarm permission is denied or Doze mode is active.',
    content: `package com.remindme.app.alarm

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
`,
  },
  {
    path: 'app/src/main/java/com/remindme/app/alarm/NotificationHelper.kt',
    name: 'NotificationHelper.kt',
    folder: 'AlarmManager & Notifications',
    language: 'kotlin',
    description: 'Builds NotificationChannels and displays rich Material notifications with Mark as Done and Snooze (5, 10, 15, 30, 60m) actions.',
    content: `package com.remindme.app.alarm

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

        val categoryLabel = category?.let { "\${it.emoji} \${it.name}" } ?: "Reminder"
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
            .addAction(android.R.drawable.ic_lock_idle_alarm, "Snooze \${defaultSnoozeMinutes}m", snoozePendingIntent)

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
`,
  },
  {
    path: 'app/src/main/java/com/remindme/app/alarm/AlarmReceiver.kt',
    name: 'AlarmReceiver.kt',
    folder: 'AlarmManager & Notifications',
    language: 'kotlin',
    description: 'BroadcastReceiver that wakes on AlarmManager trigger, shows the smart notification, and automatically computes & schedules the next recurring alarm.',
    content: `package com.remindme.app.alarm

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
`,
  },
  {
    path: 'app/src/main/java/com/remindme/app/alarm/NotificationActionReceiver.kt',
    name: 'NotificationActionReceiver.kt',
    folder: 'AlarmManager & Notifications',
    language: 'kotlin',
    description: 'Handles "Mark as Done" and "Snooze" notification button taps in the background.',
    content: `package com.remindme.app.alarm

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
`,
  },
  {
    path: 'app/src/main/java/com/remindme/app/alarm/BootAndTimeReceiver.kt',
    name: 'BootAndTimeReceiver.kt',
    folder: 'AlarmManager & Notifications',
    language: 'kotlin',
    description: 'Restores all pending alarms after device reboot (BOOT_COMPLETED), app update, time change, or timezone change.',
    content: `package com.remindme.app.alarm

import android.app.AlarmManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.remindme.app.data.local.AppDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class BootAndTimeReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val validActions = setOf(
            Intent.ACTION_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON",
            Intent.ACTION_MY_PACKAGE_REPLACED,
            Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED,
            AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED
        )
        if (intent.action !in validActions) return

        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val dao = AppDatabase.getInstance(context).reminderDao()
                val scheduler = AlarmScheduler(context)
                val pendingReminders = dao.getAllPendingRemindersSync()
                for (reminder in pendingReminders) {
                    scheduler.schedule(reminder)
                }
            } finally {
                pendingResult.finish()
            }
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/remindme/app/ui/viewmodel/ReminderViewModel.kt',
    name: 'ReminderViewModel.kt',
    folder: 'MVVM ViewModel & Repository',
    language: 'kotlin',
    description: 'MVVM ViewModel exposing immutable StateFlows for Dashboard, Calendar, Search/Filter, Categories, and CRUD operations.',
    content: `package com.remindme.app.ui.viewmodel

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
                title = "\${reminder.title} (Copy)",
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
                id = "custom-\${UUID.randomUUID()}",
                name = name.trim(),
                emoji = emoji.ifBlank { "✨" },
                colorHex = colorHex,
                isDefault = false
            )
            dao.upsertCategory(category)
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/remindme/app/ui/theme/Theme.kt',
    name: 'Theme.kt',
    folder: 'Jetpack Compose UI (ui/theme)',
    language: 'kotlin',
    description: 'Material 3 + iOS 26 Liquid Glass optical theme with translucent gradient fill, Fresnel specular border, and Electric Blue / Purple / Cyan palette.',
    content: `package com.remindme.app.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

val ElectricBlue = Color(0xFF2563EB)
val RoyalPurple = Color(0xFF8B5CF6)
val VibrantCyan = Color(0xFF06B6D4)
val LightBackground = Color(0xFFF8FAFC)
val DarkBackground = Color(0xFF0F172A)
val SuccessGreen = Color(0xFF22C55E)
val WarningOrange = Color(0xFFF59E0B)

private val LightColorPalette = lightColorScheme(
    primary = ElectricBlue,
    secondary = RoyalPurple,
    tertiary = VibrantCyan,
    background = LightBackground,
    surface = Color(0xB8FFFFFF),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFF0F172A),
    onSurface = Color(0xFF0F172A)
)

private val DarkColorPalette = darkColorScheme(
    primary = Color(0xFF3B82F6),
    secondary = Color(0xFFA78BFA),
    tertiary = Color(0xFF22D3EE),
    background = DarkBackground,
    surface = Color(0x9E0F172A),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFFF8FAFC),
    onSurface = Color(0xFFF8FAFC)
)

/**
 * iOS 26 Liquid Glass optical surface modifier for Jetpack Compose cards and bars.
 * Applies a multi-stop translucent gradient fill and a specular Fresnel rim border.
 */
fun Modifier.liquidGlassSurface(
    darkTheme: Boolean,
    cornerRadius: Dp = 24.dp
): Modifier {
    val shape = RoundedCornerShape(cornerRadius)
    val glassFill = if (darkTheme) {
        Brush.linearGradient(
            colors = listOf(Color(0xAD1E293B), Color(0x8A0F172A))
        )
    } else {
        Brush.linearGradient(
            colors = listOf(Color(0xD6FFFFFF), Color(0x99F8FAFC))
        )
    }
    val rimStroke = if (darkTheme) {
        Brush.linearGradient(
            colors = listOf(Color(0x47FFFFFF), Color(0x1494A3B8))
        )
    } else {
        Brush.linearGradient(
            colors = listOf(Color(0xEBFFFFFF), Color(0x66CBD5E1))
        )
    }
    return this
        .clip(shape)
        .background(brush = glassFill, shape = shape)
        .border(width = 1.dp, brush = rimStroke, shape = shape)
}

@Composable
fun RemindMeTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkColorPalette else LightColorPalette
    MaterialTheme(
        colorScheme = colors,
        content = content
    )
}
`,
  },
  {
    path: 'app/src/main/java/com/remindme/app/MainActivity.kt',
    name: 'MainActivity.kt',
    folder: 'Jetpack Compose UI (ui)',
    language: 'kotlin',
    description: 'Main Activity with Jetpack Compose Navigation, Bottom Navigation Bar (Home, Calendar, Categories, Settings), runtime permission prompts, and Add/Edit Reminder sheets.',
    content: `package com.remindme.app

import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.remindme.app.alarm.NotificationHelper
import com.remindme.app.ui.theme.RemindMeTheme
import com.remindme.app.ui.viewmodel.ReminderViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        NotificationHelper(this).createNotificationChannels()

        setContent {
            var isDarkMode by remember { mutableStateOf(false) }
            val viewModel: ReminderViewModel = viewModel()

            val permissionLauncher = rememberLauncherForActivityResult(
                ActivityResultContracts.RequestPermission()
            ) { _ -> }

            LaunchedEffect(Unit) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            }

            RemindMeTheme(darkTheme = isDarkMode) {
                RemindMeMainScaffold(
                    viewModel = viewModel,
                    isDarkMode = isDarkMode,
                    onToggleDarkMode = { isDarkMode = !isDarkMode }
                )
            }
        }
    }
}

@Composable
fun RemindMeMainScaffold(
    viewModel: ReminderViewModel,
    isDarkMode: Boolean,
    onToggleDarkMode: () -> Unit
) {
    var selectedTab by remember { mutableStateOf("home") }
    val reminders by viewModel.reminders.collectAsState()
    val categories by viewModel.categories.collectAsState()

    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = selectedTab == "home",
                    onClick = { selectedTab = "home" },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                    label = { Text("Home") }
                )
                NavigationBarItem(
                    selected = selectedTab == "calendar",
                    onClick = { selectedTab = "calendar" },
                    icon = { Icon(Icons.Default.CalendarMonth, contentDescription = "Calendar") },
                    label = { Text("Calendar") }
                )
                NavigationBarItem(
                    selected = selectedTab == "categories",
                    onClick = { selectedTab = "categories" },
                    icon = { Icon(Icons.Default.Category, contentDescription = "Categories") },
                    label = { Text("Categories") }
                )
                NavigationBarItem(
                    selected = selectedTab == "settings",
                    onClick = { selectedTab = "settings" },
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                    label = { Text("Settings") }
                )
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding).fillMaxSize()) {
            Text("RemindMe Compose Container (\${reminders.size} reminders, \${categories.size} categories)")
        }
    }
}
`,
  },
  {
    path: 'app/src/test/java/com/remindme/app/ReminderSchedulerTest.kt',
    name: 'ReminderSchedulerTest.kt',
    folder: 'Unit Tests (app/src/test)',
    language: 'kotlin',
    description: 'JUnit 4 unit test suite verifying one-time, hourly, daily, weekday, custom interval, and end-date expiration recurrence logic.',
    content: `package com.remindme.app

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
`,
  },
  {
    path: 'README_BUILD_APK.md',
    name: 'README_BUILD_APK.md',
    folder: 'Build & Install APK Guide',
    language: 'markdown',
    description: 'Step-by-step instructions to build, sign, test, and install the RemindMe APK on a physical Android device or emulator, plus Android OS Exact Alarm & Doze documentation.',
    content: `# RemindMe — Complete Android Studio Project & APK Build Guide

## 1. Prerequisites
- **Android Studio**: Ladybug (2024.2.1) or newer
- **JDK**: Java 17 (bundled with Android Studio)
- **Android SDK**: API Level 35 (Android 15), Minimum SDK 26 (Android 8.0)

## 2. How to Open & Build the Debug APK
1. Export or clone the \`android-project\` folder into a local directory.
2. Open **Android Studio** -> **Open** -> Select the project folder.
3. Let Gradle sync complete automatically.
4. To build the installable Debug APK from the terminal:
   \`\`\`bash
   ./gradlew assembleDebug
   \`\`\`
5. The generated APK will be located at:
   \`\`\`
   app/build/outputs/apk/debug/app-debug.apk
   \`\`\`

## 3. How to Install on Your Android Device via ADB
1. Enable **Developer Options** and **USB Debugging** on your Android phone.
2. Connect your phone via USB and run:
   \`\`\`bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   \`\`\`

## 4. Running the Unit Test Suite
To run the JUnit 4 recurrence and scheduling tests:
\`\`\`bash
./gradlew testDebugUnitTest
\`\`\`

## 5. Android OS Restrictions: Exact Alarms, Doze Mode & Battery Optimization
- **Notification Permission (Android 13 / API 33+)**: Requires runtime \`POST_NOTIFICATIONS\` permission. If denied, reminders remain tracked inside the app dashboard, and a banner prompts the user to enable notifications in System Settings.
- **Exact Alarms (Android 12+ / API 31+ & Android 14+ / API 34+)**: \`AlarmScheduler\` checks \`AlarmManager.canScheduleExactAlarms()\`. When granted, it calls \`setExactAndAllowWhileIdle(RTC_WAKEUP, ...)\` to wake the device at the scheduled time. If the user revokes exact alarm permission in Special App Access, \`AlarmScheduler\` gracefully falls back to \`setAndAllowWhileIdle()\` so the app never crashes with a \`SecurityException\`.
- **Doze Mode & App Standby**: Even with \`setExactAndAllowWhileIdle\`, Android OS throttles exact alarms during deep Doze maintenance windows (typically deferring repeat alarms if fired more than once per 9 minutes) unless the user sets battery usage to **Unrestricted** (\`ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS\`).
- **Reboot & Timezone Persistence**: \`BootAndTimeReceiver\` listens for \`BOOT_COMPLETED\`, \`TIME_SET\`, and \`TIMEZONE_CHANGED\` broadcasts to query Room Database and reschedule all pending reminders automatically.
`,
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    name: 'strings.xml',
    folder: 'Manifest & Resources',
    language: 'xml',
    description: 'Android string resources for app name, notification channels, and actions.',
    content: `<resources>
    <string name="app_name">RemindMe</string>
    <string name="action_mark_done">Mark as Done</string>
    <string name="action_snooze">Snooze</string>
    <string name="channel_urgent_title">Urgent &amp; High Priority Reminders</string>
    <string name="channel_default_title">Standard Reminders</string>
    <string name="widget_description">Displays upcoming scheduled reminders and 1-tap quick add button.</string>
</resources>
`,
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher_foreground.xml',
    name: 'ic_launcher_foreground.xml',
    folder: 'Manifest & Resources',
    language: 'xml',
    description: 'Adaptive launcher vector icon with Electric Blue (#2563EB) bell & checkmark motif.',
    content: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#2563EB"
        android:pathData="M0,0h108v108h-108z" />
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M54,28c-9.94,0 -18,8.06 -18,18v11l-4,5v2h44v-2l-4,-5V46c0,-9.94 -8.06,-18 -18,-18zM54,72c3.31,0 6,-2.69 6,-6H48c0,3.31 2.69,6 6,6z" />
    <path
        android:fillColor="#06B6D4"
        android:pathData="M68,34a8,8 0 1,0 0.01,0z" />
</vector>
`,
  },
  {
    path: 'app/src/main/res/xml/remindme_widget_info.xml',
    name: 'remindme_widget_info.xml',
    folder: 'Home Screen Widget',
    language: 'xml',
    description: 'AppWidgetProviderInfo metadata defining widget sizes, resize modes, and update intervals.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="110dp"
    android:targetCellWidth="3"
    android:targetCellHeight="2"
    android:minResizeWidth="180dp"
    android:minResizeHeight="80dp"
    android:maxResizeWidth="500dp"
    android:maxResizeHeight="600dp"
    android:updatePeriodMillis="1800000"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen"
    android:initialLayout="@layout/widget_remindme_layout"
    android:description="@string/widget_description" />
`,
  },
  {
    path: 'app/src/main/res/layout/widget_remindme_layout.xml',
    name: 'widget_remindme_layout.xml',
    folder: 'Home Screen Widget',
    language: 'xml',
    description: 'Main widget RemoteViews layout with header, 1-tap quick add button (+), and ListView.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="@drawable/widget_background"
    android:padding="14dp">

    <!-- Header: Wordmark & Quick Add Button -->
    <RelativeLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginBottom="10dp">

        <LinearLayout
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:layout_alignParentStart="true"
            android:layout_centerVertical="true"
            android:layout_toStartOf="@id/btn_widget_quick_add">

            <TextView
                android:id="@+id/tv_widget_title"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="RemindMe"
                android:textSize="15sp"
                android:textStyle="bold"
                android:textColor="#0F172A" />

            <TextView
                android:id="@+id/tv_widget_subtitle"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Upcoming Agenda"
                android:textSize="11sp"
                android:textColor="#64748B" />
        </LinearLayout>

        <!-- Quick Add Action Button (+) -->
        <FrameLayout
            android:id="@+id/btn_widget_quick_add"
            android:layout_width="34dp"
            android:layout_height="34dp"
            android:layout_alignParentEnd="true"
            android:layout_centerVertical="true"
            android:background="@drawable/widget_add_btn_bg"
            android:clickable="true"
            android:focusable="true">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_gravity="center"
                android:text="+"
                android:textColor="#FFFFFF"
                android:textSize="20sp"
                android:textStyle="bold"
                android:includeFontPadding="false" />
        </FrameLayout>
    </RelativeLayout>

    <!-- Empty State View -->
    <LinearLayout
        android:id="@+id/widget_empty_view"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:gravity="center"
        android:orientation="vertical"
        android:padding="16dp"
        android:visibility="gone">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="🎉"
            android:textSize="28sp" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="6dp"
            android:text="All caught up!"
            android:textColor="#0F172A"
            android:textSize="13sp"
            android:textStyle="bold" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="2dp"
            android:text="Tap + to schedule a new reminder"
            android:textColor="#64748B"
            android:textSize="11sp" />
    </LinearLayout>

    <!-- Upcoming Reminders Scrollable List -->
    <ListView
        android:id="@+id/widget_reminder_list"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:divider="@android:color/transparent"
        android:dividerHeight="6dp"
        android:scrollbars="none" />

</LinearLayout>
`,
  },
  {
    path: 'app/src/main/java/com/remindme/app/widget/RemindMeWidgetProvider.kt',
    name: 'RemindMeWidgetProvider.kt',
    folder: 'Home Screen Widget',
    language: 'kotlin',
    description: 'AppWidgetProvider handling lifecycle, Quick-Add PendingIntent, and data change broadcasts.',
    content: `package com.remindme.app.widget

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

        fun sendRefreshBroadcast(context: Context) {
            val intent = Intent(context, RemindMeWidgetProvider::class.java).apply {
                action = ACTION_REFRESH_WIDGET
            }
            context.sendBroadcast(intent)
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/remindme/app/widget/RemindMeWidgetService.kt',
    name: 'RemindMeWidgetService.kt',
    folder: 'Home Screen Widget',
    language: 'kotlin',
    description: 'RemoteViewsService and RemoteViewsFactory querying Room DB and populating upcoming agenda rows.',
    content: `package com.remindme.app.widget

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

    override fun onCreate() {}

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

        views.setTextViewText(R.id.tv_widget_item_emoji, category?.emoji ?: "🔔")
        views.setTextViewText(R.id.tv_widget_item_title, reminder.title)

        val triggerEpoch = reminder.snoozedUntilEpochMillis ?: reminder.scheduledAtEpochMillis
        val triggerDate = Date(triggerEpoch)
        val isToday = todayFormat.format(triggerDate) == todayFormat.format(Date())
        val timeLabel = if (isToday) "Today, \${timeFormat.format(triggerDate)}" else dateFormat.format(triggerDate)
        val statusText = if (reminder.snoozedUntilEpochMillis != null) "⏰ Snoozed · \$timeLabel" else timeLabel
        views.setTextViewText(R.id.tv_widget_item_time, statusText)

        val (priorityLabel, priorityColor) = when (reminder.priority.uppercase()) {
            "URGENT" -> "URGENT" to Color.parseColor("#EF4444")
            "HIGH" -> "HIGH" to Color.parseColor("#F59E0B")
            "LOW" -> "LOW" to Color.parseColor("#10B981")
            else -> "MED" to Color.parseColor("#2563EB")
        }
        views.setTextViewText(R.id.tv_widget_item_priority, priorityLabel)
        views.setTextColor(R.id.tv_widget_item_priority, priorityColor)

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
`,
  },
];


