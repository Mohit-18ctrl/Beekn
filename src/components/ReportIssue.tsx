import React, { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GeminiAnalysis, IssueCategory, IssueSeverity, Issue, getPriorityExplanation } from "../types";
import {
  Upload,
  Image as ImageIcon,
  MapPin,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Eye,
  FileText,
  Building2,
  TrendingUp,
  ShieldCheck,
  Check,
  Edit2,
  RefreshCw,
  Camera,
  Video,
} from "lucide-react";
import MediaPreview from "./MediaPreview";

interface ReportIssueProps {
  onAnalyze: (data: {
    title: string;
    description: string;
    location: string;
    image: string;
    mediaType?: "image" | "video";
    analysisMode?: "Best Quality" | "Fast" | "Demo Safe";
  }) => Promise<GeminiAnalysis>;
  onSubmit: (data: {
    title: string;
    description: string;
    location: string;
    latitude?: number;
    longitude?: number;
    image: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
    analysis: GeminiAnalysis;
  }) => void;
  onCancel: () => void;
  issues?: Issue[];
  onViewIssue?: (issue: Issue) => void;
  draft?: any;
  onSaveDraft?: (draft: any) => void;
  isSubmissionPaused?: boolean;
  submissionPausedUntil?: string | null;
}

// Preset visual samples for users to quick-test the demo without having their own image
const SAMPLE_DEMO_IMAGES = [
  {
    name: "Road Pothole",
    url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
    desc: "Severe asphalt cave-in near the turn",
    title: "Dangerous pothole blocking traffic lanes",
    loc: "Turn 4, Central Avenue Bypass",
    lat: 20.3541,
    lng: 85.8085,
  },
  {
    name: "Garbage Pile",
    url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600",
    desc: "Litter scattering near the local food court",
    title: "Overflowing garbage dump with foul odor",
    loc: "Backyard Lane, Block D Market",
    lat: 20.3575,
    lng: 85.8123,
  },
  {
    name: "Broken Streetlight",
    url: "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?auto=format&fit=crop&q=80&w=600",
    desc: "Complete dark zone near children's playground",
    title: "Shattered overhead streetlight pole bulb",
    loc: "Playground Ring Road, Sector 9",
    lat: 20.3528,
    lng: 85.8055,
  },
];

