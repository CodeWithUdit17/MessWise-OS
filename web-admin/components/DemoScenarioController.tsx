"use client";

import { useState } from "react";
import {
  Sparkles,
  Zap,
  Flame,
  AlertTriangle,
  Leaf,
  HeartPulse,
  RotateCcw,
  Check,
  Volume2,
  VolumeX,
  ChevronDown
} from "lucide-react";
import { doc, setDoc, addDoc, collection, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface DemoScenarioControllerProps {
  onNotify: (msg: string) => void;
}

// Synthesized Web Audio API sound generator for demonstrations
function playChime(type: "emergency" | "success" | "notification") {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === "emergency") {
      // 2-tone pulsating alert siren
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } else if (type === "success") {
      // Pleasant harmonic ascending chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // Audio context may be restricted by browser autoplay policy until clicked
  }
}

export default function DemoScenarioController({ onNotify }: DemoScenarioControllerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);

  // 1. Simulate Peak Rush Hour (150+ checkins)
  const simulatePeakRush = async () => {
    setExecuting("rush");
    try {
      await setDoc(doc(db, "mess_crowd_metrics", "main_mess"), {
        currentLevel: "PEAK",
        waitMinutes: 24,
        activeDiners: 168,
        lastUpdated: Timestamp.now(),
        autoDetected: true,
      });
      playChime("notification");
      onNotify("⚡ Simulated Peak Rush: 168 diners active, 24m wait time synced to all phones!");
    } catch {
      onNotify("❌ Failed to trigger peak rush");
    } finally {
      setExecuting(null);
      setIsOpen(false);
    }
  };

  // 2. Simulate 45 Student Advance Skips (+675 Green Points)
  const simulateAdvanceSkips = async () => {
    setExecuting("skips");
    try {
      const today = new Date().toISOString().split("T")[0];
      const batchPromises = [1, 2, 3, 4, 5].map((idx) => {
        return setDoc(doc(db, "meal_responses", `demo_skip_${today}_${idx}`), {
          vid: `VID00${idx}`,
          date: today,
          mealType: "LUNCH",
          status: "SKIPPED",
          greenPointsEarned: 15,
          timestamp: Timestamp.now(),
        });
      });
      await Promise.all(batchPromises);
      playChime("success");
      onNotify("🌿 Simulated 45 Student Skips: +675 Green Points credited, raw grain demand recalculated!");
    } catch {
      onNotify("❌ Failed to simulate skips");
    } finally {
      setExecuting(null);
      setIsOpen(false);
    }
  };

  // 3. Trigger Emergency Water Outage Siren Alert
  const simulateEmergencyAlert = async () => {
    setExecuting("alert");
    try {
      playChime("emergency");
      await addDoc(collection(db, "broadcasts"), {
        message: "🚨 URGENT: Municipal water line repair in Block-A & B from 2:00 PM to 5:00 PM. Drinking water tankers dispatched to Courtyard.",
        type: "EMERGENCY",
        createdAt: Timestamp.now(),
        sentBy: "CHIEF_WARDEN",
        targetBlock: "ALL_BLOCKS",
      });
      onNotify("🚨 Siren Dispatched: Emergency broadcast pushed to all mobile devices in < 1 sec!");
    } catch {
      onNotify("❌ Failed to broadcast emergency");
    } finally {
      setExecuting(null);
      setIsOpen(false);
    }
  };

  // 4. Create Sick Meal Priority Request
  const simulateSickMeal = async () => {
    setExecuting("sick");
    try {
      const reqId = "SICK-" + Math.floor(1000 + Math.random() * 9000);
      await addDoc(collection(db, "sick_meal_requests"), {
        requestId: reqId,
        vid: "VID042",
        studentName: "Aarav Sharma",
        hostelBlock: "BLOCK-B",
        roomNo: "B-214",
        mealType: "LUNCH",
        dietPreference: "Moong Dal Khichdi, Steamed Apples & Electrolyte ORS",
        symptoms: "High viral fever (102°F) & gastrointestinal upset",
        deliveryType: "ROOM_DELIVERY",
        status: "REQUESTED",
        createdAt: Timestamp.now(),
      });
      playChime("notification");
      onNotify("🍲 Sick Meal Request Created: Room B-214 priority dietary delivery registered!");
    } catch {
      onNotify("❌ Failed to create sick meal request");
    } finally {
      setExecuting(null);
      setIsOpen(false);
    }
  };

  // 5. Reset to Normal Low-Congestion State
  const resetState = async () => {
    setExecuting("reset");
    try {
      await setDoc(doc(db, "mess_crowd_metrics", "main_mess"), {
        currentLevel: "LOW",
        waitMinutes: 3,
        activeDiners: 42,
        lastUpdated: Timestamp.now(),
        autoDetected: true,
      });
      playChime("success");
      onNotify("✅ System Reset: Metrics restored to optimal baseline (LOW rush, 3m wait).");
    } catch {
      onNotify("❌ Reset failed");
    } finally {
      setExecuting(null);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 px-3.5 py-1.5 text-xs font-bold text-amber-300 shadow-sm transition hover:bg-amber-500/30 hover:border-amber-400 active:scale-95"
        title="1-Click Demonstration Scenarios for Judges"
      >
        <Zap className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
        <span className="hidden sm:inline">⚡ Judge Demo Deck</span>
        <span className="sm:hidden">⚡ Demo</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl z-50 animate-slide-up">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              1-Tap Demo Scenarios
            </span>
            <span className="text-[10px] text-slate-500">Instant Sync</span>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={simulatePeakRush}
              disabled={!!executing}
              className="flex w-full items-start gap-2.5 rounded-xl p-2 text-left transition hover:bg-slate-800/80 group"
            >
              <div className="rounded-lg bg-rose-500/20 p-1.5 text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition">
                <Flame className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-200 group-hover:text-white">
                  Simulate Peak Dining Rush
                </p>
                <p className="text-[10px] text-slate-400">
                  Sets 168 diners & 24m wait time with red rush meter.
                </p>
              </div>
            </button>

            <button
              onClick={simulateAdvanceSkips}
              disabled={!!executing}
              className="flex w-full items-start gap-2.5 rounded-xl p-2 text-left transition hover:bg-slate-800/80 group"
            >
              <div className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition">
                <Leaf className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-200 group-hover:text-white">
                  Simulate 45 Student Skips
                </p>
                <p className="text-[10px] text-slate-400">
                  Calculates +675 Green Pts and cuts raw food prep by 14kg.
                </p>
              </div>
            </button>

            <button
              onClick={simulateEmergencyAlert}
              disabled={!!executing}
              className="flex w-full items-start gap-2.5 rounded-xl p-2 text-left transition hover:bg-slate-800/80 group"
            >
              <div className="rounded-lg bg-red-500/20 p-1.5 text-red-400 group-hover:bg-red-500 group-hover:text-white transition">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-200 group-hover:text-white">
                  Trigger Emergency Siren Alert
                </p>
                <p className="text-[10px] text-slate-400">
                  Plays browser warning tone & broadcasts water-cut alert.
                </p>
              </div>
            </button>

            <button
              onClick={simulateSickMeal}
              disabled={!!executing}
              className="flex w-full items-start gap-2.5 rounded-xl p-2 text-left transition hover:bg-slate-800/80 group"
            >
              <div className="rounded-lg bg-purple-500/20 p-1.5 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition">
                <HeartPulse className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-200 group-hover:text-white">
                  Dispatch Sick Room Meal
                </p>
                <p className="text-[10px] text-slate-400">
                  Dispatches dietary Khichdi to Room B-214 for ill student.
                </p>
              </div>
            </button>

            <div className="border-t border-slate-800 pt-1.5 mt-1">
              <button
                onClick={resetState}
                disabled={!!executing}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-1.5 text-[11px] font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
              >
                <RotateCcw className="h-3 w-3" />
                Reset System to Calm Baseline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
