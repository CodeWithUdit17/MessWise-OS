package com.messwise.os.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.messwise.os.data.model.FoodItem

/**
 * A food item card showing dish name, calories, allergen warnings, and pure veg dietary tags.
 */
@Composable
fun MealCard(
    foodItem: FoodItem,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            Column(modifier = Modifier.weight(1f)) {
                // Header row with official Indian Pure Vegetarian Symbol
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    // FSSAI standard Green Veg square border with filled green circle
                    Box(
                        modifier = Modifier
                            .size(15.dp)
                            .border(1.5.dp, Color(0xFF16A34A), RoundedCornerShape(3.dp))
                            .padding(2.5.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(5.5.dp)
                                .background(Color(0xFF16A34A), CircleShape)
                        )
                    }

                    Text(
                        text = foodItem.name,
                        style = MaterialTheme.typography.bodyLarge.copy(
                            fontWeight = FontWeight.SemiBold
                        ),
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.weight(1f)
                    )
                }

                if (foodItem.calories > 0) {
                    Text(
                        text = "${foodItem.calories} kcal",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(start = 23.dp, top = 2.dp)
                    )
                }

                // Allergen warnings
                if (foodItem.allergens.isNotEmpty()) {
                    Row(
                        modifier = Modifier.padding(start = 23.dp, top = 6.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        foodItem.allergens.forEach { allergen ->
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = Color(0xFFFEE2E2)
                            ) {
                                Text(
                                    text = "⚠️ $allergen",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 10.sp
                                    ),
                                    color = Color(0xFF991B1B),
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                                )
                            }
                        }
                    }
                }

                // Dietary tags (Always ensure Pure Veg tag is shown)
                val allTags = if (foodItem.tags.any { it.contains("Veg", ignoreCase = true) }) {
                    foodItem.tags
                } else {
                    listOf("Pure Veg") + foodItem.tags
                }

                Row(
                    modifier = Modifier.padding(start = 23.dp, top = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    allTags.forEach { tag ->
                        val isVegTag = tag.contains("Veg", ignoreCase = true)
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = if (isVegTag) Color(0xFFDCFCE7) else MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.6f)
                        ) {
                            Text(
                                text = if (isVegTag && !tag.contains("🌱")) "🌱 $tag" else tag,
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontSize = 10.sp,
                                    fontWeight = if (isVegTag) FontWeight.Bold else FontWeight.Medium
                                ),
                                color = if (isVegTag) Color(0xFF15803D) else MaterialTheme.colorScheme.onPrimaryContainer,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
