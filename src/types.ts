export type IssueStatus = "Reported" | "Community Verified" | "In Progress" | "Resolved" | "Rejected";

export type IssueCategory =
  | "Road Damage"
  | "Garbage"
  | "Streetlight"
  | "Water Leakage"
  | "Drainage"
  | "Road Blockage"
  | "Other";

export type IssueSeverity = "Low" | "Medium" | "High" | "Critical";

export interface GeminiAnalysis {
  title: string;
  category: IssueCategory;
  severity: IssueSeverity;
  summary: string;
  suggestedDepartment: string;
  priorityScore: number;
  citizenAction: string;
  isFallback?: boolean;
  modelUsed?: string;
  analysisMode?: string;
  analysisDurationMs?: number;
  errorCategory?: string;
  latitude?: number;
  longitude?: number;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  authorUid?: string | null;
}

export interface IssueVerification {
  uid: string;
  email?: string | null;
  name?: string | null;
  verifiedAt: string;
}

export interface IssueStatusHistoryEntry {
  status: IssueStatus;
  previousStatus?: IssueStatus;
  actorUid?: string | null;
  actorName?: string | null;
  actorRole?: UserRole;
  createdAt: string;
  pointsAwarded?: number;
}

export type IssueRejectionReason =
  | "Duplicate"
  | "Not a civic issue"
  | "False or misleading"
  | "Spam or abuse"
  | "Insufficient evidence";

export interface IssueModeration {
  reason: IssueRejectionReason;
  note?: string;
  actionByUid?: string | null;
  actionByName?: string | null;
  createdAt: string;
  submitterCooldownUntil?: string | null;
  verifierPenaltyPoints: number;
  submitterPenaltyPoints: number;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  location: string;
  latitude?: number;
  longitude?: number;
  category: IssueCategory;
  severity: IssueSeverity;
  summary: string;
  suggestedDepartment: string;
  priorityScore: number;
  citizenAction: string;
  status: IssueStatus;
  verificationCount: number;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
  createdBy?: string;
  createdByEmail?: string | null;
  createdByName?: string | null;
  createdByProvider?: string;
  verifiedBy?: IssueVerification[];
  statusHistory?: IssueStatusHistoryEntry[];
  moderation?: IssueModeration;
}

export type UserRole = "public" | "authority";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: UserRole;
  department?: string;
  verificationStatus?: "demo-approved" | "pending" | "verified";
  cooldownUntil?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppPreferences {
  notifications: {
    statusUpdates: boolean;
    nearbyIssues: boolean;
    weeklyDigest: boolean;
  };
  privacy: {
    showReporterName: boolean;
    rememberLastLocation: boolean;
    allowAnalytics: boolean;
  };
  appearance: {
    compactMode: boolean;
  };
}

export function getPriorityExplanation(params: {
  severity: IssueSeverity;
  category: IssueCategory;
  priorityScore: number;
  verificationCount?: number;
  createdAt?: string;
  status?: string;
}): string[] {
  const reasons: string[] = [];

  // 1. Severity Reason (e.g. "High severity due to public safety risk")
  if (params.severity === "Critical") {
    reasons.push("Critical severity due to public safety risk");
  } else if (params.severity === "High") {
    reasons.push("High severity due to public safety risk");
  } else if (params.severity === "Medium") {
    reasons.push("Medium severity with moderate public safety risk");
  } else {
    reasons.push("Low severity, standard municipal concern");
  }

  // 2. Category / Hazard Reason
  if (params.category === "Road Damage" || params.category === "Road Blockage") {
    reasons.push("Hazard in active transit zone");
  } else if (params.category === "Water Leakage" || params.category === "Drainage") {
    reasons.push("Utility infrastructure hazard");
  } else if (params.category === "Streetlight") {
    reasons.push("Public safety risk due to lighting obstruction");
  } else if (params.category === "Garbage") {
    reasons.push("Environmental sanitation hazard");
  } else {
    reasons.push("General community concern");
  }

  // 3. Status/Age/Verification Reason (if existing) or Priority Score Reason (if draft/new)
  if (params.createdAt) {
    // Verification Count takes precedence for existing issues
    if (params.verificationCount && params.verificationCount > 0) {
      reasons.push(`Verified by ${params.verificationCount} citizen${params.verificationCount === 1 ? "" : "s"}`);
    }

    // Age Reason
    const diffMs = Date.now() - new Date(params.createdAt).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (params.status === "Rejected") {
      reasons.push("Rejected by authority review");
    } else if (params.status === "Resolved") {
      reasons.push("Resolved issue (priority updated)");
    } else if (diffDays >= 1) {
      reasons.push(`Unresolved for ${diffDays} day${diffDays === 1 ? "" : "s"}`);
    } else if (diffHours >= 1) {
      reasons.push(`Unresolved for ${diffHours} hour${diffHours === 1 ? "" : "s"}`);
    } else {
      reasons.push("Recently reported issue");
    }
  } else {
    // Draft / New issue context
    if (params.priorityScore >= 80) {
      reasons.push(`Critical priority score of ${params.priorityScore}/100`);
    } else if (params.priorityScore >= 50) {
      reasons.push(`Moderate priority score of ${params.priorityScore}/100`);
    } else {
      reasons.push(`Routine priority score of ${params.priorityScore}/100`);
    }
  }

  // Ensure at most 3 reasons
  return reasons.slice(0, 3);
}

export function matchesAdminDepartment(issueDept: string, adminDept: string): boolean {
  if (!adminDept || adminDept === "All Departments") return true;
  
  const lowerIssueDept = (issueDept || "").toLowerCase();
  const lowerAdminDept = adminDept.toLowerCase();

  if (lowerAdminDept === "sanitation") {
    return lowerIssueDept.includes("sanitation") || lowerIssueDept.includes("waste") || lowerIssueDept.includes("garbage");
  }
  if (lowerAdminDept === "roads / pwd") {
    return lowerIssueDept.includes("road") || lowerIssueDept.includes("pwd") || lowerIssueDept.includes("works") || lowerIssueDept.includes("pothole") || lowerIssueDept.includes("blockage");
  }
  if (lowerAdminDept === "lighting / electricity") {
    return lowerIssueDept.includes("light") || lowerIssueDept.includes("electric") || lowerIssueDept.includes("lighting");
  }
  if (lowerAdminDept === "water board") {
    return lowerIssueDept.includes("water") || lowerIssueDept.includes("sewer") || lowerIssueDept.includes("drain") || lowerIssueDept.includes("leak") || lowerIssueDept.includes("leakage");
  }
  if (lowerAdminDept === "campus facilities") {
    return lowerIssueDept.includes("campus") || lowerIssueDept.includes("facilit");
  }

  return false;
}
