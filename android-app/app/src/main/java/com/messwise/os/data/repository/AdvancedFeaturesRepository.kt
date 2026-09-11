package com.messwise.os.data.repository

import com.google.firebase.Timestamp
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.messwise.os.data.model.*
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AdvancedFeaturesRepository @Inject constructor(
    private val firestore: FirebaseFirestore
) {

    // ── 1. Plate Scanner (Green Coins Reward/Deduction) ──────────────────────
    suspend fun recordPlateScan(
        vid: String,
        uid: String,
        mealType: String,
        isCleanPlate: Boolean,
        wastePercentage: Int
    ): Result<Int> = try {
        val today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
        val pointsDelta = if (isCleanPlate) 20 else -15

        // 1. Log the scan record
        val logId = UUID.randomUUID().toString()
        firestore.collection("plate_waste_logs").document(logId).set(
            mapOf(
                "logId" to logId,
                "vid" to vid,
                "date" to today,
                "mealType" to mealType,
                "isCleanPlate" to isCleanPlate,
                "wastePercentage" to wastePercentage,
                "pointsDelta" to pointsDelta,
                "createdAt" to Timestamp.now()
            )
        ).await()

        // 2. Adjust student's greenPoints in users collection
        if (uid.isNotBlank()) {
            val userRef = firestore.collection("users").document(uid)
            val userSnap = userRef.get().await()
            val currentPoints = userSnap.getLong("greenPoints")?.toInt() ?: 0
            val updatedPoints = (currentPoints + pointsDelta).coerceAtLeast(0)
            userRef.update("greenPoints", updatedPoints).await()
            Result.success(updatedPoints)
        } else {
            Result.success(pointsDelta)
        }
    } catch (e: Exception) {
        Result.failure(e)
    }

    // ── 2. Health Issues & Sick Meals ────────────────────────────────────────
    suspend fun submitSickMealRequest(request: SickMealRequest): Result<Unit> = try {
        val docId = UUID.randomUUID().toString()
        firestore.collection("sick_meal_requests").document(docId).set(
            mapOf(
                "requestId" to docId,
                "vid" to request.vid,
                "studentName" to request.studentName,
                "hostelBlock" to request.hostelBlock,
                "roomNo" to request.roomNo,
                "mealType" to request.mealType,
                "dietPreference" to request.dietPreference,
                "symptoms" to request.symptoms,
                "deliveryType" to request.deliveryType,
                "status" to "REQUESTED",
                "createdAt" to Timestamp.now()
            )
        ).await()
        Result.success(Unit)
    } catch (e: Exception) {
        Result.failure(e)
    }

    // ── 3. Special Lunch Facility ───────────────────────────────────────────
    fun observeSpecialLunches(): Flow<List<SpecialLunchEvent>> = callbackFlow {
        val listener = firestore.collection("special_events")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(emptyList())
                    return@addSnapshotListener
                }
                val events = snapshot?.documents?.mapNotNull { doc ->
                    SpecialLunchEvent(
                        id = doc.id,
                        title = doc.getString("title") ?: "",
                        date = doc.getString("date") ?: "",
                        mealType = doc.getString("mealType") ?: "LUNCH",
                        description = doc.getString("description") ?: "",
                        menuItems = (doc.get("menuItems") as? List<*>)?.mapNotNull { it?.toString() } ?: emptyList(),
                        maxSlots = doc.getLong("maxSlots")?.toInt() ?: 100,
                        bookedCount = doc.getLong("bookedCount")?.toInt() ?: 0,
                        tokenPrice = doc.getLong("tokenPrice")?.toInt() ?: 0
                    )
                } ?: emptyList()
                trySend(events)
            }
        awaitClose { listener.remove() }
    }

    suspend fun bookSpecialLunch(
        eventId: String,
        vid: String,
        studentName: String
    ): Result<Unit> = try {
        val bookingRef = firestore.collection("special_events").document(eventId)
            .collection("bookings").document(vid)

        bookingRef.set(
            mapOf(
                "vid" to vid,
                "studentName" to studentName,
                "createdAt" to Timestamp.now()
            )
        ).await()

        firestore.collection("special_events").document(eventId).update(
            "bookedCount", FieldValue.increment(1)
        ).await()

        Result.success(Unit)
    } catch (e: Exception) {
        Result.failure(e)
    }

    // ── 4. QR Gate Entry & Automated Check-in ────────────────────────────────
    suspend fun recordGateCheckin(vid: String, mealType: String, gateId: String): Result<Unit> = try {
        val today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
        val docId = UUID.randomUUID().toString()

        firestore.collection("mess_checkins").document(docId).set(
            mapOf(
                "id" to docId,
                "vid" to vid,
                "date" to today,
                "mealType" to mealType,
                "gateId" to gateId,
                "timestamp" to Timestamp.now()
            )
        ).await()
        Result.success(Unit)
    } catch (e: Exception) {
        Result.failure(e)
    }

    // ── 5. Student Password Reset Request to Admin ───────────────────────────
    suspend fun requestPasswordReset(
        vid: String,
        email: String,
        hostelBlock: String,
        roomNo: String,
        reason: String
    ): Result<Unit> = try {
        val docId = UUID.randomUUID().toString()
        firestore.collection("password_reset_requests").document(docId).set(
            mapOf(
                "id" to docId,
                "vid" to vid,
                "email" to email,
                "hostelBlock" to hostelBlock,
                "roomNo" to roomNo,
                "reason" to reason,
                "status" to "PENDING",
                "createdAt" to Timestamp.now()
            )
        ).await()
        Result.success(Unit)
    } catch (e: Exception) {
        Result.failure(e)
    }

    // ── 6. Food Quality Feedback & Hostel Handover ───────────────────────────
    suspend fun submitMealFeedback(feedback: MealFeedback): Result<Unit> = try {
        val docId = UUID.randomUUID().toString()
        firestore.collection("meal_feedback").document(docId).set(
            mapOf(
                "id" to docId,
                "vid" to feedback.vid,
                "date" to feedback.date,
                "mealType" to feedback.mealType,
                "rating" to feedback.rating,
                "complaintTags" to feedback.complaintTags,
                "comments" to feedback.comments,
                "createdAt" to Timestamp.now()
            )
        ).await()
        Result.success(Unit)
    } catch (e: Exception) {
        Result.failure(e)
    }

    fun observeHostelTeamTakeover(date: String): Flow<Boolean> = callbackFlow {
        val listener = firestore.collection("mess_operations_status").document(date)
            .addSnapshotListener { snapshot, _ ->
                val isTakeover = snapshot?.getBoolean("hostelTeamTakeover") ?: false
                trySend(isTakeover)
            }
        awaitClose { listener.remove() }
    }

    // ── 7. Advance 1-Day Holiday Rebate Application ──────────────────────────
    suspend fun applyHolidayRebate(rebate: HolidayRebate): Result<Unit> {
        return try {
            // Enforce 1-day advance requirement
            val today = LocalDate.now()
            val start = LocalDate.parse(rebate.startDate)
            if (!start.isAfter(today)) {
                return Result.failure(Exception("Advance notice required! Must apply at least 1 day before departure."))
            }

            val docId = UUID.randomUUID().toString()
            firestore.collection("holiday_rebates").document(docId).set(
                mapOf(
                    "rebateId" to docId,
                    "vid" to rebate.vid,
                    "startDate" to rebate.startDate,
                    "endDate" to rebate.endDate,
                    "daysCount" to rebate.daysCount,
                    "reason" to rebate.reason,
                    "status" to "PENDING",
                    "isAdvanceNoticeGiven" to true,
                    "createdAt" to Timestamp.now()
                )
            ).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // ── 8. Technical Complaint Box ───────────────────────────────────────────
    suspend fun submitTechnicalComplaint(complaint: TechnicalComplaint): Result<Unit> = try {
        val docId = UUID.randomUUID().toString()
        firestore.collection("technical_complaints").document(docId).set(
            mapOf(
                "ticketId" to docId,
                "vid" to complaint.vid,
                "title" to complaint.title,
                "category" to complaint.category,
                "description" to complaint.description,
                "status" to "OPEN",
                "createdAt" to Timestamp.now()
            )
        ).await()
        Result.success(Unit)
    } catch (e: Exception) {
        Result.failure(e)
    }
}
