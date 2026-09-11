package com.messwise.os.data.model

import com.google.firebase.Timestamp

/**
 * Special lunch feast event published by the mess head.
 * Maps to Firestore collection: `special_events/{eventId}`
 */
data class SpecialLunchEvent(
    val id: String = "",
    val title: String = "",
    val date: String = "",
    val mealType: String = "LUNCH",
    val description: String = "",
    val menuItems: List<String> = emptyList(),
    val maxSlots: Int = 200,
    val bookedCount: Int = 0,
    val tokenPrice: Int = 0,
    val isBookedByMe: Boolean = false
)

data class SpecialLunchBooking(
    val bookingId: String = "",
    val eventId: String = "",
    val vid: String = "",
    val studentName: String = "",
    val date: String = "",
    val createdAt: Timestamp? = null
)
