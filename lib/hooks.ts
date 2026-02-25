/**
 * Hooks React personnalisés pour l'application de vote CSE.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { User } from "firebase/auth";
import type { Session, VoteResults } from "./types";
import {
  subscribeToSession,
  subscribeToVotes,
  listSessions,
} from "./db";
import { onAuthChange } from "./auth";

/**
 * Hook pour l'authentification admin.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading };
}

/**
 * Hook pour s'abonner à une session en temps réel.
 */
export function useSession(sessionId: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToSession(sessionId, (data) => {
      setSession(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [sessionId]);

  return { session, loading };
}

/**
 * Hook pour s'abonner aux résultats de vote en temps réel.
 */
export function useVoteResults(sessionId: string) {
  const [results, setResults] = useState<VoteResults>({
    favorable: 0,
    defavorable: 0,
    abstention: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToVotes(sessionId, (data) => {
      setResults(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [sessionId]);

  return { results, loading };
}

/**
 * Hook pour charger la liste des sessions.
 */
export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listSessions();
      setSessions(data);
    } catch (error) {
      console.error("Erreur chargement sessions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sessions, loading, refresh };
}
