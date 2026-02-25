/**
 * Module d'authentification Firebase pour les administrateurs.
 */

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebase";

/**
 * Connexion administrateur par email/mot de passe.
 */
export async function loginAdmin(
  email: string,
  password: string
): Promise<User> {
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return credential.user;
}

/**
 * Déconnexion administrateur.
 */
export async function logoutAdmin(): Promise<void> {
  await signOut(getFirebaseAuth());
}

/**
 * Écoute les changements d'état d'authentification.
 */
export function onAuthChange(
  callback: (user: User | null) => void
): () => void {
  return firebaseOnAuthStateChanged(getFirebaseAuth(), callback);
}
