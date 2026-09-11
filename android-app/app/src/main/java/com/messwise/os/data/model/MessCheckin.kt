package com.messwise.os.data.model

import com.google.firebase.Timestamp

/**
 * QR Check-in event at the mess entrance gate.
 * Maps to Firestore collection: `mess_checkins/{checkinId}`
 */
data class MessCheckin(
    val id: String = "",
    val vid: String = "",
    val date: String = "",
    val mealType: String = "",
    val gateId: String = "GATE_A",
    val timestamp: Timestamp? = null
)
