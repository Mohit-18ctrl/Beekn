import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { Issue, GeminiAnalysis, IssueStatus, IssueCategory, IssueSeverity, Comment } from "./src/types";

dotenv.config({ path: ".env", quiet: true });
dotenv.config({ path: ".env.local", override: true, quiet: true });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });


const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Enable CORS for Firebase-hosted frontend and local/dev clients.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header("Vary", "Origin");
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Body parser with 10MB limit for base64 image uploads
app.use(express.json({ limit: "10mb" }));

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Default stock image URLs from Unsplash for our 4 sample issues
const MOCK_IMAGES = {
  road: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
  garbage: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600",
  streetlight: "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?auto=format&fit=crop&q=80&w=600",
  water: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=600",
};

// Original 4 sample issues as required
const getInitialSampleIssues = (): Issue[] => [
  {
    id: "issue-1",
    title: "Large Pothole near College Gate",
    description: "Deep pothole right in front of the main college entrance. Forcing two-wheelers and scooters to swerve dangerously into oncoming traffic lanes.",
    imageUrl: MOCK_IMAGES.road,
    location: "Main Gate, College Road, Ward 12",
    category: "Road Damage",
    severity: "High",
    summary: "Large asphalt cavity in a high-traffic student pedestrian zone causing direct traffic obstruction and driving hazards.",
    suggestedDepartment: "Municipal Public Works Department (PWD)",
    priorityScore: 82,
    citizenAction: "Slow down when approaching the entrance. Keep a safe distance from other vehicles.",
    status: "Reported",
    verificationCount: 1,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
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
    imageUrl: MOCK_IMAGES.garbage,
    location: "Central Market Lane, behind Plaza B",
    category: "Garbage",
    severity: "Medium",
    summary: "Unmanaged solid waste accumulation causing bio-hazard risks, odor pollution, and obstruction of shopping lanes.",
    suggestedDepartment: "Sanitation and Waste Management Division",
    priorityScore: 65,
    citizenAction: "Dispose of household waste inside the bins. Avoid littering around the marketplace area.",
    status: "In Progress",
    verificationCount: 3, // Community Verified status automatically handled
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
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
    imageUrl: MOCK_IMAGES.streetlight,
    location: "Hostel Road Stretch, near Block B",
    category: "Streetlight",
    severity: "High",
    summary: "Inoperative street illumination along a major pedestrian pathway, elevating safety risks for evening commuters.",
    suggestedDepartment: "Municipal Electrical & Lighting Board",
    priorityScore: 75,
    citizenAction: "Use your phone flashlight when walking at night. Walk in groups if possible.",
    status: "Community Verified",
    verificationCount: 3,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    comments: [],
  },
  {
    id: "issue-4",
    title: "Major Water Pipe Leakage near Main Highway",
    description: "Main drinking water pipeline has burst, causing hundreds of gallons of clean water to flood the side service road.",
    imageUrl: MOCK_IMAGES.water,
    location: "Service Road, Highway Junction 4",
    category: "Water Leakage",
    severity: "Critical",
    summary: "High-pressure potable water distribution failure leading to major water wastage and road flooding.",
    suggestedDepartment: "Water Supply and Sewerage Board",
    priorityScore: 92,
    citizenAction: "Avoid driving on the flooded service road. Report any pressure drop in neighboring buildings.",
    status: "Resolved",
    verificationCount: 5,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
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

// In-Memory Database State
let issues: Issue[] = getInitialSampleIssues();

// Fallback Heuristic Generator when Gemini API is unconfigured or fails
function fallbackHeuristicAnalysis(title: string, description: string): GeminiAnalysis {
  const content = `${title} ${description}`.toLowerCase();

  let category: IssueCategory = "Other";
  let severity: IssueSeverity = "Medium";
  let suggestedDepartment = "Municipal General Administration Department";
  let priorityScore = 50;
  let summary = `Civic issue reported: "${title || "Unnamed civic report"}". Needs field investigation.`;
  let citizenAction = "Please remain cautious in this area and report any worsening conditions.";

  if (
    content.includes("pothole") ||
    content.includes("road") ||
    content.includes("asphalt") ||
    content.includes("crack") ||
    content.includes("pavement") ||
    content.includes("crater")
  ) {
    category = "Road Damage";
    severity = content.includes("huge") || content.includes("dangerous") || content.includes("severe") ? "High" : "Medium";
    suggestedDepartment = "Municipal Public Works Department (PWD)";
    priorityScore = severity === "High" ? 82 : 62;
    summary = "Reported surface failure or asphalt crater on public road causing potential vehicle damage and transit delays.";
    citizenAction = "Drive at reduced speeds and avoid sudden lane adjustments near the affected site.";
  } else if (
    content.includes("garbage") ||
    content.includes("trash") ||
    content.includes("waste") ||
    content.includes("dump") ||
    content.includes("litter") ||
    content.includes("smell") ||
    content.includes("pile")
  ) {
    category = "Garbage";
    severity = content.includes("overflow") || content.includes("smell") || content.includes("toxic") ? "High" : "Medium";
    suggestedDepartment = "Sanitation and Solid Waste Management Division";
    priorityScore = severity === "High" ? 72 : 55;
    summary = "Solid waste accumulation causing sanitation concerns, visual pollution, and potential stray animal hazards.";
    citizenAction = "Dispose of waste strictly inside designated containers. Do not approach litter piles directly.";
  } else if (
    content.includes("light") ||
    content.includes("dark") ||
    content.includes("bulb") ||
    content.includes("streetlight") ||
    content.includes("lamp") ||
    content.includes("electricity")
  ) {
    category = "Streetlight";
    severity = content.includes("completely dark") || content.includes("unsafe") || content.includes("campus") ? "High" : "Medium";
    suggestedDepartment = "Municipal Electrical & Lighting Board";
    priorityScore = severity === "High" ? 75 : 48;
    summary = "Inoperative street illumination along a pedestrian pathway, elevating safety risks for evening commuters.";
    citizenAction = "Ensure personal light devices are active. Avoid dark shortcuts and stick to well-lit main routes.";
  } else if (
    content.includes("leak") ||
    content.includes("water") ||
    content.includes("pipe") ||
    content.includes("burst") ||
    content.includes("flooding") ||
    content.includes("puddle")
  ) {
    category = "Water Leakage";
    severity = content.includes("burst") || content.includes("highway") || content.includes("flooding") ? "Critical" : "Medium";
    suggestedDepartment = "Water Supply and Sewerage Board";
    priorityScore = severity === "Critical" ? 92 : 64;
    summary = "Potable water distribution failure leading to notable resource wastage and localized water pooling on road.";
    citizenAction = "Keep dry. Avoid driving directly through deep standing water to prevent vehicle hydroplaning.";
  } else if (
    content.includes("drain") ||
    content.includes("sewer") ||
    content.includes("gutter") ||
    content.includes("clog") ||
    content.includes("blockage") ||
    content.includes("overflow")
  ) {
    category = "Drainage";
    severity = content.includes("overflow") || content.includes("foul") || content.includes("storm") ? "High" : "Medium";
    suggestedDepartment = "Stormwater Drainage and Sewerage Division";
    priorityScore = severity === "High" ? 78 : 58;
    summary = "Clogged drainage channel or sewage conduit causing blackwater backup on pedestrian sidewalk.";
    citizenAction = "Avoid direct contact with flooded sewage. Inform local health inspectors if odor persists.";
  } else if (
    content.includes("block") ||
    content.includes("tree") ||
    content.includes("barricade") ||
    content.includes("obstacle") ||
    content.includes("branch") ||
    content.includes("construction")
  ) {
    category = "Road Blockage";
    severity = content.includes("complete") || content.includes("highway") ? "Critical" : "High";
    suggestedDepartment = "Emergency Civil Response and Traffic Control";
    priorityScore = severity === "Critical" ? 85 : 70;
    summary = "Physical road obstruction causing total or partial block of a vehicle traffic/sidewalk lane.";
    citizenAction = "Follow detour instructions. Use alternate neighborhood lanes where applicable.";
  }

  return {
    title: title || `${category} Issue`,
    category,
    severity,
    summary,
    suggestedDepartment,
    priorityScore,
    citizenAction,
  };
}

// REST API Endpoints

// 0a. GET Firebase configuration for client-side setup
app.get("/api/firebase-config", (req, res) => {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      return res.json(configData);
    }
  } catch (err) {
    console.error("Error reading firebase-applet-config.json", err);
  }
  // Fallback to env vars if config file not found or empty
  res.json({
    apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0991151641",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
    firestoreDatabaseId: process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-communityhero-bc5d0b28-46b4-469c-808e-79d41f43dae1"
  });
});

