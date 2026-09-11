package com.messwise.os.data.model

import com.google.firebase.Timestamp

/**
 * Tracks a student's decision to attend or skip a specific meal.
 * Maps to Firestore collection: `meal_responses/{date_mealType_vid}`
 *
 * Document ID convention: "2026-09-11_LUNCH_VID001"
 */
data class MealResponse(
    val vid: String = "",
    val date: String = "",
    val mealType: String = "",
    val status: AttendanceStatus = AttendanceStatus.ATTENDING,
    val timestamp: Timestamp? = null
)

enum class AttendanceStatus {
    ATTENDING,
    SKIPPED
}
