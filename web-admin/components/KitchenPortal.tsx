"use client";

import { useState, useEffect, useMemo } from "react";
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
  Sparkles,
  HeartPulse,
  ThumbsDown,
  Award,
  ShieldAlert,
  Check,
  QrCode,
  Leaf,
  Clock,
  Send,
  UserCheck
} from "lucide-react";
import MessTimetable from "./MessTimetable";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
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
  activeDiners?: number;
  autoDetected?: boolean;
}

interface SpecialEvent {
  id: string;
  title: string;
  date: string;
  mealType: string;
  description: string;
  menuItems: string[];
  maxSlots: number;
  bookedCount: number;
  tokenPrice: number;
  createdAt: Timestamp;
}

interface SickMealRequest {
  id: string;
  requestId: string;
  vid: string;
  studentName?: string;
  hostelBlock: string;
  roomNo: string;
  mealType: string;
  dietPreference: string;
  symptoms: string;
  deliveryType: "ROOM_DELIVERY" | "COUNTER_PICKUP";
  status: "REQUESTED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED";
  createdAt: Timestamp;
}

interface MealFeedback {
  id: string;
  vid: string;
  date: string;
  mealType: string;
  rating: "LOVED" | "AVERAGE" | "UNHAPPY";
  complaintTags?: string[];
  comments?: string;
  createdAt: Timestamp;
}

interface PlateWasteLog {
  id: string;
  vid: string;
  date: string;
  mealType: string;
  isCleanPlate: boolean;
  wastePercentage: number;
  pointsDelta: number;
  createdAt: Timestamp;
}

