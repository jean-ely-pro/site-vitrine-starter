'use client'

import React, { useEffect, useState } from 'react'

type Diagnostic = {
  access: { totalUsers: number; activeUsers: number; activeAdmins: number }
  twoFactor: { adminsWithout2fa: number; allAdminsCovered: boolean }
  password: { ageDays: number | null; stale: boolean }
  backups: {
    toolingAvailable: boolean
    count: number
    lastBackup: string | null
    ageDays: number | null
    fresh: boolean
    frequency: string
  }
  legal: { mentionsLegales: boolean; confidentialite: boolean; cgu: boolean }
}

const OK = '#15803D'
const BAD = '#B91C1C'
const MUTED = '#4B5563'

const Row = ({ ok, label, detail }: { ok: boolean; label: string; detail: string }) => (
  <li style={{ display: 'flex', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid #E5E7EB' }}>
    <span aria-hidden="true" style={{ color: ok ? OK : BAD, fontWeight: 700 }}>
      {ok ? '✓' : '✗'}
    </span>
    <span style={{ minWidth: 220, fontWeight: 600 }}>{label}</span>
    <span style={{ color: MUTED }}>{detail}</span>
  </li>
)

export const DiagnosticView: React.FC = () => {
  const [data, setData] = useState<Diagnostic | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/diagnostic')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true))
  }, [])

  if (error) return <p style={{ color: BAD }}>Impossible de charger le diagnostic.</p>
  if (!data) return <p style={{ color: MUTED }}>Chargement du diagnostic…</p>

  const { access, twoFactor, password, backups, legal } = data

  return (
    <div style={{ maxWidth: 720 }}>
      <p style={{ color: MUTED, marginBottom: '1rem' }}>
        Un aperçu de la santé et de la sécurité de votre site.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <Row
          ok={twoFactor.allAdminsCovered}
          label="Double authentification"
          detail={
            twoFactor.allAdminsCovered
              ? 'Tous les administrateurs sont protégés.'
              : `${twoFactor.adminsWithout2fa} administrateur(s) sans double authentification.`
          }
        />
        <Row
          ok={!password.stale}
          label="Âge de votre mot de passe"
          detail={
            password.ageDays == null
              ? 'Inconnu.'
              : password.stale
                ? `${password.ageDays} jours — pensez à le changer.`
                : `${password.ageDays} jours.`
          }
        />
        <Row
          ok={backups.fresh}
          label="Sauvegarde"
          detail={
            !backups.toolingAvailable
              ? 'Outil de sauvegarde indisponible dans cet environnement.'
              : backups.lastBackup == null
                ? 'Aucune sauvegarde pour le moment.'
                : `Dernière sauvegarde il y a ${backups.ageDays} jour(s) (${backups.count} au total).`
          }
        />
        <Row
          ok={legal.mentionsLegales}
          label="Mentions légales"
          detail={legal.mentionsLegales ? 'Publiées.' : 'Non publiées.'}
        />
        <Row
          ok={legal.confidentialite}
          label="Politique de confidentialité"
          detail={legal.confidentialite ? 'Publiée.' : 'Non publiée.'}
        />
        <Row
          ok={access.activeAdmins > 0}
          label="Accès actifs"
          detail={`${access.activeAdmins} administrateur(s), ${access.activeUsers} accès actif(s) sur ${access.totalUsers}.`}
        />
      </ul>
    </div>
  )
}
