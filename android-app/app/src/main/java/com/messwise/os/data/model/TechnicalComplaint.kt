package com.messwise.os.data.model

import com.google.firebase.Timestamp

/**
 * Technical issues & IT helpdesk ticket (separate from hostel civil maintenance).
 * Maps to Firestore collection: `technical_complaints/{ticketId}`
 */
data class TechnicalComplaint(
    val id: String = "",
    val ticketId: String = "",
    val vid: String = "",
    val title: String = "",
    val category: String = "APP_BUG", // "APP_BUG", "MESS_WIFI", "RFID_SCANNER", "GREEN_COINS", "OTHER"
    val description: String = "",
    val status: String = "OPEN", // "OPEN", "IN_PROGRESS", "RESOLVED"
    val createdAt: Timestamp? = null
)

enum class TechCategory(val displayName: String, val emoji: String) {
    APP_BUG("Mobile App Bug / Crash", "📱"),
    MESS_WIFI("Mess Hall WiFi Network", "📶"),
    RFID_SCANNER("Smart Card / RFID Gate", "🪪"),
    GREEN_COINS("Green Coins Discrepancy", "🌿"),
    OTHER("Other IT Issue", "💻")
}