interface MessCheckin {
  id: string;
  vid: string;
  date: string;
  mealType: string;
  timestamp: Timestamp;
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

export default function KitchenPortal() {
  const today = todayISO();
  const [selectedMeal, setSelectedMeal] = useState<string>("LUNCH");
  const [selectedEditDate, setSelectedEditDate] = useState<string>(today);
  const [activeTab, setActiveTab] = useState<
    "timetable" | "editor" | "special_lunch" | "sick_meals" | "feedback" | "plate_waste"
  >("timetable");

  // ── Menu Data ──
  const { data: allMenus } = useCollection<MessMenu>("mess_menu");
  const currentEditMenu = allMenus.find(
    (m) => m.date === selectedEditDate && m.mealType === selectedMeal
  );

  // ── Meal Responses ──
  const { data: responses } = useCollection<MealResponse>("meal_responses", [
    where("date", "==", today),
  ]);

  // ── Crowd Metrics ──
  const { data: crowd } = useDocument<CrowdMetrics>(
    "mess_crowd_metrics",
    "main_mess"
  );

  // ── Real-time Special Events / Special Lunch ──
  const { data: specialLunches } = useCollection<SpecialEvent>("special_events", [
    orderBy("date", "desc")
  ]);

  // ── Sick Meal Requests ──
  const { data: sickMealRequests } = useCollection<SickMealRequest>("sick_meal_requests", [
    orderBy("createdAt", "desc")
  ]);

  // ── Food Quality Feedback ──
  const { data: feedbacks } = useCollection<MealFeedback>("meal_feedback", [
    where("date", "==", today)
  ]);

  // ── Plate Waste Logs ──
  const { data: plateLogs } = useCollection<PlateWasteLog>("plate_waste_logs", [
    where("date", "==", today)
  ]);

  // ── Mess Gate Checkins for automated crowd counting ──
  const { data: checkins } = useCollection<MessCheckin>("mess_checkins", [
    where("date", "==", today)
  ]);

  // ── Menu Editor State ──
  const [editItems, setEditItems] = useState<FoodItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ── Special Lunch Form State ──
  const [specialForm, setSpecialForm] = useState({
    title: "Grand Sunday Royal Feast",
    date: today,
    mealType: "LUNCH",
    description: "Multi-course special pure vegetarian feast with Paneer Butter Masala, Kashmiri Dum Aloo, Gulab Jamun, and Badam Milk.",
    maxSlots: 250,
    tokenPrice: 0,
    menuItems: "Paneer Butter Masala, Kashmiri Pulao, Butter Naan, Gulab Jamun, Cold Badam Milk"
  });
  const [publishingSpecial, setPublishingSpecial] = useState(false);

  // Sync editor when menu changes
  useEffect(() => {
    setEditItems(currentEditMenu?.items || []);
  }, [currentEditMenu, selectedMeal, selectedEditDate]);

  // ── Automated Crowd Calculation Logic (Threshold = 120 check-ins) ──
  useEffect(() => {
    if (!checkins) return;
    const activeCheckinCount = checkins.length;

    // Determine level automatically based on headcounts
    let targetLevel: "LOW" | "MODERATE" | "PEAK" = "LOW";
    let targetWait = 2;

    if (activeCheckinCount >= 120) {
      targetLevel = "PEAK"; // Crowdy!
      targetWait = 18;
    } else if (activeCheckinCount >= 50) {
      targetLevel = "MODERATE";
      targetWait = 7;
    }

    // If different from database, automatically sync crowd metrics
    if (crowd && (crowd.currentLevel !== targetLevel || crowd.activeDiners !== activeCheckinCount)) {
      setDoc(doc(db, "mess_crowd_metrics", "main_mess"), {
        currentLevel: targetLevel,
        waitMinutes: targetWait,
        activeDiners: activeCheckinCount,
        autoDetected: true,
        lastUpdated: Timestamp.now(),
      }, { merge: true }).catch(console.error);
    }
  }, [checkins, crowd]);

  // ── Food Quality Dissatisfaction Calculation & Hostel Handover ──
  const feedbackMetrics = useMemo(() => {
    const total = feedbacks.length;
    if (total === 0) return { total: 0, loved: 0, average: 0, unhappy: 0, unhappyPct: 0, takeoverTriggered: false };
    const loved = feedbacks.filter(f => f.rating === "LOVED").length;
    const average = feedbacks.filter(f => f.rating === "AVERAGE").length;
    const unhappy = feedbacks.filter(f => f.rating === "UNHAPPY").length;
    const unhappyPct = Math.round((unhappy / total) * 100);
    // Threshold: > 40% unhappy or >= 5 unhappy responses
    const takeoverTriggered = (unhappyPct > 40 && total >= 3) || unhappy >= 5;
    return { total, loved, average, unhappy, unhappyPct, takeoverTriggered };
  }, [feedbacks]);

  // Update mess_operations_status when takeover is triggered
  useEffect(() => {
    if (feedbackMetrics.takeoverTriggered) {
      setDoc(doc(db, "mess_operations_status", today), {
        date: today,
        hostelTeamTakeover: true,
        unhappyPercentage: feedbackMetrics.unhappyPct,
        unhappyCount: feedbackMetrics.unhappy,
        activatedAt: Timestamp.now(),
        message: "Mess operations under emergency oversight of Hostel Student Committee."
      }, { merge: true }).catch(console.error);
    }
  }, [feedbackMetrics.takeoverTriggered, today, feedbackMetrics.unhappyPct, feedbackMetrics.unhappy]);

  // ── Plate Waste Analytics ──
  const plateStats = useMemo(() => {
    const total = plateLogs.length;
    const clean = plateLogs.filter(p => p.isCleanPlate).length;
    const wasted = total - clean;
    const coinsAwarded = clean * 20;
    const coinsDeducted = wasted * 15;
    return { total, clean, wasted, coinsAwarded, coinsDeducted };
  }, [plateLogs]);

  // ── Forecaster calculations ──
  const mealResponses = responses.filter((r) => r.mealType === selectedMeal);
  const skipped = mealResponses.filter((r) => r.status === "SKIPPED").length;
  const expectedEaters = TOTAL_STUDENTS - skipped;
  const ingredientMultiplier = expectedEaters / TOTAL_STUDENTS;

  const forecast = {
    rice: +(TOTAL_STUDENTS * PER_CAPITA_KG.rice * ingredientMultiplier).toFixed(1),
    dal: +(TOTAL_STUDENTS * PER_CAPITA_KG.dal * ingredientMultiplier).toFixed(1),
    dough: +(TOTAL_STUDENTS * PER_CAPITA_KG.dough * ingredientMultiplier).toFixed(1),
    wastePrevented: +(skipped * (PER_CAPITA_KG.rice + PER_CAPITA_KG.dal + PER_CAPITA_KG.dough)).toFixed(1),
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleSelectMealForEdit = (date: string, mealType: string) => {
    setSelectedEditDate(date);
    setSelectedMeal(mealType);
    setActiveTab("editor");
  };

  // ── Menu CRUD Handlers ──
  const addItem = () => {
    if (!newItemName.trim()) return;
    setEditItems((prev) => [
      ...prev,
      {
        name: newItemName.trim(),
        calories: 220,
        allergens: [],
        tags: ["Vegetarian", "Pure Veg"],
      },
    ]);
    setNewItemName("");
  };

  const removeItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
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
      showToast(`✅ Saved ${selectedMeal} menu for ${selectedEditDate}`);
    } catch (err) {
      console.error("Save menu failed:", err);
      showToast("❌ Failed to save menu");
    } finally {
      setSaving(false);
    }
  };

