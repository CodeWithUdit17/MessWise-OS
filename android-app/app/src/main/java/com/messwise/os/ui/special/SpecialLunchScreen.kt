package com.messwise.os.ui.special

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.messwise.os.data.model.SpecialLunchEvent
import com.messwise.os.data.repository.AdvancedFeaturesRepository
import com.messwise.os.data.repository.AuthRepository
import kotlinx.coroutines.launch

/**
 * SpecialLunchScreen — Student Special Lunch & Festive Feast Booking
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SpecialLunchScreen(
    onNavigateBack: () -> Unit,
    advancedRepo: AdvancedFeaturesRepository,
    authRepo: AuthRepository
) {
    val scope = rememberCoroutineScope()
    val uid = authRepo.currentUid ?: ""
    var userVid by remember { mutableStateOf("") }
    var userName by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        if (uid.isNotBlank()) {
            val profile = authRepo.fetchUserProfile(uid)
            userVid = profile?.vid ?: ""
            userName = profile?.name ?: ""
        }
    }

    val specialLunches by advancedRepo.observeSpecialLunches().collectAsState(initial = emptyList())
    var bookingInProgress by remember { mutableStateOf<String?>(null) }
    var bookedEvents by remember { mutableStateOf(setOf<String>()) }
    var toastMessage by remember { mutableStateOf<String?>(null) }

    fun bookLunch(event: SpecialLunchEvent) {
        bookingInProgress = event.id
        scope.launch {
            val result = advancedRepo.bookSpecialLunch(event.id, userVid, userName)
            result.fold(
                onSuccess = {
                    bookedEvents = bookedEvents + event.id
                    toastMessage = "🎉 Special Lunch booked for ${event.date}!"
                },
                onFailure = { err ->
                    toastMessage = "❌ Booking failed: ${err.message}"
                }
            )
            bookingInProgress = null
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Special Lunch Facility", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        Text("Grand weekend feasts & festival thali bookings", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFBEB)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFDE68A))
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("🌟", fontSize = 28.sp)
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                "Advance Special Lunch Booking",
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = Color(0xFF92400E)
                            )
                            Text(
                                "Reserve your token 1–2 days before special feasts to avoid long mess counter queues.",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFFB45309)
                            )
                        }
                    }
                }
            }

            if (specialLunches.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("🍽️", fontSize = 42.sp)
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                "No Special Lunches Scheduled",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                "The kitchen head has not announced a weekend feast yet.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                            )
                        }
                    }
                }
            } else {
                items(specialLunches) { event ->
                    val isBooked = bookedEvents.contains(event.id) || event.isBookedByMe

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(22.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = Color(0xFFFEF3C7)
                                ) {
                                    Text(
                                        text = "📅 ${event.date}",
                                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Black),
                                        color = Color(0xFF92400E),
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                    )
                                }

                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = Color(0xFFD1FAE5)
                                ) {
                                    Text(
                                        text = "🌱 100% Pure Veg",
                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                        color = Color(0xFF065F46),
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Text(
                                text = event.title,
                                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black)
                            )

                            Text(
                                text = event.description,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(top = 4.dp)
                            )

                            Spacer(modifier = Modifier.height(14.dp))

                            Text(
                                text = "Special Feast Menu:",
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.primary
                            )

                            Spacer(modifier = Modifier.height(6.dp))

                            event.menuItems.forEach { dish ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(vertical = 2.dp)
                                ) {
                                    Text("•", color = Color(0xFFD97706), fontWeight = FontWeight.Bold)
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(dish, style = MaterialTheme.typography.bodyMedium)
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            if (isBooked) {
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                    color = Color(0xFFD1FAE5)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(14.dp),
                                        horizontalArrangement = Arrangement.Center,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF059669))
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            "Seat Reserved for this Feast! 🎟️",
                                            color = Color(0xFF065F46),
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            } else {
                                Button(
                                    onClick = { bookLunch(event) },
                                    enabled = bookingInProgress != event.id,
                                    modifier = Modifier.fillMaxWidth().height(48.dp),
                                    shape = RoundedCornerShape(14.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD97706))
                                ) {
                                    if (bookingInProgress == event.id) {
                                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White)
                                        Spacer(modifier = Modifier.width(8.dp))
                                    }
                                    Text("🎟️ Book Special Lunch Token", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
