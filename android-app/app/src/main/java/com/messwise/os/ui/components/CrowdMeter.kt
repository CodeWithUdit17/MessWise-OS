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
    val (bgGradient, textColor, badgeColor) = when (crowdMetrics.currentLevel) {
        CrowdLevel.LOW -> Triple(
            listOf(Color(0xFFD1FAE5), Color(0xFFA7F3D0)),
            Color(0xFF065F46),
            Color(0xFF10B981)
        )
        CrowdLevel.MODERATE -> Triple(
            listOf(Color(0xFFFEF3C7), Color(0xFFFDE68A)),
            Color(0xFF92400E),
            Color(0xFFF59E0B)
        )
        CrowdLevel.PEAK -> Triple(
            listOf(Color(0xFFFEE2E2), Color(0xFFFECACA)),
            Color(0xFF991B1B),
            Color(0xFFEF4444)
        )
    }

    // Pulsing animation for the live indicator
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.3f,
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
                        color = Color.White.copy(alpha = 0.8f)
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
