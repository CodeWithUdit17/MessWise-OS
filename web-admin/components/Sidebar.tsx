"use client";

import {
  ChefHat,
  Shield,
  LogOut,
  LayoutDashboard,
  Users,
} from "lucide-react";
import MessLogo from "./MessLogo";
import { adminLogout, type AdminUser } from "@/lib/auth";

interface SidebarProps {
  user: AdminUser;
  activePortal: "kitchen" | "warden" | "students";
  onSelectPortal: (portal: "kitchen" | "warden" | "students") => void;
  onLogout: () => void;
}

/**
 * Role-aware navigation sidebar for the admin dashboard.
 * Switches between Kitchen (Mess Head) and Warden portals.
 */
export default function Sidebar({
  user,
  activePortal,
  onSelectPortal,
  onLogout,
}: SidebarProps) {
  const handleLogout = async () => {
    await adminLogout();
    onLogout();
  };

  const navItems = [
    {
      id: "kitchen" as const,
      label: "Mess Head Portal",
      icon: ChefHat,
      description: "Kitchen & Menu Operations",
    },
    {
      id: "warden" as const,
      label: "Warden Portal",
      icon: Shield,
      description: "Maintenance & Operations",
    },
    {
      id: "students" as const,
      label: "Student Management",
      icon: Users,
      description: "Register & Manage Students",
    },
  ];

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-slate-200 bg-white">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
        <MessLogo size="md" />
        <div>
          <h2 className="text-sm font-black tracking-tight text-slate-900">
            MessWise OS
          </h2>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Admin Dashboard
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Portals
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePortal === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectPortal(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                isActive
                  ? "bg-brand-50 text-brand-700 shadow-sm border border-brand-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  isActive
                    ? "bg-brand-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p
                  className={`text-sm font-bold ${
                    isActive ? "text-brand-800" : "text-slate-700"
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-[10px] text-slate-400">{item.description}</p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="border-t border-slate-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{user.name}</p>
              <p className="text-[10px] text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
