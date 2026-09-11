package com.messwise.os.ui.techsupport

import androidx.compose.animation.*
import androidx.compose.foundation.background
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
import com.messwise.os.data.model.TechCategory
import com.messwise.os.data.model.TechnicalComplaint
import com.messwise.os.data.repository.AdvancedFeaturesRepository
import com.messwise.os.data.repository.AuthRepository
import kotlinx.coroutines.launch

/**
 * TechnicalComplaintScreen — Dedicated Complaint Box for Digital & Technical Issues
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TechnicalComplaintScreen(
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

    var selectedCategory by remember { mutableStateOf(TechCategory.APP_BUG) }
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }
    var submitted by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    fun submitComplaint() {
        if (title.isBlank() || description.isBlank()) {
            errorMessage = "Please provide both a title and description."
            return
        }

        isSubmitting = true
        errorMessage = null

        scope.launch {
            val complaint = TechnicalComplaint(
                vid = userVid,
                title = title.trim(),
                category = selectedCategory.name,
                description = description.trim()
            )

            val result = advancedRepo.submitTechnicalComplaint(complaint)
            result.fold(
                onSuccess = { submitted = true },
                onFailure = { err -> errorMessage = err.message }
            )
            isSubmitting = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Technical Support Box", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        Text("Report app bugs, WiFi, scanner & RFID issues", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
                        Text("💻", fontSize = 48.sp)
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            "Technical Ticket Raised!",
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black),
                            color = Color(0xFF065F46)
                        )
                        Text(
                            "Your issue has been routed to the campus IT & Systems administrator. You will be updated once the glitch is resolved.",
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

            // Info Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF1F5F9))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("💡", fontSize = 28.sp)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            "Technical Issues Only",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = Color(0xFF334155)
                        )
                        Text(
                            "For hostel plumbing or room furniture repairs, please use the Maintenance section. Use this form for software, WiFi, points, or scanner glitches.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF64748B)
                        )
                    }
                }
            }

            // Category Selection
            Text(
                "Select Technical Category",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                TechCategory.entries.forEach { cat ->
                    val isSelected = cat == selectedCategory
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .clickable { selectedCategory = cat },
                        shape = RoundedCornerShape(14.dp),
                        color = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(cat.emoji, fontSize = 20.sp)
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                cat.displayName,
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium),
                                color = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            }

            // Form inputs
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Issue Title *") },
                placeholder = { Text("e.g. Green points not credited after clean plate scan") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp)
            )

            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Detailed Description *") },
                placeholder = { Text("Describe what happened, error message, or location...") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3,
                shape = RoundedCornerShape(14.dp)
            )

            errorMessage?.let {
                Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }

            Button(
                onClick = { submitComplaint() },
                enabled = !isSubmitting && title.isNotBlank() && description.isNotBlank(),
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Text(
                    if (isSubmitting) "Submitting Ticket..." else "Submit Technical Complaint",
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
