import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vote CSE - Comité Social et Économique",
  description: "Application de vote anonyme pour le CSE",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          href="/bootstrap/css/bootstrap.min.css"
        />
        <link
          rel="stylesheet"
          href="/css/cse-theme.css"
        />
      </head>
      <body>
        <nav className="navbar navbar-expand-lg navbar-cse mb-4">
          <div className="container">
            <a className="navbar-brand fw-bold" href="/">
              🗳️ Vote CSE
            </a>
            <div className="navbar-nav ms-auto">
              <a className="nav-link" href="/">
                Voter
              </a>
              <a className="nav-link" href="/admin/">
                Administration
              </a>
            </div>
          </div>
        </nav>
        <main className="container pb-5">{children}</main>
        <footer className="footer-cse bg-light py-3 mt-5">
          <div className="container text-center text-muted">
            <small>
              Vote CSE — Application de vote anonyme &copy;{" "}
              {new Date().getFullYear()}
            </small>
          </div>
        </footer>
        <script
          src="/bootstrap/js/bootstrap.bundle.min.js"
          defer
        />
      </body>
    </html>
  );
}
