import React, { useState } from "react";
import { Building2, CheckCircle2, ShieldCheck, UserRound } from "lucide-react";
import { UserProfile, UserRole } from "../types";

const DEPARTMENTS = [
  "Sanitation",
  "Roads / PWD",
  "Lighting / Electricity",
  "Water Board",
  "Campus Facilities",
  "Other",
];

interface RoleOnboardingProps {
  email?: string | null;
  displayName?: string | null;
  onComplete: (data: Pick<UserProfile, "role" | "department" | "verificationStatus">) => Promise<void>;
}

export default function RoleOnboarding({ email, displayName, onComplete }: RoleOnboardingProps) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [otherDepartment, setOtherDepartment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!role) return;
    setError("");
    setIsSaving(true);
    try {
      await onComplete({
        role,
        department: role === "authority" ? (department === "Other" ? otherDepartment.trim() || "Other" : department) : undefined,
        verificationStatus: role === "authority" ? "demo-approved" : undefined,
      });
    } catch (err: any) {
      setError(err?.message || "Could not save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] px-4 py-8 text-[#1A1A2E] dark:bg-[#0A0F1E] dark:text-[#F0F0F5]">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-4xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/40 dark:border-navy-700 dark:bg-navy-900 dark:shadow-black/30">
          <div className="border-b border-slate-100 p-6 dark:border-navy-800">
            <div className="text-xs font-black uppercase tracking-widest text-coral-600 dark:text-coral-400">Profile setup</div>
            <h1 className="mt-2 text-2xl font-black tracking-tight font-display">How will you use Beekn?</h1>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              {displayName || email || "Your account"} can be a public citizen profile or an authority profile.
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setRole("public")}
              className={`rounded-2xl border p-5 text-left transition ${
                role === "public"
                  ? "border-coral-500 bg-coral-50 ring-2 ring-coral-500/15 dark:bg-coral-500/10 dark:border-coral-500/50"
                  : "border-slate-200 hover:border-slate-300 dark:border-navy-700 dark:hover:border-navy-600"
              }`}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-coral-500 to-amber-accent text-white shadow-md">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="text-base font-black">Public Citizen</div>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Report nearby issues, verify local reports, track progress, and help your area get attention faster.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setRole("authority")}
              className={`rounded-2xl border p-5 text-left transition ${
                role === "authority"
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/15 dark:bg-blue-500/10 dark:border-blue-500/50"
                  : "border-slate-200 hover:border-slate-300 dark:border-navy-700 dark:hover:border-navy-600"
              }`}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="text-base font-black">Authority / Staff</div>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Review assigned reports, update resolution status, and manage issues for your department.
              </p>
            </button>
          </div>

          {role === "authority" && (
            <div className="border-t border-slate-100 px-5 py-5 dark:border-navy-800">
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                What issues do you handle?
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {DEPARTMENTS.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setDepartment(item)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs font-black transition ${
                      department === item
                        ? "border-coral-500 bg-coral-50 text-coral-700 dark:bg-coral-500/10 dark:text-coral-200 dark:border-coral-500/50"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-navy-700 dark:text-slate-300 dark:hover:bg-navy-800"
                    }`}
                  >
                    {item}
                    {department === item && <CheckCircle2 className="h-4 w-4" />}
                  </button>
                ))}
              </div>
              {department === "Other" && (
                <input
                  value={otherDepartment}
                  onChange={(event) => setOtherDepartment(event.target.value)}
                  placeholder="Enter department or responsibility"
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-coral-500 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                />
              )}
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                For this demo, authority access is approved after department selection. Official ID verification can be added later.
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-5 dark:border-navy-800">
            {error ? <p className="text-xs font-bold text-rose-600 dark:text-rose-300">{error}</p> : <div />}
            <button
              type="button"
              onClick={save}
              disabled={!role || isSaving}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-coral-500 to-amber-accent px-5 py-3 text-sm font-black text-white shadow-lg shadow-coral-500/20 transition hover:shadow-xl hover:shadow-coral-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
