package com.messwise.os.data.model

import com.google.firebase.Timestamp

/**
 * Campus broadcast / emergency notice from hostel warden or mess management.
 * Maps to Firestore collection: `broadcasts/{broadcastId}`
 */
data class Broadcast(
    val id: String = "",
    val message: String = "",
    val type: BroadcastType = BroadcastType.INFO,
    val sentBy: String = "WARDEN",
    val createdAt: Timestamp? = null
)

enum class BroadcastType(
    val displayName: String,
    val emoji: String,
    val label: String
) {
    INFO("Notice", "ℹ️", "Campus Notice"),
    WARNING("Advisory", "⚠️", "Important Advisory"),
    EMERGENCY("Emergency", "🚨", "Emergency Alert");

    companion object {
        fun fromString(value: String?): BroadcastType =
            entries.firstOrNull { it.name.equals(value, ignoreCase = true) } ?: INFO
    }
}
