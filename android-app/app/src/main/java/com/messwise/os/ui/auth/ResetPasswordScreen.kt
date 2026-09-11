package com.messwise.os.ui.auth

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.messwise.os.data.repository.AdvancedFeaturesRepository
import kotlinx.coroutines.launch

/**
 * ResetPasswordScreen — Student Password Reset Request to Hostel Admin / Warden
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResetPasswordScreen(
    onNavigateBack: () -> Unit,
    advancedRepo: AdvancedFeaturesRepository
) {
    val scope = rememberCoroutineScope()
    var vid by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var hostelBlock by remember { mutableStateOf("") }
    var roomNo by remember { mutableStateOf("") }
    var reason by remember { mutableStateOf("") }

    var isSubmitting by remember { mutableStateOf(false) }
    var submitted by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    fun submitRequest() {
        if (vid.isBlank() || email.isBlank()) {
            errorMessage = "Please enter both your VID and registered email."
            return
        }

        isSubmitting = true
        errorMessage = null

        scope.launch {
            val result = advancedRepo.requestPasswordReset(
                vid = vid.uppercase().trim(),
                email = email.trim(),
                hostelBlock = hostelBlock.uppercase().trim(),
                roomNo = roomNo.trim(),
                reason = reason.ifBlank { "Forgot mobile app login password" }
            )

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
                    Text("Reset Password", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
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
                .padding(20.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (submitted) {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(top = 20.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFECFDF5))
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("🔑", fontSize = 48.sp)
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            "Request Submitted to Warden!",
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black),
                            color = Color(0xFF065F46)
                        )
                        Text(
                            "Your password reset request for VID $vid has been forwarded to the hostel warden portal. You will receive an updated credential or temporary password from the admin office.",
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
                            Text("Back to Sign In", fontWeight = FontWeight.Bold)
                        }
                    }
                }
                return@Scaffold
            }

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    Text(
                        "Student Password Recovery",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black)
                    )
                    Text(
                        "Submit a verified reset request directly to the warden office to receive a temporary login credential.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 4.dp, bottom = 20.dp)
                    )

                    OutlinedTextField(
                        value = vid,
                        onValueChange = { vid = it.uppercase() },
                        label = { Text("Student VID *") },
                        placeholder = { Text("e.g. VID2024001") },
                        leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Registered Email Address *") },
                        placeholder = { Text("student@example.com") },
                        leadingIcon = { Icon(Icons.Default.Email, contentDescription = null) },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedTextField(
                            value = hostelBlock,
                            onValueChange = { hostelBlock = it.uppercase() },
                            label = { Text("Block") },
                            placeholder = { Text("e.g. A") },
                            singleLine = true,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(14.dp)
                        )
                        OutlinedTextField(
                            value = roomNo,
                            onValueChange = { roomNo = it },
                            label = { Text("Room No") },
                            placeholder = { Text("e.g. 204") },
                            singleLine = true,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(14.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedTextField(
                        value = reason,
                        onValueChange = { reason = it },
                        label = { Text("Reason for Reset") },
                        placeholder = { Text("e.g. Forgot password, device changed") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    errorMessage?.let {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    Button(
                        onClick = { submitRequest() },
                        enabled = !isSubmitting && vid.isNotBlank() && email.isNotBlank(),
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        if (isSubmitting) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                            Spacer(modifier = Modifier.width(8.dp))
                        }
                        Text(
                            if (isSubmitting) "Submitting Request..." else "Request Password Reset",
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
