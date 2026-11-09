"use client";

import { useState } from "react";
import { env } from "../config/env";

export default function HomePage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint =
        tab === "login"
          ? `${env.apiUrl}/auth/login`
          : `${env.apiUrl}/auth/register`;

      const payload =
        tab === "login"
          ? { identifier: email, password }
          : { email, phoneNumber: phone || undefined, password };

      if (tab === "register" && password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Request failed");
      }

      setAuthUser(data.data.user);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col font-sans selection:bg-[#D9FF43] selection:text-black">
      {/* Navigation */}
      <header className="border-b border-[#1E1E1E] bg-[#080808]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D9FF43]/15 border border-[#D9FF43]/40 flex items-center justify-center text-[#D9FF43] font-bold text-xl">
              F
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight">Flatmate</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm text-[#A0A0A0]">
              <span className="hover:text-white transition cursor-pointer">Features</span>
              <span className="hover:text-white transition cursor-pointer">How it Works</span>
              <span className="hover:text-white transition cursor-pointer">Safety</span>
            </nav>
            {env.mobileAppUrl && (
              <a
                href={env.mobileAppUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white border border-[#2E2E2E] transition flex items-center gap-2"
              >
                <span>📱 Open Mobile App</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero & Auth Card Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Brand Copy */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151515] border border-[#2A2A2A] text-xs font-medium text-[#65E6B5]">
            <span className="w-2 h-2 rounded-full bg-[#65E6B5] animate-pulse"></span>
            Verified Flatmate Matching & Rent Splitting
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Find your people. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9FF43] via-[#65E6B5] to-[#5A9CFF]">
              Share your space.
            </span>
          </h1>
          <p className="text-lg text-[#A0A0A0] max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Stop gambling on random roommates. Discover compatible flatmates matched by lifestyle, budget, cleanliness, and sleep schedule. Split rent and shared expenses with zero awkwardness.
          </p>

          <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
            <div className="p-4 rounded-2xl bg-[#151515] border border-[#222]">
              <div className="text-2xl font-bold text-[#D9FF43]">100%</div>
              <div className="text-xs text-[#888] mt-1">ID Verified Profiles</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#151515] border border-[#222]">
              <div className="text-2xl font-bold text-[#65E6B5]">9-Point</div>
              <div className="text-xs text-[#888] mt-1">Lifestyle Match Algorithm</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#151515] border border-[#222]">
              <div className="text-2xl font-bold text-[#5A9CFF]">₹0 Hidden</div>
              <div className="text-xs text-[#888] mt-1">Transparent Rent Splits</div>
            </div>
          </div>
        </div>

        {/* Right Column: Floating Auth Card (Matches User Reference Image) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-[420px] bg-[#151515] border border-[#2A2A2A] rounded-3xl p-7 shadow-2xl relative overflow-hidden">
            {/* Ambient subtle glow */}
            <div className="absolute -top-20 -right-20 w-44 h-44 bg-[#D9FF43]/10 rounded-full blur-3xl pointer-events-none" />

            {authUser ? (
              /* Authenticated View */
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#65E6B5]/15 border border-[#65E6B5]/40 text-[#65E6B5] flex items-center justify-center text-3xl mx-auto">
                  ✓
                </div>
                <h3 className="text-2xl font-bold">Authenticated!</h3>
                <p className="text-sm text-[#A0A0A0]">
                  Welcome back, <strong className="text-white">{authUser.email || authUser.phoneNumber}</strong>
                </p>
                <div className="p-4 rounded-xl bg-[#1F1F1F] border border-[#2A2A2A] text-left text-xs space-y-1 text-[#888]">
                  <div>User ID: <span className="font-mono text-[#AAA]">{authUser.id}</span></div>
                  <div>Account Status: <span className="text-[#65E6B5] font-semibold">{authUser.status}</span></div>
                </div>
                <button
                  onClick={() => setAuthUser(null)}
                  className="w-full py-3 rounded-xl bg-[#222] hover:bg-[#333] text-sm font-semibold transition"
                >
                  Log out
                </button>
              </div>
            ) : (
              /* Auth Form Card */
              <div>
                {/* 1. Top Segmented Pill (Matches Reference) */}
                <div className="p-1 bg-[#1F1F1F] rounded-full border border-[#2C2C2C] flex items-center mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setTab("login");
                      setError(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
                      tab === "login"
                        ? "bg-[#D9FF43] text-black shadow-md"
                        : "text-[#888] hover:text-white"
                    }`}
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTab("register");
                      setError(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
                      tab === "register"
                        ? "bg-[#D9FF43] text-black shadow-md"
                        : "text-[#888] hover:text-white"
                    }`}
                  >
                    Create account
                  </button>
                </div>

                {/* 2. Headline & Subtitle (Matches Reference) */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    {tab === "login" ? "Welcome back" : "Create an account"}
                  </h2>
                  <p className="text-xs text-[#888] mt-1">
                    {tab === "login"
                      ? "Log in to manage your spaces & chat with flatmates."
                      : "Join thousands of verified flatmates across India."}
                  </p>
                </div>

                {/* Error notification */}
                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                    {error}
                  </div>
                )}

                {/* 3. Form Inputs with labels above (Matches Reference) */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#CCC] mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1B1B1B] border border-[#2C2C2C] text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#D9FF43] transition"
                    />
                  </div>

                  {tab === "register" && (
                    <div>
                      <label className="block text-xs font-semibold text-[#CCC] mb-1.5">
                        Phone number (optional)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+919876543210"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1B1B1B] border border-[#2C2C2C] text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#D9FF43] transition"
                      />
                    </div>
                  )}

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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1B1B1B] border border-[#2C2C2C] text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#D9FF43] transition"
                    />
                  </div>

                  {tab === "register" && (
                    <div>
                      <label className="block text-xs font-semibold text-[#CCC] mb-1.5">
                        Confirm password
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1B1B1B] border border-[#2C2C2C] text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#D9FF43] transition"
                      />
                    </div>
                  )}

                  {/* Primary Action Button (Matches Reference) */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 rounded-xl bg-[#D9FF43] hover:bg-[#cbf434] text-black font-bold text-sm tracking-wide transition shadow-lg disabled:opacity-50"
                  >
                    {loading
                      ? "Processing..."
                      : tab === "login"
                      ? "Log in"
                      : "Create account"}
                  </button>

                  {/* Centered Footer Link (Matches Reference) */}
                  <div className="pt-2 text-center">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        alert("Password reset is managed via mobile OTP flow.");
                      }}
                      className="text-xs text-[#888] hover:text-[#65E6B5] transition"
                    >
                      Forgot your password?
                    </a>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1E1E1E] py-6 text-center text-xs text-[#666]">
        Flatmate Platform © 2026. All rights reserved.
      </footer>
    </div>
  );
}
