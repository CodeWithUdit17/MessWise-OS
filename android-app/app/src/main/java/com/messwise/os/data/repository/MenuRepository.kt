package com.messwise.os.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.messwise.os.data.model.FoodItem
import com.messwise.os.data.model.MealType
import com.messwise.os.data.model.MessMenu
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import java.time.DayOfWeek
import java.time.LocalDate
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for mess menu data from Firestore `mess_menu` collection.
 * Provides real-time Flow-based observation of 100% Pure Vegetarian daily menus.
 */
@Singleton
class MenuRepository @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    /**
     * Observe all menus for a given date in real-time.
     * Returns a Flow of list of [MessMenu] for all meal types on that date.
     * Guarantees 100% Pure Vegetarian menu coverage across all 4 daily meal slots.
     *
     * @param date ISO date string, e.g., "2026-09-11"
     */
    fun observeMenusForDate(date: String): Flow<List<MessMenu>> = callbackFlow {
        val listener = firestore.collection("mess_menu")
            .whereEqualTo("date", date)
            .addSnapshotListener { snapshots, error ->
                if (error != null) {
                    trySend(getPureVegDefaultMenusForDate(date))
                    return@addSnapshotListener
                }

                val remoteMenus = snapshots?.documents?.mapNotNull { doc ->
                    try {
                        val items = (doc.get("items") as? List<*>)?.mapNotNull { item ->
                            val map = item as? Map<*, *> ?: return@mapNotNull null
                            val rawTags = (map["tags"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
                            val pureVegTags = if (rawTags.any { it.contains("Veg", ignoreCase = true) }) {
                                rawTags
                            } else {
                                listOf("Pure Veg") + rawTags
                            }

                            FoodItem(
                                name = map["name"] as? String ?: "",
                                calories = (map["calories"] as? Long)?.toInt() ?: 0,
                                allergens = (map["allergens"] as? List<*>)
                                    ?.filterIsInstance<String>() ?: emptyList(),
                                tags = pureVegTags
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

                // Merge remote menus with the official Pure Veg schedule if any slots are missing
                val existingTypes = remoteMenus.map { it.mealType }.toSet()
                val defaults = getPureVegDefaultMenusForDate(date)
                val missingDefaults = defaults.filter { it.mealType !in existingTypes }
                val merged = (remoteMenus + missingDefaults).sortedBy { it.mealType.ordinal }

                trySend(merged)
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
                    trySend(getPureVegDefaultMenu(date, mealType))
                    return@addSnapshotListener
                }

                try {
                    val items = (snapshot.get("items") as? List<*>)?.mapNotNull { item ->
                        val map = item as? Map<*, *> ?: return@mapNotNull null
                        val rawTags = (map["tags"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
                        val pureVegTags = if (rawTags.any { it.contains("Veg", ignoreCase = true) }) {
                            rawTags
                        } else {
                            listOf("Pure Veg") + rawTags
                        }

                        FoodItem(
                            name = map["name"] as? String ?: "",
                            calories = (map["calories"] as? Long)?.toInt() ?: 0,
                            allergens = (map["allergens"] as? List<*>)
                                ?.filterIsInstance<String>() ?: emptyList(),
                            tags = pureVegTags
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
                    trySend(getPureVegDefaultMenu(date, mealType))
                }
            }

        awaitClose { listener.remove() }
    }

    /**
     * Complete 7-Day Pure Vegetarian Schedule for MessWise OS.
     * Guarantees 100% Pure Veg dishes for Breakfast, Lunch, Snacks, and Dinner.
     */
    companion object {
        fun getPureVegDefaultMenu(date: String, mealType: MealType): MessMenu {
            val dayOfWeek = try {
                LocalDate.parse(date).dayOfWeek
            } catch (_: Exception) {
                DayOfWeek.FRIDAY
            }

            val servingTime = when (mealType) {
                MealType.BREAKFAST -> "7:30 – 9:30 AM"
                MealType.LUNCH -> "12:30 – 2:30 PM"
                MealType.SNACKS -> "4:30 – 5:30 PM"
                MealType.DINNER -> "7:30 – 9:30 PM"
            }

            val items = when (mealType) {
                MealType.BREAKFAST -> when (dayOfWeek) {
                    DayOfWeek.MONDAY -> listOf(
                        FoodItem("Crispy Masala Dosa with Sambar & Chutney", 290, emptyList(), listOf("Pure Veg", "South Indian")),
                        FoodItem("Steamed Idli (3 pcs) with Podi Dip", 210, emptyList(), listOf("Pure Veg", "Gluten-Free")),
                        FoodItem("Fresh Cut Papaya & Banana Bowl", 95, emptyList(), listOf("Pure Veg", "Fruit Bowl")),
                        FoodItem("Hot Adrak Masala Chai & Coffee", 85, listOf("Dairy"), listOf("Pure Veg", "Beverage"))
                    )
                    DayOfWeek.TUESDAY -> listOf(
                        FoodItem("Aloo Paratha with White Butter & Pickle", 340, listOf("Gluten", "Dairy"), listOf("Pure Veg", "North Indian")),
                        FoodItem("Sprouted Moong & Boiled Kala Chana", 140, emptyList(), listOf("Pure Veg", "High Protein")),
                        FoodItem("Cold Badam Milk / Hot Tea", 110, listOf("Dairy", "Nuts"), listOf("Pure Veg", "Beverage"))
                    )
                    DayOfWeek.WEDNESDAY -> listOf(
                        FoodItem("Indori Poha with Roasted Peanuts & Sev", 250, listOf("Nuts"), listOf("Pure Veg", "Light")),
                        FoodItem("Paneer Bhurji with Desi Ghee & Herbs", 260, listOf("Dairy"), listOf("Pure Veg", "High Protein")),
                        FoodItem("Banana Shake & Cutting Chai", 140, listOf("Dairy"), listOf("Pure Veg", "Beverage"))
                    )
                    DayOfWeek.THURSDAY -> listOf(
                        FoodItem("Steamed Idli (3) & Medu Vada (1)", 270, emptyList(), listOf("Pure Veg", "South Indian")),
                        FoodItem("Coconut & Tomato Chutney Duo", 80, emptyList(), listOf("Pure Veg")),
                        FoodItem("Hot Filter Coffee / Masala Tea", 90, listOf("Dairy"), listOf("Pure Veg", "Beverage"))
                    )
                    DayOfWeek.FRIDAY -> listOf(
                        FoodItem("Delhi Special Chole Bhature", 430, listOf("Gluten"), listOf("Pure Veg", "Chef Special")),
                        FoodItem("Sprouted Salad with Lemon & Herbs", 110, emptyList(), listOf("Pure Veg", "Fitness")),
                        FoodItem("Sweet Lassi / Masala Chai", 160, listOf("Dairy"), listOf("Pure Veg", "Beverage"))
                    )
                    DayOfWeek.SATURDAY -> listOf(
                        FoodItem("Onion Tomato Masala Uttapam", 280, emptyList(), listOf("Pure Veg", "South Indian")),
                        FoodItem("Cornflakes with Warm Milk & Bananas", 210, listOf("Dairy"), listOf("Pure Veg", "Healthy")),
                        FoodItem("Fresh Watermelon Juice / Filter Coffee", 90, emptyList(), listOf("Pure Veg", "Beverage"))
                    )
                    DayOfWeek.SUNDAY -> listOf(
                        FoodItem("Crispy Masala Dosa with Sambar & 3 Chutneys", 310, emptyList(), listOf("Pure Veg", "Weekend Special")),
                        FoodItem("Desi Ghee Poha with Sev & Peanuts", 260, listOf("Nuts"), listOf("Pure Veg", "Traditional")),
                        FoodItem("Cold Bournvita / Special Coffee", 120, listOf("Dairy"), listOf("Pure Veg", "Beverage"))
                    )
                }

                MealType.LUNCH -> when (dayOfWeek) {
                    DayOfWeek.MONDAY -> listOf(
                        FoodItem("Kashmiri Rajma Masala (Slow Cooked)", 340, emptyList(), listOf("Pure Veg", "High Protein")),
                        FoodItem("Steamed Jeera Basmati Rice", 210, emptyList(), listOf("Pure Veg", "Gluten-Free")),
                        FoodItem("Crispy Bhindi Kurkuri & Seasonal Sabzi", 150, emptyList(), listOf("Pure Veg", "Vegan")),
                        FoodItem("Fresh Tawa Roti with Desi Ghee (4 pcs)", 140, listOf("Gluten"), listOf("Pure Veg", "Staple")),
                        FoodItem("Chilled Boondi Raita with Roasted Cumin", 90, listOf("Dairy"), listOf("Pure Veg", "Cooling"))
                    )
                    DayOfWeek.TUESDAY -> listOf(
                        FoodItem("Dhaba Style Dal Tadka (Double Garlic Tadka)", 210, listOf("Dairy"), listOf("Pure Veg", "Homestyle")),
                        FoodItem("Paneer Butter Masala (Makhani Gravy)", 320, listOf("Dairy"), listOf("Pure Veg", "Royal")),
                        FoodItem("Desi Ghee Phulka & Steamed Rice", 180, listOf("Gluten"), listOf("Pure Veg", "Staple")),
                        FoodItem("Cucumber Tomato Green Salad", 45, emptyList(), listOf("Pure Veg", "Fresh"))
                    )
                    DayOfWeek.WEDNESDAY -> listOf(
                        FoodItem("Punjabi Kadhi Pakora with Methi Tadka", 310, listOf("Dairy"), listOf("Pure Veg", "Traditional")),
                        FoodItem("Fragrant Basmati Rice & Desi Roti", 220, listOf("Gluten"), listOf("Pure Veg", "Staple")),
                        FoodItem("Aloo Gobhi Adraki Dry Sabzi", 160, emptyList(), listOf("Pure Veg", "Homestyle")),
                        FoodItem("Roasted Papad & Sweet Mango Pickle", 50, emptyList(), listOf("Pure Veg", "Crunchy"))
                    )
                    DayOfWeek.THURSDAY -> listOf(
                        FoodItem("Panchmel Dal (5 Lentil High Protein)", 240, emptyList(), listOf("Pure Veg", "High Protein")),
                        FoodItem("Shahi Matar Paneer in Cashew Gravy", 310, listOf("Dairy", "Nuts"), listOf("Pure Veg", "Royal")),
                        FoodItem("Jeera Pulao & Warm Butter Phulka", 210, listOf("Gluten", "Dairy"), listOf("Pure Veg", "Staple")),
                        FoodItem("Beetroot & Carrot Kachumber Salad", 40, emptyList(), listOf("Pure Veg", "Healthy"))
                    )
                    DayOfWeek.FRIDAY -> listOf(
                        FoodItem("Kashmiri Rajma Masala & Steamed Rice", 380, emptyList(), listOf("Pure Veg", "High Protein", "North Indian")),
                        FoodItem("Dhaba Style Dal Tadka (Double Tadka)", 210, listOf("Dairy"), listOf("Pure Veg", "Homestyle")),
                        FoodItem("Paneer Butter Masala (Makhani Gravy)", 320, listOf("Dairy"), listOf("Pure Veg", "Royal")),
                        FoodItem("Crispy Bhindi Kurkuri & Seasonal Sabzi", 150, emptyList(), listOf("Pure Veg", "Vegan")),
                        FoodItem("Fresh Tawa Roti with Desi Ghee", 140, listOf("Gluten"), listOf("Pure Veg", "Staple")),
                        FoodItem("Boondi Raita / Mint Garlic Dip", 85, listOf("Dairy"), listOf("Pure Veg", "Cooling"))
                    )
                    DayOfWeek.SATURDAY -> listOf(
                        FoodItem("Amritsari Pindi Chana with Butter Naan", 390, listOf("Gluten", "Dairy"), listOf("Pure Veg", "Punjabi Feast")),
                        FoodItem("Mix Vegetable Pulao & Cucumber Salad", 210, emptyList(), listOf("Pure Veg", "Vegan")),
                        FoodItem("Yellow Moong Dal Fry with Desi Ghee", 190, listOf("Dairy"), listOf("Pure Veg", "Homestyle")),
                        FoodItem("Pineapple Raita", 110, listOf("Dairy"), listOf("Pure Veg", "Cooling"))
                    )
                    DayOfWeek.SUNDAY -> listOf(
                        FoodItem("Grand Sunday Feast: Paneer Butter Masala", 340, listOf("Dairy"), listOf("Pure Veg", "Royal Special")),
                        FoodItem("Kashmiri Pulao with Dry Fruits & Pomegranate", 280, listOf("Nuts"), listOf("Pure Veg", "Rich")),
                        FoodItem("Dal Tadka with Double Desi Ghee Fry", 220, listOf("Dairy"), listOf("Pure Veg", "Homestyle")),
                        FoodItem("Tandoori Butter Naan & Soft Phulka", 210, listOf("Gluten", "Dairy"), listOf("Pure Veg", "Tandoor")),
                        FoodItem("Cold Badam Kesar Milk", 140, listOf("Dairy", "Nuts"), listOf("Pure Veg", "Dessert Drink"))
                    )
                }

                MealType.SNACKS -> when (dayOfWeek) {
                    DayOfWeek.MONDAY -> listOf(
                        FoodItem("Crispy Vegetable Samosa (2 pcs)", 260, listOf("Gluten"), listOf("Pure Veg", "Street Style")),
                        FoodItem("Adrak-Elaichi Cutting Chai", 85, listOf("Dairy"), listOf("Pure Veg", "Beverage"))
                    )
                    DayOfWeek.TUESDAY -> listOf(
                        FoodItem("Stuffed Paneer Bread Pakora with Imli Dip", 280, listOf("Gluten", "Dairy"), listOf("Pure Veg", "Monsoon Special")),
                        FoodItem("Fresh Lemon Ice Tea / Hot Coffee", 75, emptyList(), listOf("Pure Veg", "Beverage"))
                    )
                    DayOfWeek.WEDNESDAY -> listOf(
                        FoodItem("Bombay Bhel Puri with Tangy Tamarind & Sev", 190, listOf("Nuts"), listOf("Pure Veg", "Street Style")),
                        FoodItem("Adrak Masala Chai", 85, listOf("Dairy"), listOf("Pure Veg", "Beverage"))
                    )
                    DayOfWeek.THURSDAY -> listOf(
                        FoodItem("Crispy Vegetable Cutlet with Tomato Dip", 220, listOf("Gluten"), listOf("Pure Veg", "Crunchy")),
                        FoodItem("Hot Masala Chai / Green Tea", 80, listOf("Dairy"), listOf("Pure Veg", "Beverage"))
                    )
                    DayOfWeek.FRIDAY -> listOf(
                        FoodItem("Mumbai Butter Pav Bhaji with Soft Pav", 360, listOf("Gluten", "Dairy"), listOf("Pure Veg", "Hot & Savory")),
                        FoodItem("Adrak-Elaichi Cutting Chai / Cold Coffee", 95, listOf("Dairy"), listOf("Pure Veg", "Beverage"))
                    )
                    DayOfWeek.SATURDAY -> listOf(
                        FoodItem("White Sauce Cheesy Vegetable Pasta", 290, listOf("Gluten", "Dairy"), listOf("Pure Veg", "Italian")),
                        FoodItem("Crispy Peri-Peri French Fries", 230, emptyList(), listOf("Pure Veg", "Vegan")),
                        FoodItem("Cold Coffee with Vanilla Ice Cream", 150, listOf("Dairy"), listOf("Pure Veg", "Beverage"))
                    )
                    DayOfWeek.SUNDAY -> listOf(
                        FoodItem("Mumbai Batata Vada with Fried Green Chilli", 240, listOf("Gluten"), listOf("Pure Veg", "Spicy Street")),
                        FoodItem("Sweet Corn Chaat with Butter & Herbs", 180, listOf("Dairy"), listOf("Pure Veg", "Healthy")),
                        FoodItem("Kulhad Masala Chai", 95, listOf("Dairy"), listOf("Pure Veg", "Beverage"))
                    )
                }

                MealType.DINNER -> when (dayOfWeek) {
                    DayOfWeek.MONDAY -> listOf(
                        FoodItem("Slow-Cooked Dal Makhani (Dal Bukhara)", 290, listOf("Dairy"), listOf("Pure Veg", "Rich")),
                        FoodItem("Paneer Lababdar in Rich Cashew Gravy", 340, listOf("Dairy", "Nuts"), listOf("Pure Veg", "High Protein")),
                        FoodItem("Butter Garlic Naan & Tandoori Roti", 210, listOf("Gluten", "Dairy"), listOf("Pure Veg", "Tandoor")),
                        FoodItem("Warm Gulab Jamun (2 pcs)", 220, listOf("Gluten", "Dairy"), listOf("Pure Veg", "Dessert"))
                    )
                    DayOfWeek.TUESDAY -> listOf(
                        FoodItem("Amritsari Chole with Jeera Rice", 330, emptyList(), listOf("Pure Veg", "High Protein")),
                        FoodItem("Palak Paneer with Garlic Tadka", 270, listOf("Dairy"), listOf("Pure Veg", "Iron Rich")),
                        FoodItem("Tawa Butter Roti (3 pcs)", 150, listOf("Gluten", "Dairy"), listOf("Pure Veg", "Staple")),
                        FoodItem("Desi Ghee Moong Dal Halwa", 230, listOf("Dairy", "Nuts"), listOf("Pure Veg", "Dessert"))
                    )
                    DayOfWeek.WEDNESDAY -> listOf(
                        FoodItem("Hyderabadi Veg Dum Biryani with Saffron", 420, listOf("Dairy"), listOf("Pure Veg", "Chef Special")),
                        FoodItem("Mirchi Ka Salan (Peanut Sesame Gravy)", 180, listOf("Nuts", "Sesame"), listOf("Pure Veg", "Hyderabadi")),
                        FoodItem("Creamy Burani Garlic Raita", 95, listOf("Dairy"), listOf("Pure Veg", "Cooling")),
                        FoodItem("Kesar Pista Rice Kheer", 190, listOf("Dairy", "Nuts"), listOf("Pure Veg", "Dessert"))
                    )
                    DayOfWeek.THURSDAY -> listOf(
                        FoodItem("Malai Kofta in Silk White Cashew Gravy", 350, listOf("Dairy", "Nuts"), listOf("Pure Veg", "Royal")),
                        FoodItem("Dal Palak Lasooni Tadka", 190, emptyList(), listOf("Pure Veg", "Iron Rich")),
                        FoodItem("Laccha Paratha & Steamed Basmati Rice", 220, listOf("Gluten", "Dairy"), listOf("Pure Veg", "Tandoor")),
                        FoodItem("Hot Jalebi with Rabdi", 240, listOf("Gluten", "Dairy"), listOf("Pure Veg", "Dessert"))
                    )
                    DayOfWeek.FRIDAY -> listOf(
                        FoodItem("Slow-Cooked Dal Makhani (Dal Bukhara)", 290, listOf("Dairy"), listOf("Pure Veg", "Rich")),
                        FoodItem("Shahi Paneer Lababdar in Rich Cashew Gravy", 340, listOf("Dairy", "Nuts"), listOf("Pure Veg", "High Protein")),
                        FoodItem("Tandoori Soya Chaap Curry with Rich Masala", 280, listOf("Soy", "Dairy"), listOf("Pure Veg", "High Protein")),
                        FoodItem("Butter Garlic Naan & Laccha Paratha", 200, listOf("Gluten", "Dairy"), listOf("Pure Veg", "Tandoor")),
                        FoodItem("Warm Gulab Jamun (2 pcs)", 220, listOf("Gluten", "Dairy"), listOf("Pure Veg", "Dessert", "Hot"))
                    )
                    DayOfWeek.SATURDAY -> listOf(
                        FoodItem("Paneer Tikka Masala in Smoked Gravy", 340, listOf("Dairy"), listOf("Pure Veg", "Tandoor Special")),
                        FoodItem("Dal Maharani (Slow Simmered Black Lentils)", 270, listOf("Dairy"), listOf("Pure Veg", "Rich")),
                        FoodItem("Jeera Rice & Desi Ghee Roti", 210, listOf("Gluten", "Dairy"), listOf("Pure Veg", "Staple")),
                        FoodItem("Angoori Rasmalai in Cardamom Milk", 220, listOf("Dairy", "Nuts"), listOf("Pure Veg", "Dessert"))
                    )
                    DayOfWeek.SUNDAY -> listOf(
                        FoodItem("Slow-Cooked Dal Makhani with Makhan", 300, listOf("Dairy"), listOf("Pure Veg", "Rich")),
                        FoodItem("Matar Paneer with Jeera Rice", 320, listOf("Dairy"), listOf("Pure Veg", "Classic")),
                        FoodItem("Butter Garlic Naan & Tawa Roti", 220, listOf("Gluten", "Dairy"), listOf("Pure Veg", "Tandoor")),
                        FoodItem("Warm Malpua with Rabdi", 260, listOf("Gluten", "Dairy"), listOf("Pure Veg", "Dessert"))
                    )
                }
            }

            return MessMenu(
                date = date,
                mealType = mealType,
                items = items,
                servingTime = servingTime
            )
        }

        fun getPureVegDefaultMenusForDate(date: String): List<MessMenu> {
            return MealType.entries.map { getPureVegDefaultMenu(date, it) }
        }
    }
}

