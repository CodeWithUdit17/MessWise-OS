package com.messwise.os.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.firebase.Timestamp
import com.messwise.os.data.model.Broadcast
import com.messwise.os.data.model.BroadcastType

/**
 * Real-time Campus Broadcast Banner.
 * Displays official warden & mess announcements with urgency-based color coding.
 */
@Composable
fun BroadcastBanner(
    broadcasts: List<Broadcast>,
    modifier: Modifier = Modifier
) {
    if (broadcasts.isEmpty()) return

    var isExpanded by remember { mutableStateOf(false) }

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        if (!isExpanded) {
            // Display only the most recent broadcast prominently
            val latest = broadcasts.first()
            SingleBroadcastCard(
                broadcast = latest,
                totalCount = broadcasts.size,
                isExpandable = broadcasts.size > 1,
                isExpanded = false,
                onToggleExpand = { isExpanded = !isExpanded }
            )
        } else {
            // Expanded view: header + all active notices
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Active Notices (${broadcasts.size})",
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                TextButton(
                    onClick = { isExpanded = false },
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp)
                ) {
                    Text("Collapse", style = MaterialTheme.typography.labelMedium)
                    Icon(Icons.Default.ExpandLess, contentDescription = "Collapse", modifier = Modifier.size(16.dp))
                }
            }

            broadcasts.forEach { broadcast ->
                SingleBroadcastCard(
                    broadcast = broadcast,
                    totalCount = broadcasts.size,
                    isExpandable = false,
                    isExpanded = true,
                    onToggleExpand = {}
                )
            }
        }
    }
}

@Composable
private fun SingleBroadcastCard(
    broadcast: Broadcast,
    totalCount: Int,
    isExpandable: Boolean,
    isExpanded: Boolean,
    onToggleExpand: () -> Unit
) {
    val style = when (broadcast.type) {
        BroadcastType.EMERGENCY -> BroadcastStyle(
            backgroundColor = Color(0xFFFEF2F2),
            borderColor = Color(0xFFFCA5A5),
            badgeBg = Color(0xFFFEE2E2),
            badgeTextColor = Color(0xFF991B1B),
            messageColor = Color(0xFF7F1D1D),
            icon = "🚨",
            label = "EMERGENCY ALERT"
        )
        BroadcastType.WARNING -> BroadcastStyle(
            backgroundColor = Color(0xFFFFFBEB),
            borderColor = Color(0xFFFCD34D),
            badgeBg = Color(0xFFFEF3C7),
            badgeTextColor = Color(0xFF92400E),
            messageColor = Color(0xFF78350F),
            icon = "⚠️",
            label = "CAMPUS ADVISORY"
        )
        BroadcastType.INFO -> BroadcastStyle(
            backgroundColor = Color(0xFFEFF6FF),
            borderColor = Color(0xFFBFDBFE),
            badgeBg = Color(0xFFDBEAFE),
            badgeTextColor = Color(0xFF1E40AF),
            messageColor = Color(0xFF1E3A8A),
            icon = "📢",
            label = "WARDEN NOTICE"
        )
    }

    // Pulsing animation for emergency
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = EaseInOutCubic),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseAlpha"
    )

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .border(
                width = if (broadcast.type == BroadcastType.EMERGENCY) 1.5.dp else 1.dp,
                color = style.borderColor,
                shape = RoundedCornerShape(16.dp)
            ),
        shape = RoundedCornerShape(16.dp),
        color = style.backgroundColor,
        shadowElevation = if (broadcast.type == BroadcastType.EMERGENCY) 3.dp else 1.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp)
        ) {
            // Header Row: Type badge + timestamp + expand button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    // Pulsing dot for emergency
                    if (broadcast.type == BroadcastType.EMERGENCY) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFDC2626).copy(alpha = pulseAlpha))
                        )
                    }

                    // Badge
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = style.badgeBg
                    ) {
                        Text(
                            text = "${style.icon} ${style.label}",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Black,
                                letterSpacing = 0.5.sp
                            ),
                            color = style.badgeTextColor,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }

                    // Sent by tag
                    Text(
                        text = "• ${broadcast.sentBy}",
                        style = MaterialTheme.typography.labelSmall,
                        color = style.messageColor.copy(alpha = 0.7f)
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = formatRelativeTime(broadcast.createdAt),
                        style = MaterialTheme.typography.labelSmall,
                        color = style.messageColor.copy(alpha = 0.7f)
                    )

                    if (isExpandable) {
                        IconButton(
                            onClick = onToggleExpand,
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(
                                imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                contentDescription = "Toggle all notices",
                                tint = style.badgeTextColor,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Notice Message
            Text(
                text = broadcast.message,
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = FontWeight.Medium,
                    lineHeight = 20.sp
                ),
                color = style.messageColor
            )

            // Multi-notice hint footer
            if (isExpandable && !isExpanded && totalCount > 1) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onToggleExpand() }
                        .padding(top = 2.dp),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "+ ${totalCount - 1} more notice${if (totalCount > 2) "s" else ""}",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold
                        ),
                        color = style.badgeTextColor
                    )
                    Icon(
                        Icons.Default.ExpandMore,
                        contentDescription = null,
                        tint = style.badgeTextColor,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }
        }
    }
}

private data class BroadcastStyle(
    val backgroundColor: Color,
    val borderColor: Color,
    val badgeBg: Color,
    val badgeTextColor: Color,
    val messageColor: Color,
    val icon: String,
    val label: String
)

private fun formatRelativeTime(timestamp: Timestamp?): String {
    if (timestamp == null) return "Just now"
    val diffMillis = System.currentTimeMillis() - timestamp.toDate().time
    val diffSeconds = diffMillis / 1000

    return when {
        diffSeconds < 60 -> "Just now"
        diffSeconds < 3600 -> "${diffSeconds / 60}m ago"
        diffSeconds < 86400 -> "${diffSeconds / 3600}h ago"
        else -> "${diffSeconds / 86400}d ago"
    }
}
