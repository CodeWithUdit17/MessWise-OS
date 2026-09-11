package com.messwise.os.data.repository

import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.messwise.os.data.model.AttendanceStatus
import com.messwise.os.data.model.MealResponse
import com.messwise.os.data.model.MealType
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for meal attendance responses (Skip / Eat decisions).
 * Firestore collection: `meal_responses/{date_mealType_vid}`
 */
@Singleton
class MealResponseRepository @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    private val collection = firestore.collection("meal_responses")

    /**
     * Observe all meal responses for a student on a given date.
     * Used to show which meals the student has marked as Eating or Skipping.
     */
    fun observeStudentResponses(vid: String, date: String): Flow<List<MealResponse>> =
        callbackFlow {
            val listener = collection
                .whereEqualTo("vid", vid)
                .whereEqualTo("date", date)
                .addSnapshotListener { snapshots, error ->
                    if (error != null) {
                        trySend(emptyList())
                        return@addSnapshotListener
                    }

                    val responses = snapshots?.documents?.mapNotNull { doc ->
                        try {
                            MealResponse(
                                vid = doc.getString("vid") ?: "",
                                date = doc.getString("date") ?: "",
                                mealType = doc.getString("mealType") ?: "",
                                status = try {
                                    AttendanceStatus.valueOf(
                                        doc.getString("status") ?: "ATTENDING"
                                    )
                                } catch (_: Exception) {
                                    AttendanceStatus.ATTENDING
                                },
                                timestamp = doc.getTimestamp("timestamp")
                            )
                        } catch (_: Exception) {
                            null
                        }
                    } ?: emptyList()

                    trySend(responses)
                }

            awaitClose { listener.remove() }
        }

    /**
     * Toggle a student's meal attendance status.
     * Creates or updates the document at `meal_responses/{date_mealType_vid}`.
     *
     * @return the new [AttendanceStatus] after toggling
     */
    suspend fun toggleMealResponse(
        vid: String,
        date: String,
        mealType: MealType,
        currentStatus: AttendanceStatus
    ): Result<AttendanceStatus> {
        return try {
            val newStatus = when (currentStatus) {
                AttendanceStatus.ATTENDING -> AttendanceStatus.SKIPPED
                AttendanceStatus.SKIPPED -> AttendanceStatus.ATTENDING
            }

            val docId = "${date}_${mealType.name}_$vid"
            val data = mapOf(
                "vid" to vid,
                "date" to date,
                "mealType" to mealType.name,
                "status" to newStatus.name,
                "timestamp" to Timestamp.now()
            )

            collection.document(docId).set(data).await()
            Result.success(newStatus)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Observe aggregate counts for a specific meal on a date.
     * Returns a Flow of pair: (attendingCount, skippedCount)
     */
    fun observeMealCounts(date: String, mealType: MealType): Flow<Pair<Int, Int>> =
        callbackFlow {
            val listener = collection
                .whereEqualTo("date", date)
                .whereEqualTo("mealType", mealType.name)
                .addSnapshotListener { snapshots, error ->
                    if (error != null) {
                        trySend(Pair(0, 0))
                        return@addSnapshotListener
                    }

                    var attending = 0
                    var skipped = 0
                    snapshots?.documents?.forEach { doc ->
                        when (doc.getString("status")) {
                            "ATTENDING" -> attending++
                            "SKIPPED" -> skipped++
                        }
                    }

                    trySend(Pair(attending, skipped))
                }

            awaitClose { listener.remove() }
        }
}
