/**
 * Couche d'accès à Firebase Realtime Database.
 * Sessions, votes, codes de session.
 */

import {
  ref,
  push,
  set,
  get,
  update,
  remove,
  onValue,
  off,
  runTransaction,
} from "firebase/database";
import { database } from "./firebase";
import type {
  Session,
  Vote,
  VoteChoice,
  VoteResults,
} from "./types";

// ========================
// SESSIONS
// ========================

/**
 * Crée une nouvelle session de vote.
 */
export async function createSession(
  title: string,
  voterCount: number,
  adminEmail: string,
  sessionCode: string
): Promise<string> {
  const sessionsRef = ref(database, "sessions");
  const newRef = push(sessionsRef);
  const session: Session = {
    title,
    status: "open",
    sessionCode,
    voterCount,
    currentVotes: 0,
    adminEmail,
    createdAt: Date.now(),
    closedAt: null,
  };
  await set(newRef, session);

  // Enregistrer le code dans un index pour garantir l'unicité
  const codeRef = ref(database, `sessionCodes/${sessionCode}`);
  await set(codeRef, newRef.key);

  return newRef.key!;
}

/**
 * Vérifie si un code de session existe déjà.
 */
export async function isSessionCodeTaken(code: string): Promise<boolean> {
  const codeRef = ref(database, `sessionCodes/${code}`);
  const snapshot = await get(codeRef);
  return snapshot.exists();
}

/**
 * Trouve une session par son code.
 */
export async function findSessionByCode(
  code: string
): Promise<Session | null> {
  const codeRef = ref(database, `sessionCodes/${code}`);
  const codeSnapshot = await get(codeRef);
  if (!codeSnapshot.exists()) return null;

  const sessionId = codeSnapshot.val() as string;
  const sessionRef = ref(database, `sessions/${sessionId}`);
  const sessionSnapshot = await get(sessionRef);
  if (!sessionSnapshot.exists()) return null;

  return { ...sessionSnapshot.val(), id: sessionId } as Session;
}

/**
 * Récupère une session par son ID.
 */
export async function getSession(
  sessionId: string
): Promise<Session | null> {
  const sessionRef = ref(database, `sessions/${sessionId}`);
  const snapshot = await get(sessionRef);
  if (!snapshot.exists()) return null;
  return { ...snapshot.val(), id: sessionId } as Session;
}

/**
 * Liste toutes les sessions.
 */
export async function listSessions(): Promise<Session[]> {
  const sessionsRef = ref(database, "sessions");
  const snapshot = await get(sessionsRef);
  if (!snapshot.exists()) return [];

  const sessions: Session[] = [];
  snapshot.forEach((child) => {
    sessions.push({ ...child.val(), id: child.key } as Session);
  });
  return sessions.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Ferme une session de vote.
 */
export async function closeSession(sessionId: string): Promise<void> {
  const sessionRef = ref(database, `sessions/${sessionId}`);
  await update(sessionRef, {
    status: "closed",
    closedAt: Date.now(),
  });
}

/**
 * Supprime une session et ses votes associés.
 */
export async function deleteSession(sessionId: string): Promise<void> {
  // Récupérer le code de session pour nettoyer l'index
  const session = await getSession(sessionId);
  if (session?.sessionCode) {
    const codeRef = ref(database, `sessionCodes/${session.sessionCode}`);
    await remove(codeRef);
  }

  // Supprimer les votes
  const votesRef = ref(database, `votes/${sessionId}`);
  await remove(votesRef);

  // Supprimer la session
  const sessionRef = ref(database, `sessions/${sessionId}`);
  await remove(sessionRef);
}

/**
 * S'abonne aux changements d'une session (temps réel).
 */
export function subscribeToSession(
  sessionId: string,
  callback: (session: Session | null) => void
): () => void {
  const sessionRef = ref(database, `sessions/${sessionId}`);
  const listener = onValue(sessionRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback({ ...snapshot.val(), id: sessionId } as Session);
  });

  return () => off(sessionRef, "value", listener);
}

// ========================
// VOTES
// ========================

/**
 * Enregistre un vote anonyme et incrémente le compteur.
 * Auto-ferme la session si tous les votants ont voté.
 */
export async function castVote(
  sessionId: string,
  choice: VoteChoice
): Promise<{ success: boolean; alreadyFull: boolean }> {
  const sessionRef = ref(database, `sessions/${sessionId}`);

  // Transaction atomique pour incrémenter currentVotes
  let alreadyFull = false;
  const result = await runTransaction(sessionRef, (currentData) => {
    if (currentData === null) return currentData;

    if (currentData.status === "closed" || currentData.currentVotes >= currentData.voterCount) {
      alreadyFull = true;
      return; // Annuler la transaction
    }

    currentData.currentVotes = (currentData.currentVotes || 0) + 1;

    // Auto-fermer si tous les votes sont enregistrés
    if (currentData.currentVotes >= currentData.voterCount) {
      currentData.status = "closed";
      currentData.closedAt = Date.now();
    }

    return currentData;
  });

  if (alreadyFull || !result.committed) {
    return { success: false, alreadyFull: true };
  }

  // Enregistrer le vote anonyme (opération SÉPARÉE — aucun lien avec l'utilisateur)
  const votesRef = ref(database, `votes/${sessionId}`);
  const newVoteRef = push(votesRef);
  const vote: Vote = {
    choice,
    createdAt: Date.now(),
  };
  await set(newVoteRef, vote);

  return { success: true, alreadyFull: false };
}

/**
 * S'abonne aux résultats des votes en temps réel.
 */
export function subscribeToVotes(
  sessionId: string,
  callback: (results: VoteResults) => void
): () => void {
  const votesRef = ref(database, `votes/${sessionId}`);
  const listener = onValue(votesRef, (snapshot) => {
    const results: VoteResults = {
      favorable: 0,
      defavorable: 0,
      abstention: 0,
      total: 0,
    };

    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const vote = child.val() as Vote;
        if (vote.choice in results) {
          results[vote.choice as keyof Omit<VoteResults, "total">]++;
        }
        results.total++;
      });
    }

    callback(results);
  });

  return () => off(votesRef, "value", listener);
}
