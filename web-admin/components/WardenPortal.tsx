"use client";

import { useState } from "react";
import {
  Shield,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  Send,
  Megaphone,
  ChevronDown,
  Loader2,
  MapPin,
  Zap,
  Droplets,
  Sofa,
  Filter,
  Trash2,
  KeyRound,
  Laptop,
  Plane,
  HeartPulse,
  Check,
  XCircle,
  Calendar,
  AlertCircle
} from "lucide-react";
import {
  collection,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCollection } from "@/lib/hooks";

// ── Types ──────────────────────────────────────────────────────────────────

interface MaintenanceTicket {
  id: string;
  ticketId: string;
  vid: string;
  hostelBlock: string;
  roomNo: string;
  category: string;
  description: string;
  photoUrl: string | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  assignedTo: string | null;
  createdAt: Timestamp;
  resolvedAt: Timestamp | null;
}

interface BroadcastItem {
  id: string;
  message: string;
  type: "INFO" | "WARNING" | "EMERGENCY";
  createdAt: Timestamp;
  sentBy: string;
}

interface PasswordResetRequest {
  id: string;
  vid: string;
  email: string;
  hostelBlock: string;
  roomNo: string;
  reason: string;
  status: "PENDING" | "RESOLVED";
  temporaryPassword?: string;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}

interface TechnicalComplaint {
  id: string;
  ticketId: string;
  vid: string;
  title: string;
  category: "APP_BUG" | "MESS_WIFI" | "RFID_SCANNER" | "GREEN_COINS" | "OTHER";
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  assignedTo?: string;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}

interface HolidayRebate {
  id: string;
  rebateId: string;
  vid: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isAdvanceNoticeGiven: boolean;
  createdAt: Timestamp;
}

interface SickMealRequest {
  id: string;
  requestId: string;
  vid: string;
  hostelBlock: string;
  roomNo: string;
  mealType: string;
  dietPreference: string;
  symptoms: string;
  deliveryType: "ROOM_DELIVERY" | "COUNTER_PICKUP";
  status: "REQUESTED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED";
  createdAt: Timestamp;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  OPEN: {
    label: "Open",
    badgeClass: "badge-amber",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    badgeClass: "badge-blue",
    icon: Clock,
    iconColor: "text-blue-500",
  },
  RESOLVED: {
    label: "Resolved",
    badgeClass: "badge-green",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
  },
};

const CATEGORY_ICONS: Record<string, typeof Wrench> = {
  PLUMBING: Droplets,
  ELECTRICAL: Zap,
  FURNITURE: Sofa,
  ROOM_ASSETS: MapPin,
  OTHER: Wrench,
};

