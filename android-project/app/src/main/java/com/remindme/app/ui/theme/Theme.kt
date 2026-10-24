package com.remindme.app.ui.theme

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
