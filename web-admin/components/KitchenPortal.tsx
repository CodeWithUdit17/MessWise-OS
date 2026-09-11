"use client";

import { useState, useEffect } from "react";
import {
  ChefHat,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Users,
  TrendingDown,
  Scale,
  Gauge,
  Activity,
  Loader2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import MessTimetable from "./MessTimetable";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCollection, useDocument } from "@/lib/hooks";

// ── Types ──────────────────────────────────────────────────────────────────

interface FoodItem {
  name: string;
  calories: number;
  allergens: string[];
  tags: string[];
}

interface MessMenu {
  id: string;
  date: string;
  mealType: string;
  items: FoodItem[];
  servingTime: string;
}

interface MealResponse {
  id: string;
  vid: string;
  date: string;
  mealType: string;
  status: "ATTENDING" | "SKIPPED";
}

interface CrowdMetrics {
  id: string;
  currentLevel: "LOW" | "MODERATE" | "PEAK";
  waitMinutes: number;
  lastUpdated: Timestamp;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"] as const;
const MEAL_LABELS: Record<string, { emoji: string; time: string }> = {
  BREAKFAST: { emoji: "🌅", time: "7:30 – 9:30 AM" },
  LUNCH: { emoji: "☀️", time: "12:30 – 2:30 PM" },
  SNACKS: { emoji: "🍪", time: "4:30 – 5:30 PM" },
  DINNER: { emoji: "🌙", time: "7:30 – 9:30 PM" },
};

const TOTAL_STUDENTS = 2000;
const PER_CAPITA_KG = { rice: 0.08, dal: 0.05, dough: 0.12 };

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * Mess Head Portal — Kitchen & Menu Operations
 *
 * Features:
 * 1. Menu CRUD Manager — live weekly planner
 * 2. Predictive Batching & Consumption Forecaster
 * 3. Rush & Crowd Controller
 */
export default function KitchenPortal() {
  const today = todayISO();
  const [selectedMeal, setSelectedMeal] = useState<string>("LUNCH");
  const [selectedEditDate, setSelectedEditDate] = useState<string>(today);
  const [activeTab, setActiveTab] = useState<"timetable" | "editor">("timetable");

  // ── Menu Data (All weekly menus for timetable) ──
  const { data: allMenus, loading: menusLoading } = useCollection<MessMenu>("mess_menu");

  // Filter menus for the specific date being edited
  const currentEditMenu = allMenus.find(
    (m) => m.date === selectedEditDate && m.mealType === selectedMeal
  );

  // ── Meal Responses (headcounts) ──
  const { data: responses } = useCollection<MealResponse>("meal_responses", [
    where("date", "==", today),
  ]);

  // ── Crowd Metrics ──
  const { data: crowd } = useDocument<CrowdMetrics>(
    "mess_crowd_metrics",
    "main_mess"
  );

  // ── Menu Editor State ──
  const [editItems, setEditItems] = useState<FoodItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Sync editor when menu or selection changes
  useEffect(() => {
    setEditItems(currentEditMenu?.items || []);
  }, [currentEditMenu, selectedMeal, selectedEditDate]);

  const handleSelectMealForEdit = (date: string, mealType: string) => {
    setSelectedEditDate(date);
    setSelectedMeal(mealType);
    setActiveTab("editor");
  };

  // ── Forecaster calculations ──
  const mealResponses = responses.filter((r) => r.mealType === selectedMeal);
  const attending = mealResponses.filter((r) => r.status === "ATTENDING").length;
  const skipped = mealResponses.filter((r) => r.status === "SKIPPED").length;
  const expectedEaters = TOTAL_STUDENTS - skipped;
  const ingredientMultiplier = expectedEaters / TOTAL_STUDENTS;

  const forecast = {
    rice: +(TOTAL_STUDENTS * PER_CAPITA_KG.rice * ingredientMultiplier).toFixed(1),
    dal: +(TOTAL_STUDENTS * PER_CAPITA_KG.dal * ingredientMultiplier).toFixed(1),
    dough: +(TOTAL_STUDENTS * PER_CAPITA_KG.dough * ingredientMultiplier).toFixed(1),
    wastePrevented: +(skipped * (PER_CAPITA_KG.rice + PER_CAPITA_KG.dal + PER_CAPITA_KG.dough)).toFixed(1),
  };

  // ── Menu CRUD Handlers ──
  const addItem = () => {
    if (!newItemName.trim()) return;
    setEditItems([
      ...editItems,
      { name: newItemName.trim(), calories: 0, allergens: [], tags: [] },
    ]);
    setNewItemName("");
  };

  const removeItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const saveMenu = async () => {
    setSaving(true);
    try {
      const docId = `${selectedEditDate}_${selectedMeal}`;
      await setDoc(doc(db, "mess_menu", docId), {
        date: selectedEditDate,
        mealType: selectedMeal,
        items: editItems,
        servingTime: MEAL_LABELS[selectedMeal]?.time || "",
      });
      showToast(`✅ Menu saved for ${selectedEditDate} (${selectedMeal})!`);
    } catch (err) {
      console.error("Failed to save menu:", err);
      showToast("❌ Failed to save menu");
    } finally {
      setSaving(false);
    }
  };

  // ── Crowd Controller ──
  const updateCrowdLevel = async (level: "LOW" | "MODERATE" | "PEAK") => {
    const waitMinutes =
      level === "LOW" ? 2 : level === "MODERATE" ? 7 : 15;

    await updateDoc(doc(db, "mess_crowd_metrics", "main_mess"), {
      currentLevel: level,
      waitMinutes,
      lastUpdated: Timestamp.now(),
    }).catch(() => {
      // Document might not exist yet, create it
      setDoc(doc(db, "mess_crowd_metrics", "main_mess"), {
        currentLevel: level,
        waitMinutes,
        lastUpdated: Timestamp.now(),
      });
    });

    showToast(`🔄 Crowd status updated to ${level}`);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="toast toast-success">{toast}</div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <ChefHat className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Mess Head Portal
            </h1>
            <p className="text-sm text-slate-500">
              Kitchen Operations & Menu Management — {today}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="stat-label">
            <Users className="h-3.5 w-3.5 text-blue-500" />
            Expected Diners
          </div>
          <p className="stat-value mt-1">{expectedEaters}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            of {TOTAL_STUDENTS} registered
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
            Opted Out
          </div>
          <p className="stat-value mt-1 text-emerald-600">{skipped}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            students skipping {selectedMeal.toLowerCase()}
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <Scale className="h-3.5 w-3.5 text-purple-500" />
            Waste Prevented
          </div>
          <p className="stat-value mt-1 text-purple-600">{forecast.wastePrevented} kg</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            food saved from overproduction
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <Gauge className="h-3.5 w-3.5 text-amber-500" />
            Current Rush
          </div>
          <p className={`stat-value mt-1 ${
            crowd?.currentLevel === "PEAK" ? "text-red-600" :
            crowd?.currentLevel === "MODERATE" ? "text-amber-600" : "text-emerald-600"
          }`}>
            {crowd?.currentLevel || "LOW"}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            ~{crowd?.waitMinutes || 2} min wait
          </p>
        </div>
      </div>

      {/* ── View Switcher Tabs ──────────────────────────────── */}
      <div className="flex items-center gap-3 mb-8 border-b border-slate-200/80 pb-4">
        <button
          onClick={() => setActiveTab("timetable")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${
            activeTab === "timetable"
              ? "bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]"
              : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Weekly Food Timetable
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
              activeTab === "timetable"
                ? "bg-white/20 text-white"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            7 Days + Generator
          </span>
        </button>

        <button
          onClick={() => setActiveTab("editor")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${
            activeTab === "editor"
              ? "bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]"
              : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <ChefHat className="h-4 w-4" />
          Live Menu Editor & Forecaster
        </button>
      </div>

      {/* ── Tab Content 1: Weekly Timetable View ─────────────── */}
      {activeTab === "timetable" && (
        <div className="mb-8 animate-fade-in">
          <MessTimetable
            menus={allMenus}
            onSelectMealForEdit={handleSelectMealForEdit}
          />
        </div>
      )}

      {/* ── Tab Content 2: Live Menu Editor & Predictive Forecaster ── */}
      {activeTab === "editor" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Menu CRUD Manager (2 cols) */}
          <div className="lg:col-span-2 card">
            <div className="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="card-title">
                  <ChefHat className="h-5 w-5 text-amber-600" />
                  Menu Editor
                </h2>
                <p className="card-subtitle">
                  Edit dishes and caloric details for any meal slot
                </p>
              </div>

              {/* Date Selector for Editor */}
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-1.5">
                <span className="text-xs font-bold text-slate-500">Date:</span>
                <input
                  type="date"
                  value={selectedEditDate}
                  onChange={(e) => setSelectedEditDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Meal Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
              {MEAL_TYPES.map((meal) => (
                <button
                  key={meal}
                  onClick={() => setSelectedMeal(meal)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    selectedMeal === meal
                      ? "bg-amber-100 text-amber-800 shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {MEAL_LABELS[meal].emoji} {meal.charAt(0) + meal.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Current Items */}
            <div className="space-y-2 mb-4">
              {editItems.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400">
                  No items added for {selectedMeal.toLowerCase()} on {selectedEditDate} yet. Add items below.
                </div>
              ) : (
              editItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.name}
                    </p>
                    {item.calories > 0 && (
                      <p className="text-[11px] text-slate-400">
                        {item.calories} kcal
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(i)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Item */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Add dish name (e.g., Paneer Butter Masala)"
              className="input-field flex-1"
              onKeyDown={(e) => e.key === "Enter" && addItem()}
            />
            <button onClick={addItem} className="btn-secondary flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={saveMenu}
            disabled={saving}
            className="btn-primary flex items-center gap-2 w-full justify-center"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Menu to Firestore"}
          </button>
        </div>

        {/* Consumption Forecaster (1 col) */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Scale className="h-5 w-5 text-purple-600" />
                Ingredient Forecast
              </h2>
              <p className="card-subtitle">
                Predicted raw materials for{" "}
                {selectedMeal.charAt(0) + selectedMeal.slice(1).toLowerCase()}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Diner Tally */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500">Confirmed</span>
                <span className="badge badge-green">{attending} eating</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Skipping</span>
                <span className="badge badge-amber">{skipped} opted out</span>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                  style={{
                    width: `${Math.min((expectedEaters / TOTAL_STUDENTS) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400 text-right">
                {((expectedEaters / TOTAL_STUDENTS) * 100).toFixed(0)}% capacity
              </p>
            </div>

            {/* Ingredient Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Required Quantities
              </h3>

              {[
                { label: "Rice", value: forecast.rice, unit: "kg", emoji: "🍚" },
                { label: "Dal / Lentils", value: forecast.dal, unit: "kg", emoji: "🫘" },
                { label: "Dough / Flour", value: forecast.dough, unit: "kg", emoji: "🫓" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    {item.emoji} {item.label}
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {item.value} <span className="text-xs font-medium text-slate-400">{item.unit}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Waste Prevention Badge */}
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                🌿 Waste Prevented Today
              </p>
              <p className="text-2xl font-black text-emerald-800 mt-1">
                {forecast.wastePrevented} kg
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ── Crowd Controller ────────────────────────────────────── */}
      <div className="mt-6 card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <Activity className="h-5 w-5 text-blue-600" />
              Rush & Crowd Controller
            </h2>
            <p className="card-subtitle">
              Manually update mess queue status visible to all students
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {(["LOW", "MODERATE", "PEAK"] as const).map((level) => {
            const isActive = crowd?.currentLevel === level;
            const config = {
              LOW: {
                label: "🟢 Low Rush",
                desc: "< 2 min wait",
                color: "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100",
                active: "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-500/20",
              },
              MODERATE: {
                label: "🟡 Moderate",
                desc: "~7 min wait",
                color: "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100",
                active: "bg-amber-100 border-amber-400 ring-2 ring-amber-500/20",
              },
              PEAK: {
                label: "🔴 Peak Rush",
                desc: "> 15 min wait",
                color: "bg-red-50 border-red-200 text-red-800 hover:bg-red-100",
                active: "bg-red-100 border-red-400 ring-2 ring-red-500/20",
              },
            }[level];

            return (
              <button
                key={level}
                onClick={() => updateCrowdLevel(level)}
                className={`rounded-xl border-2 p-5 text-center transition-all ${
                  isActive ? config.active : config.color
                }`}
              >
                <p className="text-lg font-black">{config.label}</p>
                <p className="text-xs font-medium mt-1 opacity-70">{config.desc}</p>
                {isActive && (
                  <p className="text-[10px] font-bold mt-2 opacity-60">
                    ✓ Currently Active
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
