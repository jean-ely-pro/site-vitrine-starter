'use client'

import React, { useCallback, useEffect, useState } from 'react'

type Backup = { file: string; size: number; createdAt: string }

const formatBytes = (b: number) =>
  b < 1024 * 1024 ? `${Math.round(b / 1024)} Ko` : `${(b / (1024 * 1024)).toFixed(1)} Mo`

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(d)
}

/**
 * Backup manager rendered inside the Sauvegardes global: list, create,
 * download, and restore backups. Restore is destructive and asks for an
 * explicit confirmation before calling the guarded endpoint.
 */
export const BackupManager: React.FC = () => {
  const [backups, setBackups] = useState<Backup[]>([])
  const [tooling, setTooling] = useState(true)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/backups/list')
      if (!res.ok) return
      const data = (await res.json()) as { backups: Backup[]; toolingAvailable: boolean }
      setBackups(data.backups)
      setTooling(data.toolingAvailable)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = async () => {
    setBusy(true)
    setNote('')
    try {
      const res = await fetch('/api/backups/create', { method: 'POST' })
      setNote(res.ok ? 'Sauvegarde créée.' : 'La sauvegarde a échoué.')
    } catch {
      setNote('La sauvegarde a échoué.')
    }
    setBusy(false)
    void refresh()
  }

  const restore = async (file: string) => {
    const confirmed = window.confirm(
      `Restaurer la sauvegarde du ${file} ?\n\nAttention : cette opération remplace TOUT le contenu actuel du site par celui de la sauvegarde. Cette action est irréversible.`,
    )
    if (!confirmed) return
    setBusy(true)
    setNote('')
    try {
      const res = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file, confirm: true }),
      })
      setNote(res.ok ? 'Restauration effectuée. Rechargez la page.' : 'La restauration a échoué.')
    } catch {
      setNote('La restauration a échoué.')
    }
    setBusy(false)
    void refresh()
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <h4 style={{ marginBottom: '0.5rem' }}>Sauvegardes disponibles</h4>

      {!tooling ? (
        <p style={{ color: '#B45309', fontSize: '0.85rem' }}>
          L’outil de sauvegarde (pg_dump) n’est pas disponible dans cet environnement. Les
          sauvegardes fonctionnent sur le serveur de production.
        </p>
      ) : null}

      <button type="button" className="btn btn--style-primary" onClick={create} disabled={busy || !tooling}>
        {busy ? 'Veuillez patienter…' : 'Créer une sauvegarde maintenant'}
      </button>
      {note ? <span style={{ marginLeft: '0.75rem' }}>{note}</span> : null}

      {backups.length === 0 ? (
        <p style={{ marginTop: '1rem', color: '#4B5563' }}>Aucune sauvegarde pour le moment.</p>
      ) : (
        <table style={{ marginTop: '1rem', width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #D1D5DB' }}>
              <th style={{ padding: '0.5rem 0.5rem 0.5rem 0' }}>Date</th>
              <th style={{ padding: '0.5rem' }}>Taille</th>
              <th style={{ padding: '0.5rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {backups.map((b) => (
              <tr key={b.file} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '0.5rem 0.5rem 0.5rem 0' }}>{formatDate(b.createdAt)}</td>
                <td style={{ padding: '0.5rem' }}>{formatBytes(b.size)}</td>
                <td style={{ padding: '0.5rem' }}>
                  <a href={`/api/backups/download?file=${encodeURIComponent(b.file)}`}>Télécharger</a>
                  <button
                    type="button"
                    onClick={() => restore(b.file)}
                    disabled={busy}
                    style={{ marginLeft: '1rem', color: '#B91C1C', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Restaurer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
