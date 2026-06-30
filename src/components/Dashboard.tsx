import React from "react";
import { motion } from "motion/react";
import { Issue, IssueCategory } from "../types";
import { CivicImpactStats } from "../lib/gamification";
import {
  CheckCircle,
  Clock,
  PlusCircle,
  ChevronRight,
  TrendingUp,
  MapPin,
  Database,
  BarChart3,
  Flame,
  Activity,
  Layers,
  RefreshCw,
  Award,
  ShieldCheck,
} from "lucide-react";
import { EmptyState, SectionHeader, SeverityBadge, StatusBadge } from "./ui";
import MediaPreview from "./MediaPreview";

interface DashboardProps {
  issues: Issue[];
  onReportClick: () => void;
  onIssueSelect: (issue: Issue) => void;
  onTabChange: (tab: "dashboard" | "feed" | "report" | "admin" | "settings") => void;
  onCivicImpactClick?: () => void;
  onResetDatabase?: () => void;
  isAdmin?: boolean;
  civicImpact?: CivicImpactStats;
}

export default function Dashboard({
  issues,
  onReportClick,
  onIssueSelect,
  onTabChange,
  onCivicImpactClick,
  onResetDatabase,
  isAdmin = false,
  civicImpact,
}: DashboardProps) {
  // Compute Stats
  const total = issues.length;
  const active = issues.filter((i) => i.status !== "Resolved" && i.status !== "Rejected").length;
  const resolved = issues.filter((i) => i.status === "Resolved").length;
  const verified = issues.filter((i) => i.status === "Community Verified").length;
  const highPriority = issues.filter(
    (i) => i.severity === "Critical" || i.severity === "High"
  ).length;

  // Recent issues (limit 3)
  const recentIssues = [...issues]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Top Priority Queue sorted by priorityScore descending (limit 3)
  const topPriorityIssues = [...issues]
    .filter((i) => i.status !== "Resolved" && i.status !== "Rejected")
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 3);

  // Category counts and distribution
  const categories: IssueCategory[] = [
    "Road Damage",
    "Garbage",
    "Streetlight",
    "Water Leakage",
    "Drainage",
    "Road Blockage",
    "Other",
  ];

  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = issues.filter((i) => i.category === cat).length;
    return acc;
  }, {} as Record<IssueCategory, number>);

  return (
    <div id="dashboard-view" className="space-y-4 sm:space-y-5 pb-24 md:pb-4 text-slate-800 dark:text-slate-100">
      <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
        <SectionHeader
          title="Community Dashboard"
          subtitle="Track local issues, verify reports, and see what needs attention."
          action={
            <button
              id="btn-dashboard-report-cta"
              onClick={onReportClick}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 shadow-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Report Issue
            </button>
          }
        />
      </div>

      {total === 0 && (
        <EmptyState
          title="No issues reported yet"
          description="Start by reporting a pothole, leak, broken streetlight, or waste problem near you."
          action={
            isAdmin && onResetDatabase ? (
              <button
                onClick={onResetDatabase}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 shadow-sm transition-colors"
              >
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                Load Sample Reports
              </button>
            ) : null
          }
        />
      )}

      {/* Structured Civic Metrics Grid (All 4 states) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Active Issues Count Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2 dark:civic-panel">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wide font-mono">
            <span>Active Issues</span>
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono leading-none">{active}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">still open</div>
          </div>
        </div>

        {/* Resolved Issues Count Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2 dark:civic-panel">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wide font-mono">
            <span>Resolved</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono leading-none">{resolved}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">fixed or closed</div>
          </div>
        </div>

        {/* Community Verified */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2 dark:civic-panel">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wide font-mono">
            <span>Verified Issues</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono leading-none">{verified}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">confirmed by people</div>
          </div>
        </div>

        {/* Total Registered Reports */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2 dark:civic-panel">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wide font-mono">
            <span>Total Reports</span>
            <Database className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono leading-none">{total}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">all reports</div>
          </div>
        </div>
      </div>

      {civicImpact && (
        <button
          type="button"
          onClick={onCivicImpactClick || (() => onTabChange("settings"))}
          className="w-full rounded-xl border border-coral-200 bg-coral-50/40 p-4 text-left shadow-xs transition hover:border-coral-300 hover:bg-coral-50 dark:border-coral-500/20 dark:bg-slate-900/70 dark:hover:border-coral-500/35 dark:hover:bg-slate-900/90"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-coral-700 dark:text-coral-300">
                <Award className="h-4 w-4" />
                Civic Impact
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                Level {civicImpact.level.level}: {civicImpact.level.label}
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {civicImpact.totalPoints} impact points · {civicImpact.estimatedStanding}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:w-80">
              <div className="rounded-lg bg-white p-2 text-center dark:bg-slate-900/70">
                <div className="font-mono text-sm font-black text-slate-900 dark:text-white">{civicImpact.reportsCreated}</div>
                <div className="text-[9px] font-black uppercase text-slate-400">Reports</div>
              </div>
              <div className="rounded-lg bg-white p-2 text-center dark:bg-slate-900/70">
                <div className="font-mono text-sm font-black text-slate-900 dark:text-white">{civicImpact.verifications}</div>
                <div className="text-[9px] font-black uppercase text-slate-400">Verifies</div>
              </div>
              <div className="rounded-lg bg-white p-2 text-center dark:bg-slate-900/70">
                <div className="font-mono text-sm font-black text-slate-900 dark:text-white">{civicImpact.trustPoints}</div>
                <div className="text-[9px] font-black uppercase text-slate-400">Trust</div>
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white dark:bg-slate-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-coral-500 to-amber-accent"
              style={{ width: `${civicImpact.nextLevelProgress}%` }}
            />
          </div>
          {civicImpact.isCooldownActive && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
              <ShieldCheck className="h-4 w-4" />
              Reporting and verification paused until {new Date(civicImpact.activeCooldownUntil!).toLocaleString()}.
            </div>
          )}
        </button>
      )}

      {/* Main Core Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left Column: Category Breakdown Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-xs dark:civic-glass">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 dark:border-teal-400/10">
            <BarChart3 className="w-4 h-4 text-indigo-500 dark:text-teal-300" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono dark:text-slate-100">
              Reports by Category
            </h3>
          </div>
          
          <div className="space-y-3">
            {categories.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const percentage = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-200">
                    <span className="truncate">{cat}</span>
                    <span className="font-mono text-slate-400 text-[11px]">
                      {count} {count === 1 ? "report" : "reports"} ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden dark:bg-slate-800/90">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500 dark:bg-gradient-to-r dark:from-teal-400 dark:to-indigo-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Top Priority Queue */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-xs dark:civic-glass">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-teal-400/10">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono dark:text-slate-100">
                High Priority Issues
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
              Priority order
            </span>
          </div>

          <div className="space-y-3">
            {topPriorityIssues.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">
                No high priority issues need attention right now.
              </p>
            ) : (
              topPriorityIssues.map((issue) => (
                <div
                  key={issue.id}
                  id={`queue-card-${issue.id}`}
                  onClick={() => onIssueSelect(issue)}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer dark:civic-tile dark:hover:border-teal-400/30"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={issue.severity} />
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
                        {issue.suggestedDepartment.split(" ")[0]}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
                      {issue.title}
                    </h4>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] font-mono font-bold text-indigo-600 dark:text-teal-300">
                      Score: {issue.priorityScore}/100
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase leading-none block mt-0.5">
                      {issue.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Stream */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold tracking-tight text-slate-700 uppercase tracking-wider font-mono dark:text-slate-100">
              Recent Reports
            </h3>
          </div>
          <button
            onClick={() => onTabChange("feed")}
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-teal-300 dark:hover:text-teal-200"
          >
            View Issues <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {recentIssues.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400 text-xs dark:border-slate-700 dark:bg-slate-900/40">
              No reported issues yet. Be the first to report!
            </div>
          ) : (
            recentIssues.map((issue) => {
              const isResolved = issue.status === "Resolved";
              return (
                <div
                  key={issue.id}
                  id={`recent-issue-card-${issue.id}`}
                  onClick={() => onIssueSelect(issue)}
                  className={`flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-xs hover:border-slate-200 transition-all cursor-pointer dark:civic-tile dark:hover:border-teal-400/30 ${
                    isResolved ? "opacity-80 border-green-200 bg-slate-50/20 dark:border-emerald-500/20" : ""
                  }`}
                >
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                    <MediaPreview
                      src={issue.mediaUrl || issue.imageUrl}
                      alt={issue.title}
                      mediaType={issue.mediaType}
                      className="h-full w-full object-cover"
                      badgeClassName="absolute bottom-1 right-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={issue.status} />
                        <SeverityBadge severity={issue.severity} />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-indigo-600">
                        P: {issue.priorityScore}
                      </span>
                    </div>
                    
                    <h4 className={`text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate leading-tight ${isResolved ? "line-through text-slate-500 dark:text-slate-400 font-medium" : ""}`}>
                      {issue.title}
                    </h4>
                    
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      <span className="flex items-center gap-0.5 truncate max-w-[150px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{issue.location}</span>
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[9px] text-slate-500">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 self-center shrink-0" />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Routing Rules & Advisory */}
      {isAdmin && (
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-800/70">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-slate-400" />
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
            Department Routing Rules
          </h4>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
          Gemini helps classify reports and suggest the right department, priority, and next action.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-600 font-semibold">
          <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-md border border-slate-100 dark:civic-tile">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Road Damage → PWD
          </div>
          <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-md border border-slate-100 dark:civic-tile">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Garbage → Sanitation
          </div>
          <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-md border border-slate-100 dark:civic-tile">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Streetlight → Lighting
          </div>
          <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-md border border-slate-100 dark:civic-tile">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Water Leak → Water Board
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
