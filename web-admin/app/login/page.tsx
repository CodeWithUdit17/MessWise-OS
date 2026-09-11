"use client";

import { useState } from "react";
import { Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import MessLogo from "@/components/MessLogo";
import { adminLogin, adminLogout, type AdminUser } from "@/lib/auth";

import { useRouter } from "next/navigation";

/**
 * Admin Login Page — restricted to ROLE_ADMIN accounts.
 * Features a premium gradient card with email/password form.
 */
export default function LoginPage(props?: any) {
  const onLoginSuccess = props?.onLoginSuccess;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const user = await adminLogin(email, password);
      if (onLoginSuccess) {
        onLoginSuccess(user);
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md px-6 animate-fade-in">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          {/* Brand Header */}
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <MessLogo size="xl" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              MessWise OS
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Hostel Mess & Admin Control Panel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@messwise.edu"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-300 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-brand-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In to Dashboard"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-slate-500">
            Restricted to authorized Hostel Wardens & Mess In-charge only.
          </p>
        </div>
      </div>
    </div>
  );
}
