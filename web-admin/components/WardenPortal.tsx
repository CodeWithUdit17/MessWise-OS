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

// ── Component ──────────────────────────────────────────────────────────────

/**
 * Hostel Warden Portal — Maintenance & Operations
 *
 * Features:
 * 1. Maintenance SLA Board — all tickets sorted by block/room/urgency
 * 2. Resolution Dispatch — assign technicians, update status
 * 3. Broadcast Dispatcher — emergency campus notices
 */
export default function WardenPortal() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState<"INFO" | "WARNING" | "EMERGENCY">("INFO");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ── Firestore tickets listener ──
  const { data: allTickets, loading } = useCollection<MaintenanceTicket>(
    "maintenance_tickets",
    [orderBy("createdAt", "desc")]
  );

  // ── Firestore broadcasts listener ──
  const { data: activeBroadcasts } = useCollection<BroadcastItem>(
    "broadcasts",
    [orderBy("createdAt", "desc")]
  );

  // Filter tickets
  const tickets =
    statusFilter === "ALL"
      ? allTickets
      : allTickets.filter((t) => t.status === statusFilter);

  // Stats
  const openCount = allTickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = allTickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolvedCount = allTickets.filter((t) => t.status === "RESOLVED").length;

  // ── Ticket Actions ──
  const updateTicketStatus = async (
    ticketDocId: string,
    newStatus: "OPEN" | "IN_PROGRESS" | "RESOLVED"
  ) => {
    try {
      const updates: Record<string, unknown> = { status: newStatus };
      if (newStatus === "RESOLVED") {
        updates.resolvedAt = Timestamp.now();
      }

      await updateDoc(doc(db, "maintenance_tickets", ticketDocId), updates);
      showToast(`✅ Ticket status updated to ${newStatus}`);
    } catch (err) {
      console.error("Failed to update ticket:", err);
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
    } catch (err) {
      console.error("Failed to assign:", err);
    }
  };

  // ── Broadcast ──
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
      showToast("📢 Broadcast sent to all students!");
    } catch (err) {
      console.error("Broadcast failed:", err);
      showToast("❌ Broadcast failed");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const deleteBroadcast = async (broadcastId: string) => {
    try {
      await deleteDoc(doc(db, "broadcasts", broadcastId));
      showToast("🗑️ Broadcast deleted");
    } catch (err) {
      console.error("Failed to delete broadcast:", err);
      showToast("❌ Failed to delete broadcast");
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
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
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && <div className="toast toast-success">{toast}</div>}

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <Shield className="h-5 w-5 text-purple-700" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Hostel Warden Portal
            </h1>
            <p className="text-sm text-slate-500">
              Maintenance SLA Board & Campus Operations
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card border-l-4 border-l-amber-400">
          <div className="stat-label">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            Open Tickets
          </div>
          <p className="stat-value mt-1 text-amber-600">{openCount}</p>
        </div>

        <div className="stat-card border-l-4 border-l-blue-400">
          <div className="stat-label">
            <Clock className="h-3.5 w-3.5 text-blue-500" />
            In Progress
          </div>
          <p className="stat-value mt-1 text-blue-600">{inProgressCount}</p>
        </div>

        <div className="stat-card border-l-4 border-l-emerald-400">
          <div className="stat-label">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Resolved
          </div>
          <p className="stat-value mt-1 text-emerald-600">{resolvedCount}</p>
        </div>
      </div>

      {/* ── Main Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Maintenance SLA Board (2 cols) */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Wrench className="h-5 w-5 text-purple-600" />
                Maintenance SLA Board
              </h2>
              <p className="card-subtitle">
                Student tickets sorted by block, room, and urgency
              </p>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="ALL">All ({allTickets.length})</option>
                <option value="OPEN">Open ({openCount})</option>
                <option value="IN_PROGRESS">In Progress ({inProgressCount})</option>
                <option value="RESOLVED">Resolved ({resolvedCount})</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400">
              <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-300 mb-3" />
              No tickets matching this filter
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="table-header">Ticket</th>
                    <th className="table-header">Location</th>
                    <th className="table-header">Category</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Assigned</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => {
                    const statusConfig = STATUS_CONFIG[ticket.status];
                    const CategoryIcon = CATEGORY_ICONS[ticket.category] || Wrench;

                    return (
                      <tr
                        key={ticket.id}
                        className="border-b border-slate-50 hover:bg-slate-50/60 transition"
                      >
                        <td className="table-cell">
                          <p className="text-xs font-bold text-slate-800">
                            #{ticket.ticketId?.slice(0, 8) || ticket.id.slice(0, 8)}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 max-w-[160px] truncate">
                            {ticket.description}
                          </p>
                        </td>
                        <td className="table-cell">
                          <p className="text-xs font-semibold text-slate-700">
                            Block {ticket.hostelBlock}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Room {ticket.roomNo}
                          </p>
                        </td>
                        <td className="table-cell">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            <CategoryIcon className="h-3.5 w-3.5" />
                            {ticket.category}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className={`badge ${statusConfig.badgeClass}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="table-cell text-xs text-slate-600">
                          {ticket.assignedTo || "—"}
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1">
                            {ticket.status === "OPEN" && (
                              <button
                                onClick={() => assignTechnician(ticket.id, "Rajesh K.")}
                                className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition"
                              >
                                <UserCheck className="inline h-3 w-3 mr-1" />
                                Assign
                              </button>
                            )}
                            {ticket.status === "IN_PROGRESS" && (
                              <button
                                onClick={() => updateTicketStatus(ticket.id, "RESOLVED")}
                                className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
                              >
                                <CheckCircle2 className="inline h-3 w-3 mr-1" />
                                Resolve
                              </button>
                            )}
                            {ticket.status === "RESOLVED" && (
                              <span className="text-[11px] text-emerald-500 font-semibold">
                                ✓ Done
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Broadcast Dispatcher */}
        <div className="card flex flex-col">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Megaphone className="h-5 w-5 text-red-600" />
                Broadcast Dispatcher
              </h2>
              <p className="card-subtitle">
                Emergency campus notices to all students
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {/* Broadcast Type */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-2 block">
                Notice Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { type: "INFO", label: "ℹ️ Info", color: "bg-blue-50 text-blue-800 border-blue-200" },
                    { type: "WARNING", label: "⚠️ Warning", color: "bg-amber-50 text-amber-800 border-amber-200" },
                    { type: "EMERGENCY", label: "🚨 Emergency", color: "bg-red-50 text-red-800 border-red-200" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => setBroadcastType(opt.type)}
                    className={`rounded-xl border-2 py-2.5 text-xs font-bold transition ${
                      broadcastType === opt.type
                        ? `${opt.color} ring-2 ring-offset-1`
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-2 block">
                Message
              </label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="e.g., Water supply will be interrupted in Block-A from 2 PM to 4 PM today for maintenance work."
                className="input-field min-h-[100px] resize-none"
                rows={4}
              />
            </div>

            {/* Quick Templates */}
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 block">
                Quick Templates
              </label>
              <div className="space-y-1.5">
                {[
                  "🍽️ Today's dinner menu has been changed due to ingredient shortage.",
                  "💧 Water supply maintenance in Block-A: 2 PM – 4 PM today.",
                  "⚡ Scheduled power cut in Block-B: 10 AM – 12 PM tomorrow.",
                ].map((template) => (
                  <button
                    key={template}
                    onClick={() => setBroadcastMessage(template)}
                    className="w-full text-left rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-[11px] text-slate-600 hover:bg-slate-100 transition truncate"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={sendBroadcast}
            disabled={isBroadcasting || !broadcastMessage.trim()}
            className="btn-danger flex items-center justify-center gap-2 w-full mt-4"
          >
            {isBroadcasting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isBroadcasting ? "Broadcasting..." : "Send Broadcast"}
          </button>

          {/* Active Broadcasts History */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Live Campus Notices ({activeBroadcasts.length})
              </span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {activeBroadcasts.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 text-center">
                No active broadcasts. Students see standard schedule.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {activeBroadcasts.map((b) => {
                  const badgeColor =
                    b.type === "EMERGENCY"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : b.type === "WARNING"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-blue-50 text-blue-700 border-blue-200";

                  return (
                    <div
                      key={b.id}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeColor}`}
                        >
                          {b.type === "EMERGENCY" ? "🚨 " : b.type === "WARNING" ? "⚠️ " : "📢 "}
                          {b.type}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">
                            {formatTime(b.createdAt)}
                          </span>
                          <button
                            onClick={() => deleteBroadcast(b.id)}
                            title="Delete Broadcast"
                            className="text-slate-400 hover:text-red-600 transition p-0.5 rounded cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-snug">
                        {b.message}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
