package com.remindme.app.data.local

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
