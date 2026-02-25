"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth, useSession, useVoteResults } from "@/lib/hooks";
import { loginAdmin } from "@/lib/auth";

function ResultBar({
  label,
  count,
  total,
  colorClass,
}: {
  label: string;
  count: number;
  total: number;
  colorClass: string;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-end mb-1">
        <span className="fw-semibold">{label}</span>
        <span className="text-muted">
          {count} vote{count > 1 ? "s" : ""} ({percentage}%)
        </span>
      </div>
      <div className="progress" style={{ height: "32px" }}>
        <div
          className={`progress-bar ${colorClass}`}
          style={{
            width: `${percentage}%`,
            transition: "width 0.5s ease-in-out",
          }}
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {percentage > 10 && `${percentage}%`}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-5">
          <div className="spinner-border text-primary">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      }
    >
      <ResultsPageContent />
    </Suspense>
  );
}

function ResultsPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("id") || "";
  const { user, loading: authLoading } = useAuth();
  const { session, loading: sessionLoading } = useSession(sessionId);
  const { results, loading: resultsLoading } = useVoteResults(sessionId);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      await loginAdmin(email, password);
    } catch {
      setLoginError("Email ou mot de passe incorrect.");
    } finally {
      setLoginLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  // Si non connecté, afficher le formulaire de connexion
  if (!user) {
    return (
      <div className="row justify-content-center py-5">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header bg-warning text-center">
              <h5 className="mb-0">🔒 Accès administrateur requis</h5>
            </div>
            <div className="card-body p-4">
              <p className="text-muted small text-center">
                Les résultats sont réservés aux administrateurs.
              </p>
              {loginError && (
                <div className="alert alert-danger small">{loginError}</div>
              )}
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Email administrateur"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loginLoading}
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginLoading}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loginLoading}
                >
                  {loginLoading ? "Connexion..." : "Se connecter"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="text-center py-5">
        <div className="display-1 mb-3">⚠️</div>
        <h2>Aucune session sélectionnée</h2>
        <a href="/vote-cse/admin/" className="btn btn-primary mt-3">
          Retour à l&apos;administration
        </a>
      </div>
    );
  }

  if (sessionLoading || resultsLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-2 text-muted">Chargement des résultats...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-5">
        <div className="display-1 mb-3">❌</div>
        <h2>Session introuvable</h2>
        <a href="/vote-cse/admin/" className="btn btn-primary mt-3">
          Retour à l&apos;administration
        </a>
      </div>
    );
  }

  const isOpen = session.status === "open";

  return (
    <>
      <div className="text-center mb-4">
        <h1 className="h3">📊 Résultats : {session.title}</h1>
        <span className={`badge ${isOpen ? "bg-success" : "bg-secondary"} me-2`}>
          {isOpen ? "Session ouverte" : "Session fermée"}
        </span>
        <span className="badge bg-info">Code : {session.sessionCode}</span>
      </div>

      {/* Statistiques */}
      <div className="row justify-content-center mb-4">
        <div className="col-md-10 col-lg-8">
          <div className="row g-3">
            <div className="col-4">
              <div className="card text-center bg-light">
                <div className="card-body py-3">
                  <div className="h2 mb-0 text-primary">{results.total}</div>
                  <small className="text-muted">Votes exprimés</small>
                </div>
              </div>
            </div>
            <div className="col-4">
              <div className="card text-center bg-light">
                <div className="card-body py-3">
                  <div className="h2 mb-0 text-info">{session.voterCount}</div>
                  <small className="text-muted">Votants attendus</small>
                </div>
              </div>
            </div>
            <div className="col-4">
              <div className="card text-center bg-light">
                <div className="card-body py-3">
                  <div className="h2 mb-0 text-success">
                    {session.voterCount > 0
                      ? Math.round((session.currentVotes / session.voterCount) * 100)
                      : 0}%
                  </div>
                  <small className="text-muted">Participation</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barres de résultats */}
      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              {results.total === 0 ? (
                <div className="text-center py-4 text-muted">
                  <div className="display-4 mb-3">🕐</div>
                  <p>Aucun vote enregistré pour le moment.</p>
                </div>
              ) : (
                <>
                  <ResultBar
                    label="✅ Favorable"
                    count={results.favorable}
                    total={results.total}
                    colorClass="bg-success"
                  />
                  <ResultBar
                    label="❌ Défavorable"
                    count={results.defavorable}
                    total={results.total}
                    colorClass="bg-danger"
                  />
                  <ResultBar
                    label="⚪ Abstention"
                    count={results.abstention}
                    total={results.total}
                    colorClass="bg-warning"
                  />
                </>
              )}
            </div>
          </div>

          {isOpen && (
            <div className="text-center mt-3">
              <small className="text-muted">
                🔄 Les résultats se mettent à jour en temps réel.
              </small>
            </div>
          )}

          <div className="text-center mt-4">
            <a href="/vote-cse/admin/" className="btn btn-outline-secondary">
              ← Retour à l&apos;administration
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
