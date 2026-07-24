import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page introuvable',
}

/**
 * App-wide 404. Self-contained (its own <html>/<body>) because the app has no
 * root layout — only per-group root layouts. Rendered on the server, so the
 * message is in the first HTML response (not streamed client-side), with a
 * single <h1> and a clear way back home.
 */
export default function NotFound() {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          color: '#1f2937',
          background: '#ffffff',
        }}
      >
        <main style={{ maxWidth: '32rem', padding: '0 1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, margin: 0 }}>Page introuvable</h1>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.6, marginTop: '1rem' }}>
            La page que vous cherchez n’existe pas ou a été déplacée.
          </p>
          <p style={{ marginTop: '1.5rem' }}>
            <a href="/" style={{ color: '#1d4ed8', fontWeight: 600 }}>
              Retour à l’accueil
            </a>
          </p>
        </main>
      </body>
    </html>
  )
}
