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
  UserCheck,
  Zap,
  Download,
  Sliders,
  CheckCircle2,
  AlertTriangle
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

interface KitchenPortalProps {
  selectedBlock?: string;
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
const PER_CAPITA_KG = {
  rice: 0.08, // 80g
  dal: 0.05,  // 50g
  dough: 0.12, // 120g
  veggies: 0.09, // 90g
  oilGhee: 0.018, // 18ml
};

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export default function KitchenPortal({ selectedBlock = "ALL" }: KitchenPortalProps) {
  const today = todayISO();
  const [selectedMeal, setSelectedMeal] = useState<string>("LUNCH");
  const [selectedEditDate, setSelectedEditDate] = useState<string>(today);
  const [activeTab, setActiveTab] = useState<
    "ai_procurement" | "timetable" | "editor" | "special_lunch" | "sick_meals" | "feedback" | "plate_waste"
  >("ai_procurement");

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

  // ── Surge Incentive State ──
  const [surgeMultiplier, setSurgeMultiplier] = useState<number>(1);
  const [surgeActive, setSurgeActive] = useState<boolean>(false);

  // ── Simulation Slider for AI Procurement ──
  const [simulationHeadcount, setSimulationHeadcount] = useState<number>(1420);

  // ── Special Lunch Form State ──
  const [specialForm, setSpecialForm] = useState({
    title: "Grand Sunday Royal Feast",
    date: today,
    mealType: "LUNCH",
    description: "Multi-course pure vegetarian feast with Paneer Butter Masala, Kashmiri Dum Aloo, Gulab Jamun, and Badam Milk.",
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

    let targetLevel: "LOW" | "MODERATE" | "PEAK" = "LOW";
    let targetWait = 2;

    if (activeCheckinCount >= 120) {
      targetLevel = "PEAK";
      targetWait = 18;
    } else if (activeCheckinCount >= 50) {
      targetLevel = "MODERATE";
      targetWait = 7;
    }

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
  const expectedEaters = Math.max(0, TOTAL_STUDENTS - skipped);

  // Sync simulation headcount to actual expected diners initially
  useEffect(() => {
    if (expectedEaters > 0) {
      setSimulationHeadcount(expectedEaters);
    }
  }, [expectedEaters]);

  // Calculations for precision procurement based on simulated/active headcount
  const precisionData = useMemo(() => {
    const eaters = simulationHeadcount;
    const riceKg = +(eaters * PER_CAPITA_KG.rice).toFixed(1);
    const dalKg = +(eaters * PER_CAPITA_KG.dal).toFixed(1);
    const doughKg = +(eaters * PER_CAPITA_KG.dough).toFixed(1);
    const veggiesKg = +(eaters * PER_CAPITA_KG.veggies).toFixed(1);
    const oilL = +(eaters * PER_CAPITA_KG.oilGhee).toFixed(1);
    const gasCylinders = +(eaters * 0.00175).toFixed(1);

    // Standard baseline (2000 blind cook)
    const baseRice = +(TOTAL_STUDENTS * PER_CAPITA_KG.rice).toFixed(1);
    const baseDal = +(TOTAL_STUDENTS * PER_CAPITA_KG.dal).toFixed(1);
    const baseDough = +(TOTAL_STUDENTS * PER_CAPITA_KG.dough).toFixed(1);
    const baseVeggies = +(TOTAL_STUDENTS * PER_CAPITA_KG.veggies).toFixed(1);
    const baseOil = +(TOTAL_STUDENTS * PER_CAPITA_KG.oilGhee).toFixed(1);
    const baseGas = +(TOTAL_STUDENTS * 0.00175).toFixed(1);

    // Savings
    const savedRice = +(baseRice - riceKg).toFixed(1);
    const savedDal = +(baseDal - dalKg).toFixed(1);
    const savedDough = +(baseDough - doughKg).toFixed(1);
    const savedVeggies = +(baseVeggies - veggiesKg).toFixed(1);
    const savedOil = +(baseOil - oilL).toFixed(1);
    const savedGas = +(baseGas - gasCylinders).toFixed(1);

    // Costs (₹)
    const costPrecision = Math.round(riceKg * 60 + dalKg * 140 + doughKg * 38 + veggiesKg * 45 + oilL * 135 + gasCylinders * 1850);
    const costBlind = Math.round(baseRice * 60 + baseDal * 140 + baseDough * 38 + baseVeggies * 45 + baseOil * 135 + baseGas * 1850);
    const costSaved = costBlind - costPrecision;

    return {
      riceKg, dalKg, doughKg, veggiesKg, oilL, gasCylinders,
      savedRice, savedDal, savedDough, savedVeggies, savedOil, savedGas,
      costPrecision, costBlind, costSaved,
      wasteSparedTotalKg: +(savedRice + savedDal + savedDough + savedVeggies).toFixed(1),
    };
  }, [simulationHeadcount]);

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

  // ── Surge Incentive Toggle ──
  const toggleSurgeIncentive = async () => {
    const nextState = !surgeActive;
    setSurgeActive(nextState);
    const multiplier = nextState ? 2 : 1;
    setSurgeMultiplier(multiplier);
    try {
      await setDoc(doc(db, "mess_operations_status", "surge_incentive"), {
        active: nextState,
        multiplier: multiplier,
        bonusPointsPerSkip: nextState ? 30 : 15,
        updatedAt: Timestamp.now(),
        reason: nextState ? "Surge Green Points active to mitigate dining hall congestion" : "Normal incentive rates",
      }, { merge: true });
      showToast(nextState ? "⚡ Surge Incentive Active: +30 Pts/Skip enabled!" : "✅ Surge Incentive deactivated (Normal +15 Pts)");
    } catch {
      showToast("❌ Failed to update surge incentive");
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

  // Export Procurement Slip
  const exportProcurementCSV = () => {
    const headers = ["Raw Ingredient", "Unit", "Precision Cook Quantity", "Standard Blind Cook Quantity", "Net Spared"];
    const rows = [
      ["Basmati / Sona Masoori Rice", "kg", precisionData.riceKg, 160, precisionData.savedRice],
      ["Toor / Arhar Dal", "kg", precisionData.dalKg, 100, precisionData.savedDal],
      ["Chakki Fresh Wheat Atta", "kg", precisionData.doughKg, 240, precisionData.savedDough],
      ["Seasonal Mixed Vegetables", "kg", precisionData.veggiesKg, 180, precisionData.savedVeggies],
      ["Cooking Oil & Pure Desi Ghee", "L", precisionData.oilL, 36, precisionData.savedOil],
      ["Commercial LPG Cylinders", "units", precisionData.gasCylinders, 3.5, precisionData.savedGas],
    ];
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MessWise_Procurement_Requisition_${today}_${selectedMeal}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Toast Alert */}
      {toast && (
        <div className="toast toast-success">
          <Check className="h-4 w-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Emergency Alert: Hostel Team Takeover */}
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
                Due to high dissatisfaction with today&apos;s meal, dining operations and preparation standards are now directly inspected and supervised by the Hostel Student Committee.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/20 text-white font-black text-xl">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                Mess Head & Kitchen Command
              </h1>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-xs font-bold text-emerald-400">
                🌱 100% Pure Veg
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              AI raw material demand forecasting, 7-day nutrition planner, sick care dispatch & gate turnstiles
            </p>
          </div>
        </div>

        {/* Live Gate & Surge Status */}
        <div className="flex items-center gap-3">
          {/* Surge Points Toggle Button */}
          <button
            onClick={toggleSurgeIncentive}
            className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition shadow-sm ${
              surgeActive
                ? "bg-amber-500 text-slate-950 border-amber-300 font-black shadow-amber-500/30"
                : "bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-750"
            }`}
          >
            <Zap className={`h-4 w-4 ${surgeActive ? "fill-current animate-bounce" : "text-amber-400"}`} />
            <span>{surgeActive ? "⚡ 2x Surge Active (+30 Pts)" : "Activate Surge (+30 Pts)"}</span>
          </button>

          {/* Gate Turnstile Badge */}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/80 p-2 px-3.5 shadow-sm">
            <QrCode className="h-4 w-4 text-brand-400" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gate Check-ins</p>
              <p className="text-xs font-black text-white">{checkins.length} diners</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-glass p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Users className="h-4 w-4 text-blue-400" />
            Expected Diners ({selectedMeal})
          </div>
          <p className="text-2xl font-black text-white mt-2">{expectedEaters}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{skipped} advance opt-outs</p>
        </div>

        <div className="card-glass p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <HeartPulse className="h-4 w-4 text-rose-400" />
            Sick Meals Active
          </div>
          <p className="text-2xl font-black text-rose-400 mt-2">{sickMealRequests.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Khichdi & mild care diets</p>
        </div>

        <div className="card-glass p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Award className="h-4 w-4 text-emerald-400" />
            Clean Plates Scanned
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">
            {plateStats.clean} <span className="text-sm font-semibold text-slate-400">/ {plateStats.total}</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">+{plateStats.coinsAwarded} Green Coins credited</p>
        </div>

        <div className="card-glass p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <ThumbsDown className="h-4 w-4 text-amber-400" />
            Student CSAT Rating
          </div>
          <p className="text-2xl font-black text-white mt-2">
            {100 - feedbackMetrics.unhappyPct}% <span className="text-xs font-semibold text-slate-400">Satisfied</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{feedbackMetrics.total} meal responses</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: "ai_procurement", label: "🧠 AI Precision Procurement", icon: Scale },
          { id: "timetable", label: "Food Timetable & Generator", icon: Calendar },
          { id: "editor", label: "Live Menu Editor", icon: ChefHat },
          { id: "special_lunch", label: "🌟 Special Feast Facility", icon: Sparkles },
          { id: "sick_meals", label: `🥣 Sick Meals (${sickMealRequests.filter(s => s.status !== "DELIVERED").length})`, icon: HeartPulse },
          { id: "feedback", label: "Food Quality & Oversight", icon: ThumbsDown },
          { id: "plate_waste", label: "🌿 Clean Plate Audit", icon: Leaf },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition ${
                isActive
                  ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 scale-[1.02]"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: AI PRECISION PROCUREMENT (NEW INNOVATION CORE) ── */}
      {activeTab === "ai_procurement" && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Banner: Financial & Environmental Impact */}
          <div className="card-glass border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-0.5 text-xs font-black text-amber-300">
                    PREDICTIVE ALGORITHMIC BATCH SIZING
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    Selected Meal: {selectedMeal}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Raw Grain & Ingredient Precision Procurement
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Eliminating the blind cooking cycle. The kitchen loads boilers based on verified 3-hour prior headcounts, preventing cooked food spoilage and cutting raw procurement bills.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase">Estimated Meal Savings</p>
                  <p className="text-2xl font-black text-emerald-400">
                    ₹{precisionData.costSaved.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {precisionData.wasteSparedTotalKg} kg raw ingredients spared
                  </p>
                </div>
                <button
                  onClick={exportProcurementCSV}
                  className="btn-primary flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Requisition Slip (CSV)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Attendance Slider for Scenario Planning */}
          <div className="card-glass p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-brand-400" />
                  Live Attendance Sizing & Simulation Slider
                </h3>
                <p className="text-xs text-slate-400">
                  Simulate different turnout scenarios or lock to today&apos;s verified attendance
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-semibold">Headcount:</span>
                <span className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-1 text-sm font-black text-brand-400 font-mono">
                  {simulationHeadcount} Diners
                </span>
                <button
                  onClick={() => setSimulationHeadcount(expectedEaters)}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Reset to Live ({expectedEaters})
                </button>
              </div>
            </div>

            <input
              type="range"
              min="500"
              max="2000"
              step="10"
              value={simulationHeadcount}
              onChange={(e) => setSimulationHeadcount(Number(e.target.value))}
              className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono font-bold">
              <span>500 (Minimum Holiday)</span>
              <span>1,250 (Moderate Weekday)</span>
              <span>2,000 (Full Capacity Blind)</span>
            </div>
          </div>

          {/* Raw Material Yield Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Scale className="h-4 w-4 text-amber-400" />
                Raw Ingredient Requirements for {simulationHeadcount} Diners
              </h3>
              <span className="text-xs text-slate-400">
                100% Pure Vegetarian Institutional Standards
              </span>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="table-header">Raw Ingredient</th>
                  <th className="table-header">Per Student Ratio</th>
                  <th className="table-header">Precision Batch Required</th>
                  <th className="table-header">Traditional Blind Batch (2000)</th>
                  <th className="table-header text-right">Raw Food Spared</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="table-cell font-bold text-white">Basmati / Sona Masoori Rice</td>
                  <td className="table-cell text-xs text-slate-400">80g / diner</td>
                  <td className="table-cell font-mono font-bold text-amber-400">{precisionData.riceKg} kg</td>
                  <td className="table-cell font-mono text-slate-400">160.0 kg</td>
                  <td className="table-cell text-right font-mono font-bold text-emerald-400">+{precisionData.savedRice} kg</td>
                </tr>
                <tr>
                  <td className="table-cell font-bold text-white">Toor / Arhar / Moong Dal</td>
                  <td className="table-cell text-xs text-slate-400">50g / diner</td>
                  <td className="table-cell font-mono font-bold text-amber-400">{precisionData.dalKg} kg</td>
                  <td className="table-cell font-mono text-slate-400">100.0 kg</td>
                  <td className="table-cell text-right font-mono font-bold text-emerald-400">+{precisionData.savedDal} kg</td>
                </tr>
                <tr>
                  <td className="table-cell font-bold text-white">Chakki Fresh Wheat Atta / Flour</td>
                  <td className="table-cell text-xs text-slate-400">120g / diner</td>
                  <td className="table-cell font-mono font-bold text-amber-400">{precisionData.doughKg} kg</td>
                  <td className="table-cell font-mono text-slate-400">240.0 kg</td>
                  <td className="table-cell text-right font-mono font-bold text-emerald-400">+{precisionData.savedDough} kg</td>
                </tr>
                <tr>
                  <td className="table-cell font-bold text-white">Seasonal Green Vegetables & Paneer</td>
                  <td className="table-cell text-xs text-slate-400">90g / diner</td>
                  <td className="table-cell font-mono font-bold text-amber-400">{precisionData.veggiesKg} kg</td>
                  <td className="table-cell font-mono text-slate-400">180.0 kg</td>
                  <td className="table-cell text-right font-mono font-bold text-emerald-400">+{precisionData.savedVeggies} kg</td>
                </tr>
                <tr>
                  <td className="table-cell font-bold text-white">Cooking Oil & Pure Desi Ghee</td>
                  <td className="table-cell text-xs text-slate-400">18ml / diner</td>
                  <td className="table-cell font-mono font-bold text-amber-400">{precisionData.oilL} Liters</td>
                  <td className="table-cell font-mono text-slate-400">36.0 Liters</td>
                  <td className="table-cell text-right font-mono font-bold text-emerald-400">+{precisionData.savedOil} L</td>
                </tr>
                <tr>
                  <td className="table-cell font-bold text-white">Commercial LPG Fuel (Steam Boilers)</td>
                  <td className="table-cell text-xs text-slate-400">0.00175 cyl / diner</td>
                  <td className="table-cell font-mono font-bold text-amber-400">{precisionData.gasCylinders} Cylinders</td>
                  <td className="table-cell font-mono text-slate-400">3.5 Cylinders</td>
                  <td className="table-cell text-right font-mono font-bold text-emerald-400">+{precisionData.savedGas} Cyl</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: Weekly Timetable ──────────────────────────────────────── */}
      {activeTab === "timetable" && (
        <div className="animate-fade-in">
          <MessTimetable menus={allMenus} onSelectMealForEdit={handleSelectMealForEdit} />
        </div>
      )}

      {/* ── TAB 3: Live Menu Editor & Batching Forecaster ────────────────── */}
      {activeTab === "editor" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="lg:col-span-2 card-glass">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
              <div>
                <h3 className="text-base font-black text-white">
                  Editing Menu: {selectedMeal} ({selectedEditDate})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Synchronized in real-time to student Android mobile applications
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedEditDate}
                  onChange={(e) => setSelectedEditDate(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200"
                />
                <select
                  value={selectedMeal}
                  onChange={(e) => setSelectedMeal(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200"
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
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:bg-slate-800/80"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border border-emerald-500 bg-slate-900 p-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      </div>
                      <p className="text-sm font-bold text-white">{item.name}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 pl-5">
                      <span className="text-xs font-semibold text-slate-400">{item.calories} kcal</span>
                      <span className="badge badge-green text-[10px]">Pure Veg</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(idx)}
                    className="p-2 text-slate-400 hover:text-rose-400 transition"
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
                className="input-field"
              />
              <button
                onClick={addItem}
                className="btn-secondary flex items-center gap-2 shrink-0"
              >
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={saveMenu}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Save Changes to Cloud</span>
              </button>
            </div>
          </div>

          {/* Quick Rush Controller Card */}
          <div className="card-glass space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                <Gauge className="h-4 w-4" />
                Crowd Rush Override
              </div>
              <h3 className="text-base font-black text-white mt-1">Manual Rush Controller</h3>
              <p className="text-xs text-slate-400">Pushes immediate queue update to student homescreen</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => updateCrowd("LOW", 2)}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 py-3 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition"
              >
                Low (2m)
              </button>
              <button
                onClick={() => updateCrowd("MODERATE", 7)}
                className="rounded-xl border border-amber-500/30 bg-amber-500/15 py-3 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition"
              >
                Moderate (7m)
              </button>
              <button
                onClick={() => updateCrowd("PEAK", 22)}
                className="rounded-xl border border-rose-500/30 bg-rose-500/15 py-3 text-xs font-bold text-rose-300 hover:bg-rose-500/25 transition"
              >
                Crowdy (22m)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Special Lunch Facility ────────────────────────────────── */}
      {activeTab === "special_lunch" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="card-glass space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                <Sparkles className="h-4 w-4" />
                Publish Special Feast
              </div>
              <h3 className="text-base font-black text-white mt-1">Special Lunch Facility</h3>
              <p className="text-xs text-slate-400">
                Students can reserve festival meals & royal weekend feasts via Android
              </p>
            </div>

            <form onSubmit={handlePublishSpecialLunch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={specialForm.title}
                  onChange={(e) => setSpecialForm(prev => ({ ...prev, title: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={specialForm.date}
                    onChange={(e) => setSpecialForm(prev => ({ ...prev, date: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    required
                    value={specialForm.maxSlots}
                    onChange={(e) => setSpecialForm(prev => ({ ...prev, maxSlots: Number(e.target.value) }))}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Special Pure Veg Menu Items</label>
                <textarea
                  rows={2}
                  required
                  value={specialForm.menuItems}
                  onChange={(e) => setSpecialForm(prev => ({ ...prev, menuItems: e.target.value }))}
                  placeholder="Comma separated items"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={specialForm.description}
                  onChange={(e) => setSpecialForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={publishingSpecial}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {publishingSpecial ? "Publishing..." : "🌟 Publish Special Feast"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-black text-white">Upcoming Special Lunches</h3>
            {specialLunches.length === 0 ? (
              <div className="card-glass p-12 text-center text-slate-400">
                <Sparkles className="h-8 w-8 mx-auto mb-2 text-slate-500" />
                <p className="font-bold text-white">No active special lunches</p>
                <p className="text-xs">Publish one to enable student reservations</p>
              </div>
            ) : (
              specialLunches.map((item) => (
                <div key={item.id} className="card-glass p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-amber uppercase">
                          {item.date}
                        </span>
                        <span className="text-xs font-bold text-slate-400">Pure Veg Feast</span>
                      </div>
                      <h4 className="text-base font-black text-white mt-1">{item.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-black text-amber-400">
                        {item.bookedCount || 0} / {item.maxSlots}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Booked Seats</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-1.5">
                    {item.menuItems?.map((dish, i) => (
                      <span key={i} className="rounded-full bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 text-xs font-bold">
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

      {/* ── TAB 5: Sick Meals Care ───────────────────────────────────────── */}
      {activeTab === "sick_meals" && (
        <div className="card-glass space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-400">
                <HeartPulse className="h-4 w-4" />
                Student Health Care
              </div>
              <h3 className="text-base font-black text-white mt-1">Sick Meal & Dietary Care Queue</h3>
              <p className="text-xs text-slate-400">
                Mild diet requests (Khichdi, boiled veggies, curd) requested by unwell students
              </p>
            </div>
            <span className="badge badge-red">
              {sickMealRequests.length} Active Requests
            </span>
          </div>

          {sickMealRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <HeartPulse className="h-8 w-8 mx-auto mb-2 text-slate-500" />
              <p className="font-bold text-white">No active sick meal requests</p>
              <p className="text-xs">Students submit health dietary requests via the Android mobile app</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sickMealRequests.map((req) => (
                <div key={req.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-black text-white">
                        {req.vid} {req.studentName ? `(${req.studentName})` : ""}
                      </span>
                      <p className="text-xs font-bold text-rose-400">
                        Block {req.hostelBlock} • Room {req.roomNo}
                      </p>
                    </div>
                    <span className={`badge ${
                      req.status === "DELIVERED" ? "badge-green" :
                      req.status === "OUT_FOR_DELIVERY" ? "badge-blue" :
                      req.status === "PREPARING" ? "badge-amber" : "badge-purple"
                    }`}>
                      {req.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <p><strong className="text-white">Diet Requested:</strong> {req.dietPreference}</p>
                    <p><strong className="text-white">Health Symptoms:</strong> {req.symptoms || "Mild recovery diet"}</p>
                    <p><strong className="text-white">Delivery Method:</strong> {req.deliveryType === "ROOM_DELIVERY" ? "🚪 Hostel Room Delivery" : "🏃 Counter Pickup"}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => updateSickMealStatus(req.id, "PREPARING")}
                      className="flex-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold py-2 hover:bg-amber-500/30 transition"
                    >
                      Preparing
                    </button>
                    <button
                      onClick={() => updateSickMealStatus(req.id, "OUT_FOR_DELIVERY")}
                      className="flex-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold py-2 hover:bg-blue-500/30 transition"
                    >
                      Dispatch
                    </button>
                    <button
                      onClick={() => updateSickMealStatus(req.id, "DELIVERED")}
                      className="flex-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold py-2 hover:bg-emerald-500/30 transition"
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

      {/* ── TAB 6: Food Quality & Democratic Oversight ──────────────────── */}
      {activeTab === "feedback" && (
        <div className="card-glass space-y-6 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
              <ThumbsDown className="h-4 w-4" />
              Student Voice & Accountability
            </div>
            <h3 className="text-base font-black text-white mt-1">Food Quality Rating & Oversight</h3>
            <p className="text-xs text-slate-400">
              If unhappy feedback exceeds 40%, the mess is automatically handed over to the Hostel Oversight Committee
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
              <p className="text-3xl">😋</p>
              <p className="text-xl font-black text-emerald-400 mt-2">{feedbackMetrics.loved}</p>
              <p className="text-xs font-bold text-emerald-300">Loved It</p>
            </div>
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 text-center">
              <p className="text-3xl">😐</p>
              <p className="text-xl font-black text-blue-400 mt-2">{feedbackMetrics.average}</p>
              <p className="text-xs font-bold text-blue-300">Acceptable</p>
            </div>
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-center">
              <p className="text-3xl">😡</p>
              <p className="text-xl font-black text-rose-400 mt-2">{feedbackMetrics.unhappy}</p>
              <p className="text-xs font-bold text-rose-300">Unhappy ({feedbackMetrics.unhappyPct}%)</p>
            </div>
          </div>

          {/* Feedback logs */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white">Student Remarks ({feedbacks.length})</h4>
            {feedbacks.length === 0 ? (
              <p className="text-xs text-slate-400">No ratings submitted for today&apos;s meal yet.</p>
            ) : (
              feedbacks.map((f) => (
                <div key={f.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{f.vid}</span> • <span className="font-semibold text-slate-400">{f.mealType}</span>
                    {f.complaintTags && f.complaintTags.length > 0 && (
                      <span className="ml-2 text-rose-400 font-bold">[{f.complaintTags.join(", ")}]</span>
                    )}
                    {f.comments && <p className="text-slate-300 mt-1 italic">&ldquo;{f.comments}&rdquo;</p>}
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

      {/* ── TAB 7: Plate Waste & Green Coins ────────────────────────────── */}
      {activeTab === "plate_waste" && (
        <div className="card-glass space-y-6 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
              <Leaf className="h-4 w-4" />
              Sustainability Ledger
            </div>
            <h3 className="text-base font-black text-white mt-1">Plate Scanner Waste Audit</h3>
            <p className="text-xs text-slate-400">
              Students scanning clean plates earn +20 Green Coins; leftover waste incurs -15 Green Coins
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs text-slate-400 font-bold uppercase">Total Plates Scanned</p>
              <p className="text-2xl font-black text-white mt-1">{plateStats.total}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
              <p className="text-xs text-emerald-400 font-bold uppercase">Clean Plates (Zero Waste)</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{plateStats.clean}</p>
              <p className="text-xs text-emerald-300 mt-0.5">+{plateStats.coinsAwarded} Coins Awarded 🌿</p>
            </div>
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5">
              <p className="text-xs text-rose-400 font-bold uppercase">Food Wasted</p>
              <p className="text-2xl font-black text-rose-400 mt-1">{plateStats.wasted}</p>
              <p className="text-xs text-rose-300 mt-0.5">-{plateStats.coinsDeducted} Coins Penalized ⚠️</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-black text-white">Recent Disposal Counter Scans</h4>
            {plateLogs.length === 0 ? (
              <p className="text-xs text-slate-400">No plate scans logged today yet.</p>
            ) : (
              plateLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-xl border border-slate-800 p-3 text-xs bg-slate-900/60">
                  <span className="font-bold text-white">{log.vid}</span>
                  <span className={`font-bold ${log.isCleanPlate ? "text-emerald-400" : "text-rose-400"}`}>
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