// 0b. POST - Upload media to Cloudinary
app.post("/api/upload-media", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("[Multer Error]:", err);
      return res.status(400).json({ error: err.message || "File upload parsing failed" });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded in the request" });
    }

    const { mimetype, size, buffer } = req.file;
    const isImage = mimetype.startsWith("image/");
    const isVideo = mimetype.startsWith("video/");

    if (!isImage && !isVideo) {
      return res.status(400).json({ error: "Unsupported media format. Please upload an image or video file." });
    }

    // Size limit verification:
    // images: max 10 MB
    // videos: max 100 MB
    if (isImage && size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: "Image file exceeds the 10MB maximum size limit." });
    }
    if (isVideo && size > 100 * 1024 * 1024) {
      return res.status(400).json({ error: "Video file exceeds the 100MB maximum size limit." });
    }

    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(400).json({ error: "Cloudinary credentials are not configured on the backend environment." });
    }

    // Upload buffer to Cloudinary using stream upload
    const uploadStream = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder: "community_hero",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(buffer);
      });
    };

    const result: any = await uploadStream();
    
    return res.json({
      mediaUrl: result.secure_url || result.url,
      mediaType: isVideo ? "video" : "image",
      publicId: result.public_id,
    });
  } catch (error: any) {
    console.error("[Cloudinary Uplink Error]:", error);
    return res.status(500).json({
      error: error.message || "Uplink transfer failed due to Cloudinary backend settings.",
    });
  }
});

