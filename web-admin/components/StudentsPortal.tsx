"use client";

import { useState, useMemo } from "react";
import {
  UserPlus,
  Users,
  Search,
  Trophy,
  Award,
  Leaf,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { db, firebaseConfig } from "@/lib/firebase";
import { doc, setDoc, updateDoc, increment } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { useCollection } from "@/lib/hooks";

interface StudentUser {
  id: string;
  vid: string;
  name: string;
  email: string;
  role: string;
  hostelBlock: string;
  roomNo: string;
  greenPoints: number;
}

interface StudentsPortalProps {
  selectedBlock?: string;
}

export default function StudentsPortal({ selectedBlock = "ALL" }: StudentsPortalProps) {
  const [activeTab, setActiveTab] = useState<"directory" | "leaderboard" | "register">("directory");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // ── Firestore Listeners for Users ──
  const { data: allUsers, loading: usersLoading } = useCollection<StudentUser>("users");

  // Filter students only (role !== "ADMIN" or role === "STUDENT")
  const students = useMemo(() => {
    return allUsers.filter((u) => u.role !== "ADMIN");
  }, [allUsers]);

  // Filter by block & search query
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchBlock =
        selectedBlock === "ALL" ||
        s.hostelBlock?.toUpperCase() === selectedBlock.toUpperCase();
      const matchSearch =
        !searchQuery ||
        s.vid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.roomNo?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBlock && matchSearch;
    });
  }, [students, selectedBlock, searchQuery]);

  // Top Leaderboard
  const topStudents = useMemo(() => {
    return [...students]
      .sort((a, b) => (b.greenPoints || 0) - (a.greenPoints || 0))
      .slice(0, 10);
  }, [students]);

  // ── Registration Form State ──
  const [formData, setFormData] = useState({
    vid: "",
    name: "",
    email: "",
    password: "",
    hostelBlock: selectedBlock !== "ALL" ? selectedBlock : "A",
    roomNo: "",
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Award Bonus Points
  const handleAwardBonusPoints = async (uid: string, studentName: string, points: number) => {
    try {
      await updateDoc(doc(db, "users", uid), {
        greenPoints: increment(points),
      });
      showToast(`🌟 Awarded +${points} Green Points to ${studentName}!`);
    } catch {
      showToast("❌ Failed to award bonus points");
    }
  };

  // Handle Registration Submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError(null);
    setRegisterSuccess(false);

    try {
      // 1. Secondary Firebase app
      const secondaryApp =
        getApps().find((app) => app.name === "StudentCreatorApp") ||
        initializeApp(firebaseConfig, "StudentCreatorApp");

      const secondaryAuth = getAuth(secondaryApp);

      // 2. Create User
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email,
        formData.password
      );

      const uid = userCredential.user.uid;

      // 3. Write Profile in Firestore
      await setDoc(doc(db, "users", uid), {
        vid: formData.vid.trim().toUpperCase(),
        email: formData.email.trim(),
        name: formData.name.trim(),
        role: "STUDENT",
        hostelBlock: formData.hostelBlock.trim().toUpperCase(),
        roomNo: formData.roomNo.trim(),
        greenPoints: 25, // Welcome bonus
      });

      // 4. Sign Out Secondary App
      await signOut(secondaryAuth);

      setRegisterSuccess(true);
      showToast(`✅ Student ${formData.name} registered with 25 Welcome Points!`);
      setFormData({
        vid: "",
        name: "",
        email: "",
        password: "",
        hostelBlock: selectedBlock !== "ALL" ? selectedBlock : "A",
        roomNo: "",
      });
    } catch (err: unknown) {
      const error = err as Error;
      setRegisterError(error.message || "Failed to create student account.");
    } finally {
      setRegisterLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["VID", "Name", "Email", "Hostel Block", "Room No", "Green Points"];
    const rows = filteredStudents.map((s) => [
      s.vid || "",
      `"${s.name || ""}"`,
      s.email || "",
      s.hostelBlock || "",
      s.roomNo || "",
      s.greenPoints || 0,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MessWise_Students_${selectedBlock}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 p-6 lg:p-10 max-w-7xl mx-auto animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="toast toast-success">
          <Sparkles className="h-4 w-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-purple-500/10 border border-purple-500/30 px-3 py-0.5 text-xs font-bold text-purple-400">
              CAMPUS RESIDENCY & INCENTIVE LEDGER
            </span>
            <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs text-slate-400">
              {students.length} Registered Students
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-brand-400" />
            Student Directory & Green Economy
          </h1>
          <p className="text-xs lg:text-sm text-slate-400 mt-1">
            Manage student campus credentials, monitor real-time Green Points balances, and incentivize clean plate habits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white"
          >
            <Download className="h-4 w-4 text-brand-400" />
            <span>Export Roster</span>
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Enroll Student</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("directory")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all ${
            activeTab === "directory"
              ? "border-brand-500 text-brand-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Active Roster ({filteredStudents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all ${
            activeTab === "leaderboard"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Trophy className="h-4 w-4 text-amber-400" />
          <span>Green Economy Leaderboard</span>
        </button>

        <button
          onClick={() => setActiveTab("register")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all ${
            activeTab === "register"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <UserPlus className="h-4 w-4 text-purple-400" />
          <span>Account Provisioning</span>
        </button>
      </div>

      {/* ── Tab 1: Directory ── */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student VID, name, room, or email..."
                className="input-field pl-11"
              />
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-300">
              Showing {filteredStudents.length} of {students.length}
            </div>
          </div>

          {/* Student Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="table-header">Student / VID</th>
                    <th className="table-header">Hostel Location</th>
                    <th className="table-header">Email Address</th>
                    <th className="table-header">Green Points Balance</th>
                    <th className="table-header text-right">Quick Incentive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-slate-500">
                        No students found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-emerald-600/20 text-brand-400 font-bold border border-brand-500/30 text-xs">
                              {s.name?.charAt(0)?.toUpperCase() || "S"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{s.name}</p>
                              <p className="text-[11px] font-mono text-brand-400">{s.vid}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-200">
                            Block {s.hostelBlock || "A"} • Room {s.roomNo || "N/A"}
                          </span>
                        </td>
                        <td className="table-cell text-xs font-mono text-slate-400">
                          {s.email}
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                              <Leaf className="h-3 w-3" />
                              {s.greenPoints || 0} Pts
                            </span>
                          </div>
                        </td>
                        <td className="table-cell text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleAwardBonusPoints(s.id, s.name, 15)}
                              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition"
                              title="Award +15 Green Points for advance skip / clean plate"
                            >
                              +15 Pts
                            </button>
                            <button
                              onClick={() => handleAwardBonusPoints(s.id, s.name, 50)}
                              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-amber-400 hover:bg-amber-600 hover:text-white hover:border-amber-500 transition"
                              title="Award +50 points for eco-initiative champion"
                            >
                              +50 Pts
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Green Points Leaderboard ── */}
      {activeTab === "leaderboard" && (
        <div className="space-y-6">
          <div className="card-glass border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-slate-900/80 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-500/20 p-3 text-amber-400 border border-amber-500/30">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Campus Sustainability Champions</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Students leading the university in advance meal skips, zero-food-waste clean plates, and sustainable living.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topStudents.map((student, idx) => (
              <div
                key={student.id}
                className="card-glass relative overflow-hidden flex items-center justify-between p-5 group"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl font-black text-sm border ${
                      idx === 0
                        ? "bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/20"
                        : idx === 1
                        ? "bg-slate-300 text-slate-900 border-white shadow-md"
                        : idx === 2
                        ? "bg-amber-700 text-white border-amber-600 shadow-md"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{student.name}</p>
                    <p className="text-[11px] font-mono text-slate-400">
                      {student.vid} • Block {student.hostelBlock}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-emerald-400">
                    {student.greenPoints || 0}
                  </span>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Green Pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 3: Account Provisioning Form ── */}
      {activeTab === "register" && (
        <div className="max-w-3xl mx-auto card-glass p-8">
          <div className="mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-purple-400" />
              Enroll New Student
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Creates authenticated student credentials for Android Mobile App sign-in with auto-provisioned Green Points.
            </p>
          </div>

          {registerError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Error creating account</p>
                <p>{registerError}</p>
              </div>
            </div>
          )}

          {registerSuccess && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-300 text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Account Enrolled Successfully</p>
                <p>The student can now log into the MessWise OS Android App using their VID.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Student VID
                </label>
                <input
                  required
                  type="text"
                  value={formData.vid}
                  onChange={(e) => setFormData({ ...formData, vid: e.target.value })}
                  placeholder="e.g. VID1042"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Priya Iyer"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Campus Email Address
                </label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@university.edu"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Initial Password
                </label>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Hostel Block
                </label>
                <input
                  required
                  type="text"
                  value={formData.hostelBlock}
                  onChange={(e) => setFormData({ ...formData, hostelBlock: e.target.value })}
                  placeholder="e.g. A, B, or C"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Room Number
                </label>
                <input
                  required
                  type="text"
                  value={formData.roomNo}
                  onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })}
                  placeholder="e.g. 204"
                  className="input-field"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={registerLoading}
                className="btn-primary flex items-center gap-2"
              >
                {registerLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Enrolling Student...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Create & Credit 25 Welcome Pts</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