export default function WardenPortal() {
  const [activePortalTab, setActivePortalTab] = useState<
    "maintenance" | "password_resets" | "technical_complaints" | "holiday_rebates" | "sick_meals"
  >("maintenance");

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState<"INFO" | "WARNING" | "EMERGENCY">("INFO");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ── Firestore Listeners ──
  const { data: allTickets } = useCollection<MaintenanceTicket>("maintenance_tickets", [
    orderBy("createdAt", "desc"),
  ]);
  const { data: activeBroadcasts } = useCollection<BroadcastItem>("broadcasts", [
    orderBy("createdAt", "desc"),
  ]);
  const { data: passwordResets } = useCollection<PasswordResetRequest>("password_reset_requests", [
    orderBy("createdAt", "desc"),
  ]);
  const { data: techComplaints } = useCollection<TechnicalComplaint>("technical_complaints", [
    orderBy("createdAt", "desc"),
  ]);
  const { data: holidayRebates } = useCollection<HolidayRebate>("holiday_rebates", [
    orderBy("createdAt", "desc"),
  ]);
  const { data: sickMeals } = useCollection<SickMealRequest>("sick_meal_requests", [
    orderBy("createdAt", "desc"),
  ]);

  // Filter tickets
  const tickets =
    statusFilter === "ALL"
      ? allTickets
      : allTickets.filter((t) => t.status === statusFilter);

  // Stats
  const openCount = allTickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = allTickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolvedCount = allTickets.filter((t) => t.status === "RESOLVED").length;
  const pendingResets = passwordResets.filter(r => r.status === "PENDING").length;
  const openTechIssues = techComplaints.filter(t => t.status === "OPEN").length;
  const pendingLeaves = holidayRebates.filter(h => h.status === "PENDING").length;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // ── Maintenance Actions ──
  const updateTicketStatus = async (
    ticketDocId: string,
    newStatus: "OPEN" | "IN_PROGRESS" | "RESOLVED"
  ) => {
    try {
      const updates: Record<string, unknown> = { status: newStatus };
      if (newStatus === "RESOLVED") updates.resolvedAt = Timestamp.now();
      await updateDoc(doc(db, "maintenance_tickets", ticketDocId), updates);
      showToast(`✅ Ticket marked as ${newStatus}`);
    } catch {
      showToast("❌ Failed to update ticket");
    }
  };

  const assignTechnician = async (ticketDocId: string, technician: string) => {
    try {
      await updateDoc(doc(db, "maintenance_tickets", ticketDocId), {
        assignedTo: technician,
        status: "IN_PROGRESS",
      });
      showToast(`✅ Assigned to ${technician}`);
    } catch {
      showToast("❌ Assignment failed");
    }
  };

  // ── Broadcast Actions ──
  const sendBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    setIsBroadcasting(true);
    try {
      await addDoc(collection(db, "broadcasts"), {
        message: broadcastMessage.trim(),
        type: broadcastType,
        createdAt: Timestamp.now(),
        sentBy: "WARDEN",
      });
      setBroadcastMessage("");
      showToast("📢 Broadcast dispatched to all students!");
    } catch {
      showToast("❌ Broadcast failed");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const deleteBroadcast = async (id: string) => {
    try {
      await deleteDoc(doc(db, "broadcasts", id));
      showToast("🗑️ Broadcast removed");
    } catch {
      showToast("❌ Failed to delete");
    }
  };

  // ── Password Reset Actions ──
  const handleApprovePasswordReset = async (reqId: string, vid: string) => {
    try {
      const tempPass = `MessWise@${Math.floor(1000 + Math.random() * 9000)}`;
      await updateDoc(doc(db, "password_reset_requests", reqId), {
        status: "RESOLVED",
        temporaryPassword: tempPass,
        resolvedAt: Timestamp.now(),
      });
      showToast(`🔑 Password reset approved for ${vid}! Temp Password: ${tempPass}`);
    } catch {
      showToast("❌ Failed to resolve password reset");
    }
  };

  // ── Technical Complaint Actions ──
  const updateTechStatus = async (docId: string, status: TechnicalComplaint["status"]) => {
    try {
      await updateDoc(doc(db, "technical_complaints", docId), {
        status,
        resolvedAt: status === "RESOLVED" ? Timestamp.now() : null
      });
      showToast(`💻 Technical complaint updated to ${status}`);
    } catch {
      showToast("❌ Update failed");
    }
  };

  // ── Holiday Rebate Actions ──
  const updateRebateStatus = async (docId: string, status: "APPROVED" | "REJECTED") => {
    try {
      await updateDoc(doc(db, "holiday_rebates", docId), { status });
      showToast(`🏖️ Holiday leave rebate marked as ${status}`);
    } catch {
      showToast("❌ Update failed");
    }
  };

  // ── Sick Meal Status ──
  const updateSickMeal = async (docId: string, status: SickMealRequest["status"]) => {
    try {
      await updateDoc(doc(db, "sick_meal_requests", docId), { status });
      showToast(`🥣 Sick meal marked as ${status.replace(/_/g, " ")}`);
    } catch {
      showToast("❌ Update failed");
    }
  };

  const formatTime = (ts: Timestamp | null) => {
    if (!ts) return "—";
    return new Date(ts.seconds * 1000).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-5 py-3 text-sm font-bold shadow-2xl border border-slate-700 animate-fade-in">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 border border-purple-200 shadow-sm">
            <Shield className="h-6 w-6 text-purple-700" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Hostel Warden Operations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Hostel maintenance, student credential management, technical helpdesk & holiday rebates
            </p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {pendingResets > 0 && (
            <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-black border border-amber-200">
              🔑 {pendingResets} Reset Requests
            </span>
          )}
          {openTechIssues > 0 && (
            <span className="rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-black border border-blue-200">
              💻 {openTechIssues} Tech Bugs
            </span>
          )}
          {pendingLeaves > 0 && (
            <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-black border border-emerald-200">
              🏖️ {pendingLeaves} Leave Rebates
            </span>
          )}
        </div>
      </div>

      {/* ── View Switcher Navigation Tabs ──────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        {[
          { id: "maintenance", label: `Hostel Maintenance (${openCount})`, icon: Wrench },
          { id: "password_resets", label: `🔑 Password Resets (${pendingResets})`, icon: KeyRound },
          { id: "technical_complaints", label: `💻 Tech Helpdesk (${openTechIssues})`, icon: Laptop },
          { id: "holiday_rebates", label: `🏖️ Holiday Rebates (${pendingLeaves})`, icon: Plane },
          { id: "sick_meals", label: `🥣 Sick Meal Delivery (${sickMeals.filter(s => s.status !== "DELIVERED").length})`, icon: HeartPulse },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activePortalTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActivePortalTab(t.id as any)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-black transition ${
                isActive
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20 scale-[1.02]"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: Maintenance Tickets & Broadcasts ──────────────────────── */}
      {activePortalTab === "maintenance" && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card border-l-4 border-l-amber-400 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">Open Tickets</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{openCount}</p>
            </div>
            <div className="stat-card border-l-4 border-l-blue-400 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">In Progress</p>
              <p className="text-2xl font-black text-blue-600 mt-1">{inProgressCount}</p>
            </div>
            <div className="stat-card border-l-4 border-l-emerald-400 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">Resolved</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tickets List */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-900">Maintenance SLA Board</h3>
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
                  >
                    <option value="ALL">All ({allTickets.length})</option>
                    <option value="OPEN">Open ({openCount})</option>
                    <option value="IN_PROGRESS">In Progress ({inProgressCount})</option>
                    <option value="RESOLVED">Resolved ({resolvedCount})</option>
                  </select>
                </div>
              </div>

              {tickets.length === 0 ? (
                <p className="p-8 text-center text-xs text-slate-400">No tickets found in this category.</p>
              ) : (
                <div className="space-y-3">
                  {tickets.map((t) => {
                    const CatIcon = CATEGORY_ICONS[t.category] || Wrench;
                    return (
                      <div key={t.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                              <CatIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800">
                                {t.category} • Block {t.hostelBlock}, Room {t.roomNo}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                Raised by {t.vid} on {formatTime(t.createdAt)}
                              </p>
                            </div>
                          </div>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                            t.status === "RESOLVED" ? "bg-emerald-100 text-emerald-800" :
                            t.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {t.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                          {t.description}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Assign technician..."
                              defaultValue={t.assignedTo || ""}
                              onBlur={(e) => e.target.value && assignTechnician(t.id, e.target.value)}
                              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            {t.status !== "IN_PROGRESS" && (
                              <button
                                onClick={() => updateTicketStatus(t.id, "IN_PROGRESS")}
                                className="rounded-xl bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 text-xs font-bold hover:bg-blue-100 transition"
                              >
                                In Progress
                              </button>
                            )}
                            {t.status !== "RESOLVED" && (
                              <button
                                onClick={() => updateTicketStatus(t.id, "RESOLVED")}
                                className="rounded-xl bg-emerald-600 text-white px-3 py-1.5 text-xs font-black shadow-sm hover:bg-emerald-700 transition"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Broadcast Dispatcher */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-600">
                  <Megaphone className="h-4 w-4" />
                  Campus Broadcast
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">Live Announcements</h3>
                <p className="text-xs text-slate-500">
                  Broadcasts render immediately on the student mobile app top banner
                </p>
              </div>

              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. Water supply maintenance today from 2 PM to 4 PM in Block B."
                  className="w-full rounded-2xl border border-slate-200 p-3.5 text-xs text-slate-800"
                />

                <div className="flex items-center justify-between">
                  <select
                    value={broadcastType}
                    onChange={(e) => setBroadcastType(e.target.value as any)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
                  >
                    <option value="INFO">ℹ️ General Info</option>
                    <option value="WARNING">⚠️ Warning Notice</option>
                    <option value="EMERGENCY">🚨 Emergency Alert</option>
                  </select>

                  <button
                    onClick={sendBroadcast}
                    disabled={isBroadcasting || !broadcastMessage.trim()}
                    className="flex items-center gap-1.5 rounded-2xl bg-purple-600 text-white px-4 py-2 text-xs font-black hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {isBroadcasting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Broadcast
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100">
                <p className="text-xs font-black text-slate-700">Active Campus Notices</p>
                {activeBroadcasts.slice(0, 4).map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
                    <p className="text-slate-700 truncate pr-2">{b.message}</p>
                    <button onClick={() => deleteBroadcast(b.id)} className="text-slate-400 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Student Password Reset Requests ───────────────────────── */}
      {activePortalTab === "password_resets" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600">
              <KeyRound className="h-4 w-4" />
              Credential Management
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">Student Password Reset Requests</h3>
            <p className="text-xs text-slate-500">
              Students request password resets via the dedicated screen in the Android APK
            </p>
          </div>

          {passwordResets.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <KeyRound className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="font-bold">No password reset requests pending</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {passwordResets.map((req) => (
                <div key={req.id} className="rounded-2xl border border-slate-200 p-5 space-y-3 bg-slate-50/60">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">{req.vid}</p>
                      <p className="text-xs text-slate-500">{req.email}</p>
                      <p className="text-xs text-purple-700 font-bold mt-0.5">
                        Block {req.hostelBlock || "A"} • Room {req.roomNo || "—"}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                      req.status === "RESOLVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                    <strong className="text-slate-800">Reason:</strong> {req.reason || "Forgot mobile app password"}
                  </p>

                  {req.temporaryPassword && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-bold">
                      🔑 Temporary Password: <span className="font-mono">{req.temporaryPassword}</span>
                    </div>
                  )}

                  {req.status === "PENDING" && (
                    <button
                      onClick={() => handleApprovePasswordReset(req.id, req.vid)}
                      className="w-full rounded-xl bg-purple-600 text-white text-xs font-black py-2.5 hover:bg-purple-700 transition"
                    >
                      Approve & Reset Password
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Technical Helpdesk (Complaint Box) ───────────────────── */}
      {activePortalTab === "technical_complaints" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-600">
              <Laptop className="h-4 w-4" />
              IT & Digital Helpdesk
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">Technical Complaints Box</h3>
            <p className="text-xs text-slate-500">
              Issues submitted by students regarding mobile app glitches, WiFi, RFID cards, or Green Coins
            </p>
          </div>

          {techComplaints.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Laptop className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="font-bold">No technical complaints filed</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {techComplaints.map((c) => (
                <div key={c.id} className="rounded-2xl border border-slate-200 p-5 space-y-3 bg-slate-50/60">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-md bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-black uppercase">
                        {c.category.replace(/_/g, " ")}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 mt-1">{c.title}</h4>
                      <p className="text-[11px] text-slate-400">Submitted by {c.vid} • {formatTime(c.createdAt)}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                      c.status === "RESOLVED" ? "bg-emerald-100 text-emerald-800" :
                      c.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                    {c.description}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => updateTechStatus(c.id, "IN_PROGRESS")}
                      className="flex-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold py-2 hover:bg-blue-100 transition"
                    >
                      Investigate
                    </button>
                    <button
                      onClick={() => updateTechStatus(c.id, "RESOLVED")}
                      className="flex-1 rounded-xl bg-emerald-600 text-white text-xs font-black py-2 hover:bg-emerald-700 transition"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: Holiday Rebates (1-Day Advance) ────────────────────────── */}
      {activePortalTab === "holiday_rebates" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600">
              <Plane className="h-4 w-4" />
              Billing & Leave Applications
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">1-Day Advance Holiday & Mess Fee Rebates</h3>
            <p className="text-xs text-slate-500">
              Applications submitted by students ≥ 1 day in advance for long leaves (auto-excludes from kitchen headcount)
            </p>
          </div>

          {holidayRebates.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Plane className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="font-bold">No holiday rebate applications</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {holidayRebates.map((h) => (
                <div key={h.id} className="rounded-2xl border border-slate-200 p-5 space-y-3 bg-slate-50/60">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">{h.vid}</p>
                      <p className="text-xs font-bold text-slate-600">
                        {h.startDate} → {h.endDate} ({h.daysCount} Days)
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                      h.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                      h.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {h.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded-xl">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Advance notice verified (≥ 1 day prior to departure)</span>
                  </div>

                  <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                    <strong className="text-slate-800">Reason:</strong> {h.reason}
                  </p>

                  {h.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateRebateStatus(h.id, "APPROVED")}
                        className="flex-1 rounded-xl bg-emerald-600 text-white text-xs font-black py-2.5 hover:bg-emerald-700 transition"
                      >
                        Approve Rebate
                      </button>
                      <button
                        onClick={() => updateRebateStatus(h.id, "REJECTED")}
                        className="flex-1 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold py-2.5 hover:bg-slate-300 transition"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: Sick Meal Delivery Dispatch ───────────────────────────── */}
      {activePortalTab === "sick_meals" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-600">
              <HeartPulse className="h-4 w-4" />
              Hostel Health Dispatch
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">Hostel Room Sick Meal Delivery</h3>
            <p className="text-xs text-slate-500">
              Deliver hot recovery meals (Khichdi, curd, mild soup) directly to student rooms
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sickMeals.map((s) => (
              <div key={s.id} className="rounded-2xl border border-slate-200 p-5 space-y-3 bg-slate-50/60">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-sm font-black text-slate-900">{s.vid}</span>
                    <p className="text-xs font-black text-rose-700">
                      Block {s.hostelBlock} • Room {s.roomNo}
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {s.status.replace(/_/g, " ")}
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                  <strong>Requested:</strong> {s.dietPreference}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => updateSickMeal(s.id, "OUT_FOR_DELIVERY")}
                    className="flex-1 rounded-xl bg-blue-600 text-white text-xs font-bold py-2 hover:bg-blue-700 transition"
                  >
                    Dispatch to Room
                  </button>
                  <button
                    onClick={() => updateSickMeal(s.id, "DELIVERED")}
                    className="flex-1 rounded-xl bg-emerald-600 text-white text-xs font-bold py-2 hover:bg-emerald-700 transition"
                  >
                    Mark Handed Over
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
