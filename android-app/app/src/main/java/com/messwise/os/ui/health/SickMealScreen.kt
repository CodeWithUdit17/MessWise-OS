package com.messwise.os.ui.health

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import com.messwise.os.data.model.SickMealRequest
import com.messwise.os.data.repository.AdvancedFeaturesRepository
import com.messwise.os.data.repository.AuthRepository
import kotlinx.coroutines.launch

/**
 * SickMealScreen — Health profile declaration & sick/recovery meal facility
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SickMealScreen(
    onNavigateBack: () -> Unit,
    advancedRepo: AdvancedFeaturesRepository,
    authRepo: AuthRepository
) {
    val scope = rememberCoroutineScope()
    val uid = authRepo.currentUid ?: ""
    var userVid by remember { mutableStateOf("") }
    var userName by remember { mutableStateOf("") }
    var hostelBlock by remember { mutableStateOf("A") }
    var roomNo by remember { mutableStateOf("101") }

    LaunchedEffect(Unit) {
        if (uid.isNotBlank()) {
            val profile = authRepo.fetchUserProfile(uid)
            userVid = profile?.vid ?: ""
            userName = profile?.name ?: ""
            hostelBlock = profile?.hostelBlock ?: "A"
            roomNo = profile?.roomNo ?: "101"
        }
    }

    val mealOptions = listOf(
        "Moong Dal Khichdi & Fresh Curd",
        "Light Rice with Rasam & Boiled Potato",
        "Toasted Bread & Warm Milk",
        "Steamed Veggies & Clear Soup"
    )

    var selectedMeal by remember { mutableStateOf(mealOptions[0]) }
    var deliveryType by remember { mutableStateOf("ROOM_DELIVERY") }
    var symptoms by remember { mutableStateOf("") }
    var submitting by remember { mutableStateOf(false) }
    var submitted by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    fun submitRequest() {
        submitting = true
        errorMessage = null
        scope.launch {
            val req = SickMealRequest(
                vid = userVid,
                studentName = userName,
                hostelBlock = hostelBlock,
                roomNo = roomNo,
                mealType = "LUNCH",
                dietPreference = selectedMeal,
                symptoms = symptoms.ifBlank { "Unwell, requesting recovery meal" },
                deliveryType = deliveryType
            )
            val result = advancedRepo.submitSickMealRequest(req)
            result.fold(
                onSuccess = { submitted = true },
                onFailure = { err -> errorMessage = err.message }
            )
            submitting = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Health & Sick Meals", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        Text("Special dietary care for unwell students", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (submitted) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFECFDF5))
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("🥣", fontSize = 48.sp)
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            "Sick Meal Request Placed!",
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black),
                            color = Color(0xFF065F46)
                        )
                        Text(
                            "The kitchen team has been alerted. Your recovery meal ($selectedMeal) will be prepared and ${if (deliveryType == "ROOM_DELIVERY") "dispatched directly to Block $hostelBlock, Room $roomNo." else "held at the priority counter."}",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF047857),
                            modifier = Modifier.padding(top = 6.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = onNavigateBack,
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669))
                        ) {
                            Text("Back to Dining Dashboard", fontWeight = FontWeight.Bold)
                        }
                    }
                }
                return@Scaffold
            }

            // Info Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF1F2))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("❤️‍🩹", fontSize = 28.sp)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            "Hostel Health Care Facility",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = Color(0xFF9F1239)
                        )
                        Text(
                            "Feeling unwell, stomach upset or fever? Order mild oil-free meals with hostel room delivery.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFBE123C)
                        )
                    }
                }
            }

            // Dietary Options Selection
            Text(
                "Select Recovery Meal Diet",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )

            mealOptions.forEach { meal ->
                val isSelected = meal == selectedMeal
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .clickable { selectedMeal = meal }
                        .border(
                            2.dp,
                            if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent,
                            RoundedCornerShape(16.dp)
                        ),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
                        else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(selected = isSelected, onClick = { selectedMeal = meal })
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = meal,
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold)
                        )
                    }
                }
            }

            // Delivery Preference
            Text(
                "Delivery Preference",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                FilterChip(
                    selected = deliveryType == "ROOM_DELIVERY",
                    onClick = { deliveryType = "ROOM_DELIVERY" },
                    label = { Text("🚪 Deliver to Room ($hostelBlock-$roomNo)", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                    shape = RoundedCornerShape(12.dp)
                )
                FilterChip(
                    selected = deliveryType == "COUNTER_PICKUP",
                    onClick = { deliveryType = "COUNTER_PICKUP" },
                    label = { Text("🏃 Counter Pickup", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                    shape = RoundedCornerShape(12.dp)
                )
            }

            // Symptoms / Notes
            OutlinedTextField(
                value = symptoms,
                onValueChange = { symptoms = it },
                label = { Text("Symptoms / Health condition (Optional)") },
                placeholder = { Text("e.g. Fever, viral recovery, stomach acidity") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp)
            )

            errorMessage?.let {
                Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }

            Button(
                onClick = { submitRequest() },
                enabled = !submitting,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE11D48))
            ) {
                if (submitting) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Text(
                    if (submitting) "Requesting..." else "🥣 Submit Sick Meal Request",
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
