// src/features/focus-sheet/focus-sheet.service.ts
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/shared/lib/firebase";
import { useAuthStore } from "@/features/auth/auth.store";
import type { FocusSession } from "./focus-sheet.store";

// Helper to get the current user's ID
const getCurrentUserId = (): string => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("User not authenticated");
  return user.uid;
};

// Helper to get a reference to the user's sessions collection
const getSessionsCollectionRef = () => {
  const uid = getCurrentUserId();
  return collection(db, "users", uid, "sessions");
};

// Helper to convert Firestore Timestamps to JS Date objects
const mapFirestoreDocToSession = (doc: any): FocusSession => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    date: (data.date as Timestamp).toDate(),
  };
};

export const focusSheetService = {
  /**
   * Sets up a real-time listener for the user's sessions.
   * @param onDataChange Callback function that receives the updated list of sessions.
   * @returns An unsubscribe function to clean up the listener.
   */
  subscribeToSessions(onDataChange: (sessions: FocusSession[]) => void) {
    const sessionsCollection = getSessionsCollectionRef();
    const q = query(sessionsCollection, orderBy("date", "desc"), orderBy("startTime", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const sessions = querySnapshot.docs.map(mapFirestoreDocToSession);
      onDataChange(sessions);
    }, (error) => {
      console.error("[FocusSheetService] Failed to subscribe to sessions:", error);
    });

    return unsubscribe;
  },

  async add(newSession: Omit<FocusSession, "id">): Promise<string> {
    const sessionsCollection = getSessionsCollectionRef();
    const docRef = await addDoc(sessionsCollection, {
      ...newSession,
      date: Timestamp.fromDate(newSession.date),
    });
    return docRef.id;
  },
  
  async update(updatedSession: FocusSession): Promise<void> {
    const sessionDocRef = doc(getSessionsCollectionRef(), updatedSession.id);
    await updateDoc(sessionDocRef, {
      ...updatedSession,
      id: updatedSession.id, // Ensure ID is not part of the update payload
      date: Timestamp.fromDate(updatedSession.date),
    });
  },
  
  async remove(id: string): Promise<void> {
    const sessionDocRef = doc(getSessionsCollectionRef(), id);
    await deleteDoc(sessionDocRef);
  },

  async clearAndImportAll(sessions: FocusSession[]): Promise<void> {
    console.log(`[FocusSheetService] Clearing and importing ${sessions.length} sessions.`);
    const sessionsCollection = getSessionsCollectionRef();
    
    // 1. Delete all existing documents
    const existingDocs = await getDocs(query(sessionsCollection));
    const deleteBatch = writeBatch(db);
    existingDocs.forEach(doc => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
    
    // 2. Import new documents
    if (sessions.length > 0) {
        const importBatch = writeBatch(db);
        sessions.forEach(session => {
            const docRef = doc(sessionsCollection, session.id); // Use the original ID
            importBatch.set(docRef, {
                ...session,
                date: Timestamp.fromDate(session.date),
            });
        });
        await importBatch.commit();
    }
  },
};