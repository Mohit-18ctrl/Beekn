import React, { useEffect, useState, useMemo } from "react";
import { motion } from "motion/react";
import { Issue } from "../types";
import {
  Search,
  Filter,
  MapPin,
  CheckCircle,
  Navigation,
  ThumbsUp,
  RefreshCw,
} from "lucide-react";
import { EmptyState, SectionHeader, SeverityBadge, StatusBadge } from "./ui";
import MediaPreview from "./MediaPreview";

interface IssueFeedProps {
  issues: Issue[];
  onIssueSelect: (issue: Issue) => void;
  onVerifyClick: (id: string, e: React.MouseEvent) => void;
  onResetDatabase?: () => void;
  isAdmin?: boolean;
  rememberLastLocation?: boolean;
  currentUserId?: string;
}

type UserLocation = {
  latitude: number;
  longitude: number;
};

const ISSUE_SCOPE_RADIUS_KM = 25;
const LAST_LOCATION_KEY = "community_hero_last_good_location";

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const radiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radiusKm * c;
}

function readSavedLocation(): UserLocation | null {
  try {
    const saved = localStorage.getItem(LAST_LOCATION_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as UserLocation;
    if (
      typeof parsed.latitude === "number" &&
      Number.isFinite(parsed.latitude) &&
      typeof parsed.longitude === "number" &&
      Number.isFinite(parsed.longitude)
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export default function IssueFeed({
  issues,
  onIssueSelect,
  onVerifyClick,
  onResetDatabase,
  isAdmin = false,
  rememberLastLocation = true,
  currentUserId,
}: IssueFeedProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(() => rememberLastLocation ? readSavedLocation() : null);
  const [scopeMode, setScopeMode] = useState<"near" | "all">("near");

  const categories: string[] = [
    "All",
    "Road Damage",
    "Garbage",
    "Streetlight",
    "Water Leakage",
    "Drainage",
    "Road Blockage",
    "Other",
  ];

  const statuses: string[] = ["All", "My Reports", "Reported", "Community Verified", "In Progress", "Resolved"];

  useEffect(() => {
    if (!rememberLastLocation) {
      localStorage.removeItem(LAST_LOCATION_KEY);
    }
  }, [rememberLastLocation]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(nextLocation);
        if (rememberLastLocation) {
          localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(nextLocation));
        }
      },
      () => {
        const saved = rememberLastLocation ? readSavedLocation() : null;
        if (saved) setUserLocation(saved);
      },
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 8000 }
    );
  }, [rememberLastLocation]);

  const getPriorityBadgeClass = (severity: Issue["severity"]) => {
    switch (severity) {
      case "Critical":
        return "bg-rose-600/95 text-white border-rose-300/40";
      case "High":
        return "bg-orange-500/95 text-white border-orange-200/50";
      case "Medium":
        return "bg-amber-400/95 text-slate-950 border-amber-100/60";
      default:
        return "bg-emerald-500/95 text-white border-emerald-200/50";
    }
  };

  // Filter Issues
  const filteredIssues = useMemo(() => {
    const withDistance = issues.map((issue) => {
      const distanceKm =
        userLocation &&
        typeof issue.latitude === "number" &&
        typeof issue.longitude === "number"
          ? getDistanceKm(userLocation.latitude, userLocation.longitude, issue.latitude, issue.longitude)
          : null;

      return { ...issue, distanceKm };
    });

    return withDistance.filter((issue) => {
      const matchesSearch =
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || issue.category === selectedCategory;

      const matchesStatus =
        selectedStatus === "All" ||
        (selectedStatus === "My Reports" ? issue.createdBy === currentUserId : issue.status === selectedStatus);

      const matchesScope =
        scopeMode === "all" ||
        !userLocation ||
        issue.distanceKm === null ||
        issue.distanceKm <= ISSUE_SCOPE_RADIUS_KM;

      return matchesSearch && matchesCategory && matchesStatus && matchesScope;
    }).sort((a, b) => {
      if (!userLocation) return 0;
      const aDistance = a.distanceKm ?? Infinity;
      const bDistance = b.distanceKm ?? Infinity;
      return aDistance - bDistance;
    });
  }, [issues, searchTerm, selectedCategory, selectedStatus, scopeMode, userLocation, currentUserId]);

  return (
    <div id="feed-view" className="space-y-3 sm:space-y-4 pb-4 dark:text-slate-100">
      <SectionHeader
        title="Issues Near You"
        subtitle="Browse local reports, verify what you have seen, and follow progress."
      />

      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Navigation className="h-3.5 w-3.5 text-indigo-500" />
          <span className="font-semibold">
            {userLocation
              ? scopeMode === "near"
                ? `Near me: within ${ISSUE_SCOPE_RADIUS_KM} km, sorted closest first`
                : "All loaded reports"
              : "All loaded reports"}
          </span>
        </div>
        <div className="flex rounded-lg bg-white p-1 shadow-2xs dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setScopeMode("near")}
            disabled={!userLocation}
            className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
              scopeMode === "near" && userLocation
                ? "bg-indigo-600 text-white"
                : "text-slate-500 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300"
            }`}
          >
            Near me
          </button>
          <button
            type="button"
            onClick={() => setScopeMode("all")}
            className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
              scopeMode === "all" || !userLocation
                ? "bg-slate-900 text-white dark:bg-slate-700"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-300"
            }`}
          >
            All loaded
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          id="input-feed-search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by keyword, street or description..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 sm:py-3 pl-10 pr-4 text-xs shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      {/* Status Filter Horizontal Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-3 px-3 sm:-mx-4 sm:px-4 scrollbar-hide">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
              selectedStatus === status
                ? "bg-slate-900 border-slate-900 text-white shadow-sm dark:bg-indigo-600 dark:border-indigo-600"
                : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Category Horizontal Filter Pills */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-3 px-3 sm:-mx-4 sm:px-4 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`flex-shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold border transition-all ${
              selectedCategory === category
                ? "bg-indigo-500 border-indigo-500 text-white"
                : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Issues List */}
      <div className="space-y-2.5 sm:space-y-4">
        {issues.length === 0 ? (
          <EmptyState
            title="No reports yet"
            description="Report a local issue to help your community track and resolve it."
            action={
              isAdmin && onResetDatabase ? (
                <button
                  id="btn-seed-empty-state"
                  onClick={onResetDatabase}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 shadow-sm transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Load Sample Reports
                </button>
              ) : null
            }
          />
        ) : filteredIssues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-12 px-4 text-center">
            <span className="inline-flex justify-center rounded-full bg-slate-50 p-3 text-slate-400">
              <Filter className="w-6 h-6" />
            </span>
            <h3 className="mt-2 text-sm font-bold text-slate-800">No matching issues found</h3>
            <p className="mt-1 text-xs text-slate-500">
              Try updating your keywords or choosing a different filter category.
            </p>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const isResolved = issue.status === "Resolved";
            const isRejected = issue.status === "Rejected";
            const isUnmapped = typeof issue.latitude !== "number" || typeof issue.longitude !== "number";
            return (
              <motion.div
                key={issue.id}
                id={`issue-card-${issue.id}`}
                layoutId={`card-layout-${issue.id}`}
                onClick={() => onIssueSelect(issue)}
                className={`overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm hover:border-slate-200 transition-all cursor-pointer flex flex-row dark:border-slate-800 dark:bg-slate-900 ${
                  isResolved ? "opacity-75 border-green-200 bg-slate-50/50" : isRejected ? "opacity-75 border-rose-200 bg-rose-50/30" : ""
                }`}
              >
                {/* Image Section */}
                <div className="relative h-auto min-h-28 w-24 shrink-0 bg-slate-50 sm:h-32 sm:w-36 lg:w-44 dark:bg-slate-800">
                  <MediaPreview
                    src={issue.mediaUrl || issue.imageUrl}
                    alt={issue.title}
                    mediaType={issue.mediaType}
                    className="h-full w-full object-cover"
                  />
                  {(isResolved || isRejected) && (
                    <div className={`absolute inset-0 ${isRejected ? "bg-rose-950/25" : "bg-green-950/25"} backdrop-blur-[2px] flex items-center justify-center p-2`}>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold text-white shadow-md uppercase tracking-wider font-mono ${isRejected ? "bg-rose-600" : "bg-green-600"}`}>
                        <CheckCircle className="w-3 h-3" /> {isRejected ? "Rejected" : "Resolved"}
                      </span>
                    </div>
                  )}
                  {/* Category overlay */}
                  <span className="absolute top-2 left-2 rounded-full bg-slate-900/85 backdrop-blur-sm px-2 py-0.5 text-[9px] font-semibold text-white tracking-wide uppercase">
                    {issue.category}
                  </span>

                </div>

                {/* Info Section */}
                <div className="min-w-0 flex-1 p-3 sm:p-4 space-y-2 sm:space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <StatusBadge status={issue.status} />
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${getPriorityBadgeClass(issue.severity)}`}>
                        Priority {issue.priorityScore}
                      </span>
                      {isUnmapped && (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Location-unverified
                        </span>
                      )}
                    </div>
                    <SeverityBadge severity={issue.severity} />
                  </div>

                  <div className="space-y-1">
                    <h3 className={`text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 ${isResolved || isRejected ? "line-through text-slate-500 font-medium" : ""}`}>
                      {issue.title}
                    </h3>
                    <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 line-clamp-1 lg:line-clamp-2 leading-relaxed">
                      {issue.description}
                    </p>
                  </div>

                  {/* Footer Meta */}
                  <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-[10px] text-slate-600 dark:text-slate-300 font-semibold dark:border-slate-800">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{issue.location}</span>
                      {issue.distanceKm !== null && issue.distanceKm !== undefined && (
                        <span className="hidden shrink-0 font-mono text-emerald-600 sm:inline">
                          {issue.distanceKm.toFixed(1)} km
                        </span>
                      )}
                    </div>

                    {/* Verification count buttons */}
                    <button
                      id={`btn-verify-issue-${issue.id}`}
                      onClick={(e) => onVerifyClick(issue.id, e)}
                      disabled={issue.status === "In Progress" || issue.status === "Resolved" || issue.status === "Rejected"}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-bold transition-all ${
                        issue.status === "In Progress" || issue.status === "Resolved" || issue.status === "Rejected"
                          ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                          : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{issue.verificationCount}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
