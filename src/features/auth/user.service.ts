// src/features/auth/user.service.ts
import {
  collection,
  query,
  getDocs,
  writeBatch,
  doc,
  CollectionReference,
} from "firebase/firestore";
import { db } from "@/shared/lib/firebase";
import { useAuthStore } from "./auth.store";

/**
 * Deletes all documents in a given collection in batches of 500.
 * @param collectionRef The collection reference to delete documents from.
 */
async function deleteCollection(collectionRef: CollectionReference) {
  const q = query(collectionRef);
  const querySnapshot = await getDocs(q);

  if (querySnapshot.size === 0) {
    console.log(`No documents found in ${collectionRef.path}. Nothing to delete.`);
    return; // Nothing to do
  }

  console.log(`Preparing to delete ${querySnapshot.size} documents from ${collectionRef.path}...`);

  // Firestore allows up to 500 operations in a single batch
  const batchSize = 500;
  let batch = writeBatch(db);
  let count = 0;

  for (const document of querySnapshot.docs) {
    batch.delete(doc(db, collectionRef.path, document.id));
    count++;
    if (count === batchSize) {
      // Commit the batch and start a new one
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }

  // Commit the final batch if it has any operations
  if (count > 0) {
    await batch.commit();
  }

  console.log(`Successfully deleted all documents from ${collectionRef.path}.`);
}

export const userService = {
  /**
   * Deletes all data (todos and sessions) for the currently authenticated user.
   */
  async deleteAllUserData(): Promise<void> {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error("User not authenticated. Cannot delete data.");
    }

    console.log(`Starting data deletion for user: ${user.uid}`);

    const todosRef = collection(db, "users", user.uid, "todos");
    const sessionsRef = collection(db, "users", user.uid, "sessions");

    // We can run these in parallel for efficiency
    await Promise.all([
      deleteCollection(todosRef),
      deleteCollection(sessionsRef),
    ]);

    console.log(`All data for user ${user.uid} has been deleted.`);
  },
};