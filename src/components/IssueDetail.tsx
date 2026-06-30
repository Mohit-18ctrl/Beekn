import React, { useState } from "react";
import { motion } from "motion/react";
import { Issue, IssueStatus, Comment, IssueRejectionReason, getPriorityExplanation } from "../types";
import {
  MapPin,
  Calendar,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  MessageSquare,
  User,
  ThumbsUp,
  ChevronLeft,
  Send,
  Sparkles,
  Ban,
} from "lucide-react";
import MediaPreview from "./MediaPreview";

interface IssueDetailProps {
  issue: Issue;
  onBack: () => void;
  onVerify: (id: string) => void;
  onAddComment: (id: string, author: string, text: string) => void;
  onUpdateStatus: (id: string, status: IssueStatus) => void; // Admin override
  onRejectIssue: (id: string, reason: IssueRejectionReason, note: string) => void;
  backButtonLabel?: string;
  isAdmin?: boolean;
  hasVerified?: boolean;
}

export default function IssueDetail({
  issue,
  onBack,
  onVerify,
  onAddComment,
  onUpdateStatus,
  onRejectIssue,
  backButtonLabel = "Back to Feed",
  isAdmin = false,
  hasVerified = false,
}: IssueDetailProps) {
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentText, setCommentText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [rejectionReason, setRejectionReason] = useState<IssueRejectionReason>("Insufficient evidence");
  const [rejectionNote, setRejectionNote] = useState("");

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentAuthor.trim() || !commentText.trim()) {
      setErrorMsg("Please specify both your name and comment text.");
      return;
    }
    setErrorMsg("");
    onAddComment(issue.id, commentAuthor, commentText);
    setCommentText(""); // Keep the name for subsequent comments
  };

  // Helper status configs
  const getStatusConfig = (status: IssueStatus) => {
    switch (status) {
      case "Reported":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <Clock className="w-4 h-4 text-blue-600" />,
          description: "Waiting for people nearby to confirm this report.",
        };
      case "Community Verified":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: <TrendingUp className="w-4 h-4 text-amber-600" />,
          description: "Confirmed by people nearby and ready for action.",
        };
      case "In Progress":
        return {
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          icon: <AlertTriangle className="w-4 h-4 text-purple-600" />,
          description: "The responsible team is working on this issue.",
        };
      case "Resolved":
        return {
          bg: "bg-green-50 text-green-700 border-green-200",
          icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
          description: "This issue has been marked as resolved.",
        };
      case "Rejected":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          icon: <Ban className="w-4 h-4 text-rose-600" />,
          description: "This report was rejected after authority review.",
        };
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-rose-500/10 text-rose-600 border border-rose-200";
      case "High":
        return "bg-orange-500/10 text-orange-600 border border-orange-200";
      case "Medium":
        return "bg-amber-500/10 text-amber-600 border border-amber-200";
      default:
        return "bg-slate-500/10 text-slate-600 border border-slate-200";
    }
  };

  const statusCfg = getStatusConfig(issue.status);

  // Verification button logic
  const isVerificationDisabled =
    issue.status === "In Progress" || issue.status === "Resolved" || issue.status === "Rejected" || hasVerified;

  const handleRejectSubmit = () => {
    onRejectIssue(issue.id, rejectionReason, rejectionNote);
    setRejectionNote("");
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-8" id={`detail-view-${issue.id}`}>
      {/* Header Navigation */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 shadow-xs transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {backButtonLabel}
        </button>
        <div className="text-[10px] text-slate-400 font-mono">
          REPORT_ID: #{issue.id.split("-")[1] || issue.id}
        </div>
      </div>

      {/* Main Media Banner */}
      <div className="relative rounded-2xl overflow-hidden h-44 sm:h-56 bg-slate-100 border border-slate-200 shadow-xs text-slate-800">
        <MediaPreview
          src={issue.mediaUrl || issue.imageUrl}
          alt={issue.title}
          mediaType={issue.mediaType}
          className="h-full w-full object-cover"
          badgeClassName="absolute top-3 right-3"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
        {(issue.status === "Resolved" || issue.status === "Rejected") && (
          <div className={`absolute inset-0 backdrop-blur-[2px] flex items-center justify-center ${
            issue.status === "Rejected" ? "bg-rose-950/40" : "bg-green-950/40"
          }`}>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-black text-white shadow-lg uppercase tracking-wider font-mono ${
              issue.status === "Rejected" ? "bg-rose-600" : "bg-green-600 animate-pulse"
            }`}>
              {issue.status === "Rejected" ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {issue.status === "Rejected" ? "Report Rejected" : "Work Order Resolved & Completed"}
            </span>
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
          <span className="inline-flex rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase">
            {issue.category}
          </span>
          <h2 className="text-base font-extrabold leading-tight tracking-tight drop-shadow-sm">
            {issue.title}
          </h2>
          <p className="text-[10px] text-slate-200 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-red-400" />
            {issue.location}
          </p>
        </div>
      </div>

      {/* Grid Layout: Core Info and Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left 2 Columns: Description & AI analysis */}
        <div className="md:col-span-2 space-y-4">
          {/* Status & Citizen Verification Banner */}
          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${statusCfg.bg}`}>
                  {statusCfg.icon}
                  {issue.status}
                </span>
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold border ${getSeverityBadge(issue.severity)}`}>
                  {issue.severity} Severity
                </span>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400 uppercase leading-none">Priority Score</div>
                <div className="text-sm font-extrabold text-indigo-600 mt-1">{issue.priorityScore} / 100</div>
              </div>
            </div>

            <p className="text-xs text-slate-500 italic leading-relaxed">
              &ldquo;{statusCfg.description}&rdquo;
            </p>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Community Endorsement</div>
                <div className="text-xs text-slate-600 font-semibold">
                  {issue.verificationCount} citizens have verified this issue
                </div>
              </div>

              <button
                id={`btn-verify-detail-${issue.id}`}
                onClick={() => onVerify(issue.id)}
                disabled={isVerificationDisabled}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${
                  isVerificationDisabled
                    ? "bg-slate-50 text-slate-350 border border-slate-100 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                {hasVerified ? "Verified" : "Verify Issue"}
              </button>
            </div>
          </div>

          {issue.status === "Rejected" && issue.moderation && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-xs">
              <div className="font-black uppercase tracking-wider">Moderation result</div>
              <div className="mt-1 font-semibold">Reason: {issue.moderation.reason}</div>
              {issue.moderation.note && <div className="mt-1 leading-relaxed">{issue.moderation.note}</div>}
              <div className="mt-2 text-[10px] font-bold text-rose-600">
                Submitter -{issue.moderation.submitterPenaltyPoints} trust · Verifiers -{issue.moderation.verifierPenaltyPoints} trust
              </div>
            </div>
          )}

          {/* Citizen Description */}
          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2 shadow-xs">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
              CITIZEN DESCRIPTION
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {issue.description}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              Reported on {new Date(issue.createdAt).toLocaleString()}
            </div>
          </div>

          {/* Gemini AI Analysis Block */}
          <div className="rounded-xl bg-gradient-to-br from-indigo-50/50 to-blue-50/30 border border-indigo-100/80 p-4 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-indigo-100/60 pb-2">
              <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-tight">
                AI Report Summary
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-indigo-100/50">
                <div className="text-[9px] uppercase font-mono font-bold text-slate-400">Responsible Department</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800">{issue.suggestedDepartment}</span>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-indigo-100/50">
                <div className="text-[9px] uppercase font-mono font-bold text-slate-400">Priority</div>
                <div className="mt-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Severity Rank</span>
                    <span>{issue.priorityScore}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        issue.priorityScore > 80
                          ? "bg-rose-500"
                          : issue.priorityScore > 50
                          ? "bg-amber-500"
                          : "bg-indigo-500"
                      }`}
                      style={{ width: `${issue.priorityScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[9px] uppercase font-mono font-bold text-slate-400">Summary</div>
              <p className="text-xs text-slate-700 leading-relaxed bg-white/40 p-2.5 rounded-lg border border-indigo-50/50">
                {issue.summary}
              </p>
            </div>

            <div className="bg-indigo-600/5 p-3 rounded-lg border border-indigo-500/10">
              <div className="text-[9px] uppercase font-mono font-bold text-indigo-700 mb-0.5">Suggested Action</div>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                {issue.citizenAction}
              </p>
            </div>

            {(() => {
              const reasons = getPriorityExplanation({
                severity: issue.severity,
                category: issue.category,
                priorityScore: issue.priorityScore,
                verificationCount: issue.verificationCount,
                createdAt: issue.createdAt,
                status: issue.status,
              });
              return (
                <div id="priority-explanation-detail" className="bg-amber-500/5 p-3 rounded-lg border border-amber-500/15">
                  <div className="text-[9px] uppercase font-mono font-bold text-amber-700 mb-1">Priority Explanation</div>
                  <ul className="list-disc pl-4 text-xs text-slate-800 space-y-0.5">
                    {reasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right 1 Column: Comments Section & Administration Timeline */}
        <div className="space-y-4">
          {/* Issue Timeline */}
          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3.5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
              Issue Timeline
            </h3>

            <div className="space-y-4 relative pl-3.5 before:absolute before:inset-y-1 before:left-1 before:w-0.5 before:bg-slate-100">
              {/* Reported Step */}
              <div className="relative">
                <span className="absolute -left-[17.5px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100" />
                <div className="text-[11px] font-bold text-slate-700">Reported</div>
                <div className="text-[9px] text-slate-400">
                  {new Date(issue.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Verified Step */}
              <div className="relative">
                <span
                  className={`absolute -left-[17.5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ${
                    issue.verificationCount >= 3 || issue.status !== "Reported"
                      ? "bg-amber-500 ring-amber-100"
                      : "bg-slate-200 ring-white"
                  }`}
                />
                <div
                  className={`text-[11px] font-bold ${
                    issue.verificationCount >= 3 || issue.status !== "Reported"
                      ? "text-slate-700"
                      : "text-slate-400"
                  }`}
                >
                  Verified ({issue.verificationCount}/3)
                </div>
                <div className="text-[9px] text-slate-400">
                  {issue.verificationCount >= 3 ? "Auto-escalated" : "Awaiting citizens"}
                </div>
              </div>

              {/* In Progress Step */}
              <div className="relative">
                <span
                  className={`absolute -left-[17.5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ${
                    issue.status === "In Progress" || issue.status === "Resolved"
                      ? "bg-purple-500 ring-purple-100"
                      : "bg-slate-200 ring-white"
                  }`}
                />
                <div
                  className={`text-[11px] font-bold ${
                    issue.status === "In Progress" || issue.status === "Resolved"
                      ? "text-slate-700"
                      : "text-slate-400"
                  }`}
                >
                  In Progress
                </div>
                <div className="text-[9px] text-slate-400">
                  {issue.status === "In Progress" || issue.status === "Resolved"
                    ? "Assigned to department"
                    : "Waiting for action"}
                </div>
              </div>

              {/* Resolved Step */}
              <div className="relative">
                <span
                  className={`absolute -left-[17.5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ${
                    issue.status === "Resolved"
                      ? "bg-green-500 ring-green-100"
                      : "bg-slate-200 ring-white"
                  }`}
                />
                <div
                  className={`text-[11px] font-bold ${
                    issue.status === "Resolved" ? "text-slate-700" : "text-slate-400"
                  }`}
                >
                  Resolved
                </div>
                <div className="text-[9px] text-slate-400">
                  {issue.status === "Resolved" ? "Work order closed" : "Awaiting closure"}
                </div>
              </div>

              {/* Rejected Step */}
              <div className="relative">
                <span
                  className={`absolute -left-[17.5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ${
                    issue.status === "Rejected"
                      ? "bg-rose-500 ring-rose-100"
                      : "bg-slate-200 ring-white"
                  }`}
                />
                <div className={`text-[11px] font-bold ${issue.status === "Rejected" ? "text-slate-700" : "text-slate-400"}`}>
                  Rejected
                </div>
                <div className="text-[9px] text-slate-400">
                  {issue.status === "Rejected" ? issue.moderation?.reason || "Authority review" : "Only if report is invalid"}
                </div>
              </div>
            </div>
          </div>

          {/* Comment Stream */}
          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> COMMENTS ({issue.comments?.length || 0})
            </h3>

            {/* Comment List */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1 native-scroll">
              {!issue.comments || issue.comments.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic text-center py-4">
                  No public comments yet. Share your feedback below.
                </p>
              ) : (
                issue.comments.map((comment) => (
                  <div key={comment.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-700 text-[10px] mb-1">
                      <span className="flex items-center gap-1 truncate">
                        <User className="w-3 h-3 text-slate-400" />
                        {comment.author}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {new Date(comment.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed">{comment.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment input form */}
            <form onSubmit={handleCommentSubmit} className="space-y-2 border-t border-slate-100 pt-3">
              <input
                id="input-comment-author"
                type="text"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                placeholder="Your Name (e.g. resident)"
                className="w-full rounded-lg border border-slate-200 py-1.5 px-2.5 text-[11px] focus:outline-none focus:border-indigo-500"
              />
              <div className="relative">
                <input
                  id="input-comment-text"
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add civic update..."
                  className="w-full rounded-lg border border-slate-200 py-1.5 pl-2.5 pr-8 text-[11px] focus:outline-none focus:border-indigo-500"
                />
                <button
                  id="btn-comment-submit"
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-2 text-indigo-600 hover:text-indigo-800"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              {errorMsg && <p className="text-[10px] text-rose-500 font-medium">{errorMsg}</p>}
            </form>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="rounded-xl border border-red-200 bg-red-50/30 p-4 space-y-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <h4 className="text-[11px] font-bold text-red-800 uppercase tracking-wider font-mono">
              DEV / DEMO MODE PANELS (STABILIZER)
            </h4>
          </div>
          <p className="text-[10px] text-red-700 leading-relaxed">
            Simulate official city status shifts instantly. Test the 2-minute demo workflow by forcing status transitions here:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {(["Reported", "Community Verified", "In Progress", "Resolved"] as IssueStatus[]).map(
              (status) => (
                <button
                  key={status}
                  id={`btn-admin-status-${status.replace(" ", "-")}`}
                  type="button"
                  onClick={() => onUpdateStatus(issue.id, status)}
                  className={`text-[10px] font-bold border rounded-lg px-2.5 py-1.5 shadow-xs transition-colors ${
                    issue.status === status
                      ? "bg-red-700 border-red-700 text-white"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  Set: {status}
                </button>
              )
            )}
          </div>
          <div className="border-t border-red-200/60 pt-3 space-y-2">
            <div className="text-[10px] font-bold text-red-800 uppercase tracking-wider font-mono">
              Reject / misuse review
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value as IssueRejectionReason)}
                disabled={issue.status === "Rejected"}
                className="rounded-lg border border-red-200 bg-white px-2.5 py-2 text-[10px] font-bold text-slate-700 focus:outline-none disabled:opacity-50"
              >
                <option value="Duplicate">Duplicate</option>
                <option value="Not a civic issue">Not a civic issue</option>
                <option value="False or misleading">False or misleading</option>
                <option value="Spam or abuse">Spam or abuse</option>
                <option value="Insufficient evidence">Insufficient evidence</option>
              </select>
              <input
                type="text"
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                disabled={issue.status === "Rejected"}
                placeholder="Optional moderation note"
                className="rounded-lg border border-red-200 bg-white px-2.5 py-2 text-[10px] font-semibold text-slate-700 focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={issue.status === "Rejected"}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-700 px-3 py-2 text-[10px] font-black uppercase text-white shadow-xs transition hover:bg-red-800 disabled:bg-red-300"
              >
                <Ban className="h-3.5 w-3.5" />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
