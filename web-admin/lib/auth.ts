/**
 * Firebase Authentication utilities for the Admin panel.
 * Only ROLE_ADMIN users can access the dashboard.
 */

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  role: "ADMIN" | "STUDENT";
}

/**
 * Sign in with email and password, then verify ROLE_ADMIN.
 * Rejects if the user is not an admin.
 */
export async function adminLogin(
  email: string,
  password: string
): Promise<AdminUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  // Verify admin role in Firestore
  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) {
    await signOut(auth);
    throw new Error("User profile not found in database.");
  }

  const data = userDoc.data();
  if (data.role !== "ADMIN") {
    await signOut(auth);
    throw new Error("Access denied. Admin privileges required.");
  }

  return {
    uid,
    email: data.email || email,
    name: data.name || "Admin",
    role: data.role,
  };
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Fetch the admin user profile from Firestore.
 */
export async function getAdminProfile(
  uid: string
): Promise<AdminUser | null> {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) return null;

  const data = userDoc.data();
  if (data.role !== "ADMIN") return null;

  return {
    uid,
    email: data.email || "",
    name: data.name || "Admin",
    role: data.role,
  };
}

/**
 * Sign out the current admin.
 */
export async function adminLogout(): Promise<void> {
  await signOut(auth);
}
