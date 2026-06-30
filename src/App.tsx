import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Issue, GeminiAnalysis, IssueStatus, Comment, UserProfile, AppPreferences, IssueRejectionReason, IssueStatusHistoryEntry } from "./types";
import Dashboard from "./components/Dashboard";
import IssueFeed from "./components/IssueFeed";
import ReportIssue from "./components/ReportIssue";
import IssueDetail from "./components/IssueDetail";
import AdminPanel from "./components/AdminPanel";
import IssueMap from "./components/IssueMap";
import MediaPreview from "./components/MediaPreview";
import LandingPage from "./components/LandingPage";
import AuthModal from "./components/AuthModal";
import RoleOnboarding from "./components/RoleOnboarding";
import MobileOnboarding from "./components/MobileOnboarding";
import Settings from "./components/Settings";
import appIcon from "./assets/icon-beekn.jpeg";

const DEPLOYED_BACKEND_URL = "https://beekn.onrender.com";

// Global fetch patch to redirect /api/ calls to the Render backend server
if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "");
  const isFirebaseHosted = /(?:^|\.)web\.app$|(?:^|\.)firebaseapp\.com$/.test(window.location.hostname);
  const apiBackendUrl = configuredBackendUrl || (isFirebaseHosted ? DEPLOYED_BACKEND_URL : window.location.origin);

  window.fetch = function (input, init) {
    if (typeof input === "string" && input.startsWith("/api/")) {
      const requestInit = init ? { ...init } : undefined;
      if (apiBackendUrl !== window.location.origin) {
        delete requestInit?.credentials;
      }
      return originalFetch(`${apiBackendUrl}${input}`, requestInit);
    }
    return originalFetch(input, init);
  };
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}
import { initFirebase, getFirebaseStatus } from "./lib/firebase";
import {
  calculateCivicImpact,
  clearCivicImpactLocalData,
  getCooldownUntil,
  getRejectionPenalties,
  saveCivicActivity,
  saveCooldownOverride,
} from "./lib/gamification";
import { ThemeToggle } from "./components/ui";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  query,
  writeBatch,
  getDoc,
} from "firebase/firestore";
import {
  type User,
  GoogleAuthProvider,
  EmailAuthProvider,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  Activity,
  AlertTriangle,
  Database,
  LayoutDashboard,
  ListFilter,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  RefreshCw,
  Map,
  Settings as SettingsIcon,
  UserCircle,
  LogOut,
  Sparkles,
} from "lucide-react";

