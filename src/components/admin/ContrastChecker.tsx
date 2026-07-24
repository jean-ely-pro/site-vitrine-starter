'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

import { AA_CONTRAST, contrastRatio } from '../../lib/contrast'

const OK = '#15803D'
const BAD = '#B91C1C'
const MUTED = '#4B5563'

/**
 * Live contrast checker for the Couleurs settings. Reads the colour fields as
 * the owner edits them and warns, in real time, whenever a real on-screen pair
 * falls below the 4.5:1 minimum — applying what the training teaches.
 */
export const ContrastChecker: React.FC = () => {
  const colors = useFormFields(([fields]) => ({
    primary: (fields?.primary?.value as string) || '',
    secondary: (fields?.secondary?.value as string) || '',
    text: (fields?.text?.value as string) || '',
    background: (fields?.background?.value as string) || '',
  }))

  // Pairs that actually appear on screen (text on background, white on buttons).
  const pairs = [
    { label: 'Texte sur le fond', fg: colors.text, bg: colors.background },
    { label: 'Texte blanc sur la couleur principale', fg: '#FFFFFF', bg: colors.primary },
    { label: 'Texte blanc sur la couleur secondaire', fg: '#FFFFFF', bg: colors.secondary },
  ]

  return (
    <div style={{ margin: '0.5rem 0 1.5rem' }}>
      <p style={{ fontSize: '0.85rem', color: MUTED, marginBottom: '0.5rem' }}>
        Lisibilité (contraste) — un contraste d’au moins 4,5:1 est requis pour que le texte
        reste lisible par tous.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {pairs.map((pair) => {
          const ratio = contrastRatio(pair.fg, pair.bg)
          const ok = ratio != null && ratio >= AA_CONTRAST
          return (
            <li
              key={pair.label}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.35rem 0' }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  width: 44,
                  height: 24,
                  borderRadius: 4,
                  border: '1px solid #D1D5DB',
                  background: pair.bg || '#fff',
                  color: pair.fg || '#000',
                  fontSize: 12,
                  textAlign: 'center',
                  lineHeight: '24px',
                }}
              >
                Abc
              </span>
              <span style={{ minWidth: 260 }}>{pair.label}</span>
              <span style={{ color: ok ? OK : BAD, fontWeight: 700 }}>
                {ratio == null ? '—' : `${ratio.toFixed(2)}:1`} {ratio != null ? (ok ? '✓' : '✗ trop faible') : ''}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
