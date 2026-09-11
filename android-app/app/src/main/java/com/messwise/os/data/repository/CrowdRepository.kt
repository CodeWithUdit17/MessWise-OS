package com.messwise.os.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.messwise.os.data.model.CrowdLevel
import com.messwise.os.data.model.CrowdMetrics
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for live mess crowd / queue metrics.
 * Firestore collection: `mess_crowd_metrics/{messId}`
 */
@Singleton
class CrowdRepository @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    /**
     * Observe crowd metrics for the main mess hall in real-time.
     * Updates automatically when admin changes the crowd status.
     *
     * @param messId identifier for the mess, defaults to "main_mess"
     */
    fun observeCrowdMetrics(messId: String = "main_mess"): Flow<CrowdMetrics> = callbackFlow {
        val listener = firestore.collection("mess_crowd_metrics")
            .document(messId)
            .addSnapshotListener { snapshot, error ->
                if (error != null || snapshot == null || !snapshot.exists()) {
                    trySend(CrowdMetrics()) // Default: LOW, 0 min wait
                    return@addSnapshotListener
                }

                try {
                    val metrics = CrowdMetrics(
                        currentLevel = CrowdLevel.fromString(
                            snapshot.getString("currentLevel") ?: "LOW"
                        ),
                        waitMinutes = snapshot.getLong("waitMinutes")?.toInt() ?: 0,
                        lastUpdated = snapshot.getTimestamp("lastUpdated")
                    )
                    trySend(metrics)
                } catch (_: Exception) {
                    trySend(CrowdMetrics())
                }
            }

        awaitClose { listener.remove() }
    }
}
