'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

type PublicationState = 'idle' | 'running' | 'done' | 'failed' | 'unavailable'

type Publication = {
  state: PublicationState
  startedAt?: string
  endedAt?: string
  error?: string
  output?: string
}

const formatDateTime = (iso?: string): string => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(d)
}

const TONE: Record<PublicationState, { border: string; background: string; text: string }> = {
  idle: { border: '#D1D5DB', background: '#F9FAFB', text: '#374151' },
  running: { border: '#93C5FD', background: '#EFF6FF', text: '#1D4ED8' },
  done: { border: '#86EFAC', background: '#ECFDF5', text: '#15803D' },
  failed: { border: '#FCA5A5', background: '#FEF2F2', text: '#B91C1C' },
  unavailable: { border: '#D1D5DB', background: '#F9FAFB', text: '#6B7280' },
}

/** While a publication runs, poll often enough to feel live without hammering. */
const POLL_MS = 3000

/**
 * Publish the public site, and say where that publication stands.
 *
 * The distinction this screen exists to make: saving a page marks it published
 * *in the admin*, which is not the same as the visitor seeing it. The site is a
 * static snapshot, rebuilt and uploaded on demand — until that happens, a
 * published page is only published here.
 */
export const PublishSite: React.FC = () => {
  const [publication, setPublication] = useState<Publication>({ state: 'idle' })
  const [busy, setBusy] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/publication/state')
      if (!res.ok) return
      setPublication((await res.json()) as Publication)
    } catch {
      /* laissé tel quel : l'état affiché reste le dernier connu */
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Poll only while something is running, and stop as soon as it settles.
  useEffect(() => {
    if (publication.state !== 'running') return
    timer.current = setTimeout(() => void refresh(), POLL_MS)
    return () => clearTimeout(timer.current)
  }, [publication, refresh])

  const publish = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/publication/start', { method: 'POST' })
      setPublication((await res.json()) as Publication)
    } catch {
      setPublication({ state: 'failed', error: 'Serveur central injoignable.' })
    }
    setBusy(false)
  }

  const { state } = publication
  const tone = TONE[state] ?? TONE.idle

  if (state === 'unavailable') {
    return (
      <div style={{ ...box(TONE.unavailable) }}>
        <strong style={{ color: TONE.unavailable.text }}>Publication non disponible ici</strong>
        <p style={note}>
          Cette instance n’est pas rattachée au serveur de l’agence. La mise en ligne se fait
          depuis celui-ci.
        </p>
      </div>
    )
  }

  return (
    <div style={box(tone)}>
      <strong style={{ color: tone.text }}>
        {state === 'running' ? 'Publication en cours…' : null}
        {state === 'done' ? 'Site en ligne' : null}
        {state === 'failed' ? 'La publication a échoué' : null}
        {state === 'idle' ? 'Mettre le site en ligne' : null}
      </strong>

      <p style={note}>
        {state === 'running' ? (
          <>Le site est en cours de fabrication puis d’envoi. Cela prend une à deux minutes.</>
        ) : null}
        {state === 'done' ? (
          <>
            Dernière mise en ligne le {formatDateTime(publication.endedAt)}. Vos dernières
            modifications sont visibles par vos visiteurs.
          </>
        ) : null}
        {state === 'failed' ? (
          <>
            Vos contenus sont intacts : rien n’a été perdu. Le site en ligne reste celui de la
            publication précédente. Prévenez votre prestataire si le problème persiste.
          </>
        ) : null}
        {state === 'idle' ? (
          <>
            Enregistrer une page ne la met pas en ligne. Cliquez ci-dessous pour envoyer vos
            modifications sur votre site public.
          </>
        ) : null}
      </p>

      {state === 'failed' && publication.error ? (
        <p style={{ ...note, color: '#B91C1C' }}>{publication.error}</p>
      ) : null}

      {state === 'failed' && publication.output ? (
        <details style={{ marginTop: '0.5rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: '#4B5563' }}>
            Détails techniques
          </summary>
          <pre
            style={{
              marginTop: '0.4rem',
              padding: '0.5rem',
              background: '#111827',
              color: '#E5E7EB',
              borderRadius: 6,
              fontSize: '0.72rem',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {publication.output}
          </pre>
        </details>
      ) : null}

      <button
        type="button"
        onClick={() => void publish()}
        disabled={busy || state === 'running'}
        style={{
          marginTop: '0.75rem',
          padding: '0.5rem 1rem',
          borderRadius: 6,
          border: 'none',
          background: busy || state === 'running' ? '#9CA3AF' : '#1D4ED8',
          color: '#fff',
          fontWeight: 600,
          cursor: busy || state === 'running' ? 'default' : 'pointer',
        }}
      >
        {state === 'running' ? 'Publication en cours…' : 'Publier mon site'}
      </button>
    </div>
  )
}

const box = (tone: { border: string; background: string }): React.CSSProperties => ({
  margin: '0.25rem 0 1rem',
  padding: '0.75rem 0.9rem',
  borderRadius: 8,
  border: `1px solid ${tone.border}`,
  background: tone.background,
})

const note: React.CSSProperties = {
  fontSize: '0.82rem',
  color: '#4B5563',
  margin: '0.35rem 0 0',
}
