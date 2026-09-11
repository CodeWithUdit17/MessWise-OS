package com.messwise.os.data.model

import com.google.firebase.Timestamp

/**
 * Sick / mild recovery diet request for unwell students.
 * Maps to Firestore collection: `sick_meal_requests/{requestId}`
 */
data class SickMealRequest(
    val id: String = "",
    val requestId: String = "",
    val vid: String = "",
    val studentName: String = "",
    val hostelBlock: String = "",
    val roomNo: String = "",
    val mealType: String = "LUNCH",
    val dietPreference: String = "Moong Dal Khichdi & Fresh Curd",
    val symptoms: String = "",
    val deliveryType: String = "ROOM_DELIVERY", // "ROOM_DELIVERY" or "COUNTER_PICKUP"
    val status: String = "REQUESTED", // "REQUESTED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"
    val createdAt: Timestamp? = null
)
