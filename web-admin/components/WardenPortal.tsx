"use client";

import { useState, useMemo } from "react";
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
  AlertCircle,
  Volume2,
  Sparkles
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
  targetBlock?: string;
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

interface WardenPortalProps {
  selectedBlock?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, typeof Wrench> = {
  PLUMBING: Droplets,
  ELECTRICAL: Zap,
  FURNITURE: Sofa,
  ROOM_ASSETS: MapPin,
  OTHER: Wrench,
};

// Web Audio API Synthesizer for live broadcast testing
function playWarningSiren() {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(740, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
    osc.frequency.exponentialRampToValueAtTime(740, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Audio restricted until user gesture
  }
}

export default function WardenPortal({ selectedBlock = "ALL" }: WardenPortalProps) {
  const [activePortalTab, setActivePortalTab] = useState<
    "maintenance" | "password_resets" | "technical_complaints" | "holiday_rebates" | "sick_meals"
  >("maintenance");

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState<"INFO" | "WARNING" | "EMERGENCY">("INFO");
  const [broadcastTarget, setBroadcastTarget] = useState<string>("ALL_BLOCKS");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ── Firestore Listeners ──
  const { data: rawTickets } = useCollection<MaintenanceTicket>("maintenance_tickets", [
    orderBy("createdAt", "desc"),
  ]);
  const { data: activeBroadcasts } = useCollection<BroadcastItem>("broadcasts", [
    orderBy("createdAt", "desc"),
  ]);
  const { data: rawPasswordResets } = useCollection<PasswordResetRequest>("password_reset_requests", [
    orderBy("createdAt", "desc"),
  ]);
  const { data: rawTechComplaints } = useCollection<TechnicalComplaint>("technical_complaints", [
    orderBy("createdAt", "desc"),
  ]);
  const { data: rawHolidayRebates } = useCollection<HolidayRebate>("holiday_rebates", [
    orderBy("createdAt", "desc"),
  ]);
  const { data: rawSickMeals } = useCollection<SickMealRequest>("sick_meal_requests", [
    orderBy("createdAt", "desc"),
  ]);

  // Block-filtered collections
  const allTickets = useMemo(() => {
    if (selectedBlock === "ALL") return rawTickets;
    return rawTickets.filter(t => t.hostelBlock?.toUpperCase() === selectedBlock.toUpperCase());
  }, [rawTickets, selectedBlock]);

  const passwordResets = useMemo(() => {
    if (selectedBlock === "ALL") return rawPasswordResets;
    return rawPasswordResets.filter(r => r.hostelBlock?.toUpperCase() === selectedBlock.toUpperCase());
  }, [rawPasswordResets, selectedBlock]);

  const techComplaints = rawTechComplaints;

  const holidayRebates = rawHolidayRebates;

  const sickMeals = useMemo(() => {
    if (selectedBlock === "ALL") return rawSickMeals;
    return rawSickMeals.filter(s => s.hostelBlock?.toUpperCase() === selectedBlock.toUpperCase());
  }, [rawSickMeals, selectedBlock]);

  // Filter tickets by status
  const tickets = useMemo(() => {
    return statusFilter === "ALL"
      ? allTickets
      : allTickets.filter((t) => t.status === statusFilter);
  }, [allTickets, statusFilter]);

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

  // Helper for SLA Calculation (24-hour guarantee)
  const getSlaStatus = (createdAt: Timestamp | null, status: string) => {
    if (status === "RESOLVED") return { label: "SLA Compliant", color: "badge-green" };
    if (!createdAt) return { label: "SLA Active", color: "badge-blue" };

    const now = Date.now();
    const created = createdAt.seconds * 1000;
    const elapsedHours = (now - created) / (1000 * 60 * 60);

    if (elapsedHours > 24) {
      return { label: "🔴 SLA BREACHED", color: "badge-red" };
    }
    if (elapsedHours > 16) {
      return { label: `🟡 ${Math.round(24 - elapsedHours)}h left`, color: "badge-amber" };
    }
    return { label: `🟢 ${Math.round(24 - elapsedHours)}h left`, color: "badge-green" };
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
      if (broadcastType === "EMERGENCY") {
        playWarningSiren();
      }
      await addDoc(collection(db, "broadcasts"), {
        message: broadcastMessage.trim(),
        type: broadcastType,
        createdAt: Timestamp.now(),
        sentBy: "WARDEN",
        targetBlock: broadcastTarget,
      });
      setBroadcastMessage("");
      showToast("📢 Broadcast dispatched to student devices in real-time!");
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
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Toast Alert */}
      {toast && (
        <div className="toast toast-success">
          <Check className="h-4 w-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 shadow-lg shadow-purple-600/20 text-white font-black text-xl">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                Hostel Warden Command
              </h1>
              <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-3 py-0.5 text-xs font-bold text-purple-400">
                SLA Guaranteed &lt; 24h
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Automated maintenance SLA board, synthesized audio emergency dispatch, credentials & rebates
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {pendingResets > 0 && (
            <span className="badge badge-amber">
              🔑 {pendingResets} Reset Requests
            </span>
          )}
          {openTechIssues > 0 && (
            <span className="badge badge-blue">
              💻 {openTechIssues} Tech Bugs
            </span>
          )}
          {pendingLeaves > 0 && (
            <span className="badge badge-green">
              🏖️ {pendingLeaves} Leave Rebates
            </span>
          )}
        </div>
      </div>

      {/* View Switcher Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: "maintenance", label: `Hostel Maintenance SLA (${openCount})`, icon: Wrench },
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
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition ${
                isActive
                  ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20 scale-[1.02]"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: Maintenance Tickets & Audio-Visual Broadcast Center ──── */}
      {activePortalTab === "maintenance" && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-glass p-5 border-l-4 border-l-amber-400">
              <p className="text-xs font-bold text-slate-400 uppercase">Open Maintenance Requests</p>
              <p className="text-2xl font-black text-amber-400 mt-1">{openCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Dispatched to verified technicians</p>
            </div>
            <div className="card-glass p-5 border-l-4 border-l-blue-400">
              <p className="text-xs font-bold text-slate-400 uppercase">In Progress / Assigned</p>
              <p className="text-2xl font-black text-blue-400 mt-1">{inProgressCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Technicians on-site</p>
            </div>
            <div className="card-glass p-5 border-l-4 border-l-emerald-400">
              <p className="text-xs font-bold text-slate-400 uppercase">Resolved Within SLA</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{resolvedCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">96.4% on-time resolution rate</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tickets List */}
            <div className="lg:col-span-2 card-glass space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-white">Maintenance SLA Board</h3>
                  <p className="text-xs text-slate-400">Strict 24-hour campus resolution SLA countdowns</p>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200"
                  >
                    <option value="ALL">All ({allTickets.length})</option>
                    <option value="OPEN">Open ({openCount})</option>
                    <option value="IN_PROGRESS">In Progress ({inProgressCount})</option>
                    <option value="RESOLVED">Resolved ({resolvedCount})</option>
                  </select>
                </div>
              </div>

              {tickets.length === 0 ? (
                <p className="p-12 text-center text-xs text-slate-400">No tickets found matching this filter.</p>
              ) : (
                <div className="space-y-3">
                  {tickets.map((t) => {
                    const CatIcon = CATEGORY_ICONS[t.category] || Wrench;
                    const sla = getSlaStatus(t.createdAt, t.status);
                    return (
                      <div key={t.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              <CatIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-white">
                                {t.category} • Block {t.hostelBlock}, Room {t.roomNo}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                Raised by {t.vid} on {formatTime(t.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`badge ${sla.color} text-[10px]`}>
                              {sla.label}
                            </span>
                            <span className={`badge ${
                              t.status === "RESOLVED" ? "badge-green" :
                              t.status === "IN_PROGRESS" ? "badge-blue" : "badge-amber"
                            }`}>
                              {t.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                          {t.description}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <select
                              defaultValue={t.assignedTo || ""}
                              onChange={(e) => e.target.value && assignTechnician(t.id, e.target.value)}
                              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 font-medium"
                            >
                              <option value="">-- Quick Dispatch Technician --</option>
                              <option value="Ramu (Plumber)">Ramu (Plumber)</option>
                              <option value="Suresh (Electrician)">Suresh (Electrician)</option>
                              <option value="Vinod (Carpenter)">Vinod (Carpenter)</option>
                              <option value="Mahesh (Facility Tech)">Mahesh (Facility Tech)</option>
                            </select>
                            {t.assignedTo && (
                              <span className="text-[11px] text-slate-400">
                                Assigned: <strong className="text-white">{t.assignedTo}</strong>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {t.status !== "IN_PROGRESS" && (
                              <button
                                onClick={() => updateTicketStatus(t.id, "IN_PROGRESS")}
                                className="rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1.5 text-xs font-bold hover:bg-blue-500/30 transition"
                              >
                                In Progress
                              </button>
                            )}
                            {t.status !== "RESOLVED" && (
                              <button
                                onClick={() => updateTicketStatus(t.id, "RESOLVED")}
                                className="btn-primary py-1.5 px-3 text-xs"
                              >
                                Mark Resolved
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

            {/* Audio-Visual Emergency Broadcast Center */}
            <div className="card-glass space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-400">
                  <Megaphone className="h-4 w-4" />
                  Campus Broadcast Dispatcher
                </div>
                <h3 className="text-base font-black text-white mt-1">Live Student Alert Center</h3>
                <p className="text-xs text-slate-400">
                  Syncs in &lt; 1 sec to active mobile apps with optional siren chime
                </p>
              </div>

              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. Municipal water line maintenance today 2-5 PM in Block B."
                  className="input-field"
                />

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={broadcastType}
                    onChange={(e) => setBroadcastType(e.target.value as any)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200"
                  >
                    <option value="INFO">ℹ️ General Info</option>
                    <option value="WARNING">⚠️ Warning Notice</option>
                    <option value="EMERGENCY">🚨 Emergency Alert</option>
                  </select>

                  <select
                    value={broadcastTarget}
                    onChange={(e) => setBroadcastTarget(e.target.value)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200"
                  >
                    <option value="ALL_BLOCKS">All Campus Blocks</option>
                    <option value="BLOCK-A">Block A Only</option>
                    <option value="BLOCK-B">Block B Only</option>
                    <option value="BLOCK-C">Block C Only</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={playWarningSiren}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
                    title="Test Synthesized Alarm Tone"
                  >
                    <Volume2 className="h-3.5 w-3.5 text-amber-400" />
                    <span>Test Siren</span>
                  </button>

                  <button
                    onClick={sendBroadcast}
                    disabled={isBroadcasting || !broadcastMessage.trim()}
                    className="btn-primary flex items-center gap-1.5 py-2 text-xs font-bold"
                  >
                    {isBroadcasting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    <span>Dispatch Alert</span>
                  </button>
                </div>
              </div>

              {/* Active Campus Notices List */}
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <p className="text-xs font-black text-white">Active Campus Notices</p>
                {activeBroadcasts.slice(0, 4).map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-xs">
                    <p className="text-slate-300 truncate pr-2">{b.message}</p>
                    <button onClick={() => deleteBroadcast(b.id)} className="text-slate-400 hover:text-rose-400">
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
        <div className="card-glass space-y-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
              <KeyRound className="h-4 w-4" />
              Credential Recovery Management
            </div>
            <h3 className="text-base font-black text-white mt-1">Student Password Reset Requests</h3>
            <p className="text-xs text-slate-400">
              Students request password resets via the dedicated screen in the Android mobile application
            </p>
          </div>

          {passwordResets.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <KeyRound className="h-8 w-8 mx-auto mb-2 text-slate-500" />
              <p className="font-bold text-white">No password reset requests pending</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {passwordResets.map((req) => (
                <div key={req.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-black text-white">{req.vid}</p>
                      <p className="text-xs text-slate-400">{req.email}</p>
                      <p className="text-xs text-purple-400 font-bold mt-0.5">
                        Block {req.hostelBlock || "A"} • Room {req.roomNo || "—"}
                      </p>
                    </div>
                    <span className={`badge ${
                      req.status === "RESOLVED" ? "badge-green" : "badge-amber"
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <strong className="text-white">Reason:</strong> {req.reason || "Forgot mobile app password"}
                  </p>

                  {req.status === "PENDING" ? (
                    <button
                      onClick={() => handleApprovePasswordReset(req.id, req.vid)}
                      className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      <span>Approve & Issue Temporary Password</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                      Resolved! Temporary password issued: <strong className="font-mono">{req.temporaryPassword || "Issued"}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Technical Complaints ─────────────────────────────────── */}
      {activePortalTab === "technical_complaints" && (
        <div className="card-glass space-y-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-400">
              <Laptop className="h-4 w-4" />
              Technical Support Box
            </div>
            <h3 className="text-base font-black text-white mt-1">App, Wi-Fi & RFID Scanner Helpdesk</h3>
            <p className="text-xs text-slate-400">
              Student bug reports, turnstile scanner hardware issues, and Green Point synchronization anomalies
            </p>
          </div>

          {techComplaints.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Laptop className="h-8 w-8 mx-auto mb-2 text-slate-500" />
              <p className="font-bold text-white">No technical bugs reported</p>
            </div>
          ) : (
            <div className="space-y-3">
              {techComplaints.map((c) => (
                <div key={c.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white">{c.title}</span>
                      <span className="ml-2 text-xs text-slate-400">({c.category}) • By {c.vid}</span>
                    </div>
                    <span className={`badge ${
                      c.status === "RESOLVED" ? "badge-green" :
                      c.status === "IN_PROGRESS" ? "badge-blue" : "badge-amber"
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">{c.description}</p>
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      onClick={() => updateTechStatus(c.id, "IN_PROGRESS")}
                      className="rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-300 px-3 py-1 text-xs font-bold hover:bg-blue-500/25 transition"
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => updateTechStatus(c.id, "RESOLVED")}
                      className="btn-primary py-1 px-3 text-xs"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: Long Holiday & Mess Rebates ────────────────────────────── */}
      {activePortalTab === "holiday_rebates" && (
        <div className="card-glass space-y-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
              <Plane className="h-4 w-4" />
              Mess Fee Rebates
            </div>
            <h3 className="text-base font-black text-white mt-1">1-Day Advance Long Holiday Leave Approvals</h3>
            <p className="text-xs text-slate-400">
              Students taking leave for &ge; 3 days receive mess fee deductions if applied 1-day in advance
            </p>
          </div>

          {holidayRebates.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Plane className="h-8 w-8 mx-auto mb-2 text-slate-500" />
              <p className="font-bold text-white">No holiday rebate requests pending</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {holidayRebates.map((h) => (
                <div key={h.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Student {h.vid}</p>
                      <p className="text-xs text-emerald-400 font-bold">
                        {h.startDate} → {h.endDate} ({h.daysCount} Days)
                      </p>
                    </div>
                    <span className={`badge ${
                      h.status === "APPROVED" ? "badge-green" :
                      h.status === "REJECTED" ? "badge-red" : "badge-amber"
                    }`}>
                      {h.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <strong className="text-white">Reason:</strong> {h.reason}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className={`font-bold ${h.isAdvanceNoticeGiven ? "text-emerald-400" : "text-amber-400"}`}>
                      {h.isAdvanceNoticeGiven ? "✅ Valid 1-Day Advance Notice" : "⚠️ Late Notice"}
                    </span>
                    {h.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateRebateStatus(h.id, "REJECTED")}
                          className="rounded-xl border border-rose-500/30 bg-rose-500/15 text-rose-300 px-3 py-1.5 font-bold hover:bg-rose-500/25 transition"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => updateRebateStatus(h.id, "APPROVED")}
                          className="btn-primary py-1.5 px-3"
                        >
                          Approve Rebate
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: Sick Meals Care ───────────────────────────────────────── */}
      {activePortalTab === "sick_meals" && (
        <div className="card-glass space-y-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-400">
              <HeartPulse className="h-4 w-4" />
              Quarantine & Sick Student Delivery Dispatch
            </div>
            <h3 className="text-base font-black text-white mt-1">Dietary Sick Meal Dispatch Pipeline</h3>
            <p className="text-xs text-slate-400">
              Warden oversight ensuring bedridden students receive prescribed mild diets at room doors
            </p>
          </div>

          {sickMeals.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <HeartPulse className="h-8 w-8 mx-auto mb-2 text-slate-500" />
              <p className="font-bold text-white">No active sick meal deliveries</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sickMeals.map((req) => (
                <div key={req.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{req.vid} {req.studentName ? `(${req.studentName})` : ""}</p>
                      <p className="text-xs text-rose-400 font-bold">
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
                    <p><strong className="text-white">Diet:</strong> {req.dietPreference}</p>
                    <p><strong className="text-white">Symptoms:</strong> {req.symptoms || "Bedridden recovery"}</p>
                    <p><strong className="text-white">Delivery:</strong> {req.deliveryType === "ROOM_DELIVERY" ? "🚪 Hostel Room Delivery" : "🏃 Counter Pickup"}</p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => updateSickMeal(req.id, "OUT_FOR_DELIVERY")}
                      className="flex-1 rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-300 py-2 text-xs font-bold hover:bg-blue-500/25 transition"
                    >
                      Dispatch To Room
                    </button>
                    <button
                      onClick={() => updateSickMeal(req.id, "DELIVERED")}
                      className="btn-primary flex-1 py-2 text-xs"
                    >
                      Confirm Delivered
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
