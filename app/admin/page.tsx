"use client";

import { useState } from "react";
import { useAuth, useSessions } from "@/lib/hooks";
import { createSession, closeSession, deleteSession, isSessionCodeTaken } from "@/lib/db";
import { loginAdmin, logoutAdmin } from "@/lib/auth";
import { generateSessionCode } from "@/lib/crypto";
import type { Session } from "@/lib/types";

// ========================
// LOGIN FORM
// ========================

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginAdmin(email, password);
    } catch {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center py-5">
      <div className="col-md-6 col-lg-4">
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white text-center">
            <h5 className="mb-0">🔒 Connexion administrateur</h5>
          </div>
          <div className="card-body p-4">
            {error && (
              <div className="alert alert-danger small">{error}</div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  placeholder="admin@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Mot de passe</label>
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading || !email || !password}
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================
// CREATE SESSION
// ========================

function CreateSessionForm({
  adminEmail,
  onCreated,
}: {
  adminEmail: string;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [voterCount, setVoterCount] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [createdCode, setCreatedCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || voterCount < 1) return;

    setSubmitting(true);
    setCreatedCode("");
    try {
      // Générer un code unique
      let code = generateSessionCode();
      let attempts = 0;
      while (await isSessionCodeTaken(code) && attempts < 10) {
        code = generateSessionCode();
        attempts++;
      }

      await createSession(title.trim(), voterCount, adminEmail, code);
      setCreatedCode(code);
      setTitle("");
      setVoterCount(10);
      onCreated();
    } catch (error) {
      console.error("Erreur création session:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">➕ Créer une session de vote</h5>
      </div>
      <div className="card-body">
        {createdCode && (
          <div className="alert alert-success">
            <strong>✅ Session créée !</strong> Communiquez ce code aux votants :
            <div className="text-center mt-2">
              <span className="badge bg-dark fs-4 font-monospace px-4 py-2">
                {createdCode}
              </span>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-8">
              <label htmlFor="sessionTitle" className="form-label">
                Titre de la session
              </label>
              <input
                type="text"
                id="sessionTitle"
                className="form-control"
                placeholder="Ex: Vote budget activités sociales 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="voterCount" className="form-label">
                Nombre de votants
              </label>
              <input
                type="number"
                id="voterCount"
                className="form-control"
                min={1}
                max={500}
                value={voterCount}
                onChange={(e) => setVoterCount(Number.parseInt(e.target.value) || 1)}
                disabled={submitting}
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary mt-3"
            disabled={submitting || !title.trim()}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Création...
              </>
            ) : (
              "Créer la session"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ========================
// SESSION MANAGEMENT
// ========================

function SessionManagement({
  sessions,
  onRefresh,
}: {
  sessions: Session[];
  onRefresh: () => void;
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleClose = async (sessionId: string) => {
    if (!confirm("Fermer cette session ? Les votes ne seront plus possibles.")) return;
    setActionLoading(sessionId);
    try {
      await closeSession(sessionId);
      onRefresh();
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm("⚠️ Supprimer cette session et tous ses votes ? Cette action est irréversible.")) return;
    setActionLoading(sessionId);
    try {
      await deleteSession(sessionId);
      onRefresh();
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-info text-white">
        <h5 className="mb-0">📋 Sessions de vote</h5>
      </div>
      <div className="card-body p-0">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-muted">
            Aucune session créée.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Titre</th>
                  <th>Code</th>
                  <th>Statut</th>
                  <th>Participation</th>
                  <th>Créée le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="fw-semibold">{session.title}</td>
                    <td>
                      <span className="badge bg-dark font-monospace">
                        {session.sessionCode}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          session.status === "open" ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {session.status === "open" ? "Ouvert" : "Fermé"}
                      </span>
                    </td>
                    <td>
                      {session.currentVotes}/{session.voterCount}
                      <div className="progress mt-1" style={{ height: "4px" }}>
                        <div
                          className="progress-bar bg-primary"
                          style={{
                            width: `${(session.currentVotes / session.voterCount) * 100}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="text-muted small">
                      {new Date(session.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <a
                          href={`/vote-cse/results/?id=${session.id}`}
                          className="btn btn-outline-primary btn-sm"
                          title="Résultats"
                        >
                          📊
                        </a>
                        {session.status === "open" && (
                          <button
                            className="btn btn-outline-warning btn-sm"
                            onClick={() => handleClose(session.id!)}
                            disabled={actionLoading === session.id}
                            title="Fermer"
                          >
                            🔒
                          </button>
                        )}
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(session.id!)}
                          disabled={actionLoading === session.id}
                          title="Supprimer"
                        >
                          {actionLoading === session.id ? (
                            <span className="spinner-border spinner-border-sm" />
                          ) : (
                            "🗑️"
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================
// ADMIN PAGE
// ========================

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { sessions, loading: sessionsLoading, refresh } = useSessions();

  if (authLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0">⚙️ Administration</h1>
          <small className="text-muted">Connecté : {user.email}</small>
        </div>
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={() => logoutAdmin()}
        >
          Se déconnecter
        </button>
      </div>

      {sessionsLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : (
        <>
          <CreateSessionForm adminEmail={user.email!} onCreated={refresh} />
          <SessionManagement sessions={sessions} onRefresh={refresh} />
        </>
      )}
    </>
  );
}