const INITIAL_ISSUES: Issue[] = [
  {
    id: "issue-1",
    title: "Large Pothole near College Gate",
    description: "Deep pothole right in front of the main college entrance. Forcing two-wheelers and scooters to swerve dangerously into oncoming traffic lanes.",
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
    mediaUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
    mediaType: "image",
    location: "Main Gate, College Road, Ward 12",
    latitude: 20.3533,
    longitude: 85.8078,
    category: "Road Damage",
    severity: "High",
    summary: "Large asphalt cavity in a high-traffic student pedestrian zone causing direct traffic obstruction and driving hazards.",
    suggestedDepartment: "Public Works Department (PWD)",
    priorityScore: 82,
    citizenAction: "Slow down when approaching the entrance. Keep a safe distance from other vehicles.",
    status: "Reported",
    verificationCount: 1,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    comments: [
      {
        id: "c-1",
        author: "Sarah Jenkins (Student)",
        text: "Almost tripped on my scooter here yesterday morning. Needs a patch immediately!",
        createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      },
    ],
  },
  {
    id: "issue-2",
    title: "Overflowing Garbage Dump near Central Market",
    description: "Commercial and organic waste piling up outside the designated dump bins. Stray animals are scattering it, causing highly foul odors.",
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600",
    mediaUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600",
    mediaType: "image",
    location: "Central Market Lane, behind Plaza B",
    latitude: 20.3562,
    longitude: 85.8115,
    category: "Garbage",
    severity: "Medium",
    summary: "Unmanaged solid waste accumulation causing bio-hazard risks, odor pollution, and obstruction of shopping lanes.",
    suggestedDepartment: "Sanitation and Waste Management Division",
    priorityScore: 65,
    citizenAction: "Dispose of household waste inside the bins. Avoid littering around the marketplace area.",
    status: "In Progress",
    verificationCount: 3,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    comments: [
      {
        id: "c-2",
        author: "Markus Vance",
        text: "The smell is unbearable today. Happy to see municipal trucks are finally on site.",
        createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
      },
    ],
  },
  {
    id: "issue-3",
    title: "Broken Streetlight on Hostel Road",
    description: "The entire stretch of hostel road has been completely dark for 3 days due to a non-functional streetlight fixture.",
    imageUrl: "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?auto=format&fit=crop&q=80&w=600",
    mediaUrl: "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?auto=format&fit=crop&q=80&w=600",
    mediaType: "image",
    location: "Hostel Road Stretch, near Block B",
    category: "Streetlight",
    severity: "High",
    summary: "Inoperative street illumination along a major pedestrian pathway, elevating safety risks for evening commuters.",
    suggestedDepartment: "Electrical and Lighting Department",
    priorityScore: 75,
    citizenAction: "Use your phone flashlight when walking at night. Walk in groups if possible.",
    status: "Community Verified",
    verificationCount: 3,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    comments: [],
  },
  {
    id: "issue-4",
    title: "Major Water Pipe Leakage near Main Highway",
    description: "Main drinking water pipeline has burst, causing hundreds of gallons of clean water to flood the side service road.",
    imageUrl: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=600",
    mediaUrl: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=600",
    mediaType: "image",
    location: "Service Road, Highway Junction 4",
    latitude: 20.3501,
    longitude: 85.8023,
    category: "Water Leakage",
    severity: "Critical",
    summary: "High-pressure potable water distribution failure leading to major water wastage and road flooding.",
    suggestedDepartment: "Water Supply and Sewerage Board",
    priorityScore: 92,
    citizenAction: "Avoid driving on the flooded service road. Report any pressure drop in neighboring buildings.",
    status: "Resolved",
    verificationCount: 5,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    comments: [
      {
        id: "c-3",
        author: "Inspector Dave",
        text: "Maintenance crew successfully patched the main pressure valve. Water flow fully restored.",
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
    ],
  },
];

const VERIFIED_ISSUES_KEY = "community_hero_verified_issue_ids";
const VERIFICATION_RADIUS_KM = 25;
const APP_PREFERENCES_KEY = "community_hero_app_preferences";
const USER_PROFILE_CACHE_KEY = "community_hero_user_profile_cache";
const DEFAULT_APP_PREFERENCES: AppPreferences = {
  notifications: {
    statusUpdates: true,
    nearbyIssues: true,
    weeklyDigest: false,
  },
  privacy: {
    showReporterName: true,
    rememberLastLocation: true,
    allowAnalytics: false,
  },
  appearance: {
    compactMode: false,
  },
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

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

function getVerifiedIssueIds(): string[] {
  try {
    const saved = localStorage.getItem(VERIFIED_ISSUES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function hasVerifiedIssue(issueId: string): boolean {
  return getVerifiedIssueIds().includes(issueId);
}

function saveVerifiedIssueId(issueId: string) {
  const ids = new Set(getVerifiedIssueIds());
  ids.add(issueId);
  localStorage.setItem(VERIFIED_ISSUES_KEY, JSON.stringify(Array.from(ids)));
}

function loadAppPreferences(): AppPreferences {
  try {
    const saved = localStorage.getItem(APP_PREFERENCES_KEY);
    if (!saved) return DEFAULT_APP_PREFERENCES;
    const parsed = JSON.parse(saved) as Partial<AppPreferences>;

    return {
      notifications: {
        ...DEFAULT_APP_PREFERENCES.notifications,
        ...(parsed.notifications || {}),
      },
      privacy: {
        ...DEFAULT_APP_PREFERENCES.privacy,
        ...(parsed.privacy || {}),
      },
      appearance: {
        ...DEFAULT_APP_PREFERENCES.appearance,
        ...(parsed.appearance || {}),
      },
    };
  } catch {
    return DEFAULT_APP_PREFERENCES;
  }
}

function getCachedUserProfile(uid: string): UserProfile | null {
  try {
    const saved = localStorage.getItem(`${USER_PROFILE_CACHE_KEY}_${uid}`);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function cacheUserProfile(profile: UserProfile) {
  localStorage.setItem(`${USER_PROFILE_CACHE_KEY}_${profile.uid}`, JSON.stringify(profile));
}

function clearCachedUserProfile(uid?: string) {
  if (uid) {
    localStorage.removeItem(`${USER_PROFILE_CACHE_KEY}_${uid}`);
  }
}

function getVerifierLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location access is required to verify a local issue."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        reject(new Error("Location access is required to verify a local issue."));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 }
    );
  });
}


export default function App() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "feed" | "report" | "admin" | "map" | "settings">("report");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [reportDraft, setReportDraft] = useState<any>(null);
  const [issueDetailMode, setIssueDetailMode] = useState<"normal" | "duplicate-review">("normal");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [historyReady, setHistoryReady] = useState(false);
  const isRestoringHistory = useRef(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const storedTheme = localStorage.getItem("community_hero_theme");
    return storedTheme === "dark" ? "dark" : "light";
  });
  const [preferences, setPreferences] = useState<AppPreferences>(() => loadAppPreferences());
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [showQuickInspect, setShowQuickInspect] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [hasUserResolvedIssue, setHasUserResolvedIssue] = useState(false);

  useEffect(() => {
    if (selectedIssue) {
      setShowQuickInspect(true);
    }
  }, [selectedIssue]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  // Authority profile management. Public is default.
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminDepartment, setAdminDepartment] = useState<string>("All Departments");

  const loadUserProfile = async (user: User) => {
    const fb = await initFirebase();
    if (!fb.isAvailable || !fb.db) {
      return getCachedUserProfile(user.uid);
    }

    try {
      const profileRef = doc(fb.db, "users", user.uid);
      const profileSnap = await getDoc(profileRef);
      if (!profileSnap.exists()) {
        return getCachedUserProfile(user.uid);
      }

      const profile = profileSnap.data() as UserProfile;
      cacheUserProfile(profile);
      return profile;
    } catch (error) {
      console.warn("Profile lookup fell back to local cache.", error);
      return getCachedUserProfile(user.uid);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    initFirebase()
      .then((fb) => {
        if (!fb.isAvailable || !fb.auth) {
          setIsAuthReady(true);
          return;
        }

        unsubscribe = onAuthStateChanged(fb.auth, async (user) => {
          setAuthUser(user);
          setShowProfileMenu(false);
          if (!user) {
            setUserProfile(null);
            setIsAdmin(false);
            setAdminDepartment("All Departments");
            setIsAuthReady(true);
            return;
          }

          if (user.isAnonymous) {
            setUserProfile(null);
            setIsAdmin(false);
            setAdminDepartment("All Departments");
            setIsAuthReady(true);
            return;
          }

          setIsProfileLoading(true);
          try {
            const profile = await loadUserProfile(user);
            setUserProfile(profile);
          } catch (error) {
            console.error("Failed to load user profile.", error);
            setUserProfile(null);
          } finally {
            setIsProfileLoading(false);
            setIsAuthReady(true);
          }
        });
      })
      .catch((error) => {
        console.warn("Auth listener unavailable.", error);
        setIsAuthReady(true);
      });

    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    if (userProfile?.role === "authority") {
      setIsAdmin(true);
      setAdminDepartment(userProfile.department || "All Departments");
    } else {
      setIsAdmin(false);
      setAdminDepartment("All Departments");
      if (activeTab === "admin") {
        setActiveTab("dashboard");
      }
    }
  }, [userProfile, activeTab]);

  // Security guard for admin tab access
  useEffect(() => {
    if (activeTab === "admin" && !isAdmin) {
      setActiveTab("dashboard");
    }
  }, [activeTab, isAdmin]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("community_hero_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(APP_PREFERENCES_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") as typeof activeTab | null;
    const issueId = params.get("issue");

    if (tab && ["dashboard", "feed", "report", "admin", "map", "settings"].includes(tab)) {
      setActiveTab(tab);
    }

    if (issueId) {
      const targetIssue = issues.find((issue) => issue.id === issueId);
      if (targetIssue) {
        setSelectedIssue(targetIssue);
        setIssueDetailMode("normal");
      }
    }

    setHistoryReady(true);
  }, [issues]);

  useEffect(() => {
    if (!historyReady) return;
    if (isRestoringHistory.current) return;

    const currentState = {
      tab: activeTab,
      issueId: selectedIssue?.id || null,
      detailMode: issueDetailMode,
    };

    const params = new URLSearchParams();
    params.set("tab", activeTab);
    if (selectedIssue) {
      params.set("issue", selectedIssue.id);
    }

    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    const existingState = window.history.state || {};

    if (
      existingState.tab === currentState.tab &&
      existingState.issueId === currentState.issueId &&
      existingState.detailMode === currentState.detailMode
    ) {
      return;
    }

    window.history.pushState(currentState, "", nextUrl);
  }, [activeTab, selectedIssue, issueDetailMode, historyReady]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      isRestoringHistory.current = true;
      const state = event.state || {};
      const nextTab = state.tab || "dashboard";

      if (["dashboard", "feed", "report", "admin", "map", "settings"].includes(nextTab)) {
        setActiveTab(nextTab);
      }

      const issueId = state.issueId as string | null | undefined;
      if (issueId) {
        const targetIssue = issues.find((issue) => issue.id === issueId);
        setSelectedIssue(targetIssue || null);
        setIssueDetailMode(state.detailMode || "normal");
      } else {
        setSelectedIssue(null);
        setIssueDetailMode("normal");
      }

      window.setTimeout(() => {
        isRestoringHistory.current = false;
      }, 0);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [issues]);

  // Fetch all issues from Firebase or local/API fallback
  const loadIssues = async () => {
    setIsLoading(true);
    try {
      // 1. Initialize Firebase first
      const fb = await initFirebase();
      if (fb.isAvailable && fb.db) {
        console.log("Firebase is available. Fetching issues from Firestore...");
        const issuesCol = collection(fb.db, "issues");
        // We can retrieve them, and then sort by createdAt descending
        const q = query(issuesCol);
        const querySnapshot = await getDocs(q);
        const fetchedList: Issue[] = [];
        querySnapshot.forEach((docSnap) => {
          fetchedList.push({ id: docSnap.id, ...docSnap.data() } as Issue);
        });

        // Sort by createdAt descending
        fetchedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (fetchedList.length === 0) {
          console.log("Firestore collection is empty. Auto-seeding default sample issues...");
          const batch = writeBatch(fb.db);
          INITIAL_ISSUES.forEach((issue) => {
            const docRef = doc(collection(fb.db, "issues"), issue.id);
            batch.set(docRef, issue);
          });
          await batch.commit();
          setIssues(INITIAL_ISSUES);
        } else {
          setIssues(fetchedList);
        }
        setIsOfflineMode(false);
      } else {
        throw new Error("Firebase not available");
      }
    } catch (err) {
      console.warn("Firestore bypass: Connecting to backend REST or LocalStorage.", err);
      try {
        const res = await fetch("/api/issues", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load issues from backend");
        const data = await res.json();
        setIssues(data);
        setIsOfflineMode(false);
      } catch (backendErr) {
        console.error("All networks unreachable. Fetching offline state.", backendErr);
        setIsOfflineMode(true);
        const cached = localStorage.getItem("community_hero_issues");
        if (cached) {
          setIssues(JSON.parse(cached));
        } else {
          // If totally empty, use local mock defaults
          setIssues(INITIAL_ISSUES);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  // Save to localStorage as a safety layer for previews
  useEffect(() => {
    if (issues.length > 0) {
      localStorage.setItem("community_hero_issues", JSON.stringify(issues));
    }
  }, [issues]);

  const showAlert = (text: string, type: "success" | "error" = "success") => {
    setAlertMessage({ text, type });
    setTimeout(() => {
      setAlertMessage(null);
    }, 4000);
  };

  const getCurrentUserId = () => authUser?.uid || "anonymous";
  const getCurrentUserName = () => userProfile?.displayName || authUser?.displayName || authUser?.email || "Community member";

  const updateIssueState = (updated: Issue) => {
    setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    if (selectedIssue && selectedIssue.id === updated.id) {
      setSelectedIssue(updated);
    }
  };

  const addLocalActivity = (type: "report" | "verify" | "comment", issueId: string) => {
    const userId = getCurrentUserId();
    if (userId === "anonymous") return;
    saveCivicActivity({
      id: `${type}-${issueId}-${userId}`,
      type,
      issueId,
      userId,
      createdAt: new Date().toISOString(),
    });
  };

  const isCurrentUserCoolingDown = () => {
    return civicImpact.isCooldownActive && !!civicImpact.activeCooldownUntil;
  };


  const handleGoogleSignIn = async () => {
    const fb = await initFirebase();
    if (!fb.isAvailable || !fb.auth) {
      throw new Error("Firebase Auth is not configured yet.");
    }

    const provider = new GoogleAuthProvider();
    const currentUser = fb.auth.currentUser;
    const result = currentUser?.isAnonymous
      ? await linkWithPopup(currentUser, provider).catch(() => signInWithPopup(fb.auth, provider))
      : await signInWithPopup(fb.auth, provider);

    setShowAuthModal(false);
    showAlert("Signed in successfully.", "success");
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    const fb = await initFirebase();
    if (!fb.isAvailable || !fb.auth) {
      throw new Error("Firebase Auth is not configured yet.");
    }

    const result = await signInWithEmailAndPassword(fb.auth, email, password);
    setShowAuthModal(false);
    showAlert("Signed in successfully.", "success");
  };

  const handleEmailSignUp = async (email: string, password: string) => {
    const fb = await initFirebase();
    if (!fb.isAvailable || !fb.auth) {
      throw new Error("Firebase Auth is not configured yet.");
    }

    const credential = EmailAuthProvider.credential(email, password);
    const currentUser = fb.auth.currentUser;
    const result = currentUser?.isAnonymous
      ? await linkWithCredential(currentUser, credential).catch(() => createUserWithEmailAndPassword(fb.auth, email, password))
      : await createUserWithEmailAndPassword(fb.auth, email, password);

    setAuthUser(result.user);
    setUserProfile(await loadUserProfile(result.user));
    showAlert("Account created. Choose your profile type.", "success");
  };

  const handleCompleteProfile = async (data: Pick<UserProfile, "role" | "department" | "verificationStatus">) => {
    if (!authUser || authUser.isAnonymous) {
      throw new Error("Please sign in before creating a profile.");
    }

    const fb = await initFirebase();
    if (!fb.isAvailable || !fb.db) {
      throw new Error("Profile database is not available.");
    }

    const now = new Date().toISOString();
    const profile: UserProfile = {
      uid: authUser.uid,
      email: authUser.email,
      displayName: authUser.displayName || authUser.email?.split("@")[0] || "Community member",
      photoURL: authUser.photoURL || null,
      role: data.role,
      ...(data.department != null && { department: data.department }),
      ...(data.verificationStatus != null && { verificationStatus: data.verificationStatus }),
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(fb.db, "users", authUser.uid), profile);
    cacheUserProfile(profile);
    setUserProfile(profile);
    setActiveTab(profile.role === "authority" ? "admin" : "dashboard");
    setSelectedIssue(null);
    showAlert(profile.role === "authority" ? "Authority profile ready." : "Public profile ready.", "success");
  };

  const handleLogout = async () => {
    const fb = await initFirebase();
    if (fb.auth) {
      await signOut(fb.auth);
      await initFirebase();
    }
    setAuthUser(null);
    setUserProfile(null);
    setIsAdmin(false);
    setAdminDepartment("All Departments");
    setShowProfileMenu(false);
    setActiveTab("dashboard");
    setSelectedIssue(null);
    showAlert("Logged out.", "success");
  };

  const handlePreferenceChange = (nextPreferences: AppPreferences) => {
    setPreferences(nextPreferences);
    showAlert("Settings saved.", "success");
  };

  const handleUpdateDisplayName = async (displayName: string) => {
    const nextName = displayName.trim();
    if (!nextName) {
      throw new Error("Display name cannot be empty.");
    }
    if (!authUser || authUser.isAnonymous) {
      throw new Error("Please sign in before editing your name.");
    }

    const now = new Date().toISOString();
    const updatedProfile: UserProfile = {
      ...(userProfile || {
        uid: authUser.uid,
        email: authUser.email,
        role: "public",
        createdAt: now,
      }),
      uid: authUser.uid,
      email: authUser.email,
      displayName: nextName,
      photoURL: authUser.photoURL || userProfile?.photoURL || null,
      updatedAt: now,
    };

    const fb = await initFirebase();
    if (fb.auth?.currentUser) {
      await updateProfile(fb.auth.currentUser, { displayName: nextName });
    }

    if (fb.isAvailable && fb.db) {
      await setDoc(doc(fb.db, "users", authUser.uid), updatedProfile, { merge: true });
    }

    cacheUserProfile(updatedProfile);
    setUserProfile(updatedProfile);
    showAlert("Display name updated.", "success");
  };

  const handleExportAccountData = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      profile: userProfile,
      auth: authUser
        ? {
            uid: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName,
            isAnonymous: authUser.isAnonymous,
            providerIds: authUser.providerData.map((provider) => provider.providerId),
          }
        : null,
      preferences,
      reportsCreated: issues.filter((issue) => issue.createdBy === authUser?.uid),
      locallyVerifiedIssueIds: getVerifiedIssueIds(),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `beekn-account-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showAlert("Account data export prepared.", "success");
  };

  const handleClearLocalDeviceData = () => {
    localStorage.removeItem("community_hero_report_draft");
    localStorage.removeItem("community_hero_last_good_location");
    localStorage.removeItem("community_hero_issues");
    localStorage.removeItem(VERIFIED_ISSUES_KEY);
    clearCivicImpactLocalData();
    setReportDraft(null);
    showAlert("Local device cache cleared.", "success");
  };

  // 1. Trigger Gemini Server-Side analysis
  const handleAnalyze = async (data: {
    title: string;
    description: string;
    location: string;
    image: string;
    mediaType?: "image" | "video";
    analysisMode?: "Best Quality" | "Fast" | "Demo Safe";
  }): Promise<GeminiAnalysis> => {
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Gemini server error");
      const result = await res.json();
      
      if (result.isFallback) {
        console.log("Civic routing completed using backup model.");
        showAlert("Backup Engine: Seamlessly routing and classifying reported details", "success");
      } else {
        showAlert(`Gemini AI successfully routed issue via ${result.modelUsed || "Flash"}!`, "success");
      }
      return {
        ...result.analysis,
        isFallback: !!result.isFallback,
        modelUsed: result.modelUsed,
        analysisMode: result.analysisMode,
        analysisDurationMs: result.analysisDurationMs,
        errorCategory: result.errorCategory,
      };
    } catch (err) {
      console.warn("Analysis call failed, invoking front-end heuristic generator.");
      // Fallback heuristic classification inside frontend
      return {
        title: data.title,
        category: "Other",
        severity: "Medium",
        summary: `Citizen report titled "${data.title}" received at ${data.location}. Requires verification.`,
        suggestedDepartment: "Public Works Department (PWD)",
        priorityScore: 60,
        citizenAction: "Proceed with caution around this reported area.",
        isFallback: true,
        modelUsed: "frontend-fallback",
        analysisMode: data.analysisMode || "Best Quality",
      };
    }
  };

  // 2. Report issue
  const handleReportSubmit = async (data: {
    title: string;
    description: string;
    location: string;
    latitude?: number;
    longitude?: number;
    image: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
    analysis: GeminiAnalysis;
  }) => {
    if (isCurrentUserCoolingDown()) {
      showAlert(`Reporting is paused until ${new Date(civicImpact.activeCooldownUntil!).toLocaleString()} after moderation review.`, "error");
      return;
    }

    let finalMediaUrl = data.mediaUrl || data.image || "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&q=80&w=600";
    if (finalMediaUrl.startsWith("blob:")) {
      console.warn("Safety Check: Blob URL detected in submission. Replacing with placeholder.");
      finalMediaUrl = "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&q=80&w=600";
    }
    const finalMediaType = data.mediaType || "image";

    const reporterProvider = authUser?.providerData?.[0]?.providerId || (authUser?.isAnonymous ? "anonymous" : "unknown");
    const newIssue: Issue = {
      id: `issue-${Date.now()}`,
      title: data.title,
      description: data.description,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      imageUrl: finalMediaUrl,
      mediaUrl: finalMediaUrl,
      mediaType: finalMediaType,
      category: data.analysis.category,
      severity: data.analysis.severity,
      summary: data.analysis.summary,
      suggestedDepartment: data.analysis.suggestedDepartment,
      priorityScore: data.analysis.priorityScore,
      citizenAction: data.analysis.citizenAction,
      status: "Reported",
      verificationCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      createdBy: authUser?.uid || "anonymous",
      createdByEmail: authUser?.email || null,
      createdByName: userProfile?.displayName || authUser?.displayName || authUser?.email || null,
      createdByProvider: reporterProvider,
      verifiedBy: [
        {
          uid: getCurrentUserId(),
          email: authUser?.email || null,
          name: getCurrentUserName(),
          verifiedAt: new Date().toISOString(),
        },
      ],
      statusHistory: [
        {
          status: "Reported",
          actorUid: getCurrentUserId(),
          actorName: getCurrentUserName(),
          actorRole: userProfile?.role || "public",
          createdAt: new Date().toISOString(),
        },
      ],
    };

    if (getFirebaseStatus()) {
      try {
        const fb = await initFirebase();
        if (fb.isAvailable && fb.db) {
          const docRef = doc(collection(fb.db, "issues"));
          newIssue.id = docRef.id;
          await setDoc(docRef, newIssue);
          setIssues((prev) => [newIssue, ...prev]);
          addLocalActivity("report", newIssue.id);
          showAlert("Issue synchronized and registered in Persistent Cloud Database!", "success");
          setReportDraft(null);
          setActiveTab("feed");
          return;
        }
      } catch (fErr) {
        console.error("Firestore submit failed, trying REST API fallback", fErr);
      }
    }

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
          imageUrl: finalMediaUrl,
          mediaUrl: finalMediaUrl,
          mediaType: finalMediaType,
          category: data.analysis.category,
          severity: data.analysis.severity,
          summary: data.analysis.summary,
          suggestedDepartment: data.analysis.suggestedDepartment,
          priorityScore: data.analysis.priorityScore,
          citizenAction: data.analysis.citizenAction,
          createdBy: authUser?.uid || "anonymous",
          createdByEmail: authUser?.email || null,
          createdByName: userProfile?.displayName || authUser?.displayName || authUser?.email || null,
          createdByProvider: reporterProvider,
          verifiedBy: newIssue.verifiedBy,
          statusHistory: newIssue.statusHistory,
        }),
        credentials: "include",
      });

      if (res.ok) {
        const savedIssue = await res.json();
        setIssues((prev) => [savedIssue, ...prev]);
        addLocalActivity("report", savedIssue.id);
        showAlert("Issue submitted and added to public reports.", "success");
      } else {
        throw new Error("Failed to post issue to API");
      }
    } catch (err) {
      setIssues((prev) => [newIssue, ...prev]);
      addLocalActivity("report", newIssue.id);
      showAlert("Report registered locally.", "success");
    }
    setReportDraft(null);
    setActiveTab("feed");
  };

  // 3. Increment Verification
  const handleVerifyIssue = async (id: string) => {
    if (isCurrentUserCoolingDown()) {
      showAlert(`Verification is paused until ${new Date(civicImpact.activeCooldownUntil!).toLocaleString()} after moderation review.`, "error");
      return;
    }

    const issueForVerification = issues.find((issue) => issue.id === id);
    if (!issueForVerification) {
      showAlert("Issue not found.", "error");
      return;
    }

    if (hasVerifiedIssue(id)) {
      showAlert("You have already verified this issue.", "error");
      return;
    }

    if (issueForVerification.status === "Rejected") {
      showAlert("Rejected reports cannot be verified.", "error");
      return;
    }

    if (
      typeof issueForVerification.latitude !== "number" ||
      typeof issueForVerification.longitude !== "number"
    ) {
      showAlert("This report cannot be location-verified yet.", "error");
      return;
    }

    let verifierLocation: Coordinates;
    try {
      verifierLocation = await getVerifierLocation();
    } catch (error: any) {
      showAlert(error?.message || "Location access is required to verify a local issue.", "error");
      return;
    }

    const distanceKm = getDistanceKm(
      verifierLocation.latitude,
      verifierLocation.longitude,
      issueForVerification.latitude,
      issueForVerification.longitude
    );

    if (distanceKm > VERIFICATION_RADIUS_KM) {
      showAlert("You need to be in the same city or nearby area to verify this issue.", "error");
      return;
    }

    if (getFirebaseStatus()) {
      try {
        const fb = await initFirebase();
        if (fb.isAvailable && fb.db) {
          const issueToUpdate = issues.find((i) => i.id === id);
          if (issueToUpdate) {
            const newCount = (issueToUpdate.verificationCount || 0) + 1;
            const newStatus = (newCount >= 3 && issueToUpdate.status === "Reported") ? "Community Verified" : issueToUpdate.status;
            const now = new Date().toISOString();
            const verifiedBy = [
              ...(issueToUpdate.verifiedBy || []),
              {
                uid: getCurrentUserId(),
                email: authUser?.email || null,
                name: getCurrentUserName(),
                verifiedAt: now,
              },
            ];
            
            const issueRef = doc(fb.db, "issues", id);
            await updateDoc(issueRef, {
              verificationCount: newCount,
              status: newStatus,
              verifiedBy,
              updatedAt: now,
            });

            const updated = {
              ...issueToUpdate,
              verificationCount: newCount,
              status: newStatus,
              verifiedBy,
              updatedAt: now,
            };
            updateIssueState(updated);
            saveVerifiedIssueId(id);
            addLocalActivity("verify", id);
            showAlert(`Verification registered! (Total: ${newCount})`, "success");
            return;
          }
        }
      } catch (fErr) {
        console.error("Firestore verify failed, trying REST API fallback", fErr);
      }
    }

    try {
      const res = await fetch(`/api/issues/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verifier: {
            uid: getCurrentUserId(),
            email: authUser?.email || null,
            name: getCurrentUserName(),
            verifiedAt: new Date().toISOString(),
          },
        }),
        credentials: "include",
      });
      if (res.ok) {
        const updated = await res.json();
        updateIssueState(updated);
        saveVerifiedIssueId(id);
        addLocalActivity("verify", id);
        showAlert(`Verification added! (Count: ${updated.verificationCount})`, "success");
      }
    } catch (err) {
      setIssues((prev) =>
        prev.map((i) => {
          if (i.id === id) {
            const count = i.verificationCount + 1;
            const updatedStatus: IssueStatus =
              count >= 3 && i.status === "Reported" ? "Community Verified" : i.status;
            const updated = {
              ...i,
              verificationCount: count,
              status: updatedStatus,
              verifiedBy: [
                ...(i.verifiedBy || []),
                {
                  uid: getCurrentUserId(),
                  email: authUser?.email || null,
                  name: getCurrentUserName(),
                  verifiedAt: new Date().toISOString(),
                },
              ],
              updatedAt: new Date().toISOString(),
            };
            if (selectedIssue && selectedIssue.id === id) {
              setSelectedIssue(updated);
            }
            saveVerifiedIssueId(id);
            addLocalActivity("verify", id);
            return updated;
          }
          return i;
        })
      );
      showAlert("Verification incremented locally.", "success");
    }
  };

  // 4. Update status (Admin Override)
  const handleUpdateStatus = async (id: string, status: IssueStatus) => {
    const issueBeforeUpdate = issues.find((i) => i.id === id);
    const now = new Date().toISOString();
    const statusHistory: IssueStatusHistoryEntry[] = issueBeforeUpdate
      ? [
          ...(issueBeforeUpdate.statusHistory || []),
          {
            status,
            previousStatus: issueBeforeUpdate.status,
            actorUid: getCurrentUserId(),
            actorName: getCurrentUserName(),
            actorRole: userProfile?.role || "public",
            createdAt: now,
          },
        ]
      : [];

    if (getFirebaseStatus()) {
      try {
        const fb = await initFirebase();
        if (fb.isAvailable && fb.db) {
          const issueToUpdate = issues.find((i) => i.id === id);
          if (issueToUpdate) {
            const issueRef = doc(fb.db, "issues", id);
            await updateDoc(issueRef, {
              status: status,
              statusHistory,
              updatedAt: now,
            });

            const updated = {
              ...issueToUpdate,
              status: status,
              statusHistory,
              updatedAt: now,
            };
            updateIssueState(updated);
            if (status === "Resolved") setHasUserResolvedIssue(true);
            showAlert(`Operational status updated to: ${status}`, "success");
            return;
          }
        }
      } catch (fErr) {
        console.error("Firestore status override failed, trying REST API fallback", fErr);
      }
    }

    try {
      const res = await fetch(`/api/issues/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, statusHistory }),
        credentials: "include",
      });
      if (res.ok) {
        const updated = await res.json();
        updateIssueState({ ...updated, statusHistory: updated.statusHistory || statusHistory });
        if (status === "Resolved") setHasUserResolvedIssue(true);
        showAlert(`Operational status updated to: ${status}`, "success");
      }
    } catch (err) {
      setIssues((prev) =>
        prev.map((i) => {
          if (i.id === id) {
            const updated = { ...i, status, statusHistory, updatedAt: now };
            if (selectedIssue && selectedIssue.id === id) {
              setSelectedIssue(updated);
            }
            return updated;
          }
          return i;
        })
      );
      if (status === "Resolved") setHasUserResolvedIssue(true);
      showAlert(`Status updated to: ${status} (local)`, "success");
    }
  };

  const handleRejectIssue = async (id: string, reason: IssueRejectionReason, note: string) => {
    const issueToReject = issues.find((issue) => issue.id === id);
    if (!issueToReject) {
      showAlert("Issue not found.", "error");
      return;
    }

    const now = new Date().toISOString();
    const penalties = getRejectionPenalties(reason);
    const cooldownUntil = getCooldownUntil(reason);
    const statusHistory: IssueStatusHistoryEntry[] = [
      ...(issueToReject.statusHistory || []),
      {
        status: "Rejected",
        previousStatus: issueToReject.status,
        actorUid: getCurrentUserId(),
        actorName: getCurrentUserName(),
        actorRole: userProfile?.role || "authority",
        createdAt: now,
      },
    ];

    const updated: Issue = {
      ...issueToReject,
      status: "Rejected",
      updatedAt: now,
      statusHistory,
      moderation: {
        reason,
        note: note.trim() || undefined,
        actionByUid: getCurrentUserId(),
        actionByName: getCurrentUserName(),
        createdAt: now,
        submitterCooldownUntil: cooldownUntil,
        verifierPenaltyPoints: penalties.verifierPenaltyPoints,
        submitterPenaltyPoints: penalties.submitterPenaltyPoints,
      },
    };

    if (cooldownUntil && issueToReject.createdBy) {
      saveCooldownOverride({
        userId: issueToReject.createdBy,
        until: cooldownUntil,
        reason,
        issueId: id,
        createdAt: now,
      });
    }

    if (getFirebaseStatus()) {
      try {
        const fb = await initFirebase();
        if (fb.isAvailable && fb.db) {
          await updateDoc(doc(fb.db, "issues", id), {
            status: updated.status,
            updatedAt: updated.updatedAt,
            statusHistory: updated.statusHistory,
            moderation: updated.moderation,
          });

          if (cooldownUntil && issueToReject.createdBy) {
            await updateDoc(doc(fb.db, "users", issueToReject.createdBy), {
              cooldownUntil,
              updatedAt: now,
            }).catch(() => undefined);
          }

          updateIssueState(updated);
          showAlert("Report rejected and trust scores updated.", "success");
          return;
        }
      } catch (error) {
        console.error("Firestore rejection failed, applying local moderation.", error);
      }
    }

    try {
      const res = await fetch(`/api/issues/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Rejected",
          statusHistory: updated.statusHistory,
          moderation: updated.moderation,
        }),
        credentials: "include",
      });

      if (res.ok) {
        const saved = await res.json();
        updateIssueState(saved);
        showAlert("Report rejected and trust scores updated.", "success");
        return;
      }
    } catch (error) {
      console.error("REST rejection failed, keeping local moderation.", error);
    }

    updateIssueState(updated);
    showAlert("Report rejected locally. Trust scores updated.", "success");
  };

  // 5. Add Comment
  const handleAddComment = async (id: string, author: string, text: string) => {
    if (getFirebaseStatus()) {
      try {
        const fb = await initFirebase();
        if (fb.isAvailable && fb.db) {
          const issueToUpdate = issues.find((i) => i.id === id);
          if (issueToUpdate) {
            const newComment: Comment = {
              id: `comment-${Date.now()}`,
              author,
              text,
              authorUid: getCurrentUserId(),
              createdAt: new Date().toISOString(),
            };
            const updatedComments = [...(issueToUpdate.comments || []), newComment];
            
            const issueRef = doc(fb.db, "issues", id);
            await updateDoc(issueRef, {
              comments: updatedComments,
              updatedAt: new Date().toISOString(),
            });

            const updated = {
              ...issueToUpdate,
              comments: updatedComments,
              updatedAt: new Date().toISOString(),
            };
            updateIssueState(updated);
            addLocalActivity("comment", id);
            showAlert("Comment posted to report timeline.", "success");
            return;
          }
        }
      } catch (fErr) {
        console.error("Firestore comment add failed, trying REST API fallback", fErr);
      }
    }

    try {
      const res = await fetch(`/api/issues/${id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, text, authorUid: getCurrentUserId() }),
        credentials: "include",
      });
      if (res.ok) {
        const updated = await res.json();
        updateIssueState(updated);
        addLocalActivity("comment", id);
        showAlert("Comment posted to report timeline.", "success");
      }
    } catch (err) {
      setIssues((prev) =>
        prev.map((i) => {
          if (i.id === id) {
            const newComment: Comment = {
              id: `comment-local-${Date.now()}`,
              author,
              text,
              authorUid: getCurrentUserId(),
              createdAt: new Date().toISOString(),
            };
            const updated = {
              ...i,
              comments: [...(i.comments || []), newComment],
              updatedAt: new Date().toISOString(),
            };
            if (selectedIssue && selectedIssue.id === id) {
              setSelectedIssue(updated);
            }
            addLocalActivity("comment", id);
            return updated;
          }
          return i;
        })
      );
      showAlert("Comment registered (local)", "success");
    }
  };

  // 6. Reset Database to Default Mock state
  const handleResetDatabase = async () => {
    if (getFirebaseStatus()) {
      try {
        setIsLoading(true);
        const fb = await initFirebase();
        if (fb.isAvailable && fb.db) {
          const q = query(collection(fb.db, "issues"));
          const snapshot = await getDocs(q);
          const batch = writeBatch(fb.db);
          snapshot.docs.forEach((docSnap) => {
            batch.delete(docSnap.ref);
          });
          await batch.commit();

          const seedBatch = writeBatch(fb.db);
          INITIAL_ISSUES.forEach((issue) => {
            const docRef = doc(collection(fb.db, "issues"), issue.id);
            seedBatch.set(docRef, issue);
          });
          await seedBatch.commit();

          setIssues(INITIAL_ISSUES);
          setSelectedIssue(null);
          showAlert("Persistent database restored with 4 standard reports!", "success");
          setIsLoading(false);
          return;
        }
      } catch (fErr) {
        console.error("Firestore database reset failed, trying API fallback", fErr);
      }
    }

    try {
      const res = await fetch("/api/issues/reset", { method: "POST", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues);
        setSelectedIssue(null);
        showAlert("Demo database restored with 4 standard reports!", "success");
      }
    } catch (err) {
      localStorage.removeItem("community_hero_issues");
      window.location.reload();
    }
  };

  // Quick Stats
  const activeReportsCount = issues.filter((i) => i.status !== "Resolved" && i.status !== "Rejected").length;
  const resolvedReportsCount = issues.filter((i) => i.status === "Resolved").length;
  const reportsCreatedCount = issues.filter((issue) => issue.createdBy === authUser?.uid).length;
  const verifiedIssueCount = getVerifiedIssueIds().length;
  const civicImpact = useMemo(
    () =>
      calculateCivicImpact({
        issues,
        profile: userProfile,
        userId: authUser?.uid || null,
        localVerifiedIssueIds: getVerifiedIssueIds(),
      }),
    [issues, userProfile, authUser?.uid]
  );

  const isMobile = useIsMobile();
  const isSignedInUser = !!authUser && !authUser.isAnonymous;
  const needsProfileSetup = isSignedInUser && isAuthReady && !userProfile && !isProfileLoading;

  // Session Restore / Auth Check Loading Splash
  if (!isAuthReady) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-[#050a15] flex flex-col items-center justify-center font-sans text-white select-none relative overflow-hidden">
        {/* Concentric beacon rings */}
        <div className="beacon-ring absolute h-48 w-48 rounded-full border border-coral-500/20" />
        <div className="beacon-ring-delayed absolute h-72 w-72 rounded-full border border-coral-500/10" />
        <div className="beacon-ring-slow absolute h-96 w-96 rounded-full border border-coral-500/5" />
        
        {/* Large App Logo centered in full screen */}
        <div className="relative z-10 animate-pulse flex flex-col items-center">
          <img 
            src={appIcon} 
            alt="Beekn Logo" 
            className="w-24 h-24 rounded-[2rem] border-2 border-[#EAB308]/30 shadow-2xl shadow-[#EAB308]/15 object-cover"
          />
          <h1 className="mt-4 font-display text-2xl font-black tracking-tight text-white">
            Beekn
          </h1>
          <p className="mt-1.5 text-[9px] font-bold text-slate-400 font-mono tracking-widest uppercase">
            Connecting civic signal...
          </p>
        </div>
      </div>
    );
  }

  // Mobile: full-screen onboarding flow (splash → login → role → department)
  if (isMobile && (!isSignedInUser || needsProfileSetup)) {
    return (
      <MobileOnboarding
        theme={theme}
        onToggleTheme={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
        onGoogleSignIn={handleGoogleSignIn}
        onEmailSignIn={handleEmailSignIn}
        onEmailSignUp={handleEmailSignUp}
        onCompleteProfile={handleCompleteProfile}
        authUser={authUser}
        userProfile={userProfile}
        needsProfileSetup={needsProfileSetup}
      />
    );
  }

  // Desktop: landing page + auth modal
  if (!isSignedInUser) {
    return (
      <>
        <LandingPage
          theme={theme}
          onToggleTheme={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
          onGetStarted={() => setShowAuthModal(true)}
          issuesCount={issues.length}
          resolvedCount={issues.filter((i) => i.status === "Resolved").length}
        />
        <AnimatePresence>
          {showAuthModal && (
            <AuthModal
              onClose={() => setShowAuthModal(false)}
              onGoogleSignIn={handleGoogleSignIn}
              onEmailSignIn={handleEmailSignIn}
              onEmailSignUp={handleEmailSignUp}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop: role onboarding (if signed in but no profile)
  if (needsProfileSetup) {
    return (
      <RoleOnboarding
        email={authUser.email}
        displayName={authUser.displayName}
        onComplete={handleCompleteProfile}
      />
    );
  }

  return (
    <div className="h-screen h-[100dvh] bg-[#FAFAF8] dark:bg-[#0A0F1E] flex flex-col font-sans text-[#1A1A2E] dark:text-[#F0F0F5] selection:bg-coral-100 selection:text-coral-900 overflow-hidden relative">
      
      {/* Top High-Density Navigation Header */}
      <nav id="top-navigation" className="h-16 bg-white dark:bg-navy-950 text-[#1A1A2E] dark:text-[#F0F0F5] flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-xs border-b border-slate-200 dark:border-navy-800 relative z-[5000]">
        <div className="flex items-center gap-2.5">
          <img src={appIcon} alt="Beekn Logo" className="w-9 h-9 rounded-xl shadow-md object-cover" />
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-black text-sm tracking-tight font-display">Beekn</span>
              <span className="hidden sm:inline-block text-[9px] bg-coral-50 dark:bg-coral-500/10 px-1.5 py-0.5 rounded text-coral-600 dark:text-coral-400 font-mono border border-coral-200 dark:border-coral-500/20">
                Community
              </span>
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Civic Issue Reporter</span>
          </div>
        </div>

        {/* Profile menu */}
        <div className="flex items-center gap-3">
          <ThemeToggle theme={theme} onToggle={() => setTheme((value) => (value === "dark" ? "light" : "dark"))} />

          
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-navy-700" />

          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setShowProfileMenu((value) => !value)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 px-2 py-1.5 text-left transition hover:bg-slate-100 dark:hover:bg-navy-700"
              aria-label="Open profile menu"
            >
              {authUser?.photoURL ? (
                <img src={authUser.photoURL} alt="Profile" className="h-6 w-6 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserCircle className="h-6 w-6 text-coral-500" />
              )}
              <span className="hidden max-w-28 truncate text-[10px] font-black text-slate-800 dark:text-slate-100 sm:block">
                {userProfile?.displayName || authUser?.email || "Profile"}
              </span>
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-navy-700 dark:bg-navy-900 dark:text-slate-100"
                >
                  <div className="border-b border-slate-100 p-3 dark:border-navy-800">
                    <div className="truncate text-sm font-black">{userProfile?.displayName || authUser?.email || "Community member"}</div>
                    <div className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">{authUser?.email}</div>
                    <div className="mt-2 inline-flex rounded-full bg-coral-50 px-2 py-0.5 text-[10px] font-black capitalize text-coral-700 dark:bg-coral-500/10 dark:text-coral-400">
                      {userProfile?.role === "authority" ? `${adminDepartment} authority` : "Public citizen"}
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("admin");
                        setSelectedIssue(null);
                        setShowProfileMenu(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-black transition hover:bg-slate-50 dark:hover:bg-navy-800"
                    >
                      <Database className="h-4 w-4" />
                      Admin Console
                    </button>
                  )}
                  {!isMobile && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("settings");
                        setSelectedIssue(null);
                        setShowProfileMenu(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-black transition hover:bg-slate-50 dark:hover:bg-navy-800"
                    >
                      <SettingsIcon className="h-4 w-4" />
                      Settings
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-black text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Alert Banner Notification */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-18 left-4 right-4 z-[6000] mx-auto max-w-sm rounded-xl p-3 shadow-lg border bg-navy-950 border-navy-800 text-white flex items-center gap-2.5"
          >
            <div className="h-2 w-2 rounded-full bg-coral-500 animate-ping" />
            <span className="text-xs font-semibold">{alertMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <main className="h-[calc(100dvh-8rem-env(safe-area-inset-bottom))] md:h-auto md:flex-1 min-h-0 w-full mx-auto px-3 pt-3 pb-3 md:px-4 md:py-5 flex flex-col md:flex-row md:gap-5 overflow-y-auto md:overflow-hidden native-scroll">
        
        {/* Left Column Navigation (Hidden on Mobile, Visible on Desktop for High Density) */}
        <aside
          className={`hidden md:flex min-h-0 shrink-0 flex-col gap-4 transition-all duration-200 ${
            isSidebarCollapsed ? "w-16" : "w-72"
          }`}
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs space-y-3 dark:civic-panel">
            <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"}`}>
              {!isSidebarCollapsed && (
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Menu
                </h3>
              )}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((value) => !value)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-navy-700 dark:text-slate-300 dark:hover:bg-navy-800 dark:hover:text-white"
                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
            </div>
            <div className="space-y-1">
              {[
                { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
                { id: "report", label: "Report Issue", icon: <PlusCircle className="w-4 h-4" /> },
                { id: "feed", label: "Issues", icon: <ListFilter className="w-4 h-4" /> },
                { id: "map", label: "Map", icon: <Map className="w-4 h-4" /> },
                isAdmin && { id: "admin", label: "Admin Console", icon: <Database className="w-4 h-4" /> },
              ].filter((t): t is any => !!t).map((tab) => (
                <button
                  key={tab.id}
                  id={`side-tab-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSelectedIssue(null);
                  }}
                  title={tab.label}
                  className={`w-full inline-flex items-center rounded-lg py-2.5 text-xs font-bold transition-all ${
                    isSidebarCollapsed ? "justify-center px-2" : "gap-2.5 px-3"
                  } ${
                    activeTab === tab.id && !selectedIssue
                      ? "bg-gradient-to-r from-coral-500 to-amber-accent text-white shadow-sm shadow-coral-500/20"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-navy-800 dark:hover:text-white"
                  }`}
                >
                  {tab.icon}
                  {!isSidebarCollapsed && tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats sidebar widget */}
          {isAdmin && !isSidebarCollapsed && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 overflow-y-auto native-scroll dark:civic-panel">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Admin Activity
            </h3>
            <div className="space-y-3 text-[11px]">
              <div className="border-l-2 border-coral-500 pl-2.5 py-0.5">
                <div className="text-[9px] text-slate-400 font-mono">10:41 AM</div>
                <div className="font-bold text-slate-700">Service Online</div>
                <div className="text-[9px] text-coral-600 dark:text-coral-400 font-mono">Status: Connected</div>
              </div>
              <div className="border-l-2 border-slate-200 pl-2.5 py-0.5">
                <div className="text-[9px] text-slate-400 font-mono">10:38 AM</div>
                <div className="font-medium text-slate-600">Model ready: Flash 3.5</div>
                <div className="text-[9px] text-slate-400 font-mono">Validation Schema: JSON</div>
              </div>
              <div className="border-l-2 border-slate-200 pl-2.5 py-0.5">
                <div className="text-[9px] text-slate-400 font-mono">10:25 AM</div>
                <div className="font-medium text-slate-600">Loaded 4 presets</div>
                <div className="text-[9px] text-slate-400 font-mono">Sample database loaded</div>
              </div>
            </div>
          </div>
          )}
        </aside>

        {/* Middle Active Tab/Screen View */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          {isOfflineMode && (
            <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800 flex items-center justify-between font-medium shadow-xs">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Local Sync Connected: Persistence verified via local browser sandbox.</span>
              </div>
              <button onClick={() => loadIssues()} className="text-amber-900 font-bold hover:underline shrink-0 pl-2">
                Retry Link
              </button>
            </div>
          )}
          <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-3xl p-3 sm:p-5 shadow-xs md:overflow-y-auto overflow-y-visible native-scroll dark:civic-glass">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                {/* Modern classic 2-circle spinner */}
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-coral-500 animate-spin" />
                  <div className="absolute inset-1.5 rounded-full border-4 border-slate-100 border-b-amber-500 animate-spin [animation-duration:1.5s]" />
                </div>
                <span className="text-xs font-semibold text-slate-500">Retrieving regional reports...</span>
              </div>
            ) : selectedIssue ? (
              // If an issue is selected, show details
              <IssueDetail
                issue={selectedIssue}
                onBack={() => {
                  setSelectedIssue(null);
                  if (issueDetailMode === "duplicate-review") {
                    setActiveTab("report");
                  }
                  setIssueDetailMode("normal");
                }}
                onVerify={handleVerifyIssue}
                onAddComment={handleAddComment}
                onUpdateStatus={handleUpdateStatus}
                onRejectIssue={handleRejectIssue}
                backButtonLabel={issueDetailMode === "duplicate-review" ? "Back to Draft" : "Back to Feed"}
                isAdmin={isAdmin}
                hasVerified={hasVerifiedIssue(selectedIssue.id)}
              />
            ) : (
              // Otherwise, switch among the active tabs
              <AnimatePresence mode="wait">
                {activeTab === "dashboard" && (
                  <motion.div key="dashboard-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Dashboard
                      issues={issues.filter((i) => i.status !== "Rejected")}
                      onReportClick={() => {
                        setIssueDetailMode("normal");
                        setActiveTab("report");
                      }}
                      onIssueSelect={(issue) => {
                        setIssueDetailMode("normal");
                        setSelectedIssue(issue);
                      }}
                      onTabChange={setActiveTab}
                      onCivicImpactClick={() => {
                        setSelectedIssue(null);
                        setActiveTab("settings");
                        window.setTimeout(() => {
                          document.getElementById("settings-civic-impact")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 120);
                      }}
                      onResetDatabase={handleResetDatabase}
                      isAdmin={isAdmin}
                      civicImpact={civicImpact}
                    />
                  </motion.div>
                )}
                {activeTab === "feed" && (
                  <motion.div key="feed-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <IssueFeed
                      issues={issues.filter((i) => i.status !== "Rejected")}
                      onIssueSelect={(issue) => {
                        setIssueDetailMode("normal");
                        setSelectedIssue(issue);
                      }}
                      onVerifyClick={(id, e) => {
                        e.stopPropagation();
                        handleVerifyIssue(id);
                      }}
                      onResetDatabase={handleResetDatabase}
                      isAdmin={isAdmin}
                      rememberLastLocation={preferences.privacy.rememberLastLocation}
                      currentUserId={authUser?.uid}
                    />
                  </motion.div>
                )}
                {activeTab === "report" && (
                  <motion.div key="report-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ReportIssue
                      onAnalyze={handleAnalyze}
                      onSubmit={handleReportSubmit}
                      onCancel={() => {
                        setReportDraft(null);
                        setActiveTab("dashboard");
                      }}
                      issues={issues}
                      onViewIssue={(issue) => {
                        setIssueDetailMode("duplicate-review");
                        setActiveTab("report");
                        setSelectedIssue(issue);
                      }}
                      draft={reportDraft}
                      onSaveDraft={setReportDraft}
                      isSubmissionPaused={civicImpact.isCooldownActive}
                      submissionPausedUntil={civicImpact.activeCooldownUntil}
                    />
                  </motion.div>
                )}
                {activeTab === "map" && (
                  <motion.div key="map-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <IssueMap
                      issues={issues.filter((i) => i.status !== "Rejected")}
                      onIssueSelect={(issue) => {
                        setIssueDetailMode("normal");
                        setSelectedIssue(issue);
                      }}
                      isAdmin={isAdmin}
                      adminDepartment={adminDepartment}
                      rememberLastLocation={preferences.privacy.rememberLastLocation}
                      theme={theme}
                    />
                  </motion.div>
                )}
                {activeTab === "admin" && (
                  <motion.div key="admin-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <AdminPanel
                      issues={issues}
                      onResetDatabase={handleResetDatabase}
                      onUpdateStatus={handleUpdateStatus}
                      onRejectIssue={handleRejectIssue}
                      onIssueSelect={(issue) => {
                        setIssueDetailMode("normal");
                        setSelectedIssue(issue);
                      }}
                      adminDepartment={adminDepartment}
                      onLogout={() => {
                        setIsAdmin(false);
                        setAdminDepartment("All Departments");
                        setActiveTab("dashboard");
                      }}
                      civicImpact={civicImpact}
                    />
                  </motion.div>
                )}
                {activeTab === "settings" && (
                  <motion.div key="settings-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Settings
                      profile={userProfile}
                      isAnonymous={!!authUser?.isAnonymous}
                      theme={theme}
                      preferences={preferences}
                      issueCount={issues.length}
                      reportsCreatedCount={reportsCreatedCount}
                      verifiedIssueCount={verifiedIssueCount}
                      isOfflineMode={isOfflineMode}
                      civicImpact={civicImpact}
                      onToggleTheme={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
                      onPreferenceChange={handlePreferenceChange}
                      onUpdateDisplayName={handleUpdateDisplayName}
                      onExportAccountData={handleExportAccountData}
                      onClearLocalData={handleClearLocalDeviceData}
                      onLogout={handleLogout}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </section>

        {/* Right Preview Sidecard (Visible on Desktop when selectedIssue is active) */}
        {selectedIssue && showQuickInspect && (
          <aside className="hidden md:flex min-h-0 w-80 flex-col shrink-0">
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-3xl shadow-xs overflow-hidden flex flex-col h-full">
              <div className="p-4 bg-gradient-to-r from-coral-500 to-amber-accent text-white flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-white/70">
                  Quick Inspect
                </span>
                <button
                  onClick={() => setShowQuickInspect(false)}
                  className="text-xs font-bold text-white/70 hover:text-white"
                >
                  Close
                </button>
              </div>

              {/* Mini Image Preview */}
              <div className="h-32 relative bg-slate-100 dark:bg-navy-950">
                <MediaPreview
                  src={selectedIssue.mediaUrl || selectedIssue.imageUrl}
                  alt={selectedIssue.title}
                  mediaType={selectedIssue.mediaType}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-navy-950/90 text-coral-300 text-[9px] font-bold px-1.5 py-0.5 rounded">
                  {selectedIssue.category}
                </div>
              </div>

              {/* Metrics detail */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1">{selectedIssue.title}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{selectedIssue.location}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">AI Assessment</span>
                  <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed font-medium">
                    {selectedIssue.summary}
                  </p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[10px] space-y-1 font-medium">
                  <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Suggested Dept</span>
                  <span className="text-slate-700">{selectedIssue.suggestedDepartment}</span>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleUpdateStatus(selectedIssue.id, "Resolved")}
                    disabled={selectedIssue.status === "Resolved" || selectedIssue.status === "Rejected"}
                    className={`w-full text-xs font-bold py-2.5 rounded-xl text-white shadow-xs transition-colors uppercase font-mono ${
                      selectedIssue.status === "Resolved" || selectedIssue.status === "Rejected"
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/20"
                    }`}
                  >
                    {selectedIssue.status === "Rejected"
                      ? "Report Rejected"
                      : selectedIssue.status === "Resolved"
                      ? "Work Order Resolved"
                      : "Quick Resolve"}
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* Bottom PWA Style Navigation Bar (Visible on Mobile only for PWA feel) */}
      <footer id="bottom-pwa-bar" className="fixed inset-x-0 bottom-0 z-[5000] flex h-[calc(4rem+env(safe-area-inset-bottom))] items-start justify-around border-t border-slate-200 bg-white px-2 pt-1 shadow-lg dark:border-navy-800 dark:bg-navy-950/95 dark:backdrop-blur-md md:hidden">
        {[
          { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: "feed", label: "Feed", icon: <ListFilter className="w-5 h-5" /> },
          { id: "report", label: "Report", icon: null }, // Handled as custom large button
          { id: "map", label: "Map", icon: <Map className="w-5 h-5" /> },
          { id: "settings", label: "Settings", icon: <SettingsIcon className="w-5 h-5" /> },
        ].map((tab) => {
          if (tab.id === "report") {
            const isSelected = activeTab === "report" && !selectedIssue;
            return (
              <button
                key={tab.id}
                id={`pwa-tab-${tab.id}`}
                onClick={() => {
                  setActiveTab("report");
                  setSelectedIssue(null);
                }}
                className="relative flex flex-col items-center justify-center -translate-y-3.5 active:scale-95 transition-transform z-30"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-[#FAFAF8] dark:border-[#0A0F1E] ${
                  isSelected 
                    ? "bg-[#EAB308] text-slate-950 shadow-yellow-500/20" 
                    : "bg-slate-950 dark:bg-navy-900 text-[#EAB308] shadow-black/20"
                }`}>
                  <PlusCircle className="w-8 h-8 stroke-[2.5]" />
                </div>
                <span className={`text-[10px] font-black mt-1 leading-none ${
                  isSelected ? "text-[#EAB308]" : "text-slate-400 dark:text-slate-500"
                }`}>
                  Report
                </span>
              </button>
            );
          }

          const isSelected = activeTab === tab.id && !selectedIssue;
          return (
            <button
              key={tab.id}
              id={`pwa-tab-${tab.id}`}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSelectedIssue(null);
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-all ${
                isSelected ? "text-coral-500" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
              }`}
            >
              {isSelected && (
                <div className="w-1 h-1 rounded-full bg-coral-500 mb-0.5" />
              )}
              <span className={`transition-transform ${isSelected ? "scale-110 text-coral-500" : ""}`}>
                {tab.icon}
              </span>
              <span className="mt-1 leading-none tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </footer>

      {/* System Console Footer status bar (Matching the High Density Design specs) */}
      {isAdmin && (
        <footer id="system-status-footer" className="hidden md:flex h-8 bg-white border-t border-slate-200 items-center justify-between px-6 text-[10px] text-slate-400 shrink-0 font-mono dark:border-navy-800 dark:bg-navy-950 dark:text-slate-500">
          <div>Admin mode active | AI analysis enabled | Cloud deployment ready</div>
          <div className="flex gap-4">
            <span>Media: Cloudinary</span>
            <span className="text-coral-600 dark:text-coral-400 font-bold uppercase">Beekn</span>
          </div>
        </footer>
      )}

      {/* Hackathon Judge Walkthrough Guide */}
      {isSignedInUser && userProfile && (
        <JudgeDemoHelper 
          step1Done={!!reportDraft?.analysisResult || issues.some(i => i.createdBy === authUser?.uid && i.comments?.length > 0)}
          step2Done={reportsCreatedCount > 0}
          step3Done={!!selectedIssue}
          step4Done={hasUserResolvedIssue}
          completedSteps={[
            !!reportDraft?.analysisResult || issues.some(i => i.createdBy === authUser?.uid && i.comments?.length > 0),
            reportsCreatedCount > 0,
            !!selectedIssue,
            hasUserResolvedIssue
          ].filter(Boolean).length}
          userRole={userProfile.role}
          onToggleRole={async () => {
            const newRole = userProfile.role === "authority" ? "public" : "authority";
            const fb = await initFirebase();
            const now = new Date().toISOString();
            const updatedProfile: UserProfile = {
              ...userProfile,
              uid: authUser.uid,
              email: authUser.email,
              displayName: userProfile.displayName || authUser.displayName || authUser.email?.split("@")[0] || "Guest Judge",
              role: newRole,
              ...(newRole === "authority" && { department: "Sanitation", verificationStatus: "demo-approved" }),
              updatedAt: now,
            } as UserProfile;
            
            if (fb.isAvailable && fb.db) {
              await setDoc(doc(fb.db, "users", authUser.uid), updatedProfile);
            }
            cacheUserProfile(updatedProfile);
            setUserProfile(updatedProfile);
            setActiveTab(newRole === "authority" ? "admin" : "report");
            setSelectedIssue(null);
            showAlert(`Role toggled to: ${newRole === "authority" ? "Authority (Sanitation)" : "Public Citizen"}`, "success");
          }}
        />
      )}
    </div>
  );
}

interface JudgeDemoHelperProps {
  step1Done: boolean;
  step2Done: boolean;
  step3Done: boolean;
  step4Done: boolean;
  completedSteps: number;
  userRole: "public" | "authority";
  onToggleRole: () => void;
}

function JudgeDemoHelper({
  step1Done,
  step2Done,
  step3Done,
  step4Done,
  completedSteps,
  userRole,
  onToggleRole,
}: JudgeDemoHelperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-[5000] font-sans text-slate-800 dark:text-slate-100">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-80 bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-3xl shadow-2xl p-4 space-y-3.5 relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-900 pb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider">Demo Walkthrough</span>
              </div>
              <span className="text-[10px] bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full text-amber-600 dark:text-amber-400 font-bold font-mono">
                {completedSteps}/4 Done
              </span>
            </div>

            {/* Checklist */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <input type="checkbox" checked={step1Done} readOnly className="mt-0.5 accent-amber-500 rounded" />
                <div>
                  <div className={`font-bold ${step1Done ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>1. Run AI Analysis</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Go to Report, select a sample image, and run Gemini.</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <input type="checkbox" checked={step2Done} readOnly className="mt-0.5 accent-amber-500 rounded" />
                <div>
                  <div className={`font-bold ${step2Done ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>2. Submit Issue</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Use current location to verify coordinates, then submit.</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <input type="checkbox" checked={step3Done} readOnly className="mt-0.5 accent-amber-500 rounded" />
                <div>
                  <div className={`font-bold ${step3Done ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>3. Inspect Feed/Map</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Click any issue in the feed or map to open full details.</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <input type="checkbox" checked={step4Done} readOnly className="mt-0.5 accent-amber-500 rounded" />
                <div>
                  <div className={`font-bold ${step4Done ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>4. Resolve Report</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Use the admin status console to mark an issue Resolved.</div>
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="pt-2 border-t border-slate-100 dark:border-navy-900 flex gap-2">
              <button
                type="button"
                onClick={onToggleRole}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-[10px] font-black uppercase py-2 rounded-xl shadow-sm transition active:scale-95"
              >
                Role: Swap to {userRole === "authority" ? "Citizen" : "Authority"}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="bg-slate-100 dark:bg-navy-900 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase px-3 py-2 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white flex items-center justify-center shadow-lg border border-amber-400 active:scale-95 transition cursor-pointer"
          >
            <Sparkles className="w-5 h-5 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
