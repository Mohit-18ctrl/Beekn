import React, { useState } from "react";
import { motion } from "motion/react";
import { Mail, X } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
  onGoogleSignIn: () => Promise<void>;
  onEmailSignIn: (email: string, password: string) => Promise<void>;
  onEmailSignUp: (email: string, password: string) => Promise<void>;
}

export default function AuthModal({
  onClose,
  onGoogleSignIn,
  onEmailSignIn,
  onEmailSignUp,
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      if (mode === "signin") {
        await onEmailSignIn(email, password);
      } else {
        await onEmailSignUp(email, password);
      }
    } catch (err: any) {
      setError(err?.message || "Could not complete sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const googleSignIn = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      await onGoogleSignIn();
    } catch (err: any) {
      setError(err?.message || "Google sign in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-navy-700 dark:bg-navy-900"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-navy-800">
          <div>
            <h2 className="text-base font-black text-slate-950 dark:text-white font-display">Citizen Account</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Sign in to report, verify, and track issues.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-navy-800 dark:hover:text-white"
            aria-label="Close sign in"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <button
            type="button"
            onClick={googleSignIn}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-navy-700 dark:bg-navy-800 dark:text-white dark:hover:bg-navy-700"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-black text-blue-600 shadow-xs">G</span>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <div className="h-px flex-1 bg-slate-200 dark:bg-navy-800" />
            or use email
            <div className="h-px flex-1 bg-slate-200 dark:bg-navy-800" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-coral-500 focus:ring-1 focus:ring-coral-500/20 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-coral-500 focus:ring-1 focus:ring-coral-500/20 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                required
              />
            </div>

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-coral-500 to-amber-accent px-4 py-3 text-sm font-black text-white shadow-lg shadow-coral-500/20 transition hover:shadow-xl hover:shadow-coral-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Mail className="h-4 w-4" />
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setError("");
              setMode((value) => (value === "signin" ? "signup" : "signin"));
            }}
            className="w-full text-center text-xs font-bold text-coral-600 hover:text-coral-700 dark:text-coral-400 dark:hover:text-coral-300"
          >
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
