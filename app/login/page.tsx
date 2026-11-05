"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginMutation = useMutation(api.auth.login);
  const registerMutation = useMutation(api.auth.register);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const trimmedUser = username.toLowerCase().trim();
      const fn = mode === "login" ? loginMutation : registerMutation;
      const res = await fn({ username: trimmedUser, password });

      login(res.token, res.username, res.isAdmin);
      router.push("/");
    } catch (err: any) {
      setError(err.data ?? err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-3xl shadow-xl shadow-orange-500/25 mb-4 transform hover:scale-105 transition">
            <span className="text-white font-black text-3xl">F</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Farewell 2026
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Table Reservations &amp; Seating Arrangement
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Mode Switcher */}
          <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                mode === "login"
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                mode === "register"
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Username / Your Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase())
                  }
                  placeholder="e.g. rohit, priya, alex"
                  required
                  autoCapitalize="none"
                  autoComplete="username"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Names are automatically stored in lowercase
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm rounded-2xl p-3.5 flex items-start gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span className="leading-tight">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-orange-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Sign In →"
                : "Register & Continue →"}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}
