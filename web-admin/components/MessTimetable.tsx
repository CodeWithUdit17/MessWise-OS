"use client";

import { useState } from "react";
import {
  Calendar,
  Sparkles,
  Clock,
  Utensils,
  Flame,
  Check,
  Shuffle,
  ChevronRight,
  AlertCircle,
  Loader2,
  Tag,
  ChefHat
} from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ── Types ──────────────────────────────────────────────────────────────────

export interface FoodItem {
  name: string;
  calories: number;
  allergens: string[];
  tags: string[];
}

export interface MessMenu {
  id: string;
  date: string;
  mealType: "BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER" | string;
  items: FoodItem[];
  servingTime: string;
  dayOfWeek?: string;
}

interface MessTimetableProps {
  menus: MessMenu[];
  onSelectMealForEdit?: (date: string, mealType: string) => void;
  onRefresh?: () => void;
}

// ── Constants & Dish Pool for Random Generation ─────────────────────────────

const DAYS_OF_WEEK = [
  { day: "Monday", short: "Mon", offset: -4 },
  { day: "Tuesday", short: "Tue", offset: -3 },
  { day: "Wednesday", short: "Wed", offset: -2 },
  { day: "Thursday", short: "Thu", offset: -1 },
  { day: "Friday", short: "Fri", offset: 0, isToday: true },
  { day: "Saturday", short: "Sat", offset: 1 },
  { day: "Sunday", short: "Sun", offset: 2 }
];

const MEALS_CONFIG = [
  { type: "BREAKFAST", label: "Breakfast", emoji: "🌅", time: "7:30 – 9:30 AM", color: "from-amber-500/10 to-orange-500/5 text-amber-800 border-amber-200" },
  { type: "LUNCH", label: "Lunch", emoji: "☀️", time: "12:30 – 2:30 PM", color: "from-emerald-500/10 to-teal-500/5 text-emerald-800 border-emerald-200" },
  { type: "SNACKS", label: "High Tea & Snacks", emoji: "🍪", time: "4:30 – 5:30 PM", color: "from-blue-500/10 to-indigo-500/5 text-blue-800 border-blue-200" },
  { type: "DINNER", label: "Dinner", emoji: "🌙", time: "7:30 – 9:30 PM", color: "from-purple-500/10 to-pink-500/5 text-purple-800 border-purple-200" }
];

