"use client";

import { useState } from "react";
import { UserPlus, CheckCircle2, AlertCircle } from "lucide-react";
import { db, firebaseConfig } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";

export default function StudentsPortal() {
  const [formData, setFormData] = useState({
    vid: "",
    name: "",
    email: "",
    password: "",
    hostelBlock: "",
    roomNo: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Initialize secondary Firebase app to avoid logging out the current admin user
      const secondaryApp =
        getApps().find((app) => app.name === "StudentCreatorApp") ||
        initializeApp(firebaseConfig, "StudentCreatorApp");
      
      const secondaryAuth = getAuth(secondaryApp);

      // 2. Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email,
        formData.password
      );

      const uid = userCredential.user.uid;

      // 3. Create the student profile in Firestore 'users' collection using the primary db
      await setDoc(doc(db, "users", uid), {
        vid: formData.vid.trim().toUpperCase(),
        email: formData.email.trim(),
        name: formData.name.trim(),
        role: "STUDENT",
        hostelBlock: formData.hostelBlock.trim().toUpperCase(),
        roomNo: formData.roomNo.trim(),
        greenPoints: 0,
      });

      // 4. Sign out of the secondary app
      await signOut(secondaryAuth);

      setSuccess(true);
      setFormData({
        vid: "",
        name: "",
        email: "",
        password: "",
        hostelBlock: "",
        roomNo: "",
      });
    } catch (err: any) {
      console.error("Error creating student:", err);
      setError(err.message || "Failed to create student account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-brand-500" />
          Register New Student
        </h1>
        <p className="text-slate-500 mt-1">
          Create student accounts so they can log into the MessWise OS mobile app.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-600">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-bold">Error creating account</p>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-green-50 p-4 text-green-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-bold">Student Registered Successfully</p>
              <p className="text-sm text-green-600">
                The student can now log in using their VID and password.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Student VID
              </label>
              <input
                required
                name="vid"
                type="text"
                value={formData.vid}
                onChange={handleChange}
                placeholder="e.g. VID12345"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Full Name
              </label>
              <input
                required
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Email Address
              </label>
              <input
                required
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student@example.com"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Password
              </label>
              <input
                required
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                minLength={6}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Hostel Block
              </label>
              <input
                required
                name="hostelBlock"
                type="text"
                value={formData.hostelBlock}
                onChange={handleChange}
                placeholder="e.g. A"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Room Number
              </label>
              <input
                required
                name="roomNo"
                type="text"
                value={formData.roomNo}
                onChange={handleChange}
                placeholder="e.g. 101"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating Student...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Register Student
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
