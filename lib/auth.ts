/**
 * Module d'authentification Firebase pour les administrateurs.
 */

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

/**
 * Connexion administrateur par email/mot de passe.
 */
export async function loginAdmin(
  email: string,
  password: string
): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/**
 * Déconnexion administrateur.
 */
export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

/**
 * Écoute les changements d'état d'authentification.
 */
export function onAuthChange(
  callback: (user: User | null) => void
): () => void {
  return firebaseOnAuthStateChanged(auth, callback);
}
