/**
 * Generic real-time Firestore hooks for the admin dashboard.
 * Uses onSnapshot for live data synchronization.
 */

"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  query,
  onSnapshot,
  type Query,
  type DocumentData,
  type QueryConstraint,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "./firebase";

// ── Types ──────────────────────────────────────────────────────────────────

export interface FirestoreState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

// ── useCollection ──────────────────────────────────────────────────────────

/**
 * Subscribe to a Firestore collection query in real-time.
 *
 * @param collectionPath - Firestore collection path (e.g., "mess_menu")
 * @param constraints - Optional query constraints (where, orderBy, limit)
 * @returns { data, loading, error }
 *
 * @example
 * const { data: menus, loading } = useCollection<MessMenu>("mess_menu", [
 *   where("date", "==", "2026-09-11"),
 *   orderBy("mealType")
 * ]);
 */
export function useCollection<T = DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[] = []
): FirestoreState<T[]> {
  const [state, setState] = useState<FirestoreState<T[]>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const collRef = collection(db, collectionPath);
    const q: Query<DocumentData> =
      constraints.length > 0 ? query(collRef, ...constraints) : query(collRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setState({ data: items, loading: false, error: null });
      },
      (error) => {
        console.error(`Firestore error [${collectionPath}]:`, error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionPath, JSON.stringify(constraints.map((c) => c.type))]);

  return state;
}

// ── useDocument ────────────────────────────────────────────────────────────

/**
 * Subscribe to a single Firestore document in real-time.
 *
 * @param collectionPath - Firestore collection path
 * @param documentId - Document ID
 * @returns { data, loading, error }
 *
 * @example
 * const { data: crowd } = useDocument<CrowdMetrics>("mess_crowd_metrics", "main_mess");
 */
export function useDocument<T = DocumentData>(
  collectionPath: string,
  documentId: string | null
): FirestoreState<T | null> {
  const [state, setState] = useState<FirestoreState<T | null>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!documentId) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const docRef: DocumentReference = doc(db, collectionPath, documentId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setState({
            data: { id: snapshot.id, ...snapshot.data() } as T,
            loading: false,
            error: null,
          });
        } else {
          setState({ data: null, loading: false, error: null });
        }
      },
      (error) => {
        console.error(`Firestore doc error [${collectionPath}/${documentId}]:`, error);
        setState({ data: null, loading: false, error: error.message });
      }
    );

    return () => unsubscribe();
  }, [collectionPath, documentId]);

  return state;
}
