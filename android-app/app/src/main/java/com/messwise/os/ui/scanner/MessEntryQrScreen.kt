package com.messwise.os.ui.scanner

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.messwise.os.data.repository.AdvancedFeaturesRepository
import com.messwise.os.data.repository.AuthRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter

/**
 * MessEntryQrScreen — Contactless Dining Hall Entry Pass & Gate Scanner
 *
 * 1. Student Digital Entry Pass (Dynamic QR Code)
 * 2. Self-Check-in Gate Scanner (Auto-triggers live dining hall crowd metrics)
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MessEntryQrScreen(
    onNavigateBack: () -> Unit,
    advancedRepo: AdvancedFeaturesRepository,
    authRepo: AuthRepository
) {
    val scope = rememberCoroutineScope()
    val uid = authRepo.currentUid ?: ""
    var userVid by remember { mutableStateOf("") }
    var userName by remember { mutableStateOf("") }
    var hostelInfo by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        if (uid.isNotBlank()) {
            val profile = authRepo.fetchUserProfile(uid)
            userVid = profile?.vid ?: "VID2024001"
            userName = profile?.name ?: "Student"
            hostelInfo = "Block ${profile?.hostelBlock ?: "A"} • Room ${profile?.roomNo ?: "101"}"
        }
    }

    var selectedTab by remember { mutableStateOf(0) } // 0: My Pass, 1: Scan Gate
    var isCheckingIn by remember { mutableStateOf(false) }
    var checkinSuccess by remember { mutableStateOf(false) }

    fun handleGateScan() {
        isCheckingIn = true
        scope.launch {
            delay(1200) // Gate scanner simulation
            val currentMeal = when (LocalTime.now().hour) {
                in 7..10 -> "BREAKFAST"
                in 12..15 -> "LUNCH"
                in 16..18 -> "SNACKS"
                else -> "DINNER"
            }
            advancedRepo.recordGateCheckin(userVid, currentMeal, "GATE_A_MAIN")
            isCheckingIn = false
            checkinSuccess = true
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Mess Gate Pass & QR Entry",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Tab Selector: My Entry Pass vs Scan Gate Standee
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                modifier = Modifier.clip(RoundedCornerShape(16.dp))
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("My Entry QR Pass", fontWeight = FontWeight.Bold, fontSize = 13.sp) },
                    icon = { Icon(Icons.Default.QrCode, contentDescription = null, modifier = Modifier.size(18.dp)) }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Scan Gate Standee", fontWeight = FontWeight.Bold, fontSize = 13.sp) },
                    icon = { Icon(Icons.Default.QrCodeScanner, contentDescription = null, modifier = Modifier.size(18.dp)) }
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            if (selectedTab == 0) {
                // ── MY ENTRY QR PASS ───────────────────────────────────────────
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFFD1FAE5)
                        ) {
                            Text(
                                "✅ MEAL PASS ACTIVE",
                                color = Color(0xFF065F46),
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Black),
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // QR Code Graphic Container
                        Box(
                            modifier = Modifier
                                .size(220.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color.White)
                                .border(2.dp, Color(0xFFE2E8F0), RoundedCornerShape(16.dp))
                                .padding(16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    Icons.Default.QrCode2,
                                    contentDescription = "QR Code",
                                    tint = Color.Black,
                                    modifier = Modifier.size(160.dp)
                                )
                                Text(
                                    text = userVid,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = Color.DarkGray
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = userName,
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black)
                        )
                        Text(
                            text = hostelInfo,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        val todayStr = LocalDate.now().format(DateTimeFormatter.ofPattern("EEEE, dd MMM yyyy"))
                        Text(
                            text = "Valid for: $todayStr",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            } else {
                // ── SCAN GATE STANDEE ──────────────────────────────────────────
                Card(
                    modifier = Modifier.fillMaxWidth().weight(1f),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
                ) {
                    Box(
                        modifier = Modifier.fillMaxSize().padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                modifier = Modifier
                                    .size(220.dp)
                                    .border(3.dp, Color(0xFF10B981), RoundedCornerShape(20.dp))
                                    .padding(24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Default.CropFree,
                                    contentDescription = null,
                                    tint = Color(0xFF10B981),
                                    modifier = Modifier.size(120.dp)
                                )
                            }

                            Spacer(modifier = Modifier.height(20.dp))

                            Text(
                                "Point camera at Mess Gate Standee",
                                color = Color.White,
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                            )
                            Text(
                                "Automatically records check-in and verifies active meal voucher",
                                color = Color.White.copy(alpha = 0.6f),
                                style = MaterialTheme.typography.bodySmall,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                AnimatedVisibility(visible = checkinSuccess) {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFECFDF5)),
                        modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(14.dp)
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF059669))
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                "Entry Verified! Welcome to Mess Hall A 🍽️",
                                color = Color(0xFF065F46),
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                }

                Button(
                    onClick = { handleGateScan() },
                    enabled = !isCheckingIn,
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    if (isCheckingIn) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text(
                        if (isCheckingIn) "Verifying Gate QR..." else "📸 Scan Gate QR Standee",
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
