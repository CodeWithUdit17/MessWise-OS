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
import androidx.compose.ui.text.style.TextOverflow
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
 *
 * Features:
 * 1. Tabbed meal schedule (Breakfast, Lunch, Snacks, Dinner)
 * 2. Dynamic food cards with nutritional tags & allergens
 * 3. 1-tap Skip/Eat toggle with 3-hour cutoff
 * 4. Live crowd/queue meter with color-coded indicators
 * 5. Green Points counter
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentMessScreen(
    onNavigateToTickets: () -> Unit,
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
                        Text(
                            "MessWise OS",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Black
                            )
                        )
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
            // ── Section 0: Live Campus & Warden Broadcasts ────────────────
            if (uiState.broadcasts.isNotEmpty()) {
                item {
                    BroadcastBanner(broadcasts = uiState.broadcasts)
                }
            }

            // ── Section 1: Meal Type Tabs ─────────────────────────────────
            item {
                MealTypeTabs(
                    selectedMealType = uiState.selectedMealType,
                    onSelect = viewModel::selectMealType
                )
            }

            // ── Section 2: Current Meal Menu Cards ────────────────────────
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

            // ── Section 3: 1-Tap Skip/Eat Toggle ─────────────────────────
            item {
                SkipEatToggleSection(
                    mealStatuses = uiState.mealStatuses,
                    onToggle = viewModel::toggleMealResponse
                )
            }

            // ── Section 4: Live Crowd Meter ───────────────────────────────
            item {
                CrowdMeter(crowdMetrics = uiState.crowdMetrics)
            }

            // ── Section 5: Green Points Info Card ─────────────────────────
            item {
                GreenPointsInfoCard(points = uiState.greenPoints)
            }

            // Bottom spacing
            item { Spacer(modifier = Modifier.height(24.dp)) }
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
private fun GreenPointsInfoCard(points: Int) {
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
                        text = "Help reduce campus food wastage",
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
        }
    }
}
