package com.messwise.os.data.model

import com.google.firebase.Timestamp

/**
 * Hostel maintenance issue ticket raised by a student.
 * Maps to Firestore collection: `maintenance_tickets/{ticketId}`
 */
data class MaintenanceTicket(
    val ticketId: String = "",
    val vid: String = "",
    val hostelBlock: String = "",
    val roomNo: String = "",
    val category: TicketCategory = TicketCategory.PLUMBING,
    val description: String = "",
    val photoUrl: String? = null,
    val status: TicketStatus = TicketStatus.OPEN,
    val assignedTo: String? = null,
    val createdAt: Timestamp? = null,
    val resolvedAt: Timestamp? = null
)

enum class TicketCategory(val displayName: String, val emoji: String) {
    PLUMBING("Plumbing", "🔧"),
    ELECTRICAL("Electrical", "⚡"),
    FURNITURE("Furniture", "🪑"),
    ROOM_ASSETS("Room Assets", "🏠"),
    OTHER("Other", "📋")
}

enum class TicketStatus(val displayName: String) {
    OPEN("Open"),
    IN_PROGRESS("In Progress"),
    RESOLVED("Resolved")
}