  const updateCrowd = async (level: "LOW" | "MODERATE" | "PEAK", waitMinutes: number) => {
    try {
      await updateDoc(doc(db, "mess_crowd_metrics", "main_mess"), {
        currentLevel: level,
        waitMinutes,
        lastUpdated: Timestamp.now(),
        autoDetected: false
      });
      showToast(`🔄 Crowd status updated to ${level}`);
    } catch {
      await setDoc(doc(db, "mess_crowd_metrics", "main_mess"), {
        currentLevel: level,
        waitMinutes,
        lastUpdated: Timestamp.now(),
        autoDetected: false
      });
      showToast(`🔄 Crowd status updated to ${level}`);
    }
  };

  // ── Create Special Lunch ──
  const handlePublishSpecialLunch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishingSpecial(true);
    try {
      await addDoc(collection(db, "special_events"), {
        title: specialForm.title.trim(),
        date: specialForm.date,
        mealType: specialForm.mealType,
        description: specialForm.description.trim(),
        menuItems: specialForm.menuItems.split(",").map(i => i.trim()),
        maxSlots: Number(specialForm.maxSlots),
        bookedCount: 0,
        tokenPrice: Number(specialForm.tokenPrice),
        createdAt: Timestamp.now()
      });
      showToast("🌟 Special Lunch Facility event published!");
      setSpecialForm(prev => ({ ...prev, title: "", description: "" }));
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to publish special lunch");
    } finally {
      setPublishingSpecial(false);
    }
  };

  // ── Update Sick Meal Status ──
  const updateSickMealStatus = async (docId: string, status: SickMealRequest["status"]) => {
    try {
      await updateDoc(doc(db, "sick_meal_requests", docId), { status });
      showToast(`🥣 Sick meal marked as ${status.replace(/_/g, " ")}`);
    } catch {
      showToast("❌ Error updating sick meal");
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-5 py-3 text-sm font-bold shadow-2xl border border-slate-700 animate-fade-in">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* ── Emergency Alert: Hostel Team Takeover ──────────────── */}
      {feedbackMetrics.takeoverTriggered && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-6 text-white shadow-xl shadow-red-500/20 border border-red-400 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <ShieldAlert className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-600">
                  Democratic Oversight Active
                </span>
                <span className="text-xs text-white/80 font-semibold">
                  {feedbackMetrics.unhappyPct}% Unhappy Student Ratings
                </span>
              </div>
              <h2 className="text-lg font-black mt-1">
                Quality Threshold Breached: Mess Handed Over to Hostel Team!
              </h2>
              <p className="text-xs text-white/90">
                Due to high dissatisfaction with today's meal, dining operations and preparation standards are now directly inspected and supervised by the Hostel Student Committee.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 border border-amber-200 shadow-sm">
            <ChefHat className="h-6 w-6 text-amber-800" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Mess Head & Kitchen Operations
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-black border border-emerald-200">
                🌱 100% Pure Veg
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Production forecasting, special lunch facilities, sick care & real-time gate automation
            </p>
          </div>
        </div>

        {/* Live Crowd Badge with Automatic Detection Status */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-2.5 shadow-sm">
          <div className="flex items-center gap-2 px-3">
            <QrCode className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gate Check-ins</p>
              <p className="text-sm font-black text-slate-800">{checkins.length} students today</p>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex items-center gap-2 px-3">
            <div className={`h-3 w-3 rounded-full ${crowd?.currentLevel === "PEAK" ? "bg-red-500 animate-ping" : crowd?.currentLevel === "MODERATE" ? "bg-amber-500" : "bg-emerald-500"}`} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rush Level</p>
              <p className="text-sm font-black text-slate-800">
                {crowd?.currentLevel === "PEAK" ? "⚠️ CROWDY" : crowd?.currentLevel || "LOW"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Stats Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Users className="h-4 w-4 text-blue-500" />
            Expected Diners
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{expectedEaters}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{skipped} students opted out</p>
        </div>

        <div className="stat-card bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <HeartPulse className="h-4 w-4 text-rose-500" />
            Sick Meals Today
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{sickMealRequests.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Khichdi & mild care diets</p>
        </div>

        <div className="stat-card bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Award className="h-4 w-4 text-emerald-500" />
            Clean Plates Scanned
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{plateStats.clean} / {plateStats.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">+{plateStats.coinsAwarded} Green Coins earned</p>
        </div>

        <div className="stat-card bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <ThumbsDown className="h-4 w-4 text-amber-500" />
            Food Feedback
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {feedbackMetrics.unhappyPct}% <span className="text-xs font-bold text-slate-400">Unhappy</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{feedbackMetrics.total} ratings received</p>
        </div>
      </div>

      {/* ── View Switcher Navigation Tabs ──────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        {[
          { id: "timetable", label: "Food Timetable", icon: Calendar },
          { id: "editor", label: "Menu Editor & Batching", icon: ChefHat },
          { id: "special_lunch", label: "🌟 Special Lunch Facility", icon: Sparkles },
          { id: "sick_meals", label: `🥣 Sick Meals (${sickMealRequests.filter(s => s.status !== "DELIVERED").length})`, icon: HeartPulse },
          { id: "feedback", label: "Food Quality & Oversight", icon: ThumbsDown },
          { id: "plate_waste", label: "🌿 Plate Waste & Coins", icon: Leaf },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-black transition ${
                isActive
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-[1.02]"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: Weekly Timetable ──────────────────────────────────────── */}
      {activeTab === "timetable" && (
        <div className="animate-fade-in">
          <MessTimetable menus={allMenus} onSelectMealForEdit={handleSelectMealForEdit} />
        </div>
      )}

      {/* ── TAB 2: Live Menu Editor & Batching Forecaster ────────────────── */}
      {activeTab === "editor" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Editing: {selectedMeal} ({selectedEditDate})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update meal items distributed to Android student apps
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedEditDate}
                  onChange={(e) => setSelectedEditDate(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
                />
                <select
                  value={selectedMeal}
                  onChange={(e) => setSelectedMeal(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
                >
                  {MEAL_TYPES.map((m) => (
                    <option key={m} value={m}>{MEAL_LABELS[m]?.emoji} {m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Current Items List */}
            <div className="space-y-3 mb-6">
              {editItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition hover:bg-slate-100/70"
                >
                  <div>
                    <p className="text-sm font-black text-slate-800">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-slate-400">{item.calories} kcal</span>
                      <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                        Pure Veg
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(idx)}
                    className="p-2 text-slate-400 hover:text-red-600 transition"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Item Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Kashmiri Pulao, Desi Ghee Roti, Shahi Paneer"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none"
              />
              <button
                onClick={addItem}
                className="flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-5 py-3 text-sm font-bold hover:bg-slate-800 transition"
              >
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={saveMenu}
                disabled={saving}
                className="flex items-center gap-2 rounded-2xl bg-amber-500 text-white px-6 py-3 text-sm font-black shadow-lg shadow-amber-500/25 hover:bg-amber-600 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes to Cloud
              </button>
            </div>
          </div>

          {/* Predictive Forecaster Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700">
                <Scale className="h-4 w-4" />
                Raw Material Forecaster
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-1">Batch Sizing</h3>
              <p className="text-xs text-slate-500">Calculated based on {expectedEaters} eating students</p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs text-slate-500 font-bold">Rice to Cook</p>
                <p className="text-xl font-black text-slate-800 mt-1">{forecast.rice} kg</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs text-slate-500 font-bold">Dal / Pulses</p>
                <p className="text-xl font-black text-slate-800 mt-1">{forecast.dal} kg</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs text-slate-500 font-bold">Wheat Dough</p>
                <p className="text-xl font-black text-slate-800 mt-1">{forecast.dough} kg</p>
              </div>
            </div>

            {/* Manual Rush Override */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-black uppercase text-slate-400 mb-3">Manual Rush Override</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => updateCrowd("LOW", 2)}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                >
                  Low
                </button>
                <button
                  onClick={() => updateCrowd("MODERATE", 7)}
                  className="rounded-xl border border-amber-200 bg-amber-50 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
                >
                  Moderate
                </button>
                <button
                  onClick={() => updateCrowd("PEAK", 18)}
                  className="rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-bold text-red-800 hover:bg-red-100 transition"
                >
                  Crowdy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Special Lunch Facility ────────────────────────────────── */}
      {activeTab === "special_lunch" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Create Special Event Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600">
                <Sparkles className="h-4 w-4" />
                Publish Special Feast
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-1">Special Lunch Facility</h3>
              <p className="text-xs text-slate-500">
                Students can book special festival meals & weekend feasts via Android app
              </p>
            </div>

            <form onSubmit={handlePublishSpecialLunch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={specialForm.title}
                  onChange={(e) => setSpecialForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={specialForm.date}
                    onChange={(e) => setSpecialForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    required
                    value={specialForm.maxSlots}
                    onChange={(e) => setSpecialForm(prev => ({ ...prev, maxSlots: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Special Pure Veg Menu Items</label>
                <textarea
                  rows={2}
                  required
                  value={specialForm.menuItems}
                  onChange={(e) => setSpecialForm(prev => ({ ...prev, menuItems: e.target.value }))}
                  placeholder="Comma separated items"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={specialForm.description}
                  onChange={(e) => setSpecialForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={publishingSpecial}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black py-3 text-sm shadow-md shadow-amber-500/20 hover:brightness-105 transition"
              >
                {publishingSpecial ? "Publishing..." : "🌟 Publish Special Lunch"}
              </button>
            </form>
          </div>

          {/* Active Special Lunches List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Upcoming Special Lunches</h3>
            {specialLunches.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
                <Sparkles className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold">No active special lunches</p>
                <p className="text-xs">Publish one to enable student reservations</p>
              </div>
            ) : (
              specialLunches.map((item) => (
                <div key={item.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 uppercase">
                          {item.date}
                        </span>
                        <span className="text-xs font-bold text-slate-400">Pure Veg Feast</span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 mt-1">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-black text-amber-600">
                        {item.bookedCount || 0} / {item.maxSlots}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Booked Seats</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {item.menuItems?.map((dish, i) => (
                      <span key={i} className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-bold">
                        🍽️ {dish}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: Health Issues & Sick Meals Care ───────────────────────── */}
      {activeTab === "sick_meals" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-600">
                <HeartPulse className="h-4 w-4" />
                Student Health Care
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-1">Sick Meal & Dietary Care Queue</h3>
              <p className="text-xs text-slate-500">
                Mild diet requests (Khichdi, boiled veggies, curd) requested by unwell students
              </p>
            </div>
            <span className="rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2 text-xs font-black">
              {sickMealRequests.length} Active Requests
            </span>
          </div>

          {sickMealRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <HeartPulse className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="font-bold">No active sick meal requests</p>
              <p className="text-xs">Students will submit health requests via the Android app</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sickMealRequests.map((req) => (
                <div key={req.id} className="rounded-2xl border border-slate-200 p-5 space-y-3 bg-slate-50/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-800">
                        {req.vid} {req.studentName ? `(${req.studentName})` : ""}
                      </span>
                      <p className="text-xs font-bold text-rose-700">
                        Block {req.hostelBlock} • Room {req.roomNo}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                      req.status === "DELIVERED" ? "bg-emerald-100 text-emerald-800" :
                      req.status === "OUT_FOR_DELIVERY" ? "bg-blue-100 text-blue-800" :
                      req.status === "PREPARING" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-700"
                    }`}>
                      {req.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 space-y-1 bg-white p-3 rounded-xl border border-slate-100">
                    <p><strong className="text-slate-900">Diet Requested:</strong> {req.dietPreference}</p>
                    <p><strong className="text-slate-900">Health Symptoms:</strong> {req.symptoms || "Mild recovery diet"}</p>
                    <p><strong className="text-slate-900">Delivery Method:</strong> {req.deliveryType === "ROOM_DELIVERY" ? "🚪 Hostel Room Delivery" : "🏃 Counter Pickup"}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => updateSickMealStatus(req.id, "PREPARING")}
                      className="flex-1 rounded-xl bg-amber-500 text-white text-xs font-bold py-2 hover:bg-amber-600 transition"
                    >
                      Preparing
                    </button>
                    <button
                      onClick={() => updateSickMealStatus(req.id, "OUT_FOR_DELIVERY")}
                      className="flex-1 rounded-xl bg-blue-600 text-white text-xs font-bold py-2 hover:bg-blue-700 transition"
                    >
                      Dispatch
                    </button>
                    <button
                      onClick={() => updateSickMealStatus(req.id, "DELIVERED")}
                      className="flex-1 rounded-xl bg-emerald-600 text-white text-xs font-bold py-2 hover:bg-emerald-700 transition"
                    >
                      Delivered
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: Food Quality & Democratic Oversight ──────────────────── */}
      {activeTab === "feedback" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600">
              <ThumbsDown className="h-4 w-4" />
              Student Voice & Accountability
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">Food Quality Rating & Oversight</h3>
            <p className="text-xs text-slate-500">
              If unhappy feedback exceeds 40%, the mess is automatically handed over to the Hostel Oversight Committee
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <p className="text-3xl">😋</p>
              <p className="text-xl font-black text-emerald-800 mt-2">{feedbackMetrics.loved}</p>
              <p className="text-xs font-bold text-emerald-700">Loved It</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-center">
              <p className="text-3xl">😐</p>
              <p className="text-xl font-black text-blue-800 mt-2">{feedbackMetrics.average}</p>
              <p className="text-xs font-bold text-blue-700">Acceptable</p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
              <p className="text-3xl">😡</p>
              <p className="text-xl font-black text-red-800 mt-2">{feedbackMetrics.unhappy}</p>
              <p className="text-xs font-bold text-red-700">Unhappy ({feedbackMetrics.unhappyPct}%)</p>
            </div>
          </div>

          {/* Feedback logs */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-slate-800">Student Remarks ({feedbacks.length})</h4>
            {feedbacks.length === 0 ? (
              <p className="text-xs text-slate-400">No ratings submitted for today's meal yet.</p>
            ) : (
              feedbacks.map((f) => (
                <div key={f.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-black text-slate-800">{f.vid}</span> • <span className="font-semibold">{f.mealType}</span>
                    {f.complaintTags && f.complaintTags.length > 0 && (
                      <span className="ml-2 text-rose-600 font-bold">[{f.complaintTags.join(", ")}]</span>
                    )}
                    {f.comments && <p className="text-slate-600 mt-1 italic">"{f.comments}"</p>}
                  </div>
                  <span className="text-lg">
                    {f.rating === "LOVED" ? "😋" : f.rating === "AVERAGE" ? "😐" : "😡"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 6: Plate Waste & Green Coins ────────────────────────────── */}
      {activeTab === "plate_waste" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600">
              <Leaf className="h-4 w-4" />
              Sustainability Ledger
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">Plate Scanner Waste Audit</h3>
            <p className="text-xs text-slate-500">
              Students scanning clean plates earn +20 Green Coins; leftover waste incurs -15 Green Coins
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs text-slate-400 font-bold uppercase">Total Plates Scanned</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{plateStats.total}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-xs text-emerald-600 font-bold uppercase">Clean Plates (Zero Waste)</p>
              <p className="text-2xl font-black text-emerald-800 mt-1">{plateStats.clean}</p>
              <p className="text-xs text-emerald-700 mt-0.5">+{plateStats.coinsAwarded} Coins Awarded 🌿</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <p className="text-xs text-rose-600 font-bold uppercase">Food Wasted</p>
              <p className="text-2xl font-black text-rose-800 mt-1">{plateStats.wasted}</p>
              <p className="text-xs text-rose-700 mt-0.5">-{plateStats.coinsDeducted} Coins Penalized ⚠️</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-black text-slate-800">Recent Disposal Counter Scans</h4>
            {plateLogs.length === 0 ? (
              <p className="text-xs text-slate-400">No plate scans logged today yet.</p>
            ) : (
              plateLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-xs bg-slate-50">
                  <span className="font-bold text-slate-800">{log.vid}</span>
                  <span className={`font-black ${log.isCleanPlate ? "text-emerald-600" : "text-rose-600"}`}>
                    {log.isCleanPlate ? "✅ Clean Plate (+20 pts)" : `⚠️ Food Wasted (${log.wastePercentage}%) -15 pts`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
