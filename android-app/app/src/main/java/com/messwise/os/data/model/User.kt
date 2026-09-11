package com.messwise.os.data.model

/**
 * Represents a registered user in the platform.
 * Maps to Firestore collection: `users/{uid}`
 */
data class User(
    val uid: String = "",
    val vid: String = "",
    val name: String = "",
    val email: String = "",
    val role: UserRole = UserRole.STUDENT,
    val hostelBlock: String = "",
    val roomNo: String = "",
    val greenPoints: Int = 0
)

enum class UserRole {
    STUDENT,
    ADMIN
}
