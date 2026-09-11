package com.messwise.os.data.model

import com.google.firebase.Timestamp

/**
 * Real-time mess crowd status for the queue meter.
 * Maps to Firestore collection: `mess_crowd_metrics/{messId}`
 */
data class CrowdMetrics(
    val currentLevel: CrowdLevel = CrowdLevel.LOW,
    val waitMinutes: Int = 0,
    val lastUpdated: Timestamp? = null
)

enum class CrowdLevel(val displayName: String, val emoji: String) {
    LOW("Low Rush", "🟢"),
    MODERATE("Moderate", "🟡"),
    PEAK("Peak Rush", "🔴");

    companion object {
        fun fromString(value: String): CrowdLevel =
            entries.firstOrNull { it.name.equals(value, ignoreCase = true) } ?: LOW
    }
}
