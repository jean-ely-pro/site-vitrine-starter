'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

// Above this size, a photo is heavier than it needs to be for the web.
const WARN_BYTES = 500 * 1024

const COLORS = {
  label: '#4B5563',
  value: '#1F2937',
  ok: '#15803D',
  warn: '#B45309',
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

/**
 * Read-only summary of the uploaded file: weight, format, and dimensions, with
 * a plain-language warning when the image is heavier than the web needs. The
 * generated sizes stay light regardless; this nudges the owner to upload
 * reasonable originals.
 */
export const MediaFileInfo: React.FC = () => {
  const { filesize, mimeType, width, height } = useFormFields(([fields]) => ({
    filesize: fields?.filesize?.value as number | undefined,
    mimeType: fields?.mimeType?.value as string | undefined,
    width: fields?.width?.value as number | undefined,
    height: fields?.height?.value as number | undefined,
  }))

  if (!filesize && !mimeType) return null

  const tooHeavy = typeof filesize === 'number' && filesize > WARN_BYTES

  const row = (label: string, value: React.ReactNode) => (
    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem' }}>
      <span style={{ color: COLORS.label, minWidth: 90 }}>{label}</span>
      <span style={{ color: COLORS.value, fontWeight: 600 }}>{value}</span>
    </div>
  )

  return (
    <div
      style={{
        marginBottom: '1rem',
        padding: '0.75rem 1rem',
        border: '1px solid #D1D5DB',
        borderRadius: 8,
        display: 'grid',
        gap: '0.25rem',
        maxWidth: 420,
      }}
    >
      {typeof filesize === 'number'
        ? row(
            'Poids',
            <span style={{ color: tooHeavy ? COLORS.warn : COLORS.ok }}>{formatBytes(filesize)}</span>,
          )
        : null}
      {mimeType ? row('Format', mimeType.replace('image/', '').toUpperCase()) : null}
      {width && height ? row('Dimensions', `${width} × ${height} px`) : null}
      {tooHeavy ? (
        <p style={{ color: COLORS.warn, fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
          Cette image est lourde (plus de {formatBytes(WARN_BYTES)}). Une image plus légère
          accélère le site. Le site en génère automatiquement des versions optimisées.
        </p>
      ) : null}
    </div>
  )
}
