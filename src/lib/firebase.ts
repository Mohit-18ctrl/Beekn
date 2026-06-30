import { initializeApp, getApps, getApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  writeBatch,
} from "firebase/firestore";

let firebaseApp: any = null;
let auth: any = null;
let db: any = null;
let isFirebaseAvailable = false;

export async function initFirebase(config?: any) {
  if (isFirebaseAvailable && db) {
    return { auth, db, isAvailable: true };
  }

  try {
    const metaEnv = (import.meta as any).env || {};
    const finalConfig = config || {
      apiKey: metaEnv.VITE_FIREBASE_API_KEY,
      authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
      storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: metaEnv.VITE_FIREBASE_APP_ID,
      firestoreDatabaseId: metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
    };

    // Fallback to fetch config from backend if local environments are missing
    if (!finalConfig.apiKey || !finalConfig.projectId) {
      console.log("Firebase config not fully loaded from frontend environment. Requesting from app config endpoint...");
      const res = await fetch("/api/firebase-config");
      if (res.ok) {
        const fetchedConfig = await res.json();
        Object.assign(finalConfig, fetchedConfig);
      }
    }

    if (!finalConfig.apiKey || !finalConfig.projectId) {
      throw new Error("Firebase configuration credentials not found");
    }

    firebaseApp = getApps().length === 0 ? initializeApp(finalConfig) : getApp();
    auth = getAuth(firebaseApp);
    await setPersistence(auth, browserLocalPersistence);

    // Some configurations provision custom named databases, otherwise fallback to default
    const dbId = finalConfig.firestoreDatabaseId || "(default)";
    db = getFirestore(firebaseApp, dbId);

    isFirebaseAvailable = true;
    return { auth, db, isAvailable: true };
  } catch (error) {
    console.warn("Firebase initialization bypass active. Seamlessly entering offline backup engine mode.", error);
    isFirebaseAvailable = false;
    return { auth: null, db: null, isAvailable: false };
  }
}

export function getFirebaseStatus() {
  return isFirebaseAvailable;
}

export { auth, db };
