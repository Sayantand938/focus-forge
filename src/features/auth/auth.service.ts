import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/shared/lib/firebase";
import type { User } from "./auth.store";

// Helper to map Firebase user to our app's user type
const mapFirebaseUserToAppUser = (firebaseUser: FirebaseUser | null): User | null => {
  if (!firebaseUser) return null;
  return {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName,
    email: firebaseUser.email,
  };
};

export const authService = {
  /**
   * Listens for real-time authentication state changes from Firebase.
   * This is the definitive way to know if a user is logged in.
   * @param callback A function that will be called with the user object or null.
   * @returns An unsubscribe function to clean up the listener.
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, (firebaseUser) => {
      const user = mapFirebaseUserToAppUser(firebaseUser);
      callback(user);
    });
  },

  /**
   * Signs up a new user with email, password, and a display name.
   */
  async signUp(name: string, email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // After creating the user, update their profile with the provided name.
    await updateProfile(userCredential.user, { displayName: name });
    return mapFirebaseUserToAppUser(userCredential.user)!;
  },

  /**
   * Signs in an existing user with their email and password.
   */
  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return mapFirebaseUserToAppUser(userCredential.user)!;
  },

  /**
   * Signs out the current user.
   */
  async logout(): Promise<void> {
    await signOut(auth);
  },
};