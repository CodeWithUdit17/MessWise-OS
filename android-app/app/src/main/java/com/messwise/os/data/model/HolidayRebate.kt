package com.messwise.os.data.model

import com.google.firebase.Timestamp

/**
 * Advance holiday leave and mess billing fee rebate application.
 * Requirement: Must be applied at least 1 day in advance.
 * Maps to Firestore collection: `holiday_rebates/{rebateId}`
 */
data class HolidayRebate(
    val id: String = "",
    val rebateId: String = "",
    val vid: String = "",
    val startDate: String = "",
    val endDate: String = "",
    val daysCount: Int = 2,
    val reason: String = "",
    val status: String = "PENDING", // "PENDING", "APPROVED", "REJECTED"
    val isAdvanceNoticeGiven: Boolean = true,
    val createdAt: Timestamp? = null
)
