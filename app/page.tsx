"use client";

import { useState } from "react";
import { findSessionByCode } from "@/lib/db";

export default function HomePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Veuillez entrer un code de session.");
      return;
    }

    setLoading(true);
    try {
      const session = await findSessionByCode(trimmed);
      if (!session) {
        setError("Code de session invalide. Vérifiez et réessayez.");
        setLoading(false);
        return;
      }
      if (session.status === "closed") {
        setError("Cette session de vote est terminée.");
        setLoading(false);
        return;
      }
      // Rediriger vers la page de vote
      window.location.href = `/vote-cse/session/?id=${session.id}`;
    } catch (err) {
      setError("Erreur de connexion. Réessayez.");
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold">🗳️ Vote CSE</h1>
        <p className="lead text-muted">
          Système de vote anonyme pour le Comité Social et Économique
        </p>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h5 className="card-title text-center mb-3">
                Rejoindre une session de vote
              </h5>
              <p className="text-muted text-center small">
                Entrez le code de session fourni par votre administrateur.
              </p>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <input
                    type="text"
                    className={`form-control form-control-lg text-center text-uppercase font-monospace ${
                      error ? "is-invalid" : ""
                    }`}
                    placeholder="CSE-XXXX"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={loading}
                    autoFocus
                    maxLength={8}
                  />
                  {error && (
                    <div className="invalid-feedback text-center">
                      {error}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-cse btn-lg w-100"
                  disabled={loading || !code.trim()}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />{" "}
                      Recherche...
                    </>
                  ) : (
                    "Rejoindre la session"
                  )}
                </button>
              </form>
            </div>
          </div>
          <div className="text-center mt-3">
            <small className="text-muted">
              🔒 Votre vote sera totalement anonyme.
            </small>
          </div>
        </div>
      </div>
    </>
  );
}
