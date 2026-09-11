/**
 * Firebase SDK v10+ modular initialization.
 *
 * Replace the placeholder values below with your actual Firebase project config.
 * You can find these in your Firebase Console → Project Settings → General.
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDskeXHjMMDx7zXEH6b8Z-UvDAvOJLL6t0",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "messwise-os.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "messwise-os",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "messwise-os.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "57089215957",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:57089215957:web:76f5e1d30a7ba1aa95815c",
  measurementId: "G-JTFFE2QLP5"
};

// Initialize Firebase (prevent re-initialization in dev hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true }, "default");
export const storage = getStorage(app);
export default app;