// 1. GET all issues
app.get("/api/issues", (req, res) => {
  res.json(issues);
});

// 2. GET single issue
app.get("/api/issues/:id", (req, res) => {
  const issue = issues.find((i) => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }
  res.json(issue);
});

// 3. POST - Create new issue
app.post("/api/issues", (req, res) => {
  const {
    title,
    description,
    imageUrl,
    mediaUrl,
    mediaType,
    location,
    latitude,
    longitude,
    category,
    severity,
    summary,
    suggestedDepartment,
    priorityScore,
    citizenAction,
    createdBy,
    createdByEmail,
    createdByName,
    createdByProvider,
    verifiedBy,
    statusHistory,
  } = req.body;

  if (!title || !description || !location) {
    return res.status(400).json({ error: "Missing required fields (title, description, location)" });
  }

  const newIssue: Issue = {
    id: `issue-${Date.now()}`,
    title,
    description,
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&q=80&w=600", // Default placeholder image
    mediaUrl: mediaUrl || imageUrl,
    mediaType: mediaType || "image",
    location,
    latitude: latitude ? Number(latitude) : undefined,
    longitude: longitude ? Number(longitude) : undefined,
    category: category || "Other",
    severity: severity || "Medium",
    summary: summary || description.substring(0, 100) + "...",
    suggestedDepartment: suggestedDepartment || "Municipal General Administration Department",
    priorityScore: priorityScore || 50,
    citizenAction: citizenAction || "Proceed with caution in the reported sector.",
    status: "Reported",
    verificationCount: 1, // Auto-verified by reporter
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    comments: [],
    createdBy: createdBy || "anonymous",
    createdByEmail: createdByEmail || null,
    createdByName: createdByName || null,
    createdByProvider: createdByProvider || "unknown",
    verifiedBy: verifiedBy || [],
    statusHistory: statusHistory || [],
  };

  issues.unshift(newIssue); // Put newest reports on top of the list
  res.status(201).json(newIssue);
});

