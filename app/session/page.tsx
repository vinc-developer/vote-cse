"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/lib/hooks";
import { castVote } from "@/lib/db";
import type { VoteChoice } from "@/lib/types";

type VoteStep = "loading" | "voting" | "already-voted" | "success" | "full" | "error";

export default function VotePage() {
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
      <VotePageContent />
    </Suspense>
  );
}

function VotePageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("id") || "";
  const { session, loading: sessionLoading } = useSession(sessionId);

  const [step, setStep] = useState<VoteStep>("loading");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Vérifier si déjà voté via localStorage
  useEffect(() => {
    if (sessionLoading || !session) return;
    const voted = localStorage.getItem(`voted_${sessionId}`);
    if (voted) {
      setStep("already-voted");
    } else if (session.status === "closed" || session.currentVotes >= session.voterCount) {
      setStep("full");
    } else {
      setStep("voting");
    }
  }, [sessionLoading, session, sessionId]);

  const handleVote = async (choice: VoteChoice) => {
    setError("");
    setSubmitting(true);

    try {
      const result = await castVote(sessionId, choice);

      if (!result.success) {
        setStep("full");
        setSubmitting(false);
        return;
      }

      // Marquer comme voté dans localStorage
      localStorage.setItem(`voted_${sessionId}`, Date.now().toString());
      setStep("success");
    } catch (err) {
      setError("Erreur lors de l'enregistrement du vote.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="text-center py-5">
        <div className="display-1 mb-3">⚠️</div>
        <h2>Aucune session sélectionnée</h2>
        <a href="/vote-cse/" className="btn btn-primary mt-3">
          Retour à l&apos;accueil
        </a>
      </div>
    );
  }

  if (sessionLoading || step === "loading") {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-5">
        <div className="display-1 mb-3">❌</div>
        <h2>Session introuvable</h2>
        <a href="/vote-cse/" className="btn btn-primary mt-3">
          Retour à l&apos;accueil
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-4">
        <h1 className="h3">{session.title}</h1>
        <span className={`badge ${session.status === "open" ? "bg-success" : "bg-secondary"} me-2`}>
          {session.status === "open" ? "Session ouverte" : "Session fermée"}
        </span>
        <span className="badge badge-cse">
          Code : {session.sessionCode}
        </span>
      </div>

      {/* Barre de participation */}
      <div className="row justify-content-center mb-4">
        <div className="col-md-8 col-lg-6">
          <div className="card bg-light">
            <div className="card-body text-center py-2">
              <small className="text-muted">
                Participation : <strong>{session.currentVotes}</strong> / {session.voterCount} votes
              </small>
              <div className="progress mt-2" style={{ height: "6px" }}>
                <div
                  className="progress-bar progress-bar-cse"
                  style={{
                    width: `${(session.currentVotes / session.voterCount) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Étape : Vote */}
      {step === "voting" && (
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-sm">
              <div className="card-body p-4">
                <h5 className="card-title text-center mb-4">
                  Exprimez votre vote
                </h5>
                {error && (
                  <div className="alert alert-danger text-center">{error}</div>
                )}
                <div className="d-grid gap-3">
                  <button
                    className="btn btn-success btn-lg py-3"
                    onClick={() => handleVote("favorable")}
                    disabled={submitting}
                  >
                    ✅ Favorable
                  </button>
                  <button
                    className="btn btn-danger btn-lg py-3"
                    onClick={() => handleVote("defavorable")}
                    disabled={submitting}
                  >
                    ❌ Défavorable
                  </button>
                  <button
                    className="btn btn-warning btn-lg py-3"
                    onClick={() => handleVote("abstention")}
                    disabled={submitting}
                  >
                    ⚪ Abstention
                  </button>
                </div>
                {submitting && (
                  <div className="text-center mt-3">
                    <span className="spinner-border spinner-border-sm text-primary" />
                    <span className="ms-2">Enregistrement...</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-center mt-3">
              <small className="text-muted">
                🔒 Votre vote est totalement anonyme.
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Déjà voté */}
      {step === "already-voted" && (
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-sm border-info">
              <div className="card-body p-4 text-center">
                <div className="display-1 mb-3">✅</div>
                <h4 className="text-info">Vous avez déjà voté</h4>
                <p className="text-muted">
                  Votre vote a été enregistré pour cette session.
                </p>
                <a href="/vote-cse/" className="btn btn-outline-primary mt-2">
                  ← Retour à l&apos;accueil
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vote enregistré */}
      {step === "success" && (
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-sm border-success">
              <div className="card-body p-4 text-center">
                <div className="display-1 mb-3">✅</div>
                <h4 className="text-success">Vote enregistré !</h4>
                <p className="text-muted">
                  Merci de votre participation. Votre vote est anonyme.
                </p>
                <a href="/vote-cse/" className="btn btn-outline-primary mt-2">
                  ← Retour à l&apos;accueil
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session pleine / fermée */}
      {step === "full" && (
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-sm border-secondary">
              <div className="card-body p-4 text-center">
                <div className="display-1 mb-3">🔒</div>
                <h4 className="text-secondary">Vote terminé</h4>
                <p className="text-muted">
                  Tous les votes ont été enregistrés ou la session a été fermée.
                </p>
                <a href="/vote-cse/" className="btn btn-outline-primary mt-2">
                  ← Retour à l&apos;accueil
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
