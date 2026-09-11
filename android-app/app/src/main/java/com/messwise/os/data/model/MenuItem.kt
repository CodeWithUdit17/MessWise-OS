package com.messwise.os.data.model

/**
 * A single food item within a meal slot.
 */
data class FoodItem(
    val name: String = "",
    val calories: Int = 0,
    val allergens: List<String> = emptyList(),
    val tags: List<String> = emptyList() // e.g., "Vegan", "Gluten-Free", "High Protein"
)

/**
 * Represents a meal menu entry for a specific date and meal type.
 * Maps to Firestore collection: `mess_menu/{date_mealType}`
 *
 * Document ID convention: "2026-09-11_LUNCH"
 */
data class MessMenu(
    val date: String = "",
    val mealType: MealType = MealType.LUNCH,
    val items: List<FoodItem> = emptyList(),
    val servingTime: String = "" // e.g., "12:30 PM - 2:30 PM"
)

enum class MealType(val displayName: String, val emoji: String) {
    BREAKFAST("Breakfast", "🌅"),
    LUNCH("Lunch", "☀️"),
    SNACKS("Snacks", "🍪"),
    DINNER("Dinner", "🌙");

    companion object {
        fun fromString(value: String): MealType =
            entries.firstOrNull { it.name.equals(value, ignoreCase = true) } ?: LUNCH
    }
}
