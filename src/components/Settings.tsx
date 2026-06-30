import React, { useEffect, useState } from "react";
import {
  Bell,
  Award,
  ChevronRight,
  Database,
  Download,
  Edit2,
  Eye,
  EyeOff,
  Info,
  LogOut,
  MapPin,
  Moon,
  RefreshCw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Trash2,
  UserRound,
} from "lucide-react";
import { AppPreferences, UserProfile } from "../types";
import { CivicImpactStats } from "../lib/gamification";

interface SettingsProps {
  profile: UserProfile | null;
  isAnonymous: boolean;
  theme: "light" | "dark";
  preferences: AppPreferences;
  issueCount: number;
  reportsCreatedCount: number;
  verifiedIssueCount: number;
  isOfflineMode: boolean;
  civicImpact?: CivicImpactStats;
  onToggleTheme: () => void;
  onPreferenceChange: (preferences: AppPreferences) => void;
  onUpdateDisplayName: (displayName: string) => Promise<void>;
  onExportAccountData: () => void;
  onClearLocalData: () => void;
  onLogout: () => void;
}

type PreferenceGroup = keyof AppPreferences;

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
        checked
          ? "border-coral-500 bg-coral-500"
          : "border-slate-200 bg-slate-200 dark:border-slate-700 dark:bg-slate-800"
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SettingsRow({
  icon,
  title,
  description,
  control,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-xs dark:bg-slate-800 dark:text-slate-300">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-black text-slate-900 dark:text-white">{title}</div>
          <div className="mt-0.5 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </div>
        </div>
      </div>
      {control}
    </div>
  );
}

