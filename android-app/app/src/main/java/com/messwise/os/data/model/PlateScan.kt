package com.messwise.os.data.model

import com.google.firebase.Timestamp

/**
 * Log entry created when a student scans their dining plate/tray at disposal.
 * Maps to Firestore collection: `plate_waste_logs/{logId}`
 */
data class PlateScan(
    val logId: String = "",
    val vid: String = "",
    val date: String = "",
    val mealType: String = "",
    val isCleanPlate: Boolean = true,
    val wastePercentage: Int = 0,
    val pointsDelta: Int = 20,
    val createdAt: Timestamp? = null
)
