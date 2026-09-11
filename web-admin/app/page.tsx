"use client";

import { useEffect, useState } from "react";
import { onAuthChange, getAdminProfile, type AdminUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import LoginPage from "./login/page";
import KitchenPortal from "@/components/KitchenPortal";
import WardenPortal from "@/components/WardenPortal";
import StudentsPortal from "@/components/StudentsPortal";

/**
 * Root page — handles auth gating and portal routing.
 * If not logged in → shows login.
 * If logged in as admin → shows sidebar + selected portal.
 */
export default function HomePage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePortal, setActivePortal] = useState<"kitchen" | "warden" | "students">("kitchen");

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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">
            Loading MessWise OS...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={setUser} />;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        user={user}
        activePortal={activePortal}
        onSelectPortal={setActivePortal}
        onLogout={() => setUser(null)}
      />
      <main className="flex-1 overflow-y-auto">
        {activePortal === "kitchen" && <KitchenPortal />}
        {activePortal === "warden" && <WardenPortal />}
        {activePortal === "students" && <StudentsPortal />}
      </main>
    </div>
  );
}
