# RemindMe — Complete Android Studio Project & APK Build Guide

## 1. Prerequisites
- **Android Studio**: Ladybug (2024.2.1) or newer
- **JDK**: Java 17 (bundled with Android Studio)
- **Android SDK**: API Level 35 (Android 15), Minimum SDK 26 (Android 8.0)

## 2. How to Open & Build the Debug APK
1. Export or clone the `android-project` folder into a local directory.
2. Open **Android Studio** -> **Open** -> Select the project folder.
3. Let Gradle sync complete automatically.
4. To build the installable Debug APK from the terminal:
   ```bash
   ./gradlew assembleDebug
   ```
5. The generated APK will be located at:
   ```
   app/build/outputs/apk/debug/app-debug.apk
   ```

## 3. How to Install on Your Android Device via ADB
1. Enable **Developer Options** and **USB Debugging** on your Android phone.
2. Connect your phone via USB and run:
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

## 4. Running the Unit Test Suite
To run the JUnit 4 recurrence and scheduling tests:
```bash
./gradlew testDebugUnitTest
```

## 5. Android OS Restrictions: Exact Alarms, Doze Mode & Battery Optimization
- **Notification Permission (Android 13 / API 33+)**: Requires runtime `POST_NOTIFICATIONS` permission. If denied, reminders remain tracked inside the app dashboard, and a banner prompts the user to enable notifications in System Settings.
- **Exact Alarms (Android 12+ / API 31+ & Android 14+ / API 34+)**: `AlarmScheduler` checks `AlarmManager.canScheduleExactAlarms()`. When granted, it calls `setExactAndAllowWhileIdle(RTC_WAKEUP, ...)` to wake the device at the scheduled time. If the user revokes exact alarm permission in Special App Access, `AlarmScheduler` gracefully falls back to `setAndAllowWhileIdle()` so the app never crashes with a `SecurityException`.
- **Doze Mode & App Standby**: Even with `setExactAndAllowWhileIdle`, Android OS throttles exact alarms during deep Doze maintenance windows (typically deferring repeat alarms if fired more than once per 9 minutes) unless the user sets battery usage to **Unrestricted** (`ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`).
- **Reboot & Timezone Persistence**: `BootAndTimeReceiver` listens for `BOOT_COMPLETED`, `TIME_SET`, and `TIMEZONE_CHANGED` broadcasts to query Room Database and reschedule all pending reminders automatically.
