package com.remindme.app

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
import com.remindme.app.widget.RemindMeWidgetProvider

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        NotificationHelper(this).createNotificationChannels()

        val isQuickAddAction = intent?.action == RemindMeWidgetProvider.ACTION_QUICK_ADD
        val targetReminderId = intent?.getStringExtra(RemindMeWidgetProvider.EXTRA_REMINDER_ID)

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
                    initialQuickAdd = isQuickAddAction,
                    targetReminderId = targetReminderId,
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
    initialQuickAdd: Boolean = false,
    targetReminderId: String? = null,
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
            Text("RemindMe Compose Container (${reminders.size} reminders, ${categories.size} categories)")
        }
    }
}
