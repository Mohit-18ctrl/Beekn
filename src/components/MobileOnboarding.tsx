import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, UserRound, Building2, CheckCircle2, ShieldCheck } from "lucide-react";

interface MobileOnboardingProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onGoogleSignIn: () => Promise<void>;
  onEmailSignIn: (email: string, password: string) => Promise<void>;
  onEmailSignUp: (email: string, password: string) => Promise<void>;
  onCompleteProfile: (data: {
    role: "public" | "authority";
    department?: string;
    verificationStatus?: "demo-approved" | "pending" | "verified";
  }) => Promise<void>;
  authUser: any | null;
  userProfile: any | null;
  needsProfileSetup: boolean;
}

const DEPARTMENTS = [
  "Sanitation",
  "Roads / PWD",
  "Lighting / Electricity",
  "Water Board",
  "Campus Facilities",
  "Other",
];

const slideTransition = {
  duration: 0.35,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

export default function MobileOnboarding({
  theme,
  onToggleTheme,
  onGoogleSignIn,
  onEmailSignIn,
  onEmailSignUp,
  onCompleteProfile,
  authUser,
  userProfile,
  needsProfileSetup,
}: MobileOnboardingProps) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<"public" | "authority" | null>(null);
  const [department, setDepartment] = useState("");
  const [otherDepartment, setOtherDepartment] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-advance splash after 2.2s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authUser && needsProfileSetup) {
        setStep(2);
      } else {
        setStep(1);
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [authUser, needsProfileSetup]);

  // If authUser arrives later (e.g. async restore) while still on step 0 or 1
  useEffect(() => {
    if (authUser && needsProfileSetup && step === 1) {
      setStep(2);
    }
  }, [authUser, needsProfileSetup, step]);

  const progressPercent = step === 0 ? 0 : step === 1 ? 33 : step === 2 ? 66 : 100;

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      if (mode === "signin") {
        await onEmailSignIn(email, password);
      } else {
        await onEmailSignUp(email, password);
      }
      // After successful auth, if profile setup is needed, go to step 2
      // The parent may also handle navigation if profile already exists
      if (needsProfileSetup) {
        setStep(2);
      }
    } catch (err: any) {
      setError(err?.message || "Could not complete sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      await onGoogleSignIn();
      if (needsProfileSetup) {
        setStep(2);
      }
    } catch (err: any) {
      setError(err?.message || "Google sign in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleContinue = async () => {
    if (!role) return;
    setError("");
    setIsSubmitting(true);
    try {
      if (role === "public") {
        await onCompleteProfile({ role: "public" });
      } else {
        setIsSubmitting(false);
        setStep(3);
      }
    } catch (err: any) {
      setError(err?.message || "Could not save profile. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleDepartmentContinue = async () => {
    setError("");
    setIsSubmitting(true);
    const selectedDept =
      department === "Other" ? otherDepartment.trim() || "Other" : department;
    try {
      await onCompleteProfile({
        role: "authority",
        department: selectedDept,
        verificationStatus: "demo-approved",
      });
    } catch (err: any) {
      setError(err?.message || "Could not save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div className="relative min-h-screen min-h-[100dvh] bg-[#FAFAF8] dark:bg-[#0A0F1E]">
      {/* Progress Bar — hidden during splash */}
      {step > 0 && (
        <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-slate-200 dark:bg-navy-800">
          <div
            className="progress-bar-glow h-full bg-gradient-to-r from-coral-500 to-amber-accent"
            style={{
              width: `${progressPercent}%`,
              transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ====== Step 0: Brand Splash ====== */}
        {step === 0 && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex min-h-screen min-h-[100dvh] items-center justify-center"
          >
            <div className="relative flex flex-col items-center justify-center">
              {/* Concentric beacon rings */}
              <div
                className={`beacon-ring absolute h-48 w-48 rounded-full border ${
                  isDark ? "border-coral-500/30" : "border-coral-500/20"
                }`}
              />
              <div
                className={`beacon-ring-delayed absolute h-72 w-72 rounded-full border ${
                  isDark ? "border-coral-500/30" : "border-coral-500/20"
                }`}
              />
              <div
                className={`beacon-ring-slow absolute h-96 w-96 rounded-full border ${
                  isDark ? "border-coral-500/30" : "border-coral-500/20"
                }`}
              />

              {/* Brand name */}
              <h1 className="splash-brand relative z-10 font-display text-6xl font-black tracking-tight text-slate-950 dark:text-white">
                Beekn
              </h1>
              <p className="relative z-10 mt-3 text-sm font-medium text-slate-400 dark:text-slate-500">
                Your civic signal
              </p>
            </div>
          </motion.div>
        )}

        {/* ====== Step 1: Sign In ====== */}
        {step === 1 && (
          <motion.div
            key="signin"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={slideTransition}
            className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center px-6"
          >
            <div className="w-full max-w-sm space-y-6">
              {/* Heading */}
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                  Welcome to{" "}
                  <span className="text-gradient-coral">Beekn</span>
                </h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Sign in to report, verify, and track civic issues.
                </p>
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-xs transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-navy-700 dark:bg-navy-900 dark:text-white dark:hover:bg-navy-800"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-black text-blue-600 dark:bg-slate-200">
                  G
                </span>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <div className="h-px flex-1 bg-slate-200 dark:bg-navy-700" />
                or use email
                <div className="h-px flex-1 bg-slate-200 dark:bg-navy-700" />
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-coral-500 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    minLength={6}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-coral-500 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                    required
                  />
                </div>

                {/* Error */}
                {error && (
                  <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-coral-500 to-amber-accent px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-coral-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-coral-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Mail className="h-4 w-4" />
                  {isSubmitting
                    ? "Please wait..."
                    : mode === "signin"
                      ? "Sign in"
                      : "Create account"}
                </button>
              </form>

              {/* Toggle sign-in / sign-up */}
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMode((v) => (v === "signin" ? "signup" : "signin"));
                }}
                className="w-full text-center text-xs font-bold text-coral-500 hover:text-coral-600 dark:text-coral-400 dark:hover:text-coral-300"
              >
                {mode === "signin"
                  ? "New here? Create an account"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </motion.div>
        )}

        {/* ====== Step 2: Role Selection ====== */}
        {step === 2 && (
          <motion.div
            key="role"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={slideTransition}
            className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center px-6"
          >
            <div className="w-full max-w-sm space-y-6">
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                  How will you use Beekn?
                </h1>
              </div>

              {/* Role Cards */}
              <div className="space-y-3">
                {/* Public Citizen */}
                <button
                  type="button"
                  onClick={() => setRole("public")}
                  className={`w-full rounded-2xl border p-5 text-left transition ${
                    role === "public"
                      ? "border-coral-500 bg-coral-500/5 ring-2 ring-coral-500/15"
                      : "border-slate-200 hover:border-slate-300 dark:border-navy-700 dark:hover:border-navy-600"
                  }`}
                >
                  <div
                    className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl text-white ${
                      role === "public" ? "bg-coral-500" : "bg-coral-500/80"
                    }`}
                  >
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div className="text-base font-black text-slate-950 dark:text-white">
                    Public Citizen
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Report nearby issues, verify local reports, track progress,
                    and help your area get attention faster.
                  </p>
                </button>

                {/* Authority / Staff */}
                <button
                  type="button"
                  onClick={() => setRole("authority")}
                  className={`w-full rounded-2xl border p-5 text-left transition ${
                    role === "authority"
                      ? "border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/15"
                      : "border-slate-200 hover:border-slate-300 dark:border-navy-700 dark:hover:border-navy-600"
                  }`}
                >
                  <div
                    className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl text-white ${
                      role === "authority" ? "bg-blue-500" : "bg-blue-500/80"
                    }`}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="text-base font-black text-slate-950 dark:text-white">
                    Authority / Staff
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Review assigned reports, update resolution status, and manage
                    issues for your department.
                  </p>
                </button>
              </div>

              {/* Error */}
              {error && (
                <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </p>
              )}

              {/* Continue */}
              <button
                type="button"
                onClick={handleRoleContinue}
                disabled={!role || isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-coral-500 to-amber-accent px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-coral-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-coral-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Continue"}
              </button>
            </div>
          </motion.div>
        )}

        {/* ====== Step 3: Department Selection ====== */}
        {step === 3 && (
          <motion.div
            key="department"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={slideTransition}
            className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center px-6"
          >
            <div className="w-full max-w-sm space-y-6">
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                  Select your department
                </h1>
              </div>

              {/* Department Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {DEPARTMENTS.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setDepartment(item)}
                    className={`flex items-center justify-between rounded-xl border px-3.5 py-3 text-left text-sm font-black transition ${
                      department === item
                        ? "border-coral-500 bg-coral-500/5 text-coral-700 dark:bg-coral-500/10 dark:text-coral-200"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-navy-700 dark:text-slate-300 dark:hover:bg-navy-800"
                    }`}
                  >
                    <span>{item}</span>
                    {department === item && (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* Other department input */}
              {department === "Other" && (
                <input
                  value={otherDepartment}
                  onChange={(e) => setOtherDepartment(e.target.value)}
                  placeholder="Enter department or responsibility"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-coral-500 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                />
              )}

              {/* Demo notice */}
              <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                For this demo, authority access is approved after department
                selection. Official ID verification can be added later.
              </div>

              {/* Error */}
              {error && (
                <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </p>
              )}

              {/* Continue */}
              <button
                type="button"
                onClick={handleDepartmentContinue}
                disabled={!department || isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-coral-500 to-amber-accent px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-coral-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-coral-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Continue"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