export default function Settings({
  profile,
  isAnonymous,
  theme,
  preferences,
  issueCount,
  reportsCreatedCount,
  verifiedIssueCount,
  isOfflineMode,
  civicImpact,
  onToggleTheme,
  onPreferenceChange,
  onUpdateDisplayName,
  onExportAccountData,
  onClearLocalData,
  onLogout,
}: SettingsProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState(profile?.displayName || "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState("");
  const [showImpactRules, setShowImpactRules] = useState(false);
  const [showBadges, setShowBadges] = useState(false);

  useEffect(() => {
    setDisplayNameDraft(profile?.displayName || "");
  }, [profile?.displayName]);

  const updatePreference = <Group extends PreferenceGroup, Key extends keyof AppPreferences[Group]>(
    group: Group,
    key: Key,
    value: AppPreferences[Group][Key]
  ) => {
    onPreferenceChange({
      ...preferences,
      [group]: {
        ...preferences[group],
        [key]: value,
      },
    });
  };

  const accountStatus = isAnonymous ? "Anonymous demo session" : profile?.email || "Signed in";
  const joinedAt = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Session only";

  const saveDisplayName = async () => {
    setNameError("");
    setIsSavingName(true);
    try {
      await onUpdateDisplayName(displayNameDraft);
      setIsEditingName(false);
    } catch (error: any) {
      setNameError(error?.message || "Could not update display name.");
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 md:pb-4 text-slate-800 dark:text-slate-100">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-black tracking-tight text-slate-950 dark:text-white">
            Settings
          </h2>
          <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Manage your account, privacy, notifications, and local app data.
          </p>
        </div>
        <div
          className={`inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-wide ${
            isOfflineMode
              ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${isOfflineMode ? "bg-amber-500" : "bg-emerald-500"}`} />
          {isOfflineMode ? "Local sync" : "Cloud ready"}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:civic-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-coral-50 text-coral-700 dark:bg-coral-500/10 dark:text-coral-300">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserRound className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0">
              {isEditingName ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    value={displayNameDraft}
                    onChange={(event) => setDisplayNameDraft(event.target.value)}
                    className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900 outline-none focus:border-coral-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    placeholder="Display name"
                    maxLength={40}
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={saveDisplayName}
                      disabled={isSavingName}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-coral-500 px-3 text-xs font-black text-white transition hover:bg-coral-600 disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {isSavingName ? "Saving" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingName(false);
                        setNameError("");
                        setDisplayNameDraft(profile?.displayName || "");
                      }}
                      className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex min-w-0 items-center gap-2">
                  <div className="truncate text-base font-black text-slate-900 dark:text-white">
                    {profile?.displayName || profile?.email || "Guest user"}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    disabled={!profile || isAnonymous}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                    aria-label="Edit display name"
                    title="Edit display name"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <div className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                {accountStatus}
              </div>
              {nameError && <div className="mt-1 text-[10px] font-bold text-rose-600 dark:text-rose-300">{nameError}</div>}
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {profile?.role || "Public"} profile
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  Joined {joinedAt}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:w-72">
            <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/70">
              <div className="font-mono text-lg font-black text-slate-900 dark:text-white">{reportsCreatedCount}</div>
              <div className="text-[9px] font-black uppercase text-slate-400">Reports</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/70">
              <div className="font-mono text-lg font-black text-slate-900 dark:text-white">{verifiedIssueCount}</div>
              <div className="text-[9px] font-black uppercase text-slate-400">Verified</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/70">
              <div className="font-mono text-lg font-black text-slate-900 dark:text-white">{issueCount}</div>
              <div className="text-[9px] font-black uppercase text-slate-400">Loaded</div>
            </div>
          </div>
        </div>

        {profile?.role === "authority" && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            Authority workspace active for {profile.department || "all departments"}.
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:civic-panel">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-coral-600 dark:text-coral-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-100">
            App Preferences
          </h3>
        </div>

        <SettingsRow
          icon={theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          title="Theme"
          description={`Current mode: ${theme === "dark" ? "Dark" : "Light"}.`}
          control={
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white transition hover:bg-slate-800 dark:bg-coral-500 dark:text-slate-950 dark:hover:bg-coral-400"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              Toggle
            </button>
          }
        />

        <SettingsRow
          icon={<Bell className="h-4 w-4" />}
          title="Status notifications"
          description="Get notified when reports you follow move through the civic workflow."
          control={
            <ToggleSwitch
              checked={preferences.notifications.statusUpdates}
              label="Toggle status notifications"
              onChange={() => updatePreference("notifications", "statusUpdates", !preferences.notifications.statusUpdates)}
            />
          }
        />

        <SettingsRow
          icon={<MapPin className="h-4 w-4" />}
          title="Nearby issue alerts"
          description="Prioritize new reports around your last known area when location is available."
          control={
            <ToggleSwitch
              checked={preferences.notifications.nearbyIssues}
              label="Toggle nearby issue alerts"
              onChange={() => updatePreference("notifications", "nearbyIssues", !preferences.notifications.nearbyIssues)}
            />
          }
        />

        <SettingsRow
          icon={<RefreshCw className="h-4 w-4" />}
          title="Weekly digest"
          description="Reserve a weekly summary preference for production email or push delivery."
          control={
            <ToggleSwitch
              checked={preferences.notifications.weeklyDigest}
              label="Toggle weekly digest"
              onChange={() => updatePreference("notifications", "weeklyDigest", !preferences.notifications.weeklyDigest)}
            />
          }
        />
      </section>

      {civicImpact && (
        <section id="settings-civic-impact" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs scroll-mt-6 dark:civic-panel">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-coral-600 dark:text-coral-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-100">
                Civic Impact
              </h3>
            </div>
            <span className="rounded-full bg-coral-50 px-2.5 py-1 text-[10px] font-black text-coral-700 dark:bg-coral-500/10 dark:text-coral-300">
              {civicImpact.estimatedStanding}
            </span>
          </div>

          <div className="rounded-xl border border-coral-100 bg-coral-50/40 p-4 dark:border-coral-500/20 dark:bg-slate-900/70">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  Level {civicImpact.level.level}: {civicImpact.level.label}
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {civicImpact.totalPoints} impact points · {civicImpact.trustPoints} trust score
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:w-56">
                <div className="rounded-lg bg-white p-2 text-center dark:bg-slate-900/70">
                  <div className="font-mono text-sm font-black">{civicImpact.citizenPoints}</div>
                  <div className="text-[9px] font-black uppercase text-slate-400">Citizen</div>
                </div>
                <div className="rounded-lg bg-white p-2 text-center dark:bg-slate-900/70">
                  <div className="font-mono text-sm font-black">{civicImpact.authorityPoints}</div>
                  <div className="text-[9px] font-black uppercase text-slate-400">Admin</div>
                </div>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white dark:bg-slate-900">
              <div
                className="h-full rounded-full bg-gradient-to-r from-coral-500 to-amber-accent"
                style={{ width: `${civicImpact.nextLevelProgress}%` }}
              />
            </div>
          </div>

          {civicImpact.isCooldownActive && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
              Reporting and verification are paused until {new Date(civicImpact.activeCooldownUntil!).toLocaleString()} after moderation review.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Reports", civicImpact.reportsCreated],
              ["Verified", civicImpact.verifications],
              ["Comments", civicImpact.comments],
              ["Resolved", civicImpact.resolvedReports],
              ["Rejected", civicImpact.rejectedReports],
              ["Invalid votes", civicImpact.invalidVerifications],
              ["Admin closes", civicImpact.resolvedByAdmin],
              ["Avg hours", civicImpact.averageResolutionHours == null ? "-" : Math.round(civicImpact.averageResolutionHours)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/70">
                <div className="font-mono text-lg font-black text-slate-900 dark:text-white">{value}</div>
                <div className="text-[9px] font-black uppercase text-slate-400">{label}</div>
              </div>
            ))}
          </div>
          
          {civicImpact.trustPoints < 100 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-3 text-xs font-semibold leading-relaxed text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              ⚠️ Your trust score has decreased. Please be careful to submit only genuine, accurate reports. Submitting false, duplicate, or misleading reports will lower your standing and can activate a cooldown period.
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowImpactRules((value) => !value)}
            className="inline-flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:bg-slate-800"
          >
            <span className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
              <Info className="h-4 w-4 text-coral-600 dark:text-coral-400" />
              Know more about impact rules
            </span>
            <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${showImpactRules ? "rotate-90" : ""}`} />
          </button>

          {showImpactRules && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
              <div>
                <div className="font-black text-slate-900 dark:text-white">Impact points</div>
                <p>Reports earn 50 points, verifications earn 20, comments earn 10, community-verified own reports earn 30, and resolved own reports earn 75.</p>
              </div>
              <div>
                <div className="font-black text-slate-900 dark:text-white">Levels</div>
                <p>Level 1 New Neighbor: 0 points. Level 2 Local Helper: 100. Level 3 Community Scout: 250. Level 4 Civic Signal: 500. Level 5 Neighborhood Champion: 900.</p>
              </div>
              <div>
                <div className="font-black text-slate-900 dark:text-white">Trust score</div>
                <p>Everyone starts from a 100 trust base. Valid verifications and resolved own reports improve trust. Rejected reports or invalid verifications reduce trust.</p>
              </div>
              <div>
                <div className="font-black text-slate-900 dark:text-white">Admin response score</div>
                <p>Authority users earn operational points for resolving reports. Faster resolution earns more, and high or critical severity reports are weighted higher.</p>
              </div>
              <div>
                <div className="font-black text-slate-900 dark:text-white">Rejected reports and cooldowns</div>
                <p>Admins can reject duplicate, non-civic, misleading, spam, or low-evidence reports. Serious misuse can temporarily pause reporting and verification for the submitter.</p>
              </div>
              <div>
                <div className="font-black text-slate-900 dark:text-white">Private standing estimate</div>
                <p>The top percentage label is a private estimate based on your points. Beekn does not show a public leaderboard or reveal other users.</p>
              </div>
            </div>
          )}
        </section>
      )}

      {civicImpact && (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:civic-panel">
          <button
            type="button"
            onClick={() => setShowBadges((value) => !value)}
            className="flex w-full flex-col gap-2 text-left"
          >
            <div className="flex w-full items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Award className="h-4 w-4 text-coral-600 dark:text-coral-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-100">
                  Badges
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  {civicImpact.badges.filter((badge) => badge.unlocked).length}/{civicImpact.badges.length}
                </span>
              </span>
              <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${showBadges ? "rotate-90" : ""}`} />
            </div>

            <p className="text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Unlock recognition for useful reports, local verification, helpful comments, follow-through, and fast authority response.
            </p>
          </button>

          {showBadges && (
            <div className="grid gap-2 sm:grid-cols-2">
              {civicImpact.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-xl border p-3 ${
                    badge.unlocked
                      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                      : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-black text-slate-900 dark:text-white">{badge.label}</div>
                    <span className={`text-[10px] font-black ${badge.unlocked ? "text-emerald-700 dark:text-emerald-300" : "text-slate-400"}`}>
                      {badge.unlocked ? "Unlocked" : `${badge.progress}/${badge.target}`}
                    </span>
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{badge.description}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:civic-panel">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-coral-600 dark:text-coral-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-100">
            Privacy & Trust
          </h3>
        </div>

        <SettingsRow
          icon={preferences.privacy.showReporterName ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          title="Show my name on reports"
          description="Use your profile name on reports and comments when the backend supports attribution controls."
          control={
            <ToggleSwitch
              checked={preferences.privacy.showReporterName}
              label="Toggle public reporter name"
              onChange={() => updatePreference("privacy", "showReporterName", !preferences.privacy.showReporterName)}
            />
          }
        />

        <SettingsRow
          icon={<MapPin className="h-4 w-4" />}
          title="Remember last location"
          description="Keep your last successful browser location locally for nearby sorting."
          control={
            <ToggleSwitch
              checked={preferences.privacy.rememberLastLocation}
              label="Toggle remembered location"
              onChange={() => {
                const nextValue = !preferences.privacy.rememberLastLocation;
                if (!nextValue) localStorage.removeItem("community_hero_last_good_location");
                updatePreference("privacy", "rememberLastLocation", nextValue);
              }}
            />
          }
        />

        <SettingsRow
          icon={<Database className="h-4 w-4" />}
          title="Product analytics"
          description="Allow privacy-safe usage metrics once analytics is connected in production."
          control={
            <ToggleSwitch
              checked={preferences.privacy.allowAnalytics}
              label="Toggle product analytics"
              onChange={() => updatePreference("privacy", "allowAnalytics", !preferences.privacy.allowAnalytics)}
            />
          }
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:civic-panel">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-coral-600 dark:text-coral-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-100">
            Data Controls
          </h3>
        </div>

        <button
          type="button"
          onClick={onExportAccountData}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-left transition hover:border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:bg-slate-800"
        >
          <span className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-xs dark:bg-slate-800 dark:text-slate-300">
              <Download className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-slate-900 dark:text-white">Export account data</span>
              <span className="mt-0.5 block text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                Download profile, preferences, local verifications, and reports created by this account.
              </span>
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
        </button>

        <button
          type="button"
          onClick={onClearLocalData}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-left transition hover:border-amber-200 hover:bg-amber-50 dark:border-amber-500/15 dark:bg-slate-900/70 dark:hover:border-amber-500/25 dark:hover:bg-slate-900/90"
        >
          <span className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-xs dark:bg-slate-900 dark:text-amber-300">
              <Trash2 className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-amber-900 dark:text-amber-100">Clear local device data</span>
              <span className="mt-0.5 block text-xs font-medium leading-relaxed text-amber-700/80 dark:text-amber-200/80">
                Remove cached reports, saved location, local draft state, and local verification markers.
              </span>
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-amber-400" />
        </button>
      </section>

      <button
        type="button"
        onClick={onLogout}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-rose-600/15 transition hover:bg-rose-700"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </div>
  );
}
