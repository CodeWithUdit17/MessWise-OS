package com.messwise.os.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.messwise.os.data.model.Broadcast
import com.messwise.os.data.model.BroadcastType
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for campus & warden broadcasts.
 * Real-time Flow observation of Firestore `broadcasts` collection.
 */
@Singleton
class BroadcastRepository @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    /**
     * Observe all broadcasts in real time, ordered by newest first.
     */
    fun observeBroadcasts(): Flow<List<Broadcast>> = callbackFlow {
        val listener = firestore.collection("broadcasts")
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshots, error ->
                if (error != null) {
                    trySend(emptyList())
                    return@addSnapshotListener
                }

                val broadcasts = snapshots?.documents?.mapNotNull { doc ->
                    try {
                        Broadcast(
                            id = doc.id,
                            message = doc.getString("message") ?: "",
                            type = BroadcastType.fromString(doc.getString("type")),
                            sentBy = doc.getString("sentBy") ?: "WARDEN",
                            createdAt = doc.getTimestamp("createdAt")
                        )
                    } catch (_: Exception) {
                        null
                    }
                } ?: emptyList()

                trySend(broadcasts)
            }

        awaitClose { listener.remove() }
    }
}
