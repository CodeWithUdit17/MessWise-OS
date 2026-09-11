package com.messwise.os.ui.mess

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.messwise.os.data.model.*
import com.messwise.os.ui.components.BroadcastBanner
import com.messwise.os.ui.components.CrowdMeter
import com.messwise.os.ui.components.GreenPointsBadge
import com.messwise.os.ui.components.MealCard

/**
 * StudentMessScreen — The core student interface for MessWise OS.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentMessScreen(
    onNavigateToTickets: () -> Unit,
    onNavigateToPlateScanner: () -> Unit,
    onNavigateToEntryQr: () -> Unit,
    onNavigateToSickMeal: () -> Unit,
    onNavigateToSpecialLunch: () -> Unit,
    onNavigateToHolidayRebate: () -> Unit,
    onNavigateToTechnicalComplaint: () -> Unit,
    onLogout: () -> Unit,
    viewModel: MessViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // Toast / Snackbar
    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(uiState.toastMessage) {
        uiState.toastMessage?.let { msg ->
            snackbarHostState.showSnackbar(msg, duration = SnackbarDuration.Short)
            viewModel.clearToast()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                "MessWise OS",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Black
                                )
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = Color(0xFFD1FAE5)
                            ) {
                                Text(
                                    "🌱 100% PURE VEG",
                                    color = Color(0xFF065F46),
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Black),
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                        Text(
                            "Hi, ${uiState.user?.name ?: "Student"} 👋",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                actions = {
                    GreenPointsBadge(points = uiState.greenPoints)
                    Spacer(modifier = Modifier.width(4.dp))
                    IconButton(onClick = onNavigateToTechnicalComplaint) {
                        Icon(
                            Icons.Outlined.HeadsetMic,
                            contentDescription = "IT Support"
                        )
                    }
                    IconButton(onClick = onNavigateToTickets) {
                        Icon(
                            Icons.Outlined.Build,
                            contentDescription = "Maintenance"
                        )
                    }
                    IconButton(onClick = onLogout) {
                        Icon(
                            Icons.Outlined.Logout,
                            contentDescription = "Logout"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { innerPadding ->

        if (uiState.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
            return@Scaffold
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // ── Section 0A: Democratic Hostel Team Takeover Banner ─────────
            if (uiState.isHostelTeamTakeover) {
                item {
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2)),
                        border = androidx.compose.foundation.BorderStroke(1.5.dp, Color(0xFFEF4444)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("🚨", fontSize = 28.sp)
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    "Democratic Oversight Active!",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Black),
                                    color = Color(0xFF991B1B)
                                )
                                Text(
                                    "Quality threshold breached (>40% unhappy ratings). Today's mess service and preparation standards are officially supervised by the Hostel Student Team.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color(0xFFB91C1C)
                                )
                            }
                        }
                    }
                }
            }

            // ── Section 0B: Live Campus & Warden Broadcasts ───────────────
            if (uiState.broadcasts.isNotEmpty()) {
                item {
                    BroadcastBanner(broadcasts = uiState.broadcasts)
                }
            }

            // ── Section 1: Quick Feature Action Hub ───────────────────────
            item {
                QuickActionsHub(
                    onPlateScanner = onNavigateToPlateScanner,
                    onEntryQr = onNavigateToEntryQr,
                    onSickMeal = onNavigateToSickMeal,
                    onSpecialLunch = onNavigateToSpecialLunch,
                    onHolidayRebate = onNavigateToHolidayRebate,
                    onTechComplaint = onNavigateToTechnicalComplaint
                )
            }

            // ── Section 2: Meal Type Tabs ─────────────────────────────────
            item {
                MealTypeTabs(
                    selectedMealType = uiState.selectedMealType,
                    onSelect = viewModel::selectMealType
                )
            }

            // ── Section 3: Current Meal Menu Cards ────────────────────────
            item {
                val currentMenu = uiState.menus.find {
                    it.mealType == uiState.selectedMealType
                }

                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "${uiState.selectedMealType.emoji} ${uiState.selectedMealType.displayName}",
                                    style = MaterialTheme.typography.titleLarge.copy(
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                                Text(
                                    text = currentMenu?.servingTime ?: "Check schedule",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            // Skip/Eat Status Badge
                            val status = uiState.mealStatuses[uiState.selectedMealType]
                                ?: AttendanceStatus.ATTENDING

                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = if (status == AttendanceStatus.SKIPPED)
                                    Color(0xFFFEF3C7) else Color(0xFFD1FAE5),
                                modifier = Modifier.padding(start = 8.dp)
                            ) {
                                Text(
                                    text = if (status == AttendanceStatus.SKIPPED)
                                        "⏭️ Skipping" else "✅ Eating",
                                    style = MaterialTheme.typography.labelMedium.copy(
                                        fontWeight = FontWeight.Bold
                                    ),
                                    color = if (status == AttendanceStatus.SKIPPED)
                                        Color(0xFF92400E) else Color(0xFF065F46),
                                    modifier = Modifier.padding(
                                        horizontal = 12.dp,
                                        vertical = 6.dp
                                    )
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Food item cards
                        if (currentMenu != null && currentMenu.items.isNotEmpty()) {
                            currentMenu.items.forEach { item ->
                                MealCard(foodItem = item)
                                Spacer(modifier = Modifier.height(8.dp))
                            }
                        } else {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(100.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "Menu not available yet",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }

            // ── Section 4: 1-Tap Skip/Eat Toggle ─────────────────────────
            item {
                SkipEatToggleSection(
                    mealStatuses = uiState.mealStatuses,
                    onToggle = viewModel::toggleMealResponse
                )
            }

            // ── Section 5: Rate Today's Meal & Quality Feedback ──────────
            item {
                MealQualityFeedbackCard(
                    mealName = uiState.selectedMealType.displayName,
                    alreadyRated = uiState.ratedMealToday,
                    onSubmitRating = { rating, tags, comment ->
                        viewModel.submitMealRating(rating, tags, comment)
                    }
                )
            }

            // ── Section 6: Live Crowd Meter (With Dynamic Crowdy State) ──
            item {
                CrowdMeter(crowdMetrics = uiState.crowdMetrics)
            }

            // ── Section 7: Green Points Info Card ─────────────────────────
            item {
                GreenPointsInfoCard(
                    points = uiState.greenPoints,
                    onOpenScanner = onNavigateToPlateScanner
                )
            }

            // Bottom spacing
            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }
}

// ── Quick Actions Hub ──────────────────────────────────────────────────────

@Composable
private fun QuickActionsHub(
    onPlateScanner: () -> Unit,
    onEntryQr: () -> Unit,
    onSickMeal: () -> Unit,
    onSpecialLunch: () -> Unit,
    onHolidayRebate: () -> Unit,
    onTechComplaint: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                "Campus Dining Facilities",
                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(12.dp))

            LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                item {
                    ActionChipItem(
                        icon = "📸",
                        title = "Plate Scanner",
                        subtitle = "± Green Coins",
                        onClick = onPlateScanner,
                        bgColor = Color(0xFFECFDF5)
                    )
                }
                item {
                    ActionChipItem(
                        icon = "🎟️",
                        title = "QR Entry Pass",
                        subtitle = "Gate Verification",
                        onClick = onEntryQr,
                        bgColor = Color(0xFFEFF6FF)
                    )
                }
                item {
                    ActionChipItem(
                        icon = "🥣",
                        title = "Sick Meal",
                        subtitle = "Khichdi & Care",
                        onClick = onSickMeal,
                        bgColor = Color(0xFFFFF1F2)
                    )
                }
                item {
                    ActionChipItem(
                        icon = "🌟",
                        title = "Special Lunch",
                        subtitle = "Feast Booking",
                        onClick = onSpecialLunch,
                        bgColor = Color(0xFFFFFBEB)
                    )
                }
                item {
                    ActionChipItem(
                        icon = "🏖️",
                        title = "Holiday Leave",
                        subtitle = "1-Day Advance",
                        onClick = onHolidayRebate,
                        bgColor = Color(0xFFF0FDF4)
                    )
                }
                item {
                    ActionChipItem(
                        icon = "💻",
                        title = "IT Support",
                        subtitle = "Tech Complaint",
                        onClick = onTechComplaint,
                        bgColor = Color(0xFFF8FAFC)
                    )
                }
            }
        }
    }
}

@Composable
private fun ActionChipItem(
    icon: String,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    bgColor: Color
) {
    Surface(
        modifier = Modifier
            .width(130.dp)
            .clip(RoundedCornerShape(16.dp))
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        color = bgColor
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(icon, fontSize = 24.sp)
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                title,
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Black),
                color = Color(0xFF0F172A)
            )
            Text(
                subtitle,
                style = MaterialTheme.typography.labelSmall,
                color = Color(0xFF64748B)
            )
        }
    }
}

// ── Rate Today's Food / Quality Feedback Card ──────────────────────────────

@Composable
private fun MealQualityFeedbackCard(
    mealName: String,
    alreadyRated: Boolean,
    onSubmitRating: (String, List<String>, String) -> Unit
) {
    var selectedRating by remember { mutableStateOf<String?>(null) }
    var selectedTag by remember { mutableStateOf<String?>(null) }
    val unhappyTags = listOf("Cold food", "Too oily / spicy", "Bad taste", "Finished early")

    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("⭐", fontSize = 20.sp)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    "Rate $mealName Food Quality",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
            }

            Text(
                text = "If more students are unhappy (>40%), mess service is handed over to the Hostel Student Oversight Team.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp, bottom = 14.dp)
            )

            if (alreadyRated) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFFECFDF5),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        "✅ Thanks for voting! Your feedback helps uphold campus dining standards.",
                        color = Color(0xFF065F46),
                        style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                        modifier = Modifier.padding(14.dp),
                        textAlign = TextAlign.Center
                    )
                }
            } else {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    listOf(
                        Triple("LOVED", "😋", "Loved It"),
                        Triple("AVERAGE", "😐", "Average"),
                        Triple("UNHAPPY", "😡", "Unhappy")
                    ).forEach { (ratingKey, emoji, label) ->
                        val isSelected = selectedRating == ratingKey
                        Surface(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(14.dp))
                                .clickable { selectedRating = ratingKey },
                            shape = RoundedCornerShape(14.dp),
                            color = if (isSelected) {
                                if (ratingKey == "UNHAPPY") Color(0xFFFEE2E2) else Color(0xFFD1FAE5)
                            } else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        ) {
                            Column(
                                modifier = Modifier.padding(vertical = 12.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(emoji, fontSize = 24.sp)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    label,
                                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                    color = if (isSelected) {
                                        if (ratingKey == "UNHAPPY") Color(0xFF991B1B) else Color(0xFF065F46)
                                    } else MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }

                if (selectedRating == "UNHAPPY") {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        "What went wrong?",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = Color(0xFF991B1B)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(unhappyTags) { tag ->
                            FilterChip(
                                selected = selectedTag == tag,
                                onClick = { selectedTag = tag },
                                label = { Text(tag, fontSize = 11.sp) },
                                shape = RoundedCornerShape(10.dp)
                            )
                        }
                    }
                }

                if (selectedRating != null) {
                    Spacer(modifier = Modifier.height(14.dp))
                    Button(
                        onClick = {
                            val tags = if (selectedTag != null) listOf(selectedTag!!) else emptyList()
                            onSubmitRating(selectedRating!!, tags, "")
                        },
                        modifier = Modifier.fillMaxWidth().height(46.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (selectedRating == "UNHAPPY") Color(0xFFDC2626) else MaterialTheme.colorScheme.primary
                        )
                    ) {
                        Text("Submit Meal Rating", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

// ── Meal Type Tab Row ──────────────────────────────────────────────────────

@Composable
private fun MealTypeTabs(
    selectedMealType: MealType,
    onSelect: (MealType) -> Unit
) {
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(MealType.entries.toList()) { mealType ->
            val isSelected = mealType == selectedMealType
            FilterChip(
                selected = isSelected,
                onClick = { onSelect(mealType) },
                label = {
                    Text(
                        text = "${mealType.emoji} ${mealType.displayName}",
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                    )
                },
                shape = RoundedCornerShape(14.dp),
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                    selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    }
}

// ── Skip/Eat Toggle Section ────────────────────────────────────────────────

@Composable
private fun SkipEatToggleSection(
    mealStatuses: Map<MealType, AttendanceStatus>,
    onToggle: (MealType) -> Unit
) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.TouchApp,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(22.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    "1-Tap Skip or Eat",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold
                    )
                )
            }

            Text(
                text = "Opt out 3+ hours before meal to earn +15 Green Points 🌿",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
            )

            MealType.entries.forEach { mealType ->
                val status = mealStatuses[mealType] ?: AttendanceStatus.ATTENDING
                val isSkipping = status == AttendanceStatus.SKIPPED

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(
                            if (isSkipping) Color(0xFFFEF3C7).copy(alpha = 0.7f)
                            else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        )
                        .clickable { onToggle(mealType) }
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = mealType.emoji,
                            fontSize = 20.sp
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = mealType.displayName,
                            style = MaterialTheme.typography.bodyLarge.copy(
                                fontWeight = FontWeight.SemiBold
                            )
                        )
                    }

                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = if (isSkipping) Color(0xFFD97706) else MaterialTheme.colorScheme.primary
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                if (isSkipping) Icons.Default.Close else Icons.Default.Check,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (isSkipping) "Skipping" else "Eating",
                                color = Color.White,
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = FontWeight.Bold
                                )
                            )
                        }
                    }
                }

                if (mealType != MealType.entries.last()) {
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }
}

// ── Green Points Info Card ─────────────────────────────────────────────────

@Composable
private fun GreenPointsInfoCard(
    points: Int,
    onOpenScanner: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(20.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.linearGradient(
                        colors = listOf(
                            Color(0xFF064E3B),
                            Color(0xFF065F46),
                            Color(0xFF047857)
                        )
                    )
                )
                .padding(20.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "🌿 Your Green Points",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold
                            ),
                            color = Color.White
                        )
                        Text(
                            text = "Scan clean plates at disposal to earn coins",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.White.copy(alpha = 0.7f)
                        )
                    }

                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = Color.White.copy(alpha = 0.15f)
                    ) {
                        Text(
                            text = "$points pts",
                            style = MaterialTheme.typography.headlineSmall.copy(
                                fontWeight = FontWeight.Black
                            ),
                            color = Color.White,
                            modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Button(
                    onClick = onOpenScanner,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                ) {
                    Icon(Icons.Default.QrCodeScanner, contentDescription = null, tint = Color.White)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("📸 Open Plate Waste Scanner", fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        }
    }
}
