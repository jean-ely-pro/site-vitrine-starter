'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

const formatDateTime = (iso: string): string => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(d)
}

/**
 * Explicit publication state in the sidebar: "En ligne depuis…" when published,
 * or a clear "Brouillon" note otherwise. Makes "saved" vs "online" unambiguous —
 * the owner should never wonder whether their page is actually live.
 */
export const PublicationStatus: React.FC = () => {
  const { status, publishedAt } = useFormFields(([fields]) => ({
    status: fields?._status?.value as string | undefined,
    publishedAt: fields?.publishedAt?.value as string | undefined,
  }))

  const published = status === 'published'
  const when = published && publishedAt ? formatDateTime(publishedAt) : ''

  return (
    <div
      style={{
        margin: '0.25rem 0 1rem',
        padding: '0.6rem 0.75rem',
        borderRadius: 8,
        border: '1px solid #D1D5DB',
        background: published ? '#ECFDF5' : '#FEF9C3',
      }}
    >
      <strong style={{ color: published ? '#15803D' : '#713F12' }}>
        {published ? 'En ligne' : 'Brouillon — non publié'}
      </strong>
      {published && when ? (
        <div style={{ fontSize: '0.8rem', color: '#4B5563', marginTop: '0.2rem' }}>
          En ligne depuis le {when}.
        </div>
      ) : null}
      {!published ? (
        <div style={{ fontSize: '0.8rem', color: '#4B5563', marginTop: '0.2rem' }}>
          Cliquez sur « Publier » pour mettre en ligne.
        </div>
      ) : null}
    </div>
  )
}