// 4. POST - Verify an issue
app.post("/api/issues/:id/verify", (req, res) => {
  const index = issues.findIndex((i) => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const issue = issues[index];
  issue.verificationCount += 1;
  issue.updatedAt = new Date().toISOString();
  if (req.body?.verifier) {
    issue.verifiedBy = [...(issue.verifiedBy || []), req.body.verifier];
  }

  // Verification rule:
  // "Each issue has verificationCount. When verificationCount reaches 3, status becomes Community Verified unless already In Progress or Resolved."
  if (issue.verificationCount >= 3) {
    if (issue.status === "Reported") {
      issue.status = "Community Verified";
    }
  }

  res.json(issue);
});

// 5. POST - Update status (Admin)
app.post("/api/issues/:id/status", (req, res) => {
  const { status } = req.body;
  const index = issues.findIndex((i) => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const allowedStatuses: IssueStatus[] = ["Reported", "Community Verified", "In Progress", "Resolved", "Rejected"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status state" });
  }

  issues[index].status = status;
  if (req.body.statusHistory) {
    issues[index].statusHistory = req.body.statusHistory;
  }
  if (req.body.moderation) {
    issues[index].moderation = req.body.moderation;
  }
  issues[index].updatedAt = new Date().toISOString();
  res.json(issues[index]);
});

// 6. POST - Add comment
app.post("/api/issues/:id/comment", (req, res) => {
  const { author, text, authorUid } = req.body;
  if (!author || !text) {
    return res.status(400).json({ error: "Missing author or comment text" });
  }

  const index = issues.findIndex((i) => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const newComment: Comment = {
    id: `comment-${Date.now()}`,
    author,
    text,
    authorUid: authorUid || null,
    createdAt: new Date().toISOString(),
  };

  if (!issues[index].comments) {
    issues[index].comments = [];
  }
  issues[index].comments!.push(newComment);
  issues[index].updatedAt = new Date().toISOString();

  res.status(201).json(issues[index]);
});

// 7. POST - Reset Database
app.post("/api/issues/reset", (req, res) => {
  issues = getInitialSampleIssues();
  res.json({ message: "Demo database reset successful", issues });
});

// 8. POST - AI Analysis of reported issue using @google/genai (server-side)
app.post("/api/analyze", async (req, res) => {
  const { title, description, location, image, mediaType, analysisMode } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Missing title or description for analysis" });
  }

  const analysisStart = Date.now();
  const mode = analysisMode || "Best Quality";

  function isAuthError(err: any): boolean {
    const errMsg = (err?.message || String(err)).toUpperCase();
    return (
      errMsg.includes("401") ||
      errMsg.includes("403") ||
      errMsg.includes("PERMISSION_DENIED") ||
      errMsg.includes("API_KEY") ||
      errMsg.includes("API KEY") ||
      errMsg.includes("UNAUTHORIZED") ||
      errMsg.includes("INVALID_ARGUMENT") ||
      errMsg.includes("KEY_INVALID")
    );
  }

  function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Timeout of ${ms}ms exceeded for ${label}`));
      }, ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => {
      clearTimeout(timeoutId);
    });
  }

  // Handle Demo Safe option directly
  if (mode === "Demo Safe") {
    const fallbackData = fallbackHeuristicAnalysis(title, description);
    const duration = Date.now() - analysisStart;
    return res.json({
      analysis: fallbackData,
      isFallback: true,
      modelUsed: "heuristic-fallback",
      analysisMode: mode,
      analysisDurationMs: duration,
      errorCategory: "demo-safe",
    });
  }

  try {
    const ai = getGeminiClient();

    // If Gemini API is not configured, we gracefully return fallback data as per instructions
    if (!ai) {
      console.warn("GEMINI_API_KEY is not defined in backend environments. Serving smart heuristic analysis.");
      const fallbackData = fallbackHeuristicAnalysis(title, description);
      const duration = Date.now() - analysisStart;
      return res.json({
        analysis: fallbackData,
        isFallback: true,
        modelUsed: "heuristic-fallback",
        analysisMode: mode,
        analysisDurationMs: duration,
        errorCategory: "auth-error",
      });
    }

    console.log(`[Gemini API]: Starting analysis for "${title}" using mode ${mode}`);

    // Construct image part if provided and it's not a video (unless thumbnail is available)
    let imagePart: any = null;
    const isVideo = mediaType === "video" || (image && typeof image === "string" && (image.includes("/video/upload/") || image.endsWith(".mp4") || image.endsWith(".mov") || image.endsWith(".avi")));
    const isThumbnailAvailable = image && typeof image === "string" && (image.startsWith("data:image/") || image.includes("/image/upload/") || image.match(/\.(jpeg|jpg|gif|png|webp)/i));

    if (image && typeof image === "string") {
      if (isVideo && !isThumbnailAvailable) {
        console.log("[Gemini API]: Video detected without thumbnail. Skipping media part to analyze description + location only.");
      } else {
        if (image.startsWith("data:")) {
          const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            imagePart = {
              inlineData: {
                mimeType: matches[1],
                data: matches[2],
              },
            };
            console.log(`[Gemini API]: Built inlineData from base64 image.`);
          }
        } else if (image.startsWith("http://") || image.startsWith("https://")) {
          // Fetch and convert remote image to base64
          try {
            console.log(`[Gemini API]: Fetching remote image from URL: ${image}`);
            const imgRes = await fetch(image);
            if (imgRes.ok) {
              const buffer = await imgRes.arrayBuffer();
              const base64Data = Buffer.from(buffer).toString("base64");
              const contentType = imgRes.headers.get("content-type") || "image/jpeg";
              if (contentType.startsWith("image/")) {
                imagePart = {
                  inlineData: {
                    mimeType: contentType,
                    data: base64Data,
                  },
                };
                console.log(`[Gemini API]: Successfully converted remote image to base64 inlineData. Content-Type: ${contentType}`);
              } else {
                console.warn(`[Gemini API]: Fetched URL content is not an image (Content-Type: ${contentType}). Skipping.`);
              }
            } else {
              console.warn(`[Gemini API]: Failed to fetch remote image. HTTP Status: ${imgRes.status}`);
            }
          } catch (fetchErr: any) {
            console.error(`[Gemini API]: Error fetching remote image: ${fetchErr.message}`);
          }
        }
      }
    }

    const textPrompt = `Analyze this civic issue report and return a structured JSON analysis.
Report Title: ${title}
Report Description: ${description}
Location Context: ${location || "Not specified"}

You must analyze the photo (if provided) and the text details, and output a valid JSON containing:
1. title: A professional, polished title for the report.
2. category: Must be exactly one of: ["Road Damage", "Garbage", "Streetlight", "Water Leakage", "Drainage", "Road Blockage", "Other"]
3. severity: Must be exactly one of: ["Low", "Medium", "High", "Critical"]
4. summary: A clean, concise summary of the issue (maximum 2 sentences).
5. suggestedDepartment: The municipal/civic department best suited to handle this.
6. priorityScore: An integer priority rating between 0 (least urgent) and 100 (most urgent).
7. citizenAction: A clear, helpful safety advice or citizen caution for people near this issue.

Schema compliance is mandatory. Ensure the returned output strictly matches the specified format.`;

    const contents = imagePart
      ? { parts: [imagePart, { text: textPrompt }] }
      : { parts: [{ text: textPrompt }] };

    const config = {
      systemInstruction: "You are an AI civic coordinator for Beekn. Analyze reported road damage, trash pile, lighting, water leaks, and public hazards. Always produce valid, structured JSON output matching the requested schema.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Polished report title" },
          category: {
            type: Type.STRING,
            enum: ["Road Damage", "Garbage", "Streetlight", "Water Leakage", "Drainage", "Road Blockage", "Other"],
          },
          severity: {
            type: Type.STRING,
            enum: ["Low", "Medium", "High", "Critical"],
          },
          summary: { type: Type.STRING, description: "A concise 2-sentence summary" },
          suggestedDepartment: { type: Type.STRING, description: "Civic department name" },
          priorityScore: { type: Type.INTEGER, description: "Priority rating from 0 to 100" },
          citizenAction: { type: Type.STRING, description: "Recommended safety advice" },
        },
        required: ["title", "category", "severity", "summary", "suggestedDepartment", "priorityScore", "citizenAction"],
      },
    };

    let response: any = null;
    let successModel = "";
    let isFallback = false;
    let errorCategory: string | undefined = undefined;
    const errorsList: { model: string; error: string }[] = [];

    // Setup routing modes
    const modelsToTry = mode === "Fast" ? ["gemini-2.5-flash"] : ["gemini-3.5-flash", "gemini-2.5-flash"];

    for (const modelName of modelsToTry) {
      const timeElapsed = Date.now() - analysisStart;
      const totalRemaining = 25000 - timeElapsed;

      if (totalRemaining <= 0) {
        console.error(`[Gemini API]: Total analysis timeout of 25s exceeded before trying ${modelName}`);
        errorsList.push({ model: modelName, error: "Total timeout of 25s exceeded" });
        errorCategory = "timeout";
        break;
      }

      const currentTimeout = Math.min(15000, totalRemaining);

      try {
        console.log(`[Gemini API]: Attempting model: ${modelName} (timeout: ${currentTimeout}ms)`);
        
        const apiCall = ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: config,
        });

        response = await withTimeout(apiCall, currentTimeout, modelName);
        successModel = modelName;
        break; // Exit loop on success
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        console.error(`[Gemini API]: Failed on model ${modelName}: ${errMsg}`);
        errorsList.push({ model: modelName, error: errMsg });

        if (isAuthError(err)) {
          console.error(`[Gemini API]: Immediate authorization fallback triggered. Retries cancelled.`);
          errorCategory = "auth-error";
          break; // Fallback immediately
        }

        if (errMsg.includes("Timeout of")) {
          errorCategory = "timeout";
        } else {
          errorCategory = "api-error";
        }
      }
    }

    let parsedAnalysis: GeminiAnalysis;
    if (response && successModel) {
      const resultText = response.text;
      if (!resultText) {
        throw new Error("Empty response from AI client");
      }
      parsedAnalysis = JSON.parse(resultText.trim());
      isFallback = false;
    } else {
      console.warn(`[Gemini API]: All models failed or timed out. Falling back to heuristic generator.`);
      isFallback = true;
      successModel = "heuristic-fallback";
      if (!errorCategory) {
        errorCategory = "api-error";
      }
      parsedAnalysis = fallbackHeuristicAnalysis(title, description);
    }

    const duration = Date.now() - analysisStart;
    const responsePayload: any = {
      analysis: parsedAnalysis,
      isFallback,
      modelUsed: successModel,
      analysisMode: mode,
      analysisDurationMs: duration,
    };

    if (isFallback && errorCategory) {
      responsePayload.errorCategory = errorCategory;
    }

    return res.json(responsePayload);

  } catch (outerError: any) {
    const errMsg = outerError?.message || String(outerError);
    console.error(`[Gemini API]: Outer fallback catch-all block: ${errMsg}`);
    
    const fallbackData = fallbackHeuristicAnalysis(title, description);
    const duration = Date.now() - analysisStart;
    return res.json({
      analysis: fallbackData,
      isFallback: true,
      modelUsed: "heuristic-fallback",
      analysisMode: mode,
      analysisDurationMs: duration,
      errorCategory: isAuthError(outerError) ? "auth-error" : "api-error",
    });
  }
});

// Global error handler for /api routes to guarantee JSON response
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith("/api/")) {
    console.error("[Global API Error Handler]:", err);
    return res.status(err.status || err.statusCode || 500).json({
      error: err.message || "An unexpected server error occurred."
    });
  }
  next(err);
});

// Configure Vite or production static file serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Beekn Server] Civic Operations backend running on http://localhost:${PORT}`);
  });
}

startServer();
