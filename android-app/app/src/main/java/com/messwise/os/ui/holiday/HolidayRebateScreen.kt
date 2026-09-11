package com.messwise.os.ui.holiday

import androidx.compose.animation.*
import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.messwise.os.data.model.HolidayRebate
import com.messwise.os.data.repository.AdvancedFeaturesRepository
import com.messwise.os.data.repository.AuthRepository
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

/**
 * HolidayRebateScreen — Advance Holiday Application & Mess Fee Rebate
 *
 * Mandatory Rule: Must be applied at least 1 day in advance (departure date > today)
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HolidayRebateScreen(
    onNavigateBack: () -> Unit,
    advancedRepo: AdvancedFeaturesRepository,
    authRepo: AuthRepository
) {
    val scope = rememberCoroutineScope()
    val uid = authRepo.currentUid ?: ""
    var userVid by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        if (uid.isNotBlank()) {
            val profile = authRepo.fetchUserProfile(uid)
            userVid = profile?.vid ?: ""
        }
    }

    // Default dates: tomorrow to +4 days
    val tomorrow = LocalDate.now().plusDays(1)
    val defaultEnd = LocalDate.now().plusDays(4)

    var startDateStr by remember { mutableStateOf(tomorrow.format(DateTimeFormatter.ISO_LOCAL_DATE)) }
    var endDateStr by remember { mutableStateOf(defaultEnd.format(DateTimeFormatter.ISO_LOCAL_DATE)) }
    var reason by remember { mutableStateOf("Going home for festival / family leave") }

    var isSubmitting by remember { mutableStateOf(false) }
    var submitted by remember { mutableStateOf(false) }
    var validationError by remember { mutableStateOf<String?>(null) }

    val daysCount = try {
        val s = LocalDate.parse(startDateStr)
        val e = LocalDate.parse(endDateStr)
        (ChronoUnit.DAYS.between(s, e) + 1).coerceAtLeast(1).toInt()
    } catch (_: Exception) {
        3
    }

    fun submitHoliday() {
        validationError = null
        val today = LocalDate.now()
        val start = try {
            LocalDate.parse(startDateStr)
        } catch (_: Exception) {
            validationError = "Invalid start date format (use YYYY-MM-DD)."
            return
        }
        val end = try {
            LocalDate.parse(endDateStr)
        } catch (_: Exception) {
            validationError = "Invalid end date format (use YYYY-MM-DD)."
            return
        }

        // Advance 1-day rule check
        if (!start.isAfter(today)) {
            validationError = "❌ Advance Notice Required! You must apply at least 1 day before your departure date."
            return
        }

        if (end.isBefore(start)) {
            validationError = "❌ Return date must be after departure date."
            return
        }

        if (daysCount < 2) {
            validationError = "❌ Minimum holiday leave duration is 2 consecutive days for mess fee rebate."
            return
        }

        isSubmitting = true
        scope.launch {
            val rebate = HolidayRebate(
                vid = userVid,
                startDate = startDateStr,
                endDate = endDateStr,
                daysCount = daysCount,
                reason = reason,
                isAdvanceNoticeGiven = true
            )

            val result = advancedRepo.applyHolidayRebate(rebate)
            result.fold(
                onSuccess = { submitted = true },
                onFailure = { err -> validationError = err.message }
            )
            isSubmitting = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Holiday Mess Rebate", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        Text("1-Day advance leave & dining fee waiver", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
                        Text("🏖️", fontSize = 48.sp)
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            "Holiday Rebate Applied!",
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black),
                            color = Color(0xFF065F46)
                        )
                        Text(
                            "Your leave from $startDateStr to $endDateStr ($daysCount Days) has been recorded. Meal headcounts have been automatically waived for the kitchen, and your monthly mess bill rebate is active.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF047857),
                            modifier = Modifier.padding(top = 8.dp)
                        )
                        Spacer(modifier = Modifier.height(20.dp))
                        Button(
                            onClick = onNavigateBack,
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669))
                        ) {
                            Text("Back to Dashboard", fontWeight = FontWeight.Bold)
                        }
                    }
                }
                return@Scaffold
            }

            // Advance Notice Rule Banner
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFEFF6FF)),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFBFDBFE))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("⏰", fontSize = 28.sp)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            "Mandatory 1-Day Advance Notice Rule",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = Color(0xFF1E40AF)
                        )
                        Text(
                            "Per hostel bylaws, holiday rebates must be submitted at least 1 day prior to leaving so the kitchen does not procure perishable raw materials.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF1D4ED8)
                        )
                    }
                }
            }

            // Application Form
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text(
                        "Leave Dates (YYYY-MM-DD)",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedTextField(
                            value = startDateStr,
                            onValueChange = { startDateStr = it },
                            label = { Text("Start Date") },
                            placeholder = { Text("YYYY-MM-DD") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(14.dp)
                        )
                        OutlinedTextField(
                            value = endDateStr,
                            onValueChange = { endDateStr = it },
                            label = { Text("End Date") },
                            placeholder = { Text("YYYY-MM-DD") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(14.dp)
                        )
                    }

                    // Rebate duration estimation
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Total Leave Duration:", style = MaterialTheme.typography.bodySmall)
                            Text("$daysCount Days (~₹${daysCount * 140} Mess Fee Waiver)", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                        }
                    }

                    OutlinedTextField(
                        value = reason,
                        onValueChange = { reason = it },
                        label = { Text("Reason for Leave") },
                        placeholder = { Text("e.g. Vacation, home visit, exam leave") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    validationError?.let {
                        Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = { submitHoliday() },
                        enabled = !isSubmitting,
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        if (isSubmitting) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                            Spacer(modifier = Modifier.width(8.dp))
                        }
                        Text(
                            if (isSubmitting) "Verifying..." else "🏖️ Submit Holiday Rebate Application",
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