const RANDOM_DISH_POOL = {
  BREAKFAST: [
    { name: "Aloo Paratha with Fresh Curd & Pickle", calories: 340, allergens: ["Gluten", "Dairy"], tags: ["North Indian", "Favorite"] },
    { name: "Crispy Masala Dosa with Sambar", calories: 290, allergens: [], tags: ["South Indian", "Vegan"] },
    { name: "Steamed Idli (3) with Medu Vada (1)", calories: 270, allergens: [], tags: ["South Indian", "Gluten-Free"] },
    { name: "Indori Poha with Roasted Peanuts & Sev", calories: 250, allergens: ["Nuts"], tags: ["Light", "Vegan"] },
    { name: "Delhi Special Chole Bhature", calories: 430, allergens: ["Gluten"], tags: ["Chef Special", "Weekend"] },
    { name: "Mumbai Butter Pav Bhaji", calories: 360, allergens: ["Gluten", "Dairy"], tags: ["Hot", "Savory"] },
    { name: "Onion Tomato Masala Uttapam", calories: 280, allergens: [], tags: ["South Indian"] },
    { name: "Sprouted Moong & Boiled Kala Chana", calories: 140, allergens: [], tags: ["High Protein", "Fitness"] },
    { name: "Boiled Eggs with Cracked Pepper", calories: 140, allergens: ["Egg"], tags: ["High Protein"] },
    { name: "Cornflakes with Warm Milk & Bananas", calories: 210, allergens: ["Dairy"], tags: ["Quick & Healthy"] },
    { name: "Cutting Masala Chai & Filter Coffee", calories: 85, allergens: ["Dairy"], tags: ["Beverage"] }
  ],
  LUNCH: [
    { name: "Kashmiri Rajma Masala & Steamed Rice", calories: 380, allergens: [], tags: ["North Indian", "High Protein"] },
    { name: "Dhaba Style Dal Tadka (Double Tadka)", calories: 210, allergens: ["Dairy"], tags: ["Vegetarian"] },
    { name: "Paneer Butter Masala (Makhani Gravy)", calories: 320, allergens: ["Dairy"], tags: ["Royal", "Vegetarian"] },
    { name: "Punjabi Kadhi Pakora with Basmati Rice", calories: 360, allergens: ["Dairy"], tags: ["Traditional"] },
    { name: "Hyderabadi Dum Biryani with Burani Raita", calories: 420, allergens: ["Dairy"], tags: ["Chef Special", "Aromatic"] },
    { name: "Amritsari Pindi Chana with Butter Naan", calories: 390, allergens: ["Gluten", "Dairy"], tags: ["Punjabi Feast"] },
    { name: "Crispy Bhindi Kurkuri & Seasonal Sabzi", calories: 150, allergens: [], tags: ["Vegan"] },
    { name: "Fresh Tawa Roti with Desi Ghee", calories: 140, allergens: ["Gluten"], tags: ["Staple"] },
    { name: "Mix Vegetable Pulao & Cucumber Salad", calories: 210, allergens: [], tags: ["Vegan"] },
    { name: "Boondi Raita / Mint Garlic Dip", calories: 85, allergens: ["Dairy"], tags: ["Cooling"] }
  ],
  SNACKS: [
    { name: "Crispy Vegetable Samosa (2 pcs)", calories: 260, allergens: ["Gluten"], tags: ["Crispy", "Street Style"] },
    { name: "Bombay Bhel Puri with Tangy Tamarind", calories: 190, allergens: ["Nuts"], tags: ["Tangy", "Light"] },
    { name: "Stuffed Paneer Bread Pakora", calories: 280, allergens: ["Gluten", "Dairy"], tags: ["Monsoon Special"] },
    { name: "Crispy Vegetable Cutlet with Dip", calories: 220, allergens: ["Gluten"], tags: ["Vegan", "Crunchy"] },
    { name: "Mumbai Batata Vada with Fried Chilli", calories: 240, allergens: ["Gluten"], tags: ["Spicy"] },
    { name: "White Sauce Cheesy Vegetable Pasta", calories: 290, allergens: ["Gluten", "Dairy"], tags: ["Italian"] },
    { name: "Crispy Peri-Peri French Fries", calories: 230, allergens: [], tags: ["Vegan"] },
    { name: "Adrak-Elaichi Cutting Chai / Cold Coffee", calories: 95, allergens: ["Dairy"], tags: ["Beverage"] }
  ],
  DINNER: [
    { name: "Slow-Cooked Dal Makhani (Dal Bukhara)", calories: 290, allergens: ["Dairy"], tags: ["Rich", "Slow Cooked"] },
    { name: "Paneer Lababdar / Butter Chicken", calories: 340, allergens: ["Dairy", "Nuts"], tags: ["High Protein", "Chef Special"] },
    { name: "Tandoori Soya Chaap Curry", calories: 280, allergens: ["Soy", "Dairy"], tags: ["High Protein"] },
    { name: "Palak Paneer with Garlic Tadka", calories: 270, allergens: ["Dairy"], tags: ["Healthy", "Iron Rich"] },
    { name: "Matar Paneer with Jeera Rice", calories: 320, allergens: ["Dairy"], tags: ["Homestyle"] },
    { name: "Malai Kofta in Silk Cashew Gravy", calories: 350, allergens: ["Dairy", "Nuts"], tags: ["Special Occasion"] },
    { name: "Butter Garlic Naan & Laccha Paratha", calories: 200, allergens: ["Gluten", "Dairy"], tags: ["Tandoor"] },
    { name: "Warm Gulab Jamun (2 pcs)", calories: 220, allergens: ["Gluten", "Dairy"], tags: ["Dessert", "Hot"] },
    { name: "Desi Ghee Moong Dal Halwa", calories: 230, allergens: ["Dairy", "Nuts"], tags: ["Dessert", "Rich"] },
    { name: "Kesar Pista Rice Kheer", calories: 190, allergens: ["Dairy", "Nuts"], tags: ["Dessert", "Chilled"] }
  ]
};

function getDateString(offset: number): string {
  const base = new Date();
  base.setDate(base.getDate() + offset);
  return base.toISOString().split("T")[0];
}