const compressImage = (file: File, maxW = 1200, maxH = 1200, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }
        if (height > maxH) {
          width = Math.round((width * maxH) / height);
          height = maxH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name || "compressed.jpg", {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            quality
          );
        } else {
          resolve(file);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

function getCategoryPlaceholderImage(category: string): string {
  switch (category) {
    case "Pothole":
      return "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600";
    case "Garbage":
      return "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600";
    case "Streetlight":
      return "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=600";
    case "Water Leakage":
      return "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?auto=format&fit=crop&q=80&w=600";
    case "Drainage":
      return "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=600";
    case "Road Blockage":
      return "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?auto=format&fit=crop&q=80&w=600";
    default:
      return "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&q=80&w=600";
  }
}

type ReverseGeocodeResult = {
  display_name?: string;
  address?: Record<string, string | undefined>;
};

function formatReverseGeocodeAddress(data: ReverseGeocodeResult): string {
  const address = data.address || {};

  const pickFirst = (keys: string[]) => {
    for (const key of keys) {
      const value = address[key]?.trim();
      if (value) return value;
    }
    return "";
  };

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const pushUnique = (parts: string[], value: string) => {
    const cleaned = value.trim();
    if (!cleaned) return;
    const normalized = normalize(cleaned);
    if (!normalized) return;
    if (parts.some((part) => normalize(part) === normalized)) return;
    parts.push(cleaned);
  };

  const parts: string[] = [];

  pushUnique(parts, pickFirst([
    "neighbourhood",
    "suburb",
    "quarter",
    "residential",
    "locality",
    "hamlet",
    "village",
    "road",
    "amenity",
  ]));

  pushUnique(parts, pickFirst([
    "city",
    "town",
    "municipality",
    "city_district",
    "county",
    "state_district",
    "district",
  ]));

  pushUnique(parts, pickFirst(["state"]));
  pushUnique(parts, pickFirst(["postcode"]));

  if (parts.length >= 2) {
    return parts.join(", ");
  }

  const displayParts =
    data.display_name
      ?.split(",")
      .map((part) => part.trim())
      .filter((part) => part && !["india"].includes(part.toLowerCase()))
      .slice(0, 4) || [];

  for (const part of displayParts) {
    pushUnique(parts, part);
  }

  return parts.join(", ");
}

function checkDuplicate(
  newTitle: string,
  newDescription: string,
  newCategory: string,
  newLocation: string,
  newLatitude: number | undefined,
  newLongitude: number | undefined,
  existingIssues: Issue[]
): Issue | null {
  const cleanText = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, "");

  const getSignificantWords = (str: string) => {
    const stopwords = new Set([
      "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "to", "for", "in", "on", "at", "by", "with", "of", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "from", "up", "down", "out", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "can", "will", "just", "should", "now"
    ]);
    return cleanText(str)
      .split(/\s+/)
      .filter((word) => word.length >= 3 && !stopwords.has(word));
  };

  const hasCoordinates = (lat?: number, lng?: number) =>
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    typeof lng === "number" &&
    Number.isFinite(lng);

  const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const earthRadiusMeters = 6371000;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMeters * c;
  };

  const newLocWords = getSignificantWords(newLocation);
  const newTitleWords = getSignificantWords(newTitle);
  const newDescWords = getSignificantWords(newDescription);
  const newHasCoordinates = hasCoordinates(newLatitude, newLongitude);
  const nearbyThresholdMeters = 250;

  for (const issue of existingIssues) {
    if (issue.status === "Resolved") continue;

    // Check category match
    const categoryMatch = issue.category === newCategory;
    if (!categoryMatch) continue;

    // Check location similarity
    const issueLoc = issue.location.toLowerCase();
    const newLoc = newLocation.toLowerCase();
    const isLocSimilar =
      issueLoc.includes(newLoc) ||
      newLoc.includes(issueLoc) ||
      (newLocWords.length > 0 && newLocWords.some((w) => issueLoc.includes(w)));

    const isNearby =
      newHasCoordinates && hasCoordinates(issue.latitude, issue.longitude)
        ? getDistanceMeters(newLatitude!, newLongitude!, issue.latitude!, issue.longitude!) <= nearbyThresholdMeters
        : false;

    if (!isNearby && !isLocSimilar) continue;

    // Check title/description similarity
    const issueTitleLower = issue.title.toLowerCase();
    const issueDescLower = issue.description.toLowerCase();

    // Word overlapping
    const sharedTitleWords = newTitleWords.filter(
      (w) => issueTitleLower.includes(w) || issueDescLower.includes(w)
    );
    const sharedDescWords = newDescWords.filter(
      (w) => issueTitleLower.includes(w) || issueDescLower.includes(w)
    );

    // If there's keyword overlap
    const isTitleSimilar = sharedTitleWords.length >= 1;
    const isDescSimilar = sharedDescWords.length >= 1;

    if (isTitleSimilar || isDescSimilar) {
      return issue; // Found a matching possible duplicate
    }
  }

  return null;
}

