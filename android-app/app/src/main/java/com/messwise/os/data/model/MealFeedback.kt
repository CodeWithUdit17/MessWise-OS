package com.messwise.os.data.model

import com.google.firebase.Timestamp

/**
 * Meal satisfaction rating and quality audit.
 * Maps to Firestore collection: `meal_feedback/{feedbackId}`
 */
data class MealFeedback(
    val id: String = "",
    val vid: String = "",
    val date: String = "",
    val mealType: String = "",
    val rating: String = "LOVED", // "LOVED", "AVERAGE", "UNHAPPY"
    val complaintTags: List<String> = emptyList(),
    val comments: String = "",
    val createdAt: Timestamp? = null
)

enum class MealRating(val label: String, val emoji: String) {
    LOVED("Loved It", "😋"),
    AVERAGE("Acceptable", "😐"),
    UNHAPPY("Unhappy", "😡")
}
