package com.messwise.os.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.messwise.os.data.model.CrowdLevel
import com.messwise.os.data.model.CrowdMetrics

/**
 * Live Mess Crowd & Queue Meter.
 * Color-coded rush indicator (Low, Moderate, Peak)
 * with estimated queue waiting time and a pulsing live indicator.
 */
@Composable
fun CrowdMeter(
    crowdMetrics: CrowdMetrics,
    modifier: Modifier = Modifier
) {
    val isDark = androidx.compose.foundation.isSystemInDarkTheme()

    val (bgGradient, textColor, badgeColor) = when (crowdMetrics.currentLevel) {
        CrowdLevel.LOW -> if (isDark) Triple(
            listOf(Color(0xFF064E3B), Color(0xFF022C22)),
            Color(0xFF6EE7B7),
            Color(0xFF10B981)
        ) else Triple(
            listOf(Color(0xFFD1FAE5), Color(0xFFA7F3D0)),
            Color(0xFF065F46),
            Color(0xFF10B981)
        )
        CrowdLevel.MODERATE -> if (isDark) Triple(
            listOf(Color(0xFF78350F), Color(0xFF451A03)),
            Color(0xFFFCD34D),
            Color(0xFFF59E0B)
        ) else Triple(
            listOf(Color(0xFFFEF3C7), Color(0xFFFDE68A)),
            Color(0xFF92400E),
            Color(0xFFF59E0B)
        )
        CrowdLevel.PEAK -> if (isDark) Triple(
            listOf(Color(0xFF7F1D1D), Color(0xFF450A0A)),
            Color(0xFFFCA5A5),
            Color(0xFFEF4444)
        ) else Triple(
            listOf(Color(0xFFFEE2E2), Color(0xFFFECACA)),
            Color(0xFF991B1B),
            Color(0xFFEF4444)
        )
    }

    // Pulsing animation for the live indicator
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.35f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    Card(
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = modifier.fillMaxWidth()
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.linearGradient(bgGradient))
                .padding(20.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.Groups,
                            contentDescription = null,
                            tint = textColor,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Live Mess Rush",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold
                            ),
                            color = textColor
                        )
                    }

                    // Pulsing live dot
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .scale(pulseScale)
                                .clip(CircleShape)
                                .background(badgeColor)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "LIVE",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Black
                            ),
                            color = textColor.copy(alpha = 0.7f)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Main status display
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Bottom
                ) {
                    Column {
                        Text(
                            text = crowdMetrics.currentLevel.emoji,
                            style = MaterialTheme.typography.headlineLarge
                        )
                        Text(
                            text = crowdMetrics.currentLevel.displayName,
                            style = MaterialTheme.typography.headlineSmall.copy(
                                fontWeight = FontWeight.Black
                            ),
                            color = textColor
                        )
                    }

                    // Wait time badge
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = if (isDark) Color.Black.copy(alpha = 0.35f) else Color.White.copy(alpha = 0.85f),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            textColor.copy(alpha = 0.2f)
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Timer,
                                contentDescription = null,
                                tint = textColor,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Column {
                                Text(
                                    text = "Est. Wait",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = textColor.copy(alpha = 0.7f)
                                )
                                Text(
                                    text = if (crowdMetrics.waitMinutes > 0)
                                        "~${crowdMetrics.waitMinutes} min"
                                    else "< 2 min",
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontWeight = FontWeight.Bold
                                    ),
                                    color = textColor
                                )
                            }
                        }
                    }
                }

                // 3-Segment Visual Rush Gauge
                Spacer(modifier = Modifier.height(14.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    val activeSegments = when (crowdMetrics.currentLevel) {
                        CrowdLevel.LOW -> 1
                        CrowdLevel.MODERATE -> 2
                        CrowdLevel.PEAK -> 3
                    }
                    val segmentColor = when (crowdMetrics.currentLevel) {
                        CrowdLevel.LOW -> Color(0xFF10B981)
                        CrowdLevel.MODERATE -> Color(0xFFF59E0B)
                        CrowdLevel.PEAK -> Color(0xFFEF4444)
                    }
                    for (i in 1..3) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp))
                                .background(
                                    if (i <= activeSegments) segmentColor else textColor.copy(alpha = 0.15f)
                                )
                        )
                    }
                }

                if (crowdMetrics.currentLevel == CrowdLevel.PEAK) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0xFF991B1B),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Text("⚠️", fontSize = 16.sp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                "MESS IS CROWDY: High occupancy detected at gate counters. Expect queue delays!",
                                color = Color.White,
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold)
                            )
                        }
                    }
                }
            }
        }
    }
}
