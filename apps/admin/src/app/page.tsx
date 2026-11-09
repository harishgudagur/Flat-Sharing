"use client";

import { useState, useEffect, useRef } from "react";
import { env } from "../config/env";

export default function AdminPage() {
  const [authMode, setAuthMode] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<any | null>(null);

  // OTP State
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60-second countdown timer for OTP resend
  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  // Handle password-based Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
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

      if (data.data?.tokens) {
        try {
          localStorage.setItem("adminAccessToken", data.data.tokens.accessToken);
          localStorage.setItem("adminRefreshToken", data.data.tokens.refreshToken);
        } catch {}
      }

      setAdminUser(data.data.user);
    } catch (err: any) {
      setError(err.message || "Admin authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // Handle Requesting Admin OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpIdentifier.trim()) {
      setError("Please enter your administrator email or phone.");
      return;
    }

    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const res = await fetch(`${env.apiUrl}/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: otpIdentifier.trim(),
          purpose: "LOGIN",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send administrative OTP");
      }

      setOtpStep("verify");
      setTimerSeconds(data.data?.resendAfterSeconds || 60);
      if (data.data?.debugOtp) {
        setDebugOtp(data.data.debugOtp);
        setInfoMessage(`Code sent! (Dev debug OTP: ${data.data.debugOtp})`);
      } else {
        setInfoMessage("Administrative OTP sent successfully.");
      }

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err.message || "Unable to send verification code");
    } finally {
      setLoading(false);
    }
  };

  // Handle Submitting 6-Digit Admin OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit administrative code.");
      return;
    }

    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const res = await fetch(`${env.apiUrl}/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: otpIdentifier.trim(),
          code,
          purpose: "LOGIN",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid or expired administrative code");
      }

      if (data.data?.tokens) {
        try {
          localStorage.setItem("adminAccessToken", data.data.tokens.accessToken);
          localStorage.setItem("adminRefreshToken", data.data.tokens.refreshToken);
        } catch {}
      }

      setAdminUser(data.data.user);
      setAuthMode("password");
      setOtpStep("request");
      setOtpDigits(["", "", "", "", "", ""]);
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    const char = val.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);

    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteDigits = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!paste) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = paste[i] || "";
    }
    setOtpDigits(newDigits);
    const targetIdx = Math.min(paste.length, 5);
    otpInputRefs.current[targetIdx]?.focus();
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("adminAccessToken");
      localStorage.removeItem("adminRefreshToken");
    } catch {}
    setAdminUser(null);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col font-sans selection:bg-[#5A9CFF] selection:text-black">
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
              <span className="text-xs text-[#888]">
                Signed in as: <strong className="text-white">{adminUser.email || adminUser.phoneNumber}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs rounded-lg bg-[#222] hover:bg-[#333] text-red-400 font-semibold transition cursor-pointer"
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
                <div className="text-3xl font-bold mt-2 text-white">0</div>
                <div className="text-xs text-[#65E6B5] mt-1">All systems normal</div>
              </div>
            </div>

            {/* Quick Operations Panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-[#151515] border border-[#262626] space-y-3">
                <h3 className="text-base font-bold text-white">User Moderation</h3>
                <p className="text-xs text-[#888] leading-relaxed">
                  Review flagged user profiles, check suspicious activity, or manage account lockouts caused by repeated failed login attempts.
                </p>
                <div className="pt-2">
                  <span className="text-xs text-[#5A9CFF] font-medium">Ready for Phase 3 moderation</span>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-[#151515] border border-[#262626] space-y-3">
                <h3 className="text-base font-bold text-white">ID & KYC Approvals</h3>
                <p className="text-xs text-[#888] leading-relaxed">
                  Validate government IDs (Aadhaar, Passport) and university/employment badges uploaded for verified roommate badges.
                </p>
                <div className="pt-2">
                  <span className="text-xs text-[#5A9CFF] font-medium">18 verifications in queue</span>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-[#151515] border border-[#262626] space-y-3">
                <h3 className="text-base font-bold text-white">Dispute & Escrow Resolution</h3>
                <p className="text-xs text-[#888] leading-relaxed">
                  Audit rent group transactions, utility split disputes, and reconcile payment settlement states.
                </p>
                <div className="pt-2">
                  <span className="text-xs text-[#5A9CFF] font-medium">0 active disputes</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Centered Admin Login Card (Matches User Reference Image) */
          <div className="w-full max-w-[420px] bg-[#151515] border border-[#2A2A2A] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-44 h-44 bg-[#5A9CFF]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Pill / Segmented Switcher (Matches Reference) */}
            <div className="p-1 bg-[#1F1F1F] rounded-full border border-[#2C2C2C] flex items-center mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("password");
                  setError(null);
                  setInfoMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  authMode === "password"
                    ? "bg-[#5A9CFF] text-black shadow-md"
                    : "text-[#888] hover:text-white"
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("otp");
                  setOtpStep("request");
                  setOtpIdentifier(email);
                  setError(null);
                  setInfoMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  authMode === "otp"
                    ? "bg-[#5A9CFF] text-black shadow-md"
                    : "text-[#888] hover:text-white"
                }`}
              >
                Admin OTP
              </button>
            </div>

            {/* Headline & Subtitle (Matches Reference) */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {authMode === "password"
                  ? "Admin Sign In"
                  : otpStep === "request"
                  ? "Admin OTP Access"
                  : "Verify Administrative Code"}
              </h2>
              <p className="text-xs text-[#888] mt-1">
                {authMode === "password"
                  ? "Log in with administrative credentials to manage the platform."
                  : otpStep === "request"
                  ? "Enter your verified administrator email or phone to receive a 6-digit code."
                  : `Enter the 6-digit code sent to ${otpIdentifier}.`}
              </p>
            </div>

            {/* Notification messages */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}
            {infoMessage && (
              <div className="mb-4 p-3 rounded-xl bg-[#65E6B5]/10 border border-[#65E6B5]/30 text-[#65E6B5] text-xs">
                {infoMessage}
              </div>
            )}

            {authMode === "password" ? (
              /* Password Login Form */
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-[#5A9CFF] hover:bg-[#4a8ce8] text-black font-bold text-sm tracking-wide transition shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Authenticating..." : "Log in"}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("otp");
                      setOtpStep("request");
                      setOtpIdentifier(email);
                      setError(null);
                      setInfoMessage(null);
                    }}
                    className="text-xs text-[#5A9CFF] hover:underline font-medium cursor-pointer"
                  >
                    Authenticate with Admin OTP instead
                  </button>
                </div>
              </form>
            ) : otpStep === "request" ? (
              /* OTP Request Form */
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#CCC] mb-1.5">
                    Admin Email or Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={otpIdentifier}
                    onChange={(e) => setOtpIdentifier(e.target.value)}
                    placeholder="admin@flatmate.internal"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1B1B1B] border border-[#2C2C2C] text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#5A9CFF] transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-[#5A9CFF] hover:bg-[#4a8ce8] text-black font-bold text-sm tracking-wide transition shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Sending..." : "Send Administrative Code"}
                </button>
              </form>
            ) : (
              /* OTP 6-Digit PIN Form */
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#CCC] mb-2 text-center">
                    Enter 6-digit PIN
                  </label>
                  <div className="flex justify-between gap-2" onPaste={handlePasteDigits}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                        className="w-12 h-14 text-center text-xl font-bold bg-[#1B1B1B] border border-[#2C2C2C] rounded-xl text-white focus:outline-none focus:border-[#5A9CFF] focus:ring-1 focus:ring-[#5A9CFF] transition"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpDigits.join("").length !== 6}
                  className="w-full py-3 rounded-xl bg-[#5A9CFF] hover:bg-[#4a8ce8] text-black font-bold text-sm tracking-wide transition shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </button>

                <div className="text-center pt-2">
                  {timerSeconds > 0 ? (
                    <span className="text-xs text-[#777]">
                      Resend code in 00:{timerSeconds.toString().padStart(2, "0")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={loading}
                      className="text-xs text-[#5A9CFF] hover:underline font-semibold cursor-pointer"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </form>
            )}

            <div className="pt-4 text-center text-xs text-[#777]">
              Secured by NestJS RBAC & Rate Limiting Guard
            </div>
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
