"use client";

import { useState, useEffect, useRef } from "react";
import { env } from "../config/env";
import { ProfileManager, AuthUser } from "../components/ProfileManager";

export default function HomePage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60-second countdown timer for OTP resend
  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  // Handle password-based Login and Register
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
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

      if (data.data?.tokens) {
        try {
          localStorage.setItem("accessToken", data.data.tokens.accessToken);
          localStorage.setItem("refreshToken", data.data.tokens.refreshToken);
        } catch {
          // ignore localstorage errors
        }
      }

      setAuthUser(data.data.user);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle Requesting OTP Code
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpIdentifier.trim()) {
      setError("Please enter your email or phone number.");
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
        throw new Error(data.message || "Failed to send OTP code");
      }

      setOtpStep("verify");
      setTimerSeconds(data.data?.resendAfterSeconds || 60);
      if (data.data?.debugOtp) {
        setDebugOtp(data.data.debugOtp);
        setInfoMessage(`Code sent! (Dev debug OTP: ${data.data.debugOtp})`);
      } else {
        setInfoMessage("Verification code has been sent!");
      }

      // Auto-focus first input box
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err.message || "Unable to send verification code");
    } finally {
      setLoading(false);
    }
  };

  // Handle Submitting 6-Digit OTP Code
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code.");
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
        throw new Error(data.message || "Invalid or expired verification code");
      }

      if (data.data?.tokens) {
        try {
          localStorage.setItem("accessToken", data.data.tokens.accessToken);
          localStorage.setItem("refreshToken", data.data.tokens.refreshToken);
        } catch {
          // ignore localstorage errors
        }
      }

      setAuthUser(data.data.user);
      setIsOtpMode(false);
      setOtpStep("request");
      setOtpDigits(["", "", "", "", "", ""]);
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // Handle typing inside 6-digit OTP input boxes
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
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    } catch {}
    setAuthUser(null);
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
          <div className="w-full max-w-[460px] bg-[#151515] border border-[#2A2A2A] rounded-3xl p-7 shadow-2xl relative overflow-hidden">
            {/* Ambient subtle glow */}
            <div className="absolute -top-20 -right-20 w-44 h-44 bg-[#D9FF43]/10 rounded-full blur-3xl pointer-events-none" />

            {authUser ? (
              /* Authenticated Profile & Lifestyle Manager View */
              <ProfileManager authUser={authUser} onLogout={handleLogout} />
            ) : isOtpMode ? (
              /* OTP Authentication Section */
              <div>
                {/* Back to password pill */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOtpMode(false);
                      setOtpStep("request");
                      setError(null);
                      setInfoMessage(null);
                    }}
                    className="text-xs text-[#888] hover:text-[#D9FF43] transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>←</span>
                    <span>Back to password login</span>
                  </button>
                </div>

                {/* Header */}
                <div className="mb-6">
                  <div className="inline-block px-2.5 py-1 rounded-md bg-[#65E6B5]/15 text-[#65E6B5] text-[11px] font-bold tracking-wide uppercase mb-2">
                    Passwordless
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    {otpStep === "request" ? "OTP Login" : "Verify Code"}
                  </h2>
                  <p className="text-xs text-[#888] mt-1 leading-relaxed">
                    {otpStep === "request"
                      ? "Enter your email or phone number to receive a 6-digit verification code."
                      : `We sent a 6-digit code to ${otpIdentifier}.`}
                  </p>
                </div>

                {/* Notification banners */}
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

                {/* Step 1: Request Code */}
                {otpStep === "request" ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#CCC] mb-1.5">
                        Email or Phone number
                      </label>
                      <input
                        type="text"
                        required
                        value={otpIdentifier}
                        onChange={(e) => setOtpIdentifier(e.target.value)}
                        placeholder="you@example.com or +919876543210"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1B1B1B] border border-[#2C2C2C] text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#D9FF43] transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-3 rounded-xl bg-[#D9FF43] hover:bg-[#cbf434] text-black font-bold text-sm tracking-wide transition shadow-lg disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? "Sending Code..." : "Send Verification Code"}
                    </button>
                  </form>
                ) : (
                  /* Step 2: 6-Digit PIN Entry */
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
                            className="w-12 h-14 text-center text-xl font-bold bg-[#1B1B1B] border border-[#2C2C2C] rounded-xl text-white focus:outline-none focus:border-[#D9FF43] focus:ring-1 focus:ring-[#D9FF43] transition"
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpDigits.join("").length !== 6}
                      className="w-full py-3 rounded-xl bg-[#D9FF43] hover:bg-[#cbf434] text-black font-bold text-sm tracking-wide transition shadow-lg disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? "Verifying..." : "Verify & Sign In"}
                    </button>

                    {/* Resend Countdown */}
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
                          className="text-xs text-[#65E6B5] hover:underline font-semibold cursor-pointer"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* Password-based Auth Form Card (Matches User Reference Image) */
              <div>
                {/* 1. Top Segmented Pill (Matches Reference) */}
                <div className="p-1 bg-[#1F1F1F] rounded-full border border-[#2C2C2C] flex items-center mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setTab("login");
                      setError(null);
                      setInfoMessage(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
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
                      setInfoMessage(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
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
                {infoMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-[#65E6B5]/10 border border-[#65E6B5]/30 text-[#65E6B5] text-xs">
                    {infoMessage}
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
                    className="w-full mt-2 py-3 rounded-xl bg-[#D9FF43] hover:bg-[#cbf434] text-black font-bold text-sm tracking-wide transition shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    {loading
                      ? "Processing..."
                      : tab === "login"
                      ? "Log in"
                      : "Create account"}
                  </button>

                  {/* Centered Footer Links (Matches Reference & Mobile App) */}
                  <div className="pt-2 text-center space-y-2">
                    {tab === "login" && (
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsOtpMode(true);
                            setOtpStep("request");
                            setOtpIdentifier(email);
                            setError(null);
                            setInfoMessage(null);
                          }}
                          className="text-xs text-[#65E6B5] hover:underline font-medium cursor-pointer"
                        >
                          Log in with OTP code instead
                        </button>
                      </div>
                    )}
                    <div>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsOtpMode(true);
                          setOtpStep("request");
                          setError(null);
                        }}
                        className="text-xs text-[#888] hover:text-[#CCC] transition"
                      >
                        Forgot your password?
                      </a>
                    </div>
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
