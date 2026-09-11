package com.messwise.os.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

// ── Brand Palette ────────────────────────────────────────────────────────────

val EcoGreen = Color(0xFF10B981)
val EcoGreenDark = Color(0xFF059669)
val EcoGreenLight = Color(0xFFD1FAE5)
val MidnightSlate = Color(0xFF0F172A)
val WarmAmber = Color(0xFFF59E0B)
val AlertRed = Color(0xFFEF4444)
val SkyBlue = Color(0xFF3B82F6)
val RoyalPurple = Color(0xFF8B5CF6)

private val LightColorScheme = lightColorScheme(
    primary = EcoGreen,
    onPrimary = Color.White,
    primaryContainer = EcoGreenLight,
    onPrimaryContainer = Color(0xFF002114),
    secondary = SkyBlue,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFDBEAFE),
    onSecondaryContainer = Color(0xFF001D36),
    tertiary = RoyalPurple,
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFEDE9FE),
    onTertiaryContainer = Color(0xFF21005D),
    error = AlertRed,
    onError = Color.White,
    errorContainer = Color(0xFFFEE2E2),
    background = Color(0xFFF8FAFC),
    onBackground = MidnightSlate,
    surface = Color.White,
    onSurface = MidnightSlate,
    surfaceVariant = Color(0xFFF1F5F9),
    onSurfaceVariant = Color(0xFF475569),
    outline = Color(0xFFCBD5E1),
)

private val DarkColorScheme = darkColorScheme(
    primary = EcoGreen,
    onPrimary = Color(0xFF003822),
    primaryContainer = EcoGreenDark,
    onPrimaryContainer = EcoGreenLight,
    secondary = Color(0xFF93C5FD),
    onSecondary = Color(0xFF003258),
    secondaryContainer = Color(0xFF1E3A5F),
    tertiary = Color(0xFFC4B5FD),
    onTertiary = Color(0xFF381E72),
    error = Color(0xFFFCA5A5),
    onError = Color(0xFF690005),
    background = Color(0xFF0F172A),
    onBackground = Color(0xFFE2E8F0),
    surface = Color(0xFF1E293B),
    onSurface = Color(0xFFE2E8F0),
    surfaceVariant = Color(0xFF334155),
    onSurfaceVariant = Color(0xFF94A3B8),
    outline = Color(0xFF475569),
)

@Composable
fun MessWiseTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography(),
        content = content
    )
}
