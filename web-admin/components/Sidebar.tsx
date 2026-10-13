"use client";

import {
  ChefHat,
  Shield,
  LogOut,
  LayoutDashboard,
  Users,
  Trophy,
  Activity,
  Sparkles,
  Flame,
  Radio,
  Clock
} from "lucide-react";
import MessLogo from "./MessLogo";
import { adminLogout, type AdminUser } from "@/lib/auth";

export type PortalType = "overview" | "kitchen" | "warden" | "students";

interface SidebarProps {
  user: AdminUser;
  activePortal: PortalType;
  onSelectPortal: (portal: PortalType) => void;
  onLogout: () => void;
  onOpenRubricModal: () => void;
  pendingTicketCount?: number;
  pendingSickMealCount?: number;
}

/**
 * Role-aware Command Center Navigation Sidebar.
 * Displays real-time activity indicators, sub-portal routing, and Hackathon Judge Guide trigger.
 */
export default function Sidebar({
  user,
  activePortal,
  onSelectPortal,
  onLogout,
  onOpenRubricModal,
  pendingTicketCount = 0,
  pendingSickMealCount = 0,
}: SidebarProps) {
  const handleLogout = async () => {
    await adminLogout();
    onLogout();
  };

  const navItems = [
    {
      id: "overview" as const,
      label: "Executive Overview",
      icon: Activity,
      description: "Campus KPIs & Crowd Gauge",
      badge: "Live Telemetry",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    },
    {
      id: "kitchen" as const,
      label: "Mess Head Command",
      icon: ChefHat,
      description: "AI Raw Demand & Menus",
      badge: pendingSickMealCount > 0 ? `${pendingSickMealCount} Diets` : undefined,
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    },
    {
      id: "warden" as const,
      label: "Hostel Warden Command",
      icon: Shield,
      description: "SLA Tickets & Emergency Siren",
      badge: pendingTicketCount > 0 ? `${pendingTicketCount} Open` : undefined,
      badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    },
    {
      id: "students" as const,
      label: "Student & Green Economy",
      icon: Users,
      description: "Directory & Eco-Leaderboard",
      badge: undefined,
      badgeColor: "",
    },
  ];

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur-xl z-20">
      {/* Brand & System Title */}
      <div className="flex items-center gap-3.5 border-b border-slate-800/80 px-6 py-5">
        <MessLogo size="md" />
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-black tracking-tight text-white">
              MessWise OS
            </h2>
            <span className="rounded-md bg-brand-500/20 px-1.5 py-0.5 text-[9px] font-black text-brand-400 border border-brand-500/30">
              v2.4
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Campus Operations Center
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-3.5 py-5 overflow-y-auto">
        <div className="flex items-center justify-between px-3 mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Operational Portals
          </p>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePortal === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectPortal(item.id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-all duration-200 group ${
                isActive
                  ? "bg-slate-800/90 text-white shadow-lg border border-slate-700 shadow-slate-900/50"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? "bg-gradient-to-br from-brand-500 to-emerald-600 text-white shadow-md shadow-brand-500/25"
                    : "bg-slate-900 text-slate-400 group-hover:text-slate-200 border border-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p
                    className={`text-xs font-bold truncate ${
                      isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                    }`}
                  >
                    {item.label}
                  </p>
                  {item.badge && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}

        {/* Judge Rubric Pitch Guide Card */}
        <div className="pt-4 mt-4 border-t border-slate-800/80">
          <button
            onClick={onOpenRubricModal}
            className="flex w-full items-center gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-yellow-600/5 p-3.5 text-left transition hover:bg-amber-500/15 hover:border-amber-500/50 group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 group-hover:scale-105 transition-transform">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-black text-amber-300">
                  🏆 Hackathon Rubric Guide
                </p>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Inspect 5 scoring criteria (100% matched)
              </p>
            </div>
          </button>
        </div>
      </nav>

      {/* User Profile & Sign Out */}
      <div className="border-t border-slate-800/80 p-4 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-emerald-600/20 border border-brand-500/30 text-xs font-black text-brand-400">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-slate-800 p-2 text-slate-400 transition hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