export default function MessTimetable({
  menus,
  onSelectMealForEdit,
  onRefresh
}: MessTimetableProps) {
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0); // Friday (Today)
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedDayInfo = DAYS_OF_WEEK.find((d) => d.offset === selectedDayOffset) || DAYS_OF_WEEK[4];
  const selectedDate = getDateString(selectedDayOffset);

  // Filter menus for the selected date
  const dayMenus = menus.filter((m) => m.date === selectedDate);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ── Random Timetable Generator ────────────────────────────────────────────
  const generateRandomTimetable = async () => {
    setIsGenerating(true);
    try {
      let totalCreated = 0;

      for (const day of DAYS_OF_WEEK) {
        const dateStr = getDateString(day.offset);

        for (const meal of MEALS_CONFIG) {
          const pool = RANDOM_DISH_POOL[meal.type as keyof typeof RANDOM_DISH_POOL] || [];
          
          // Randomly pick 3 to 5 dishes from pool
          const shuffled = [...pool].sort(() => 0.5 - Math.random());
          const selectedDishes = shuffled.slice(0, Math.floor(Math.random() * 2) + 3);

          const docId = `${dateStr}_${meal.type}`;
          await setDoc(doc(db, "mess_menu", docId), {
            date: dateStr,
            dayOfWeek: day.day,
            mealType: meal.type,
            servingTime: meal.time,
            items: selectedDishes
          });

          totalCreated++;
        }
      }

      showToast(`🎲 Generated and saved ${totalCreated} fresh meal menus across all 7 days!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to generate random timetable:", err);
      showToast("❌ Error generating timetable. Check permissions.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-xl animate-fade-in fixed top-5 right-5 z-50">
          <Check className="h-5 w-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Generator Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700">
            <Calendar className="h-4 w-4" />
            Official Hostel Mess Schedule
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Weekly Food Timetable
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Synchronized with Student Android App & Kitchen Prep Stations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={generateRandomTimetable}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition hover:shadow-amber-500/40 hover:brightness-105 active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shuffle className="h-4 w-4" />
            )}
            {isGenerating ? "Generating 7 Days..." : "🎲 Shuffle Random Timetable"}
          </button>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {DAYS_OF_WEEK.map((dayItem) => {
          const isSelected = selectedDayOffset === dayItem.offset;
          const dateStr = getDateString(dayItem.offset);
          const hasData = menus.some((m) => m.date === dateStr);

          return (
            <button
              key={dayItem.day}
              onClick={() => setSelectedDayOffset(dayItem.offset)}
              className={`flex-1 min-w-[110px] rounded-2xl p-3.5 text-center transition-all duration-200 border ${
                isSelected
                  ? "border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider">
                  {dayItem.short}
                </span>
                {dayItem.isToday && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[9px] font-black ${
                      isSelected
                        ? "bg-white/25 text-white"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    TODAY
                  </span>
                )}
              </div>
              <p
                className={`text-sm font-black mt-1 ${
                  isSelected ? "text-white" : "text-slate-900"
                }`}
              >
                {dayItem.day}
              </p>
              <p
                className={`text-[11px] mt-0.5 ${
                  isSelected ? "text-amber-100" : "text-slate-400"
                }`}
              >
                {dateStr}
              </p>
              <div className="mt-2 flex justify-center">
                {hasData ? (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-white" : "bg-emerald-500"
                    }`}
                  />
                ) : (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-white/40" : "bg-slate-300"
                    }`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Meals Grid for Selected Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {MEALS_CONFIG.map((mealConfig) => {
          const menuEntry = dayMenus.find((m) => m.mealType === mealConfig.type);
          const items = menuEntry?.items || [];

          return (
            <div
              key={mealConfig.type}
              className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-2xl">{mealConfig.emoji}</span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      {mealConfig.label}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {mealConfig.time}
                  </div>
                </div>

                <div className="h-px w-full bg-slate-100 mb-3" />

                {/* Dish Items List */}
                <div className="space-y-2.5">
                  {items.length === 0 ? (
                    <div className="py-8 text-center">
                      <Utensils className="mx-auto h-6 w-6 text-slate-300 mb-1" />
                      <p className="text-xs font-semibold text-slate-400">
                        No menu configured yet
                      </p>
                    </div>
                  ) : (
                    items.map((dish, i) => (
                      <div
                        key={i}
                        className="group rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 transition hover:border-amber-200 hover:bg-amber-50/30"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <p className="text-xs font-bold text-slate-800 leading-snug">
                            {dish.name}
                          </p>
                          {dish.calories > 0 && (
                            <span className="flex items-center gap-0.5 shrink-0 rounded-md bg-amber-100/70 px-1.5 py-0.5 text-[10px] font-black text-amber-800">
                              <Flame className="h-2.5 w-2.5 text-amber-600" />
                              {dish.calories}
                            </span>
                          )}
                        </div>

                        {/* Dietary Tags & Allergens */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {dish.tags?.map((t) => (
                            <span
                              key={t}
                              className="rounded-md bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 border border-slate-200"
                            >
                              {t}
                            </span>
                          ))}
                          {dish.allergens?.map((a) => (
                            <span
                              key={a}
                              className="rounded-md bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold text-red-600 border border-red-100"
                            >
                              ⚠️ {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Quick Edit Trigger */}
              {onSelectMealForEdit && (
                <button
                  onClick={() => onSelectMealForEdit(selectedDate, mealConfig.type)}
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300"
                >
                  <ChefHat className="h-3.5 w-3.5" />
                  Edit in Live Editor
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
