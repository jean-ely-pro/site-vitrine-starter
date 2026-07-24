'use client'

import { useAllFormFields } from '@payloadcms/ui'
import React from 'react'

import { findVagueLinkLabels } from '../../lib/linkLabels'

/**
 * Scans every rich-text field in the current document and warns (without
 * blocking) when a link uses a vague label like "cliquez ici". Placed at the
 * top of content collections so the owner sees the alert while editing.
 */
export const LinkLabelWarnings: React.FC = () => {
  const [fields] = useAllFormFields()

  const labels = new Set<string>()
  Object.values(fields ?? {}).forEach((field) => {
    const value = (field as { value?: unknown })?.value
    if (value && typeof value === 'object' && 'root' in (value as object)) {
      findVagueLinkLabels(value).forEach((label) => labels.add(label))
    }
  })

  if (labels.size === 0) return null

  return (
    <div
      role="alert"
      style={{
        margin: '0 0 1rem',
        padding: '0.75rem 1rem',
        border: '1px solid #FCD34D',
        background: '#FEF9C3',
        borderRadius: 8,
        color: '#713F12',
      }}
    >
      <strong>Libellés de lien peu clairs :</strong>{' '}
      {Array.from(labels).map((l) => `« ${l} »`).join(', ')}. Préférez un texte qui décrit la
      destination du lien (par ex. « Voir nos tarifs » plutôt que « cliquez ici »), pour les
      personnes qui naviguent au lecteur d’écran.
    </div>
  )
}
