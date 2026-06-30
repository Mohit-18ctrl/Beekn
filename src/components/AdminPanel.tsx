import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Issue, IssueCategory, IssueStatus, IssueSeverity, IssueRejectionReason, matchesAdminDepartment } from "../types";
import { CivicImpactStats } from "../lib/gamification";
import {
  Database,
  RefreshCw,
  Building2,
  Clock,
  Sparkles,
  Filter,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  MapPin,
  ThumbsUp,
  ChevronRight,
  SlidersHorizontal,
  LogOut,
  Award,
} from "lucide-react";

interface AdminPanelProps {
  issues: Issue[];
  onResetDatabase: () => void;
  onUpdateStatus: (id: string, status: IssueStatus) => void;
  onRejectIssue: (id: string, reason: IssueRejectionReason, note: string) => void;
  onIssueSelect: (issue: Issue) => void;
  adminDepartment?: string;
  onLogout?: () => void;
  civicImpact?: CivicImpactStats;
}

export default function AdminPanel({
  issues,
  onResetDatabase,
  onUpdateStatus,
  onRejectIssue,
  onIssueSelect,
  adminDepartment = "All Departments",
  onLogout,
  civicImpact,
}: AdminPanelProps) {
  // Filter States
  const [filterDepartment, setFilterDepartment] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterSeverity, setFilterSeverity] = useState<string>("All");
  const [showSystemLogs, setShowSystemLogs] = useState<boolean>(false);

  // Filter issues based on logged in admin department
  const visibleIssues = issues.filter((i) =>
    matchesAdminDepartment(i.suggestedDepartment, adminDepartment)
  );

  // Get unique departments dynamically from matching issues
  const allDepartments = Array.from(
    new Set(visibleIssues.map((i) => i.suggestedDepartment || "Unassigned / General"))
  ).filter(Boolean);

  // Group and compute stats per department
  const departmentsList = filterDepartment === "All" ? allDepartments : [filterDepartment];

  const departmentQueues = departmentsList.map((dept) => {
    // All issues belonging to this department
    const deptIssues = visibleIssues.filter((i) => (i.suggestedDepartment || "Unassigned / General") === dept);

    const openIssues = deptIssues.filter((i) => i.status !== "Resolved" && i.status !== "Rejected");
    const resolvedIssues = deptIssues.filter((i) => i.status === "Resolved");
    const highSeverityCount = openIssues.filter(
      (i) => i.severity === "High" || i.severity === "Critical"
    ).length;

    // Find highest priority unresolved/open issue
    const highestPriorityIssue =
      openIssues.length > 0
        ? openIssues.reduce((prev, current) =>
            prev.priorityScore > current.priorityScore ? prev : current
          )
        : null;

    // Filtered list of issues to display inside this queue card
    const filteredIssues = deptIssues.filter((issue) => {
      if (filterStatus !== "All" && issue.status !== filterStatus) return false;
      if (filterSeverity !== "All" && issue.severity !== filterSeverity) return false;
      return true;
    });

    return {
      name: dept,
      totalOpen: openIssues.length,
      highSeverityCount,
      resolvedCount: resolvedIssues.length,
      highestPriorityIssue,
      issues: filteredIssues,
    };
  });

  // Global totals for original stats overview
  const totalReports = visibleIssues.length;
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
    acc[cat] = visibleIssues.filter((i) => i.category === cat).length;
    return acc;
  }, {} as Record<IssueCategory, number>);

  const getMockLogs = () => {
    return [
      { time: "11:15 AM", text: "Vite dev server bound securely to port 3000.", type: "system" },
      { time: "11:08 AM", text: "Department routing rules updated.", type: "system" },
      { time: "11:00 AM", text: "Gemini 3.5 Flash priority matrix synchronized.", type: "gemini" },
      { time: "10:45 AM", text: "Automatic verification thresholds verified at 3 votes.", type: "event" },
    ];
  };

  const getSeverityBadgeClass = (sev: IssueSeverity) => {
    switch (sev) {
      case "Critical":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "High":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusClass = (status: IssueStatus) => {
    switch (status) {
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "Rejected":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "In Progress":
        return "bg-purple-100 text-purple-800 border-purple-200 animate-pulse";
      case "Community Verified":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <div className="space-y-6 pb-12 text-slate-800 dark:text-slate-100" id="admin-view-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex flex-wrap items-center gap-2 dark:text-slate-100">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Admin Console
            {adminDepartment && (
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase">
                {adminDepartment}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage department queues, high-priority issues, and status updates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowSystemLogs(!showSystemLogs)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold py-2 px-3.5 transition-all shadow-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {showSystemLogs ? "Hide Logs & Stats" : "Show Logs & Stats"}
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-red-600 hover:text-red-700 text-xs font-bold py-2 px-3.5 transition-all shadow-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-red-300 dark:hover:bg-slate-700"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              Switch to Public
            </button>
          )}
          <button
            id="btn-db-reset"
            onClick={onResetDatabase}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold py-2 px-3.5 transition-all shadow-xs font-mono"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Data
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-1 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">
            <Database className="w-4 h-4 text-indigo-500" /> ACTIVE DATABASE
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalReports} Reports</div>
          <p className="text-[10px] text-slate-400">Synchronized via Firestore</p>
        </div>

        <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-4 shadow-xs space-y-1 dark:border-indigo-500/20 dark:bg-indigo-500/10">
          <div className="flex items-center gap-2 text-indigo-500 text-[10px] font-bold uppercase tracking-wider font-mono">
            <Sparkles className="w-4 h-4" /> GEMINI AI ROUTER
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">CONNECTED</div>
          <p className="text-[10px] text-indigo-600">Model: gemini-3.5-flash</p>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/20 p-4 shadow-xs space-y-1 dark:border-amber-500/20 dark:bg-amber-500/10">
          <div className="flex items-center gap-2 text-amber-600 text-[10px] font-bold uppercase tracking-wider font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> HIGH PRIORITY LOAD
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {visibleIssues.filter((i) => i.status !== "Resolved" && i.priorityScore >= 75).length} High Priority
          </div>
          <p className="text-[10px] text-amber-700">Awaiting department attention</p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-4 shadow-xs space-y-1 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-bold uppercase tracking-wider font-mono">
            <Award className="w-4 h-4" /> RESPONSE SCORE
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {civicImpact?.authorityPoints || 0} pts
          </div>
          <p className="text-[10px] text-emerald-700">
            {civicImpact?.resolvedByAdmin || 0} issues resolved by this admin
          </p>
        </div>
      </div>


      {/* Accordion System Logs & Category Stats */}
      <AnimatePresence>
        {showSystemLogs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4 pb-2"
          >
            {/* Category breakdown */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
                REPORT DISTRIBUTION BY CATEGORY
              </h3>
              <div className="space-y-2">
                {categories.map((cat) => {
                  const count = categoryCounts[cat] || 0;
                  const percentage = totalReports > 0 ? (count / totalReports) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <span>{cat}</span>
                        <span className="font-mono text-slate-400">{count} reports</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* System logs */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs flex flex-col dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
                Admin Activity Log
              </h3>
              <div className="flex-1 bg-slate-900 rounded-lg p-3 font-mono text-[10px] text-slate-300 space-y-2 max-h-56 overflow-y-auto native-scroll">
                {getMockLogs().map((log, index) => (
                  <div key={index} className="flex items-start gap-2 border-b border-slate-800/60 pb-1.5">
                    <span className="text-slate-500 flex-shrink-0">{log.time}</span>
                    <span className="text-indigo-400 flex-shrink-0">[{log.type.toUpperCase()}]</span>
                    <span className="text-slate-100">{log.text}</span>
                  </div>
                ))}
                <div className="text-[9px] text-green-400 animate-pulse">QUEUES ACTIVE | INDEX OK</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filters Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono dark:text-slate-200">
            Queue Filters
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Department Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">Department</label>
            <div className="relative">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="All">All Departments ({allDepartments.length})</option>
                {allDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">Lifecycle Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Community Verified">Community Verified</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {(filterDepartment !== "All" || filterStatus !== "All" || filterSeverity !== "All") && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => {
                setFilterDepartment("All");
                setFilterStatus("All");
                setFilterSeverity("All");
              }}
              className="text-[10px] font-mono font-bold text-indigo-600 hover:text-indigo-800"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Queues Container */}
      <div className="space-y-6">
        {departmentQueues.length === 0 || (departmentQueues.length === 1 && departmentQueues[0].name === "") ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-sm text-slate-500 font-medium dark:text-slate-400">No department queues found.</p>
          </div>
        ) : (
          departmentQueues.map((queue) => {
            if (!queue.name) return null;
            return (
              <div
                key={queue.name}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Department Queue Header Card */}
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 dark:border-slate-800 dark:bg-slate-800/70">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5 dark:text-slate-100">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      {queue.name}
                    </h3>
                    {queue.highestPriorityIssue && (
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span className="font-bold text-red-600">Highest Priority Issue:</span>{" "}
                        <span className="font-semibold max-w-xs truncate inline-block align-bottom">
                          {queue.highestPriorityIssue.title}
                        </span>{" "}
                        <span className="font-mono text-indigo-600 font-bold">
                          ({queue.highestPriorityIssue.priorityScore}/100)
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Badges Overview */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      {queue.totalOpen} Open Issues
                    </span>
                    {queue.highSeverityCount > 0 && (
                      <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-100 text-rose-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {queue.highSeverityCount} Critical/High
                      </span>
                    )}
                    {queue.resolvedCount > 0 && (
                      <span className="inline-flex items-center gap-1 bg-green-50 border border-green-100 text-green-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {queue.resolvedCount} Resolved
                      </span>
                    )}
                  </div>
                </div>

                {/* Issues List inside Department Queue */}
                <div className="divide-y divide-slate-100">
                  {queue.issues.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 font-medium">
                      No issues in this queue match the selected filters.
                    </div>
                  ) : (
                    queue.issues.map((issue) => {
                      const isHighPriorityUnresolved =
                        issue.priorityScore >= 75 && issue.status !== "Resolved" && issue.status !== "Rejected";

                      return (
                        <div
                          key={issue.id}
                          onClick={() => onIssueSelect(issue)}
                          className={`p-4 transition-all hover:bg-slate-50/50 cursor-pointer relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:hover:bg-slate-800/70 ${
                            isHighPriorityUnresolved
                              ? "border-l-4 border-amber-500 bg-amber-500/2"
                              : "border-l-4 border-transparent"
                          }`}
                        >
                          {/* Left Column: Priority Score & Info */}
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            {/* Score Display */}
                            <div
                              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-mono border flex-shrink-0 ${
                                isHighPriorityUnresolved
                                  ? "bg-amber-50 border-amber-200 text-amber-700 font-black"
                                  : issue.status === "Rejected"
                                  ? "bg-rose-50 border-rose-200 text-rose-700"
                                  : issue.status === "Resolved"
                                  ? "bg-green-50 border-green-200 text-green-700"
                                  : "bg-slate-50 border-slate-200 text-slate-600"
                              }`}
                            >
                              <span className="text-[10px] font-bold leading-none text-slate-400">PRIO</span>
                              <span className="text-sm font-black mt-0.5 leading-none">
                                {issue.priorityScore}
                              </span>
                            </div>

                            {/* Main Text Details */}
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h4 className="text-xs font-bold text-slate-800 truncate max-w-sm dark:text-slate-100">
                                  {issue.title}
                                </h4>
                                {isHighPriorityUnresolved && (
                                  <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded-sm font-mono uppercase tracking-wider animate-pulse">
                                    High Priority
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-y-1 gap-x-2.5 text-[10px] text-slate-500">
                                <span className="font-semibold text-slate-600 dark:text-slate-300">{issue.category}</span>
                                <span className="flex items-center gap-0.5 truncate">
                                  <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                  {issue.location}
                                </span>
                                <span className="flex items-center gap-1 font-mono text-slate-400">
                                  <ThumbsUp className="w-3 h-3 text-slate-400" />
                                  {issue.verificationCount || 0} votes
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Status controls & Badges */}
                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 justify-between sm:justify-end">
                            {/* Status and Severity Badges */}
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold border rounded-md uppercase tracking-wider font-mono ${getSeverityBadgeClass(
                                  issue.severity
                                )}`}
                              >
                                {issue.severity}
                              </span>
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider font-mono ${
                                  getStatusClass(issue.status)
                                }`}
                              >
                                {issue.status}
                              </span>
                            </div>

                            {/* Direct Status Update Dropdown inside the queue */}
                            <div
                              className="relative"
                              onClick={(e) => e.stopPropagation()} // Stop issue detail navigation on selector click
                            >
                              <select
                                value={issue.status}
                                onChange={(e) =>
                                  onUpdateStatus(issue.id, e.target.value as IssueStatus)
                                }
                                className="bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg py-1 px-2.5 text-[10px] font-bold text-slate-700 focus:outline-hidden transition-all uppercase tracking-wider cursor-pointer font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                              >
                                <option value="Reported">Set Reported</option>
                                <option value="Community Verified">Set Verified</option>
                                <option value="In Progress">Set In Progress</option>
                                <option value="Resolved">Set Resolved</option>
                              </select>
                            </div>

                            {issue.status !== "Rejected" && issue.status !== "Resolved" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRejectIssue(issue.id, "Insufficient evidence", "Rejected from admin queue quick action.");
                                }}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-rose-700 transition hover:bg-rose-100"
                              >
                                Reject
                              </button>
                            )}

                            {/* Action navigation indicator */}
                            <ChevronRight className="w-4 h-4 text-slate-300 hidden sm:block" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
