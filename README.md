<div align="center">

# 🔔 Beekn

### *Local issues, faster action.*

**A Gemini AI-powered civic issue reporting platform that connects citizens with local authorities to resolve community problems — faster, smarter, and more transparently.**

[![Built with Gemini](https://img.shields.io/badge/Built%20with-Gemini%20AI-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

[Live Demo](https://ai.studio/apps/86364b2e-7036-438a-bfa4-f86a96c5671b) · [View in AI Studio](https://ai.studio/apps/86364b2e-7036-438a-bfa4-f86a96c5671b)

<img width="1200" height="475" alt="Beekn Banner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />

</div>

---
# Beekn

Beekn(pronounced Beacon) is an AI-powered civic issue reporting and resolution platform built for the vibe2ship hackathon. It helps citizens report local civic problems clearly, helps administrators prioritize and resolve them, and uses gamification to encourage trustworthy civic participation.

## Problem

Civic issues like potholes, garbage overflow, water leakage, broken streetlights, and blocked drainage are often reported through fragmented or informal channels. Reports may be incomplete, duplicated, sent to the wrong department, or misused through fake submissions.

Beekn improves this flow with AI-assisted reporting, structured issue management, verification, moderation, and civic impact scoring.

## Solution

Citizens can submit reports with text, location, and media. Gemini analyzes each report and suggests the category, severity, responsible department, priority score, summary, and recommended citizen action. Admins can verify, resolve, reject, or moderate reports. Users earn civic impact points and badges for useful participation.

## 🧠 How Gemini AI Powers Beekn

Gemini isn't a bolt-on feature — it's the **core intelligence** that makes Beekn work. Here's how:

| Capability | How Gemini Is Used |
|---|---|
| **📸 Photo Analysis** | Citizens upload a photo of the issue. Gemini Vision analyzes the image to auto-detect the **category** (road damage, garbage, water leakage, etc.), **severity** (Low → Critical), and generates a structured **title + description**. |
| **🎯 Smart Priority Scoring** | Gemini assigns a priority score (0–100) based on visual severity, category urgency, and public safety risk — helping authorities triage effectively. |
| **🏛️ Department Routing** | Based on the analysis, Gemini auto-routes the report to the correct municipal department (Roads, Sanitation, Electricity, Water Supply, etc.). |
| **🛡️ Safety Tips** | For each report, Gemini generates contextual citizen safety tips (e.g., "Avoid walking near the open drain at night"). |
| **🔍 Duplicate Detection** | Before creating a new issue, Gemini compares the report against existing nearby issues to flag potential duplicates and reduce redundant reports. |

> **All AI analysis happens server-side** via the `@google/genai` SDK with structured JSON output schemas for reliable, type-safe responses.

---

## ✨ Key Features

### For Citizens
- 📷 **AI-Powered Reporting** — Snap a photo, and Gemini handles the rest (category, severity, title, description, department routing)
- 🗺️ **Interactive Map** — Browse issues near you on a GPS-enabled map with CartoDB tiles and real-time theme sync (light/dark)
- ✅ **Community Verification** — Verify issues you've witnessed to boost their credibility and priority
- 🏆 **Gamification** — Earn trust score, XP, and badges (First Report, Vigilant Verifier, Community Guardian, etc.) for active participation
- 📊 **Live Dashboard** — Track issue statistics, resolution rates, and your personal contribution metrics
- 🔎 **Smart Filtering** — Filter by status, category, proximity ("Near Me"), and search by keyword
- 📋 **My Reports** — Dedicated tab to track all issues you've personally reported
- ☁️ **Media Uploads** — Photo/video evidence uploaded to Cloudinary with preview support

### For Authorities (Admin Panel)
- 🎛️ **Issue Management** — Accept, update status (In Progress → Resolved), or reject reports with reason
- 📈 **Analytics Dashboard** — Aggregate views of issue volume, categories, resolution progress
- 🔀 **Role-Based Access** — Separate citizen and authority flows with department-scoped views

### Platform-Wide
- 🔐 **Google Authentication** — Secure sign-in via Firebase Auth with session recovery
- 🌗 **Dark/Light Mode** — Full theme support with smooth transitions across all components (including the map)
- 📱 **Mobile-First Design** — Native-feel mobile onboarding, bottom navigation, and responsive layouts
- 🎬 **Guided Demo Mode** — Floating walkthrough widget lets hackathon judges experience the full citizen → authority lifecycle in under 2 minutes

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React 19)               │
│  ┌──────────┬──────────┬──────────┬──────────┐      │
│  │Dashboard │Issue Feed│Report    │  Map     │      │
│  │          │+ Filters │Issue     │(Leaflet) │      │
│  └──────────┴──────────┴──────────┴──────────┘      │
│        Framer Motion  ·  Tailwind CSS v4             │
└──────────────────┬──────────────────────────────────┘
                   │ API Calls
┌──────────────────▼──────────────────────────────────┐
│              Backend (Express.js + TypeScript)        │
│  ┌──────────────────┐  ┌─────────────────────┐      │
│  │ Gemini AI Service │  │ Cloudinary Upload   │      │
│  │ @google/genai SDK │  │ (multer + streams)  │      │
│  └──────────────────┘  └─────────────────────┘      │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                Firebase Services                     │
│  ┌──────────────┐  ┌────────────────────────┐       │
│  │ Firestore DB │  │ Firebase Auth (Google)  │       │
│  └──────────────┘  └────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **AI** | Google Gemini AI (`@google/genai` SDK) — Vision analysis, structured JSON output |
| **Frontend** | React 19, TypeScript 5.8, Tailwind CSS v4, Framer Motion |
| **Backend** | Express.js, Node.js, TypeScript (tsx) |
| **Database** | Firebase Firestore (real-time NoSQL) |
| **Auth** | Firebase Authentication (Google Sign-In) |
| **Media** | Cloudinary (image/video upload & CDN delivery) |
| **Maps** | Leaflet.js with CartoDB tile layers (light + dark themes) |
| **Icons** | Lucide React |
| **Build** | Vite + esbuild |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A [Gemini API key](https://ai.google.dev/gemini-api/docs/api-key)
- A Firebase project with Firestore and Authentication enabled
- A Cloudinary account (for media uploads)

### Installation

```bash
# Clone the repository
git clone https://github.com/Mohit-18ctrl/Beekn.git
cd Beekn

# Install dependencies
npm install
```

### Environment Setup

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Firebase and Cloudinary configurations are set in the source files. For your own deployment, update:
- `src/firebase.ts` — Firebase project config
- `server.ts` — Cloudinary credentials

### Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Build for Production

```bash
npm run build
npm start
```

---

## 🎮 Demo Walkthrough

1. **Open the app** → You'll see the immersive landing page
2. **Sign in with Google** → Choose your role (Citizen or Authority)
3. **As a Citizen:**
   - Tap "Report Issue" → Upload a photo → Watch Gemini AI analyze it in real-time
   - Browse "Issues" → Verify reports from other citizens
   - Check "Dashboard" → See your trust score and badges
   - Open "Map" → View issues geographically
4. **Switch to Authority** (via the floating Demo Walkthrough widget):
   - Review incoming reports → Accept or reject with reasons
   - Update issue status (In Progress → Resolved)
   - Monitor resolution analytics

---

## 📁 Project Structure

```
├── src/
│   ├── App.tsx              # Main app shell, routing, state management
│   ├── components/
│   │   ├── LandingPage.tsx   # Immersive hero landing page
│   │   ├── Dashboard.tsx     # Stats, charts, gamification overview
│   │   ├── IssueFeed.tsx     # Filtered issue list with search & proximity
│   │   ├── IssueDetail.tsx   # Full issue view with comments & actions
│   │   ├── ReportIssue.tsx   # AI-powered issue reporting flow
│   │   ├── MapView.tsx       # Leaflet map with clustered markers
│   │   ├── AdminPanel.tsx    # Authority management dashboard
│   │   └── ui.tsx            # Reusable UI components & design system
│   ├── firebase.ts           # Firebase initialization & config
│   └── types.ts              # TypeScript type definitions
├── server.ts                 # Express backend (Gemini AI + Cloudinary)
├── index.html                # Entry HTML
└── package.json
```

---

## 🏆 Built For

**[Vibe-to-Ship Hackathon](https://googleai.devpost.com/)** by Google AI — June 2026

> *"Ship an AI-powered app that solves a real problem, built with Gemini."*

Beekn was built entirely during the hackathon using Google AI Studio as the development environment and Gemini AI as the core intelligence layer.

---

<div align="center">

**Made with ❤️ and Gemini AI**

</div>
