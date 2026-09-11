package com.messwise.os.data.repository

import android.net.Uri
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.storage.FirebaseStorage
import com.messwise.os.data.model.MaintenanceTicket
import com.messwise.os.data.model.TicketCategory
import com.messwise.os.data.model.TicketStatus
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for maintenance ticket CRUD and real-time observation.
 * Firestore collection: `maintenance_tickets/{ticketId}`
 */
@Singleton
class TicketRepository @Inject constructor(
    private val firestore: FirebaseFirestore,
    private val storage: FirebaseStorage
) {
    private val collection = firestore.collection("maintenance_tickets")

    /**
     * Observe all tickets for a specific student in real-time.
     * Sorted by creation date descending.
     */
    fun observeStudentTickets(vid: String): Flow<List<MaintenanceTicket>> = callbackFlow {
        val listener = collection
            .whereEqualTo("vid", vid)
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshots, error ->
                if (error != null) {
                    trySend(emptyList())
                    return@addSnapshotListener
                }
                trySend(parseTickets(snapshots))
            }

        awaitClose { listener.remove() }
    }

    /**
     * Observe all tickets for a hostel block (for admin/warden view).
     */
    fun observeBlockTickets(hostelBlock: String): Flow<List<MaintenanceTicket>> = callbackFlow {
        val listener = collection
            .whereEqualTo("hostelBlock", hostelBlock)
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshots, error ->
                if (error != null) {
                    trySend(emptyList())
                    return@addSnapshotListener
                }
                trySend(parseTickets(snapshots))
            }

        awaitClose { listener.remove() }
    }

    /**
     * Create a new maintenance ticket.
     * Optionally uploads a photo to Firebase Storage first.
     */
    suspend fun createTicket(
        vid: String,
        hostelBlock: String,
        roomNo: String,
        category: TicketCategory,
        description: String,
        photoUri: Uri? = null
    ): Result<String> {
        return try {
            val ticketId = UUID.randomUUID().toString()

            // Upload photo if provided
            val photoUrl = if (photoUri != null) {
                val ref = storage.reference
                    .child("ticket_photos/$ticketId/${photoUri.lastPathSegment}")
                ref.putFile(photoUri).await()
                ref.downloadUrl.await().toString()
            } else null

            val data = hashMapOf(
                "ticketId" to ticketId,
                "vid" to vid,
                "hostelBlock" to hostelBlock,
                "roomNo" to roomNo,
                "category" to category.name,
                "description" to description,
                "photoUrl" to photoUrl,
                "status" to TicketStatus.OPEN.name,
                "assignedTo" to null,
                "createdAt" to Timestamp.now(),
                "resolvedAt" to null
            )

            collection.document(ticketId).set(data).await()
            Result.success(ticketId)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun parseTickets(
        snapshots: com.google.firebase.firestore.QuerySnapshot?
    ): List<MaintenanceTicket> {
        return snapshots?.documents?.mapNotNull { doc ->
            try {
                MaintenanceTicket(
                    ticketId = doc.getString("ticketId") ?: doc.id,
                    vid = doc.getString("vid") ?: "",
                    hostelBlock = doc.getString("hostelBlock") ?: "",
                    roomNo = doc.getString("roomNo") ?: "",
                    category = try {
                        TicketCategory.valueOf(doc.getString("category") ?: "OTHER")
                    } catch (_: Exception) {
                        TicketCategory.OTHER
                    },
                    description = doc.getString("description") ?: "",
                    photoUrl = doc.getString("photoUrl"),
                    status = try {
                        TicketStatus.valueOf(doc.getString("status") ?: "OPEN")
                    } catch (_: Exception) {
                        TicketStatus.OPEN
                    },
                    assignedTo = doc.getString("assignedTo"),
                    createdAt = doc.getTimestamp("createdAt"),
                    resolvedAt = doc.getTimestamp("resolvedAt")
                )
            } catch (_: Exception) {
                null
            }
        } ?: emptyList()
    }
}