export default function ReportIssue({
  onAnalyze,
  onSubmit,
  onCancel,
  issues,
  onViewIssue,
  draft,
  onSaveDraft,
  isSubmissionPaused = false,
  submissionPausedUntil,
}: ReportIssueProps) {
  // Form values
  const [title, setTitle] = useState(draft?.title || "");
  const [description, setDescription] = useState(draft?.description || "");
  const [location, setLocation] = useState(draft?.location || "");
  const [latitude, setLatitude] = useState<number | undefined>(draft?.latitude || undefined);
  const [longitude, setLongitude] = useState<number | undefined>(draft?.longitude || undefined);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [image, setImage] = useState(draft?.image || ""); // base64 representation, local preview blob, or sample URL
  const [selectedFile, setSelectedFile] = useState<File | null>(draft?.selectedFile || null);
  const [mediaUrl, setMediaUrl] = useState(draft?.mediaUrl || "");
  const [mediaType, setMediaType] = useState<"image" | "video">(draft?.mediaType || "image");
  const [base64Image, setBase64Image] = useState(draft?.base64Image || "");

  // UI state
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState("");
  
  // Gemini Preview Phase state
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysis | null>(draft?.analysisResult || null);
  const [isEditingAI, setIsEditingAI] = useState(draft?.isEditingAI || false);
  const [analysisMode, setAnalysisMode] = useState<"Best Quality" | "Fast" | "Demo Safe">(draft?.analysisMode || "Best Quality");
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  
  // Editable properties for review phase
  const [reviewedTitle, setReviewedTitle] = useState(draft?.reviewedTitle || "");
  const [reviewedCategory, setReviewedCategory] = useState<IssueCategory>(draft?.reviewedCategory || "Other");
  const [reviewedSeverity, setReviewedSeverity] = useState<IssueSeverity>(draft?.reviewedSeverity || "Medium");
  const [reviewedSummary, setReviewedSummary] = useState(draft?.reviewedSummary || "");
  const [reviewedDept, setReviewedDept] = useState(draft?.reviewedDept || "");
  const [reviewedPriority, setReviewedPriority] = useState(draft?.reviewedPriority || 50);
  const [reviewedCitizenAction, setReviewedCitizenAction] = useState(draft?.reviewedCitizenAction || "");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const needsLocationVerification = location.trim().length > 0 && (latitude === undefined || longitude === undefined);

  // Sync state back to parent draft
  useEffect(() => {
    if (onSaveDraft) {
      onSaveDraft({
        title,
        description,
        location,
        latitude,
        longitude,
        image,
        selectedFile,
        mediaUrl,
        mediaType,
        base64Image,
        analysisResult,
        isEditingAI,
        analysisMode,
        reviewedTitle,
        reviewedCategory,
        reviewedSeverity,
        reviewedSummary,
        reviewedDept,
        reviewedPriority,
        reviewedCitizenAction,
      });
    }
  }, [
    title,
    description,
    location,
    latitude,
    longitude,
    image,
    selectedFile,
    mediaUrl,
    mediaType,
    base64Image,
    analysisResult,
    isEditingAI,
    analysisMode,
    reviewedTitle,
    reviewedCategory,
    reviewedSeverity,
    reviewedSummary,
    reviewedDept,
    reviewedPriority,
    reviewedCitizenAction,
    onSaveDraft,
  ]);

  // Compute possible duplicates reactively
  const possibleDuplicate = useMemo(() => {
    if (!analysisResult) return null;
    return checkDuplicate(
      reviewedTitle || title,
      description,
      reviewedCategory,
      location,
      latitude,
      longitude,
      issues || []
    );
  }, [analysisResult, reviewedTitle, title, description, reviewedCategory, location, latitude, longitude, issues]);

  // File Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowMediaOptions(false);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setErrorMsg("Unsupported file type. Please upload an image or video file.");
      return;
    }

    // Upfront rejection check for files that are far too large
    if (isImage && file.size > 25 * 1024 * 1024) {
      setErrorMsg("Image file is too large to process (maximum 25MB allowed before compression).");
      return;
    }
    if (isVideo && file.size > 100 * 1024 * 1024) {
      setErrorMsg("Video file exceeds the 100MB maximum size limit.");
      return;
    }

    let processedFile = file;
    if (isImage && file.size > 1024 * 1024) {
      try {
        setErrorMsg("");
        // Compress client side if it is over 1MB
        processedFile = await compressImage(file);
        console.log(`Successfully compressed large image. Size reduced from ${(file.size / (1024 * 1024)).toFixed(2)}MB to ${(processedFile.size / (1024 * 1024)).toFixed(2)}MB`);
      } catch (err) {
        console.warn("Client-side image compression bypassed.", err);
      }
    }

    if (isImage && processedFile.size > 10 * 1024 * 1024) {
      setErrorMsg("Image file exceeds the 10MB maximum size limit after compression.");
      return;
    }

    setSelectedFile(processedFile);
    setErrorMsg("");

    const previewUrl = URL.createObjectURL(processedFile);
    setImage(previewUrl);
    setMediaType(isVideo ? "video" : "image");

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBase64Image(event.target.result as string);
        }
      };
      reader.readAsDataURL(processedFile);
    } else {
      setBase64Image("");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setShowMediaOptions(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Pre-fill fields with template values to make testing faster
  const selectDemoSample = (sample: typeof SAMPLE_DEMO_IMAGES[0]) => {
    setSelectedFile(null);
    setImage(sample.url);
    setMediaUrl(sample.url);
    setMediaType("image");
    setBase64Image(""); // Not needed for sample URL
    setTitle(sample.title);
    setDescription(sample.desc);
    setLocation(sample.loc);
    setLatitude(sample.lat);
    setLongitude(sample.lng);
    setErrorMsg("");
  };

  // Browser Geolocation capture
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setGpsLoading(false);

        // Attempt reverse geocoding via Nominatim (OpenStreetMap public API)
        let readableAddress = "";
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "en",
                "User-Agent": "Beekn/1.0"
              }
            }
          );
          if (response.ok) {
            const data = await response.json();
            if (data) {
              readableAddress = formatReverseGeocodeAddress(data);
            }
          }
        } catch (err) {
          console.error("Reverse geocoding fetch failed:", err);
        }

        if (!readableAddress) {
          readableAddress = `Current location near ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
        
        setLocation(readableAddress);
      },
      (error) => {
        console.warn("Geolocation warning (safe to ignore if manual input used):", error);
        setGpsLoading(false);
        const denied = error.code === error.PERMISSION_DENIED;
        setErrorMsg(
          denied
            ? "Location permission was denied. You can still type the address manually."
            : `Unable to capture your location: ${error.message}. You can still type the address manually.`
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Trigger Gemini Analysis flow
  const triggerAIAnalysis = async () => {
    if (!title || !description || !location) {
      setErrorMsg("Please fill out Title, Description and Location before running Gemini.");
      return;
    }
    if (latitude === undefined || longitude === undefined) {
      setErrorMsg("Please use current location to verify where this issue is before analysis.");
      return;
    }
    setErrorMsg("");
    setIsAnalyzing(true);
    setAnalysisSteps("Preparing media upload...");

    let finalMediaUrl = mediaUrl || image;
    let finalMediaType = mediaType;

    // 1. Upload file to Cloudinary if a local file was selected
    if (selectedFile) {
      setAnalysisSteps("Uploading media securely to Cloudinary...");
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await fetch("/api/upload-media", {
          method: "POST",
          body: formData,
          credentials: "include", // Essential for iframe cross-site secure cookie transport
        });

        const responseText = await uploadRes.text();
        console.log("Upload Response Text (first 300 chars):", responseText.substring(0, 300));

        let uploadData: any;
        try {
          uploadData = JSON.parse(responseText);
        } catch (parseErr) {
          console.error("Failed to parse upload response as JSON:", responseText);
          throw new Error(`Failed to parse upload response: ${responseText.substring(0, 150)}`);
        }

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || `Upload failed with status ${uploadRes.status}`);
        }

        if (!uploadData.mediaUrl) {
          throw new Error("No media URL returned from server.");
        }
        finalMediaUrl = uploadData.mediaUrl;
        finalMediaType = uploadData.mediaType;
        setMediaUrl(finalMediaUrl);
        setMediaType(finalMediaType);
        console.log("Cloudinary Media Upload Successful:", finalMediaUrl, finalMediaType);
      } catch (uploadError: any) {
        console.error("Cloudinary upload failed:", uploadError);
        setErrorMsg(`Cloudinary Upload Error: ${uploadError.message}. Please verify settings or retry.`);
        setIsAnalyzing(false);
        return; // BLOCK AND RETURN EARLY!
      }
    }

    // Simulate progress labels for high density feel
    const progressSteps = [
      "Compressing metadata tags...",
      "Analyzing visual attributes with Gemini 3.5 Flash...",
      "Synthesizing civic severity heuristics...",
      "Assigning priority rating score...",
      "Structuring response JSON object..."
    ];

    let stepIndex = 0;
    setAnalysisSteps(progressSteps[0]);
    const timer = setInterval(() => {
      stepIndex++;
      if (stepIndex < progressSteps.length) {
        setAnalysisSteps(progressSteps[stepIndex]);
      }
    }, 900);

    try {
      // If we have base64Image, analyze it. Otherwise, analyze the placeholder image or thumbnail.
      const imageToAnalyze = base64Image || finalMediaUrl || "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&q=80&w=600";
      const result = await onAnalyze({
        title,
        description,
        location,
        image: imageToAnalyze,
        mediaType: finalMediaType,
        analysisMode: analysisMode,
      });
      clearInterval(timer);
      
      // Populate review state
      setAnalysisResult(result);
      setReviewedTitle(result.title || title);
      setReviewedCategory(result.category);
      setReviewedSeverity(result.severity);
      setReviewedSummary(result.summary);
      setReviewedDept(result.suggestedDepartment);
      setReviewedPriority(result.priorityScore);
      setReviewedCitizenAction(result.citizenAction);
    } catch (err: any) {
      clearInterval(timer);
      setErrorMsg(err?.message || "AI Analysis failed. Running heuristic backup model.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Final submit handler
  const handleFinalSubmit = () => {
    if (!analysisResult) return;
    if (isSubmissionPaused) {
      setErrorMsg(`Reporting is paused until ${submissionPausedUntil ? new Date(submissionPausedUntil).toLocaleString() : "the current moderation cooldown ends"}.`);
      return;
    }
    if (latitude === undefined || longitude === undefined) {
      setErrorMsg("Please use current location to attach verified coordinates before submitting.");
      return;
    }

    const finalizedAnalysis: GeminiAnalysis = {
      title: reviewedTitle,
      category: reviewedCategory,
      severity: reviewedSeverity,
      summary: reviewedSummary,
      suggestedDepartment: reviewedDept,
      priorityScore: reviewedPriority,
      citizenAction: reviewedCitizenAction,
    };

    // Strict safety layer: Filter out any local preview 'blob:' URLs
    const categoryPlaceholder = getCategoryPlaceholderImage(reviewedCategory);
    const finalUrl = mediaUrl && !mediaUrl.startsWith("blob:")
      ? mediaUrl
      : (image && !image.startsWith("blob:") && !image.startsWith("data:")
          ? image
          : categoryPlaceholder);

    onSubmit({
      title: reviewedTitle,
      description,
      location,
      latitude,
      longitude,
      image: finalUrl,
      mediaUrl: finalUrl,
      mediaType: mediaType,
      analysis: finalizedAnalysis,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-6" id="report-form-container">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Report an Issue</h2>
          <p className="text-xs text-slate-400">Share what happened and where. The app will suggest the right category.</p>
        </div>
        <button
          onClick={onCancel}
          className="rounded-lg border border-rose-600 bg-rose-600 px-3 py-1.5 text-xs font-black text-white shadow-sm transition-colors hover:border-rose-700 hover:bg-rose-700 dark:border-rose-500/80 dark:bg-rose-600 dark:hover:border-rose-400 dark:hover:bg-rose-500"
        >
          Cancel
        </button>
      </div>

      {isSubmissionPaused && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold leading-relaxed text-rose-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Reporting and verification are paused until {submissionPausedUntil ? new Date(submissionPausedUntil).toLocaleString() : "the moderation cooldown ends"}.
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!analysisResult ? (
          // STEP 1: FILL FORM & UPLOAD
          <motion.div
            key="form-step"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4 sm:space-y-5"
          >
            {/* Quick-test Presets banner */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-900/70">
              <span className="rounded border border-blue-200/70 bg-blue-100/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:border-coral-400/20 dark:bg-coral-400/10 dark:text-coral-300">
                Quick Samples
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Try a sample report or add your own photo/video.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {SAMPLE_DEMO_IMAGES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectDemoSample(sample)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <ImageIcon className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    {sample.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Image/Video Upload Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Photo or Video</label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => {
                  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
                  if (isMobile) {
                    setShowMediaOptions(true);
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-50/50"
                    : image
                    ? "border-green-300 bg-green-50/10 hover:border-green-400"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                {/* Standard File Picker */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden"
                />
                {/* Direct Rear-Camera Photo Capture */}
                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />
                {/* Direct Rear-Camera Video Capture */}
                <input
                  type="file"
                  ref={videoInputRef}
                  onChange={handleFileChange}
                  accept="video/*"
                  capture="environment"
                  className="hidden"
                />

                {image ? (
                  <div className="w-full text-center space-y-2">
                    <div className="relative inline-block max-w-xs mx-auto">
                      <div className="relative mx-auto h-32 w-56 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm">
                        <MediaPreview
                          src={image}
                          alt="Selected evidence preview"
                          mediaType={mediaType}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="absolute bottom-1 right-1 bg-green-600 text-white rounded-full p-1 shadow">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-green-600">
                      Media added. Tap again to replace.
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-1.5">
                    <div className="inline-flex rounded-full bg-slate-50 p-2 text-slate-400 mx-auto">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-600">
                      Tap to add media
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Supports images (max 10MB) and videos (max 100MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Text Form Inputs */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="input-title" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Issue Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Large crater-like pothole near highschool road"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 px-3.5 text-xs shadow-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-location" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Location / Street Address <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={gpsLoading}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors disabled:opacity-50 ${
                      needsLocationVerification
                        ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                        : latitude !== undefined && longitude !== undefined
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100/80 hover:text-indigo-800"
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${gpsLoading ? "animate-pulse" : ""}`} />
                    {gpsLoading
                      ? "Finding..."
                      : needsLocationVerification
                      ? "Verify Location"
                      : latitude !== undefined && longitude !== undefined
                      ? "Update Location"
                      : "Use Current Location"}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input
                    id="input-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    readOnly={latitude !== undefined && longitude !== undefined}
                    placeholder="Type a nearby landmark, then use current location to verify"
                    className={`w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3.5 text-xs shadow-xs focus:border-indigo-500 focus:outline-none ${
                      latitude !== undefined && longitude !== undefined
                        ? "cursor-default bg-emerald-50/40 text-slate-700"
                        : ""
                    }`}
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Use current location to verify where the issue is. Manual text is only a starting hint before GPS capture.
                </p>
                {latitude !== undefined && longitude !== undefined && (
                  <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 text-[10px] rounded-lg px-2.5 py-1.5 border border-emerald-100/80">
                    <span className="font-medium">
                      Verified location attached: <span className="font-mono font-bold">{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setLatitude(undefined);
                        setLongitude(undefined);
                        setLocation("");
                      }}
                      className="text-emerald-700 hover:text-emerald-950 font-bold hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="input-description" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  What happened? <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="input-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue. (e.g. Traffic is bottlenecked because of it. It is dangerous for water pooling during rain.)"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-xs shadow-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Submit & Error Footer */}
            <div className="space-y-3 pt-3">
              {/* Compact Analysis Mode Selector */}
              <div className="space-y-1.5 rounded-xl border border-slate-200/60 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Analysis Mode
                  </label>
                  <span className="font-mono text-[9px] font-medium text-indigo-600 dark:text-coral-300">
                    {analysisMode === "Best Quality" && "Best result"}
                    {analysisMode === "Fast" && "Faster result"}
                    {analysisMode === "Demo Safe" && "Offline-safe"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-slate-200/60 p-1 dark:bg-slate-950/70">
                  {(["Best Quality", "Fast", "Demo Safe"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      id={`btn-mode-${mode.toLowerCase().replace(" ", "-")}`}
                      onClick={() => setAnalysisMode(mode)}
                      className={`py-1.5 text-[11px] font-bold rounded-md transition-all ${
                        analysisMode === mode
                          ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-coral-300"
                          : "text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-100 p-3 text-rose-600 text-[11px] font-medium leading-relaxed">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

            <button
                id="btn-analyze-gemini"
                type="button"
                onClick={triggerAIAnalysis}
                disabled={isAnalyzing || isSubmissionPaused}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3.5 px-4 text-xs font-bold shadow-md transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                    <span>{analysisSteps}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Report</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          // STEP 2: GEMINI AI PREVIEW & SUBMISSION
          <motion.div
            key="analysis-preview-step"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* AI Success Banner */}
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3.5 flex items-start gap-2.5">
              <div className="rounded-md bg-indigo-600 p-1.5 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-tight">Analysis Ready</h4>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  Review the suggested category, priority, and responsible department before submitting.
                </p>
              </div>
            </div>

            {/* Possible Duplicate Warning Alert */}
            {possibleDuplicate && (
              <div id="duplicate-warning-container" className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 space-y-3 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <div className="rounded-md bg-amber-600 p-1.5 text-white shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-tight">
                      Possible duplicate found
                    </h4>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      An unresolved report with matching category and overlapping details was found in this area.
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 rounded-lg border border-amber-200 p-3 text-xs space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-800 line-clamp-1">{possibleDuplicate.title}</span>
                    <span className="text-[9px] font-mono font-bold uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                      {possibleDuplicate.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 gap-2">
                    <span className="flex items-center gap-1 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{possibleDuplicate.location}</span>
                    </span>
                    <span className="font-semibold shrink-0 bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      {possibleDuplicate.verificationCount} verifications
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    id="btn-view-duplicate"
                    onClick={() => onViewIssue && onViewIssue(possibleDuplicate)}
                    className="flex-1 bg-white hover:bg-slate-50 border border-amber-200 text-amber-800 py-2 rounded-lg text-xs font-bold uppercase shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    View Existing Issue
                  </button>
                  <button
                    type="button"
                    id="btn-submit-anyway"
                    onClick={handleFinalSubmit}
                    disabled={isSubmissionPaused}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white py-2 rounded-lg text-xs font-bold uppercase shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Submit Anyway
                  </button>
                </div>
              </div>
            )}

            {/* AI Review / Editing Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
                Report Summary
              </span>
              <button
                type="button"
                onClick={() => setIsEditingAI(!isEditingAI)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700"
              >
                <Edit2 className="w-3.5 h-3.5" />
                {isEditingAI ? "Done Editing" : "Modify Details"}
              </button>
            </div>

            {/* Editable Review Panels */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
              {isEditingAI ? (
                // EDIT MODE
                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 uppercase">Suggested Title</label>
                    <input
                      type="text"
                      value={reviewedTitle}
                      onChange={(e) => setReviewedTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 uppercase">Category</label>
                      <select
                        value={reviewedCategory}
                        onChange={(e) => setReviewedCategory(e.target.value as IssueCategory)}
                        className="w-full rounded-lg border border-slate-200 py-2 px-2.5 text-xs focus:outline-none"
                      >
                        <option value="Road Damage">Road Damage</option>
                        <option value="Garbage">Garbage</option>
                        <option value="Streetlight">Streetlight</option>
                        <option value="Water Leakage">Water Leakage</option>
                        <option value="Drainage">Drainage</option>
                        <option value="Road Blockage">Road Blockage</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 uppercase">Severity</label>
                      <select
                        value={reviewedSeverity}
                        onChange={(e) => setReviewedSeverity(e.target.value as IssueSeverity)}
                        className="w-full rounded-lg border border-slate-200 py-2 px-2.5 text-xs focus:outline-none"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 uppercase">Responsible Department</label>
                      <input
                        type="text"
                        value={reviewedDept}
                        onChange={(e) => setReviewedDept(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 uppercase">Priority (0-100)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={reviewedPriority}
                        onChange={(e) => setReviewedPriority(parseInt(e.target.value) || 50)}
                        className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 uppercase">Summary</label>
                    <textarea
                      rows={2}
                      value={reviewedSummary}
                      onChange={(e) => setReviewedSummary(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 uppercase">Suggested Action</label>
                    <input
                      type="text"
                      value={reviewedCitizenAction}
                      onChange={(e) => setReviewedCitizenAction(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                // PREVIEW MODE (Clean High Density representation)
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        Report Draft
                      </span>
                      {(() => {
                        if (!analysisResult) return null;
                        const isFallback = !!analysisResult.isFallback;
                        const mode = analysisResult.analysisMode;
                        const model = analysisResult.modelUsed;

                        if (isFallback) {
                          if (mode === "Demo Safe") {
                            return (
                              <span id="badge-demo-safe" className="text-[10px] font-bold uppercase text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-slate-500" />
                                Demo Safe: Local Fallback
                              </span>
                            );
                          }
                          return (
                            <span id="badge-fallback-analysis" className="text-[10px] font-bold uppercase text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Fallback Analysis
                            </span>
                          );
                        }

                        if (mode === "Best Quality") {
                          const modelLabel = model === "gemini-2.5-flash" ? "Gemini 2.5 Flash" : "Gemini 3.5 Flash";
                          return (
                            <span id="badge-best-quality" className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              Best Quality: {modelLabel}
                            </span>
                          );
                        }

                        if (mode === "Fast") {
                          return (
                            <span id="badge-fast" className="text-[10px] font-bold uppercase text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-indigo-600" />
                              Fast: Gemini 2.5 Flash
                            </span>
                          );
                        }

                        return (
                          <span id="badge-gemini-analysis" className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            Analyzed by Gemini
                          </span>
                        );
                      })()}
                      {analysisResult?.analysisDurationMs && (
                        <span className="text-[9px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                          {(analysisResult.analysisDurationMs / 1000).toFixed(2)}s
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mt-1">{reviewedTitle}</h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {location}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                      <div className="text-[9px] uppercase font-mono font-bold text-slate-400">Category</div>
                      <div className="text-xs font-bold text-slate-800">{reviewedCategory}</div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                      <div className="text-[9px] uppercase font-mono font-bold text-slate-400">Severity Rating</div>
                      <div className="text-xs font-bold text-slate-800">{reviewedSeverity}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                      <div className="text-[9px] uppercase font-mono font-bold text-slate-400">Responsible Department</div>
                      <div className="text-xs font-bold text-slate-800">{reviewedDept}</div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                      <div className="text-[9px] uppercase font-mono font-bold text-slate-400">Priority</div>
                      <div className="text-xs font-bold text-indigo-600">{reviewedPriority} / 100</div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div>
                      <div className="text-[9px] uppercase font-mono font-bold text-slate-400 mb-0.5">Summary</div>
                      <p className="text-xs text-slate-700 leading-relaxed">{reviewedSummary}</p>
                    </div>

                    <div className="bg-indigo-50/40 p-2.5 rounded-lg border border-indigo-100/30">
                      <div className="text-[9px] uppercase font-mono font-bold text-indigo-500 mb-0.5">Suggested Action</div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">{reviewedCitizenAction}</p>
                    </div>

                    {(() => {
                      const reasons = getPriorityExplanation({
                        severity: reviewedSeverity,
                        category: reviewedCategory,
                        priorityScore: reviewedPriority,
                      });
                      return (
                        <div id="priority-explanation-preview" className="bg-amber-50/45 p-2.5 rounded-lg border border-amber-200/40">
                          <div className="text-[9px] uppercase font-mono font-bold text-amber-700 mb-1">Priority Explanation</div>
                          <ul className="list-disc pl-4 text-xs text-slate-700 space-y-0.5">
                            {reasons.map((reason, idx) => (
                              <li key={idx}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Back to Edit Report or Submit */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAnalysisResult(null)}
                className="flex-1 bg-white border border-slate-300 py-3 rounded-xl text-xs font-bold text-slate-600 uppercase hover:bg-slate-50 transition-colors"
              >
                Edit Report
              </button>
              <button
                id="btn-confirm-report"
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmissionPaused}
                className="flex-1 bg-indigo-600 py-3 rounded-xl text-xs font-bold text-white uppercase shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                Submit Report
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Options Actions Sheet Modal */}
      <AnimatePresence>
        {showMediaOptions && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => setShowMediaOptions(false)} />
            
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 p-5 space-y-4 shadow-2xl text-slate-800 dark:text-slate-100 z-10"
            >
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Select Evidence Source
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Capture a new photo/video or upload an existing file from your device.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowMediaOptions(false);
                    setTimeout(() => photoInputRef.current?.click(), 150);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 px-4 py-3 text-xs font-black transition hover:bg-slate-100 dark:hover:bg-navy-800"
                >
                  <Camera className="w-5 h-5 text-coral-500 shrink-0" />
                  Take Photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMediaOptions(false);
                    setTimeout(() => videoInputRef.current?.click(), 150);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 px-4 py-3 text-xs font-black transition hover:bg-slate-100 dark:hover:bg-navy-800"
                >
                  <Video className="w-5 h-5 text-amber-500 shrink-0" />
                  Record Video
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMediaOptions(false);
                    setTimeout(() => fileInputRef.current?.click(), 150);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 px-4 py-3 text-xs font-black transition hover:bg-slate-100 dark:hover:bg-navy-800"
                >
                  <Upload className="w-5 h-5 text-blue-500 shrink-0" />
                  Choose from Device
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowMediaOptions(false)}
                className="w-full text-center py-2 text-xs font-black text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
