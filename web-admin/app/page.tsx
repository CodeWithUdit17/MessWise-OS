"use client";

import { useEffect, useState } from "react";
import { onAuthChange, getAdminProfile, type AdminUser } from "@/lib/auth";
import Sidebar, { type PortalType } from "@/components/Sidebar";
import LoginPage from "./login/page";
import ExecutiveOverview from "@/components/ExecutiveOverview";
import KitchenPortal from "@/components/KitchenPortal";
import WardenPortal from "@/components/WardenPortal";
import StudentsPortal from "@/components/StudentsPortal";
import JudgeRubricModal from "@/components/JudgeRubricModal";
import DemoScenarioController from "@/components/DemoScenarioController";
import { useCollection } from "@/lib/hooks";
import { orderBy, Timestamp } from "firebase/firestore";
import {
  Building2,
  Radio,
  Trophy,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ChevronDown
} from "lucide-react";

interface MaintenanceTicket {
  id: string;
  status: string;
}

interface SickMealRequest {
  id: string;
  status: string;
}

export default function HomePage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePortal, setActivePortal] = useState<PortalType>("overview");
  const [selectedBlock, setSelectedBlock] = useState<string>("ALL");
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [globalToast, setGlobalToast] = useState<string | null>(null);

  // Real-time telemetry badges for Sidebar
  const { data: tickets } = useCollection<MaintenanceTicket>("maintenance_tickets");
  const { data: sickMeals } = useCollection<SickMealRequest>("sick_meal_requests");

  const openTicketsCount = tickets.filter((t) => t.status === "OPEN").length;
  const activeSickMealsCount = sickMeals.filter((s) => s.status !== "DELIVERED").length;

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getAdminProfile(firebaseUser.uid);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const showGlobalToast = (msg: string) => {
    setGlobalToast(msg);
    setTimeout(() => setGlobalToast(null), 4500);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Initializing MessWise OS...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={setUser} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Real-time Global Toast */}
      {globalToast && (
        <div className="toast toast-success flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{globalToast}</span>
        </div>
      )}

      {/* Navigation Sidebar */}
      <Sidebar
        user={user}
        activePortal={activePortal}
        onSelectPortal={setActivePortal}
        onLogout={() => setUser(null)}
        onOpenRubricModal={() => setIsRubricModalOpen(true)}
        pendingTicketCount={openTicketsCount}
        pendingSickMealCount={activeSickMealsCount}
      />

      {/* Main Command Center Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Command Telemetry Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-6 backdrop-blur-md z-10">
          {/* Multi-Tenant Block Filter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 shadow-sm">
              <Building2 className="h-4 w-4 text-brand-400" />
              <span className="text-xs font-bold text-slate-400">Hostel Filter:</span>
              <select
                value={selectedBlock}
                onChange={(e) => setSelectedBlock(e.target.value)}
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-white">🌐 All Campus Blocks (Global)</option>
                <option value="BLOCK-A" className="bg-slate-900 text-white">🏢 Block-A (Aryabhatta)</option>
                <option value="BLOCK-B" className="bg-slate-900 text-white">🏢 Block-B (Bhaskara)</option>
                <option value="BLOCK-C" className="bg-slate-900 text-white">🏢 Block-C (Gargi)</option>
              </select>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-3">
            {/* Live Firestore Sync Status */}
            <div className="hidden md:flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Firestore Sync: CONNECTED</span>
            </div>

            {/* 1-Click Judge Demo Deck Simulator */}
            <DemoScenarioController onNotify={showGlobalToast} />

            {/* Hackathon Rubric Guide Button */}
            <button
              onClick={() => setIsRubricModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition hover:scale-105 active:scale-95"
            >
              <Trophy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">🏆 Rubric Guide</span>
            </button>
          </div>
        </header>

        {/* Dynamic Portal Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-950 to-slate-900">
          {activePortal === "overview" && (
            <ExecutiveOverview
              selectedBlock={selectedBlock}
              onNavigatePortal={setActivePortal}
            />
          )}
          {activePortal === "kitchen" && (
            <KitchenPortal selectedBlock={selectedBlock} />
          )}
          {activePortal === "warden" && (
            <WardenPortal selectedBlock={selectedBlock} />
          )}
          {activePortal === "students" && (
            <StudentsPortal selectedBlock={selectedBlock} />
          )}
        </main>
      </div>

      {/* Judge Rubric Pitch Guide Modal */}
      <JudgeRubricModal
        isOpen={isRubricModalOpen}
        onClose={() => setIsRubricModalOpen(false)}
        onNavigatePortal={setActivePortal}
      />
    </div>
  );
}
