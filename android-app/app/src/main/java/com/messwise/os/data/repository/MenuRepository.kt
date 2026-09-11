package com.messwise.os.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.messwise.os.data.model.FoodItem
import com.messwise.os.data.model.MealType
import com.messwise.os.data.model.MessMenu
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for mess menu data from Firestore `mess_menu` collection.
 * Provides real-time Flow-based observation of daily menus.
 */
@Singleton
class MenuRepository @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    /**
     * Observe all menus for a given date in real-time.
     * Returns a Flow of list of [MessMenu] for all meal types on that date.
     *
     * @param date ISO date string, e.g., "2026-09-11"
     */
    fun observeMenusForDate(date: String): Flow<List<MessMenu>> = callbackFlow {
        val listener = firestore.collection("mess_menu")
            .whereEqualTo("date", date)
            .addSnapshotListener { snapshots, error ->
                if (error != null) {
                    trySend(emptyList())
                    return@addSnapshotListener
                }

                val menus = snapshots?.documents?.mapNotNull { doc ->
                    try {
                        val items = (doc.get("items") as? List<*>)?.mapNotNull { item ->
                            val map = item as? Map<*, *> ?: return@mapNotNull null
                            FoodItem(
                                name = map["name"] as? String ?: "",
                                calories = (map["calories"] as? Long)?.toInt() ?: 0,
                                allergens = (map["allergens"] as? List<*>)
                                    ?.filterIsInstance<String>() ?: emptyList(),
                                tags = (map["tags"] as? List<*>)
                                    ?.filterIsInstance<String>() ?: emptyList()
                            )
                        } ?: emptyList()

                        MessMenu(
                            date = doc.getString("date") ?: date,
                            mealType = MealType.fromString(doc.getString("mealType") ?: "LUNCH"),
                            items = items,
                            servingTime = doc.getString("servingTime") ?: ""
                        )
                    } catch (_: Exception) {
                        null
                    }
                } ?: emptyList()

                trySend(menus.sortedBy { it.mealType.ordinal })
            }

        awaitClose { listener.remove() }
    }

    /**
     * Observe a specific meal menu for a date and meal type.
     *
     * @param date ISO date string
     * @param mealType the meal type to observe
     */
    fun observeMenu(date: String, mealType: MealType): Flow<MessMenu?> = callbackFlow {
        val docId = "${date}_${mealType.name}"
        val listener = firestore.collection("mess_menu").document(docId)
            .addSnapshotListener { snapshot, error ->
                if (error != null || snapshot == null || !snapshot.exists()) {
                    trySend(null)
                    return@addSnapshotListener
                }

                try {
                    val items = (snapshot.get("items") as? List<*>)?.mapNotNull { item ->
                        val map = item as? Map<*, *> ?: return@mapNotNull null
                        FoodItem(
                            name = map["name"] as? String ?: "",
                            calories = (map["calories"] as? Long)?.toInt() ?: 0,
                            allergens = (map["allergens"] as? List<*>)
                                ?.filterIsInstance<String>() ?: emptyList(),
                            tags = (map["tags"] as? List<*>)
                                ?.filterIsInstance<String>() ?: emptyList()
                        )
                    } ?: emptyList()

                    trySend(
                        MessMenu(
                            date = snapshot.getString("date") ?: date,
                            mealType = mealType,
                            items = items,
                            servingTime = snapshot.getString("servingTime") ?: ""
                        )
                    )
                } catch (_: Exception) {
                    trySend(null)
                }
            }

        awaitClose { listener.remove() }
    }
}
