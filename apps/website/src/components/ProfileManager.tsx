"use client";

import { useState, useEffect } from "react";
import { env } from "../config/env";

interface ProfileManagerProps {
  authUser: any;
  onLogout: () => void;
}

export function ProfileManager({ authUser, onLogout }: ProfileManagerProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "lifestyle" | "account">("profile");
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile Form State
  const [displayName, setDisplayName] = useState("");
  const [dob, setDob] = useState("2000-01-01");
  const [gender, setGender] = useState("MALE");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [budgetMin, setBudgetMin] = useState(10000);
  const [budgetMax, setBudgetMax] = useState(20000);
  const [occupation, setOccupation] = useState("");
  const [company, setCompany] = useState("");
  const [bio, setBio] = useState("");

  // Lifestyle Preferences State
  const [sleepSchedule, setSleepSchedule] = useState("FLEXIBLE");
  const [cleanliness, setCleanliness] = useState("MODERATE");
  const [socialPreference, setSocialPreference] = useState("AMBIVERT");
  const [foodPreference, setFoodPreference] = useState("VEGETARIAN");
  const [workSchedule, setWorkSchedule] = useState("HYBRID");
  const [smokingPreference, setSmokingPreference] = useState("NEVER");
  const [drinkingPreference, setDrinkingPreference] = useState("NEVER");
  const [petPreference, setPetPreference] = useState("NO_PETS");
  const [privacyPreference, setPrivacyPreference] = useState("MODERATE");

  const getAuthToken = () => {
    try {
      return localStorage.getItem("accessToken") || "";
    } catch {
      return "";
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const res = await fetch(`${env.apiUrl}/profiles/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        const p = data.data;
        setProfile(p);
        setDisplayName(p.displayName || "");
        if (p.dateOfBirth) {
          setDob(new Date(p.dateOfBirth).toISOString().split("T")[0]);
        }
        setGender(p.gender || "MALE");
        setCity(p.city || "");
        setLocality(p.preferredLocality || "");
        setBudgetMin(p.budgetMin ?? 10000);
        setBudgetMax(p.budgetMax ?? 20000);
        setOccupation(p.occupation || "");
        setCompany(p.companyOrCollege || "");
        setBio(p.bio || "");

        if (p.lifestyle) {
          setSleepSchedule(p.lifestyle.sleepSchedule || "FLEXIBLE");
          setCleanliness(p.lifestyle.cleanliness || "MODERATE");
          setSocialPreference(p.lifestyle.socialPreference || "AMBIVERT");
          setFoodPreference(p.lifestyle.foodPreference || "VEGETARIAN");
          setWorkSchedule(p.lifestyle.workSchedule || "HYBRID");
          setSmokingPreference(p.lifestyle.smokingPreference || "NEVER");
          setDrinkingPreference(p.lifestyle.drinkingPreference || "NEVER");
          setPetPreference(p.lifestyle.petPreference || "NO_PETS");
          setPrivacyPreference(p.lifestyle.privacyPreference || "MODERATE");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (budgetMin > budgetMax) {
      setError("Min budget cannot exceed Max budget");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = getAuthToken();
      const res = await fetch(`${env.apiUrl}/profiles/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          dateOfBirth: dob,
          gender,
          city: city.trim(),
          preferredLocality: locality.trim() || undefined,
          budgetMin: Number(budgetMin),
          budgetMax: Number(budgetMax),
          occupation: occupation.trim() || undefined,
          companyOrCollege: company.trim() || undefined,
          bio: bio.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update profile");
      }

      setProfile(data.data);
      setSuccess("Profile details saved successfully!");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLifestyle = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = getAuthToken();
      const res = await fetch(`${env.apiUrl}/profiles/me/lifestyle`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sleepSchedule,
          cleanliness,
          socialPreference,
          foodPreference,
          workSchedule,
          smokingPreference,
          drinkingPreference,
          petPreference,
          privacyPreference,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update lifestyle preferences");
      }

      if (profile) {
        setProfile({
          ...profile,
          lifestyle: data.data.lifestyle,
          isComplete: data.data.isComplete,
        });
      }
      setSuccess("Lifestyle preferences saved successfully!");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const renderChip = (
    label: string,
    currentValue: string,
    targetValue: string,
    onSelect: (val: string) => void
  ) => {
    const isSelected = currentValue === targetValue;
    return (
      <button
        type="button"
        onClick={() => onSelect(targetValue)}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
          isSelected
            ? "bg-[#D9FF43] text-black border-[#D9FF43]"
            : "bg-[#1E1E1E] text-[#A0A0A0] border-[#2A2A2A] hover:border-[#444]"
        }`}
      >
        {label}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-[#888]">
        <div className="w-8 h-8 border-2 border-[#D9FF43] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading your profile...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Segmented Switcher */}
      <div className="flex bg-[#121212] p-1 rounded-2xl border border-[#222]">
        <button
          type="button"
          onClick={() => {
            setActiveTab("profile");
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === "profile"
              ? "bg-[#1F1F1F] text-[#D9FF43] shadow-md border border-[#333]"
              : "text-[#888] hover:text-white"
          }`}
        >
          Profile
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("lifestyle");
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === "lifestyle"
              ? "bg-[#1F1F1F] text-[#D9FF43] shadow-md border border-[#333]"
              : "text-[#888] hover:text-white"
          }`}
        >
          Lifestyle
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("account");
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === "account"
              ? "bg-[#1F1F1F] text-[#D9FF43] shadow-md border border-[#333]"
              : "text-[#888] hover:text-white"
          }`}
        >
          Account
        </button>
      </div>

      {/* Completion Indicator */}
      <div
        className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
          profile?.isComplete
            ? "bg-[#65E6B5]/10 border-[#65E6B5]/30 text-[#65E6B5]"
            : "bg-[#FF4FA3]/10 border-[#FF4FA3]/30 text-[#FF4FA3]"
        }`}
      >
        <span className="text-base">{profile?.isComplete ? "✓" : "!"}</span>
        <span className="font-semibold">
          {profile?.isComplete
            ? "Profile 100% Complete — Discoverable for Matching"
            : "Profile Incomplete — Add profile details and habits to match"}
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#FF4FA3]/10 border border-[#FF4FA3]/40 text-[#FF4FA3] text-xs">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-[#65E6B5]/10 border border-[#65E6B5]/40 text-[#65E6B5] text-xs">
          {success}
        </div>
      )}

      {/* PROFILE DETAILS TAB */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-[#888] mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs focus:border-[#D9FF43] focus:outline-none transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#888] mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs focus:border-[#D9FF43] focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#888] mb-1">
                Gender *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs focus:border-[#D9FF43] focus:outline-none transition"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="NON_BINARY">Non-Binary</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#888] mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bengaluru"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs focus:border-[#D9FF43] focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#888] mb-1">
                Preferred Locality
              </label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Koramangala"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs focus:border-[#D9FF43] focus:outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#888] mb-1">
                Min Budget (₹) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={budgetMin}
                onChange={(e) => setBudgetMin(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs focus:border-[#D9FF43] focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#888] mb-1">
                Max Budget (₹) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={budgetMax}
                onChange={(e) => setBudgetMax(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs focus:border-[#D9FF43] focus:outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#888] mb-1">
                Occupation
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Engineer / Student"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs focus:border-[#D9FF43] focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#888] mb-1">
                Company or College
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google / IIT"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs focus:border-[#D9FF43] focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#888] mb-1">
              About Me (Bio)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell prospective flatmates about yourself..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-white text-xs focus:border-[#D9FF43] focus:outline-none transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[#D9FF43] text-black font-bold text-xs hover:bg-[#c2e838] transition cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile Details"}
          </button>
        </form>
      )}

      {/* LIFESTYLE PREFERENCES TAB */}
      {activeTab === "lifestyle" && (
        <div className="space-y-4 text-left">
          {/* Sleep Schedule */}
          <div>
            <div className="text-xs font-semibold text-[#AAA] mb-1.5">
              🌅 Sleep Schedule
            </div>
            <div className="flex flex-wrap gap-2">
              {renderChip("Early Bird", sleepSchedule, "EARLY_BIRD", setSleepSchedule)}
              {renderChip("Night Owl", sleepSchedule, "NIGHT_OWL", setSleepSchedule)}
              {renderChip("Flexible", sleepSchedule, "FLEXIBLE", setSleepSchedule)}
            </div>
          </div>

          {/* Cleanliness */}
          <div>
            <div className="text-xs font-semibold text-[#AAA] mb-1.5">
              ✨ Cleanliness
            </div>
            <div className="flex flex-wrap gap-2">
              {renderChip("Very Clean", cleanliness, "VERY_CLEAN", setCleanliness)}
              {renderChip("Moderate", cleanliness, "MODERATE", setCleanliness)}
              {renderChip("Relaxed", cleanliness, "RELAXED", setCleanliness)}
            </div>
          </div>

          {/* Social */}
          <div>
            <div className="text-xs font-semibold text-[#AAA] mb-1.5">
              🎉 Social Routine
            </div>
            <div className="flex flex-wrap gap-2">
              {renderChip("Introvert", socialPreference, "INTROVERT", setSocialPreference)}
              {renderChip("Extrovert", socialPreference, "EXTROVERT", setSocialPreference)}
              {renderChip("Ambivert", socialPreference, "AMBIVERT", setSocialPreference)}
              {renderChip("Guests Welcome", socialPreference, "OCCASIONAL_GUESTS", setSocialPreference)}
            </div>
          </div>

          {/* Food */}
          <div>
            <div className="text-xs font-semibold text-[#AAA] mb-1.5">
              🥗 Food Preference
            </div>
            <div className="flex flex-wrap gap-2">
              {renderChip("Vegetarian", foodPreference, "VEGETARIAN", setFoodPreference)}
              {renderChip("Non-Veg", foodPreference, "NON_VEGETARIAN", setFoodPreference)}
              {renderChip("Vegan", foodPreference, "VEGAN", setFoodPreference)}
              {renderChip("Eggetarian", foodPreference, "EGGETARIAN", setFoodPreference)}
            </div>
          </div>

          {/* Work Mode */}
          <div>
            <div className="text-xs font-semibold text-[#AAA] mb-1.5">
              💻 Work / Study
            </div>
            <div className="flex flex-wrap gap-2">
              {renderChip("WFH", workSchedule, "WORK_FROM_HOME", setWorkSchedule)}
              {renderChip("Office", workSchedule, "OFFICE", setWorkSchedule)}
              {renderChip("Hybrid", workSchedule, "HYBRID", setWorkSchedule)}
              {renderChip("Student", workSchedule, "STUDENT", setWorkSchedule)}
            </div>
          </div>

          {/* Smoking & Drinking */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-semibold text-[#AAA] mb-1.5">🚭 Smoking</div>
              <div className="flex flex-wrap gap-1.5">
                {renderChip("Never", smokingPreference, "NEVER", setSmokingPreference)}
                {renderChip("Outside", smokingPreference, "OUTSIDE_ONLY", setSmokingPreference)}
                {renderChip("Yes", smokingPreference, "REGULAR", setSmokingPreference)}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#AAA] mb-1.5">🍺 Drinking</div>
              <div className="flex flex-wrap gap-1.5">
                {renderChip("Never", drinkingPreference, "NEVER", setDrinkingPreference)}
                {renderChip("Social", drinkingPreference, "OCCASIONALLY", setDrinkingPreference)}
                {renderChip("Regular", drinkingPreference, "REGULAR", setDrinkingPreference)}
              </div>
            </div>
          </div>

          {/* Pets */}
          <div>
            <div className="text-xs font-semibold text-[#AAA] mb-1.5">🐾 Pets</div>
            <div className="flex flex-wrap gap-2">
              {renderChip("Loves Pets", petPreference, "LOVES_PETS", setPetPreference)}
              {renderChip("No Pets", petPreference, "NO_PETS", setPetPreference)}
              {renderChip("Has Pet", petPreference, "HAS_PET", setPetPreference)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveLifestyle}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[#D9FF43] text-black font-bold text-xs hover:bg-[#c2e838] transition cursor-pointer disabled:opacity-50 mt-2"
          >
            {saving ? "Saving..." : "Save Lifestyle Preferences"}
          </button>
        </div>
      )}

      {/* ACCOUNT DETAILS TAB */}
      {activeTab === "account" && (
        <div className="space-y-4 text-left">
          <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-xs space-y-2 text-[#888]">
            <div className="flex justify-between">
              <span>User ID:</span>
              <span className="font-mono text-white text-[11px]">{authUser.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Account:</span>
              <span className="text-white font-medium">
                {authUser.email || authUser.phoneNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-[#65E6B5] font-semibold">{authUser.status}</span>
            </div>
            <div className="flex justify-between">
              <span>Email Verified:</span>
              <span className={authUser.isEmailVerified ? "text-[#65E6B5]" : "text-[#FF4FA3]"}>
                {authUser.isEmailVerified ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Phone Verified:</span>
              <span className={authUser.isPhoneVerified ? "text-[#65E6B5]" : "text-[#FF4FA3]"}>
                {authUser.isPhoneVerified ? "Yes" : "No"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full py-3 rounded-xl bg-[#222] hover:bg-[#333] text-xs font-semibold text-white transition cursor-pointer"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

