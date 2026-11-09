"use client";

import { useState } from "react";
import { env } from "../config/env";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<any | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${env.apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid administrative credentials");
      }

      setAdminUser(data.data.user);
    } catch (err: any) {
      setError(err.message || "Admin authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col font-sans selection:bg-[#D9FF43] selection:text-black">
      {/* Admin Navbar */}
      <header className="border-b border-[#1E1E1E] bg-[#0E0E0E]/90 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5A9CFF]/15 border border-[#5A9CFF]/40 flex items-center justify-center text-[#5A9CFF] font-bold text-xl">
              🛡️
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight">Flatmate Admin</span>
            </div>
          </div>
          {adminUser && (
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#888]">Signed in as: <strong className="text-white">{adminUser.email}</strong></span>
              <button
                onClick={() => setAdminUser(null)}
                className="px-3 py-1.5 text-xs rounded-lg bg-[#222] hover:bg-[#333] text-red-400 font-semibold transition"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex items-center justify-center">
        {adminUser ? (
          /* Admin Dashboard Overview */
          <div className="w-full space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">System Moderation & Overview</h1>
                <p className="text-sm text-[#888] mt-1">Platform management and operations console.</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#65E6B5]/10 text-[#65E6B5] border border-[#65E6B5]/30">
                <span className="w-2 h-2 rounded-full bg-[#65E6B5] animate-ping" />
                Backend Live: /api/v1
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-2xl bg-[#151515] border border-[#262626]">
                <div className="text-xs font-semibold text-[#888] uppercase tracking-wider">Total Registered Users</div>
                <div className="text-3xl font-bold mt-2 text-[#D9FF43]">1,280</div>
                <div className="text-xs text-[#65E6B5] mt-1">↑ +14% this week</div>
              </div>
              <div className="p-5 rounded-2xl bg-[#151515] border border-[#262626]">
                <div className="text-xs font-semibold text-[#888] uppercase tracking-wider">Pending KYC Verifications</div>
                <div className="text-3xl font-bold mt-2 text-[#FF4FA3]">18</div>
                <div className="text-xs text-[#888] mt-1">Aadhaar & College IDs</div>
              </div>
              <div className="p-5 rounded-2xl bg-[#151515] border border-[#262626]">
                <div className="text-xs font-semibold text-[#888] uppercase tracking-wider">Active Rent Groups</div>
                <div className="text-3xl font-bold mt-2 text-[#5A9CFF]">242</div>
                <div className="text-xs text-[#888] mt-1">₹1.8 Cr total rent managed</div>
              </div>
              <div className="p-5 rounded-2xl bg-[#151515] border border-[#262626]">
                <div className="text-xs font-semibold text-[#888] uppercase tracking-wider">Security Events Today</div>
                <div className="text-3xl font-bold mt-2 text-[#65E6B5]">0</div>
                <div className="text-xs text-[#888] mt-1">Brute-force / Replay attacks</div>
              </div>
            </div>

            {/* Admin Management Section Placeholder */}
            <div className="p-8 rounded-3xl bg-[#151515] border border-[#262626] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Admin Management Modules</h3>
                <span className="text-xs px-2.5 py-1 rounded-md bg-[#222] text-[#888]">Phase 8 Roadmap Ready</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#1C1C1C] border border-[#2B2B2B]">
                  <div className="text-sm font-semibold text-white">User Moderation & Bans</div>
                  <p className="text-xs text-[#777] mt-1">Inspect profiles, review suspicious accounts, ban or lift suspensions.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#1C1C1C] border border-[#2B2B2B]">
                  <div className="text-sm font-semibold text-white">ID Document Verification Queue</div>
                  <p className="text-xs text-[#777] mt-1">Review government ID scans, verify documents, and issue verification badges.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#1C1C1C] border border-[#2B2B2B]">
                  <div className="text-sm font-semibold text-white">Security & Audit Logs</div>
                  <p className="text-xs text-[#777] mt-1">View real-time security events, token replays, and failed login locks.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Centered Admin Login Card (Matches User Reference Image) */
          <div className="w-full max-w-[420px] bg-[#151515] border border-[#2A2A2A] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-44 h-44 bg-[#5A9CFF]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Pill / Badge (Matches Reference) */}
            <div className="p-1 bg-[#1F1F1F] rounded-full border border-[#2C2C2C] flex items-center justify-center mb-6">
              <div className="py-1.5 px-6 text-xs font-bold rounded-full bg-[#5A9CFF] text-black">
                Admin Authentication
              </div>
            </div>

            {/* Headline & Subtitle (Matches Reference) */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Welcome back
              </h2>
              <p className="text-xs text-[#888] mt-1">
                Log in with your administrator credentials to manage the platform.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            {/* Form Inputs with labels above (Matches Reference) */}
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#CCC] mb-1.5">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@flatmate.internal"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1B1B1B] border border-[#2C2C2C] text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#5A9CFF] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCC] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1B1B1B] border border-[#2C2C2C] text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#5A9CFF] transition"
                />
              </div>

              {/* Action Button (Matches Reference) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-[#5A9CFF] hover:bg-[#4a8ce8] text-black font-bold text-sm tracking-wide transition shadow-lg disabled:opacity-50"
              >
                {loading ? "Authenticating..." : "Log in"}
              </button>

              <div className="pt-2 text-center text-xs text-[#777]">
                Secured by NestJS RBAC & Rate Limiting Guard
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1E1E1E] py-6 text-center text-xs text-[#666]">
        Flatmate Admin Operations Console © 2026. Restricted to authorized staff.
      </footer>
    </div>
  );
}
