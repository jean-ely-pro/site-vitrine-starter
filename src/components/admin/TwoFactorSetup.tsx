'use client'

import React, { useState } from 'react'
import { useFormFields } from '@payloadcms/ui'

type Phase = 'idle' | 'scanning' | 'done'

const boxStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  padding: '1rem 1.25rem',
  margin: '0 0 1.5rem',
  background: '#FAFAFA',
}

const buttonStyle: React.CSSProperties = {
  padding: '0.55rem 1rem',
  borderRadius: 6,
  border: 'none',
  background: '#111827',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
}

const post = async (path: string, body?: unknown): Promise<Response> =>
  fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

export const TwoFactorSetup: React.FC = () => {
  const enabledInDoc = useFormFields(([fields]) => Boolean(fields?.twoFactorEnabled?.value))

  const [phase, setPhase] = useState<Phase>('idle')
  const [qr, setQr] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [locallyEnabled, setLocallyEnabled] = useState(false)

  const isEnabled = enabledInDoc || locallyEnabled

  const startSetup = async () => {
    setError(null)
    setBusy(true)
    try {
      const res = await post('/api/users/mfa/setup')
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { qrDataUrl: string }
      setQr(data.qrDataUrl)
      setPhase('scanning')
    } catch {
      setError('Impossible de démarrer l’activation. Enregistrez d’abord l’utilisateur, puis réessayez.')
    } finally {
      setBusy(false)
    }
  }

  const verify = async () => {
    setError(null)
    setBusy(true)
    try {
      const res = await post('/api/users/mfa/verify', { token: code })
      const data = (await res.json()) as { success?: boolean; backupCodes?: string[]; message?: string }
      if (!res.ok || !data.success) {
        setError(data.message || 'Code invalide.')
        return
      }
      setBackupCodes(data.backupCodes ?? [])
      setLocallyEnabled(true)
      setPhase('done')
    } catch {
      setError('Une erreur est survenue. Réessayez.')
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    setBusy(true)
    setError(null)
    try {
      await post('/api/users/mfa/disable')
      setLocallyEnabled(false)
      setPhase('idle')
      setQr(null)
      setCode('')
      setBackupCodes([])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={boxStyle}>
      <h4 style={{ margin: '0 0 0.25rem' }}>Double authentification (2FA)</h4>
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#374151' }}>
        Un second code, généré par une application sur votre téléphone, protège votre compte même si votre mot de passe est volé.
      </p>

      {error && (
        <p role="alert" style={{ color: '#B91C1C', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
          {error}
        </p>
      )}

      {isEnabled && phase !== 'done' && (
        <div>
          <p style={{ color: '#166534', fontWeight: 600, margin: '0 0 0.75rem' }}>
            ✓ La double authentification est active.
          </p>
          <button type="button" onClick={disable} disabled={busy} style={{ ...buttonStyle, background: '#B91C1C' }}>
            Désactiver
          </button>
        </div>
      )}

      {!isEnabled && phase === 'idle' && (
        <button type="button" onClick={startSetup} disabled={busy} style={buttonStyle}>
          {busy ? 'Préparation…' : 'Activer la double authentification'}
        </button>
      )}

      {phase === 'scanning' && (
        <div>
          <ol style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#374151' }}>
            <li>Installez une application d’authentification (Google Authenticator, Authy…).</li>
            <li>Scannez ce QR code avec l’application.</li>
            <li>Saisissez le code à 6 chiffres affiché, puis validez.</li>
          </ol>
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="QR code de configuration de la double authentification" width={180} height={180} style={{ display: 'block', margin: '0.5rem 0' }} />
          )}
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
            style={{ padding: '0.5rem', fontSize: '1rem', letterSpacing: '0.2em', width: 140, marginRight: '0.5rem' }}
          />
          <button type="button" onClick={verify} disabled={busy || code.length < 6} style={buttonStyle}>
            {busy ? 'Vérification…' : 'Valider'}
          </button>
        </div>
      )}

      {phase === 'done' && (
        <div>
          <p style={{ color: '#166534', fontWeight: 600 }}>✓ Double authentification activée.</p>
          {backupCodes.length > 0 && (
            <>
              <p style={{ fontSize: '0.85rem', color: '#374151', margin: '0.5rem 0' }}>
                Conservez ces codes de secours dans un endroit sûr. Chacun permet de vous connecter une fois si vous perdez votre téléphone.
              </p>
              <ul
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, max-content)',
                  gap: '0.25rem 1.5rem',
                  fontFamily: 'monospace',
                  fontSize: '0.95rem',
                  listStyle: 'none',
                  padding: 0,
                }}
              >
                {backupCodes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
