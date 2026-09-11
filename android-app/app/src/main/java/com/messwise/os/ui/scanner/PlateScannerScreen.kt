package com.messwise.os.ui.scanner

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.messwise.os.data.repository.AdvancedFeaturesRepository
import com.messwise.os.data.repository.AuthRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * PlateScannerScreen — AI Dining Plate Cleanliness Scanner
 *
 * Scans the student's dining tray at the disposal counter:
 * - Clean Plate (Zero Waste): +20 Green Coins awarded 🌿
 * - Plate Wasted (>20% food left): -15 Green Coins deducted ⚠️
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlateScannerScreen(
    onNavigateBack: () -> Unit,
    advancedRepo: AdvancedFeaturesRepository,
    authRepo: AuthRepository
) {
    val scope = rememberCoroutineScope()
    val uid = authRepo.currentUid ?: ""
    var userVid by remember { mutableStateOf("") }
    var currentCoins by remember { mutableStateOf(0) }

    LaunchedEffect(Unit) {
        if (uid.isNotBlank()) {
            val profile = authRepo.fetchUserProfile(uid)
            userVid = profile?.vid ?: "STUDENT"
            currentCoins = profile?.greenPoints ?: 0
        }
    }

    var isScanning by remember { mutableStateOf(false) }
    var scanResult by remember { mutableStateOf<ScanEvaluation?>(null) }
    var toastMessage by remember { mutableStateOf<String?>(null) }

    // Reticle animation
    val infiniteTransition = rememberInfiniteTransition(label = "reticle")
    val scannerOffset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scannerLine"
    )

    fun executeScan(simulateClean: Boolean) {
        isScanning = true
        scanResult = null

        scope.launch {
            delay(1500) // Simulate computer vision analysis
            val isClean = simulateClean
            val wastePct = if (isClean) 2 else 32
            val pointsDelta = if (isClean) 20 else -15

            val result = advancedRepo.recordPlateScan(
                vid = userVid,
                uid = uid,
                mealType = "LUNCH",
                isCleanPlate = isClean,
                wastePercentage = wastePct
            )

            result.fold(
                onSuccess = { updatedTotal ->
                    currentCoins = (currentCoins + pointsDelta).coerceAtLeast(0)
                    scanResult = ScanEvaluation(
                        isClean = isClean,
                        wastePercentage = wastePct,
                        pointsDelta = pointsDelta,
                        wastedWeightGrams = if (isClean) 0 else 185
                    )
                },
                onFailure = { err ->
                    toastMessage = "Scan error: ${err.message}"
                }
            )
            isScanning = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            "AI Plate Scanner",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            "Disposal Counter Cleanliness Audit",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0xFF065F46),
                        modifier = Modifier.padding(end = 12.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text("🌿", fontSize = 14.sp)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                "$currentCoins Coins",
                                color = Color.White,
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold)
                            )
                        }
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
            // Scanner Viewfinder Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(20.dp),
                    contentAlignment = Alignment.Center
                ) {
                    // Simulated Plate target in camera
                    Box(
                        modifier = Modifier
                            .size(260.dp)
                            .clip(CircleShape)
                            .border(3.dp, Color(0xFF38BDF8).copy(alpha = 0.6f), CircleShape)
                            .background(
                                Brush.radialGradient(
                                    listOf(Color(0xFF1E293B), Color(0xFF0F172A))
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                Icons.Default.DinnerDining,
                                contentDescription = null,
                                tint = Color.White.copy(alpha = 0.5f),
                                modifier = Modifier.size(72.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "Align Dining Plate Here",
                                color = Color.White.copy(alpha = 0.7f),
                                style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium)
                            )
                        }
                    }

                    // Scanning Laser Line
                    if (isScanning) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(3.dp)
                                .offset(y = (-100 + (scannerOffset * 200)).dp)
                                .background(
                                    Brush.horizontalGradient(
                                        listOf(Color.Transparent, Color(0xFF10B981), Color.Transparent)
                                    )
                                )
                        )
                    }

                    // Scanner Status overlay
                    if (isScanning) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color.Black.copy(alpha = 0.7f),
                            modifier = Modifier.align(Alignment.BottomCenter)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                            ) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    strokeWidth = 2.dp,
                                    color = Color(0xFF10B981)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    "Analyzing Plate Residue...",
                                    color = Color.White,
                                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold)
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Scan Evaluation Result Card
            AnimatedVisibility(
                visible = scanResult != null,
                enter = fadeIn() + expandVertically()
            ) {
                scanResult?.let { eval ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (eval.isClean) Color(0xFFECFDF5) else Color(0xFFFEF2F2)
                        ),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            if (eval.isClean) Color(0xFFA7F3D0) else Color(0xFFFECACA)
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = if (eval.isClean) "🌟" else "⚠️",
                                fontSize = 36.sp
                            )
                            Spacer(modifier = Modifier.width(14.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = if (eval.isClean) "Clean Plate Confirmed! +20 Coins" else "Food Wasted Detected: -15 Coins",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black),
                                    color = if (eval.isClean) Color(0xFF065F46) else Color(0xFF991B1B)
                                )
                                Text(
                                    text = if (eval.isClean)
                                        "Zero waste verified. Thank you for contributing to campus sustainability! 🌿"
                                    else
                                        "~${eval.wastedWeightGrams}g of leftover food was detected. Please take only what you can finish.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = if (eval.isClean) Color(0xFF047857) else Color(0xFFB91C1C)
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Action Buttons (Scan Clean vs Food Wasted for live testing/counter)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Button(
                    onClick = { executeScan(simulateClean = true) },
                    enabled = !isScanning,
                    modifier = Modifier.weight(1f).height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669))
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Clean Plate (+20)", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }

                Button(
                    onClick = { executeScan(simulateClean = false) },
                    enabled = !isScanning,
                    modifier = Modifier.weight(1f).height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626))
                ) {
                    Icon(Icons.Default.Warning, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Waste Left (-15)", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }
        }
    }
}

data class ScanEvaluation(
    val isClean: Boolean,
    val wastePercentage: Int,
    val pointsDelta: Int,
    val wastedWeightGrams: Int
)
