package com.messwise.os.data.model

import com.google.firebase.Timestamp

/**
 * Password reset request submitted by student to Warden/Admin.
 * Maps to Firestore collection: `password_reset_requests/{requestId}`
 */
data class PasswordResetRequest(
    val id: String = "",
    val vid: String = "",
    val email: String = "",
    val hostelBlock: String = "",
    val roomNo: String = "",
    val reason: String = "",
    val status: String = "PENDING", // "PENDING" or "RESOLVED"
    val temporaryPassword: String? = null,
    val createdAt: Timestamp? = null
)
