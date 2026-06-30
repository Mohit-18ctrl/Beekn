import {
  Issue,
  IssueCategory,
  IssueRejectionReason,
  IssueSeverity,
  UserProfile,
} from "../types";

export const CIVIC_ACTIVITY_KEY = "community_hero_civic_impact_activity";
export const COOLDOWN_OVERRIDES_KEY = "community_hero_cooldown_overrides";

export type CivicActivityType = "report" | "verify" | "comment";

export interface CivicImpactActivity {
  id: string;
  type: CivicActivityType;
  issueId: string;
  userId: string;
  createdAt: string;
}

export interface CivicImpactBadge {
  id: string;
  label: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

export interface CivicImpactLevel {
  level: number;
  label: string;
  minPoints: number;
  nextPoints: number | null;
}

export interface CivicImpactStats {
  citizenPoints: number;
  authorityPoints: number;
  trustPoints: number;
  totalPoints: number;
  level: CivicImpactLevel;
  nextLevelProgress: number;
  estimatedStanding: string;
  reportsCreated: number;
  verifications: number;
  comments: number;
  resolvedReports: number;
  rejectedReports: number;
  invalidVerifications: number;
  resolvedByAdmin: number;
  averageResolutionHours: number | null;
  badges: CivicImpactBadge[];
  activeCooldownUntil: string | null;
  isCooldownActive: boolean;
}

export interface CooldownOverride {
  userId: string;
  until: string;
  reason: IssueRejectionReason;
  issueId: string;
  createdAt: string;
}

const LEVELS: CivicImpactLevel[] = [
  { level: 1, label: "New Neighbor", minPoints: 0, nextPoints: 100 },
  { level: 2, label: "Local Helper", minPoints: 100, nextPoints: 250 },
  { level: 3, label: "Community Scout", minPoints: 250, nextPoints: 500 },
  { level: 4, label: "Civic Signal", minPoints: 500, nextPoints: 900 },
  { level: 5, label: "Neighborhood Champion", minPoints: 900, nextPoints: null },
];

const SEVERITY_MULTIPLIER: Record<IssueSeverity, number> = {
  Low: 0.8,
  Medium: 1,
  High: 1.25,
  Critical: 1.5,
};

const REJECTION_SUBMITTER_PENALTY: Record<IssueRejectionReason, number> = {
  Duplicate: 15,
  "Not a civic issue": 20,
  "False or misleading": 45,
  "Spam or abuse": 75,
  "Insufficient evidence": 10,
};

const REJECTION_VERIFIER_PENALTY: Record<IssueRejectionReason, number> = {
  Duplicate: 5,
  "Not a civic issue": 8,
  "False or misleading": 18,
  "Spam or abuse": 25,
  "Insufficient evidence": 4,
};

const COOLDOWN_HOURS: Record<IssueRejectionReason, number> = {
  Duplicate: 2,
  "Not a civic issue": 2,
  "False or misleading": 24,
  "Spam or abuse": 72,
  "Insufficient evidence": 2,
};

export function readCivicActivities(): CivicImpactActivity[] {
  try {
    const saved = localStorage.getItem(CIVIC_ACTIVITY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveCivicActivity(activity: CivicImpactActivity) {
  const activities = readCivicActivities();
  const alreadyExists = activities.some(
    (item) =>
      item.type === activity.type &&
      item.issueId === activity.issueId &&
      item.userId === activity.userId
  );

  if (alreadyExists) return;
  localStorage.setItem(CIVIC_ACTIVITY_KEY, JSON.stringify([activity, ...activities].slice(0, 500)));
}

export function readCooldownOverrides(): CooldownOverride[] {
  try {
    const saved = localStorage.getItem(COOLDOWN_OVERRIDES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveCooldownOverride(override: CooldownOverride) {
  const overrides = readCooldownOverrides().filter((item) => item.userId !== override.userId);
  localStorage.setItem(COOLDOWN_OVERRIDES_KEY, JSON.stringify([override, ...overrides].slice(0, 100)));
}

export function clearCivicImpactLocalData() {
  localStorage.removeItem(CIVIC_ACTIVITY_KEY);
  localStorage.removeItem(COOLDOWN_OVERRIDES_KEY);
}

export function getRejectionPenalties(reason: IssueRejectionReason) {
  return {
    submitterPenaltyPoints: REJECTION_SUBMITTER_PENALTY[reason],
    verifierPenaltyPoints: REJECTION_VERIFIER_PENALTY[reason],
    cooldownHours: COOLDOWN_HOURS[reason],
  };
}

export function getCooldownUntil(reason: IssueRejectionReason, now = new Date()) {
  const hours = COOLDOWN_HOURS[reason];
  if (hours <= 0) return null;
  return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function calculateResolutionPoints(issue: Issue) {
  const createdAt = new Date(issue.createdAt).getTime();
  const resolvedAt = new Date(issue.updatedAt).getTime();
  const ageHours = Math.max(0, (resolvedAt - createdAt) / (1000 * 60 * 60));
  const base = Math.round(60 * SEVERITY_MULTIPLIER[issue.severity]);
  const speedMultiplier = ageHours <= 24 ? 1.5 : ageHours <= 72 ? 1.15 : ageHours <= 168 ? 0.8 : 0.55;
  return Math.round(base * speedMultiplier);
}

function getLevel(points: number) {
  return [...LEVELS].reverse().find((level) => points >= level.minPoints) || LEVELS[0];
}

function getStanding(points: number, role: UserProfile["role"] | undefined) {
  if (points >= 900) return role === "authority" ? "Top 5% response estimate" : "Top 5% civic estimate";
  if (points >= 500) return "Top 10% impact estimate";
  if (points >= 250) return "Top 25% impact estimate";
  if (points >= 100) return "Top 50% impact estimate";
  return "Building your civic signal";
}

function countLocalActivities(activities: CivicImpactActivity[], userId: string, type: CivicActivityType) {
  return activities.filter((activity) => activity.userId === userId && activity.type === type).length;
}

function uniqueCategories(issues: Issue[]) {
  return new Set(issues.map((issue) => issue.category).filter(Boolean) as IssueCategory[]).size;
}

function getActiveCooldown(userId: string | null, profile: UserProfile | null, issues: Issue[]) {
  if (!userId) return null;
  const candidates = [
    profile?.cooldownUntil || null,
    ...readCooldownOverrides().filter((item) => item.userId === userId).map((item) => item.until),
    ...issues
      .filter((issue) => issue.createdBy === userId && issue.moderation?.submitterCooldownUntil)
      .map((issue) => issue.moderation?.submitterCooldownUntil || null),
  ].filter((date): date is string => !!date);

  const active = candidates
    .filter((date) => new Date(date).getTime() > Date.now())
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return active[0] || null;
}

export function calculateCivicImpact(params: {
  issues: Issue[];
  profile: UserProfile | null;
  userId: string | null;
  localVerifiedIssueIds: string[];
  activities?: CivicImpactActivity[];
}): CivicImpactStats {
  const { issues, profile, userId, localVerifiedIssueIds } = params;
  const activities = params.activities || readCivicActivities();

  if (!userId) {
    const level = LEVELS[0];
    return {
      citizenPoints: 0,
      authorityPoints: 0,
      trustPoints: 0,
      totalPoints: 0,
      level,
      nextLevelProgress: 0,
      estimatedStanding: "Sign in to build civic impact",
      reportsCreated: 0,
      verifications: 0,
      comments: 0,
      resolvedReports: 0,
      rejectedReports: 0,
      invalidVerifications: 0,
      resolvedByAdmin: 0,
      averageResolutionHours: null,
      badges: [],
      activeCooldownUntil: null,
      isCooldownActive: false,
    };
  }

  const reportsCreated = issues.filter((issue) => issue.createdBy === userId);
  const localReports = countLocalActivities(activities, userId, "report");
  const reportCount = Math.max(reportsCreated.length, localReports);

  const verifiedIssues = new Set([
    ...localVerifiedIssueIds,
    ...issues
      .filter((issue) => issue.verifiedBy?.some((verification) => verification.uid === userId))
      .map((issue) => issue.id),
  ]);

  const commentCount = Math.max(
    countLocalActivities(activities, userId, "comment"),
    issues.reduce(
      (total, issue) => total + (issue.comments || []).filter((comment) => comment.authorUid === userId).length,
      0
    )
  );

  const resolvedReports = reportsCreated.filter((issue) => issue.status === "Resolved").length;
  const rejectedReports = reportsCreated.filter((issue) => issue.status === "Rejected").length;
  const invalidVerifications = issues.filter(
    (issue) => issue.status === "Rejected" && issue.verifiedBy?.some((verification) => verification.uid === userId)
  ).length;

  const resolvedByAdminIssues = issues.filter(
    (issue) =>
      issue.status === "Resolved" &&
      issue.statusHistory?.some((entry) => entry.status === "Resolved" && entry.actorUid === userId)
  );

  const resolutionHours = resolvedByAdminIssues.map((issue) => {
    const createdAt = new Date(issue.createdAt).getTime();
    const resolvedAt = new Date(issue.updatedAt).getTime();
    return Math.max(0, (resolvedAt - createdAt) / (1000 * 60 * 60));
  });

  const averageResolutionHours =
    resolutionHours.length > 0
      ? resolutionHours.reduce((sum, hours) => sum + hours, 0) / resolutionHours.length
      : null;

  const citizenBase =
    reportCount * 50 +
    verifiedIssues.size * 20 +
    commentCount * 10 +
    reportsCreated.filter((issue) => issue.status === "Community Verified").length * 30 +
    resolvedReports * 75;

  const authorityPoints = resolvedByAdminIssues.reduce(
    (total, issue) => total + calculateResolutionPoints(issue),
    0
  );

  const trustPenalty =
    reportsCreated.reduce(
      (total, issue) => total + (issue.moderation?.submitterPenaltyPoints || 0),
      0
    ) +
    issues.reduce((total, issue) => {
      if (!issue.moderation || !issue.verifiedBy?.some((verification) => verification.uid === userId)) return total;
      return total + issue.moderation.verifierPenaltyPoints;
    }, 0);

  const trustPoints = Math.max(0, 100 + resolvedReports * 12 + verifiedIssues.size * 4 - trustPenalty);
  const citizenPoints = Math.max(0, citizenBase - trustPenalty);
  const totalPoints = citizenPoints + authorityPoints;
  const level = getLevel(totalPoints);
  const nextLevelProgress =
    level.nextPoints === null
      ? 100
      : Math.max(0, Math.min(100, ((totalPoints - level.minPoints) / (level.nextPoints - level.minPoints)) * 100));

  const activeCooldownUntil = getActiveCooldown(userId, profile, issues);

  const badges: CivicImpactBadge[] = [
    {
      id: "first-signal",
      label: "First Signal",
      description: "Submit your first civic report.",
      unlocked: reportCount >= 1,
      progress: Math.min(reportCount, 1),
      target: 1,
    },
    {
      id: "field-verifier",
      label: "Field Verifier",
      description: "Verify 3 local reports.",
      unlocked: verifiedIssues.size >= 3,
      progress: Math.min(verifiedIssues.size, 3),
      target: 3,
    },
    {
      id: "pattern-spotter",
      label: "Pattern Spotter",
      description: "Report across 3 civic categories.",
      unlocked: uniqueCategories(reportsCreated) >= 3,
      progress: Math.min(uniqueCategories(reportsCreated), 3),
      target: 3,
    },
    {
      id: "community-voice",
      label: "Community Voice",
      description: "Add 5 helpful civic updates.",
      unlocked: commentCount >= 5,
      progress: Math.min(commentCount, 5),
      target: 5,
    },
    {
      id: "follow-through",
      label: "Follow Through",
      description: "Have a submitted report resolved.",
      unlocked: resolvedReports >= 1,
      progress: Math.min(resolvedReports, 1),
      target: 1,
    },
    {
      id: "trusted-neighbor",
      label: "Trusted Neighbor",
      description: "Reach Level 3 civic impact.",
      unlocked: level.level >= 3,
      progress: Math.min(level.level, 3),
      target: 3,
    },
  ];

  if (profile?.role === "authority") {
    badges.push({
      id: "rapid-responder",
      label: "Rapid Responder",
      description: "Resolve 3 valid reports as an authority.",
      unlocked: resolvedByAdminIssues.length >= 3,
      progress: Math.min(resolvedByAdminIssues.length, 3),
      target: 3,
    });
  }

  return {
    citizenPoints,
    authorityPoints,
    trustPoints,
    totalPoints,
    level,
    nextLevelProgress,
    estimatedStanding: getStanding(totalPoints, profile?.role),
    reportsCreated: reportCount,
    verifications: verifiedIssues.size,
    comments: commentCount,
    resolvedReports,
    rejectedReports,
    invalidVerifications,
    resolvedByAdmin: resolvedByAdminIssues.length,
    averageResolutionHours,
    badges,
    activeCooldownUntil,
    isCooldownActive: !!activeCooldownUntil,
  };
}
