'use client'

import { useField } from '@payloadcms/ui'
import React from 'react'

type Props = {
  field?: { label?: string; required?: boolean; admin?: { description?: string } }
  path: string
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/

// Curated palette spanning light → dark so it fits every role (background, text,
// brand). French names double as accessible labels for the swatch buttons.
const PRESETS: { name: string; hex: string }[] = [
  { name: 'Blanc', hex: '#FFFFFF' },
  { name: 'Gris très clair', hex: '#F3F4F6' },
  { name: 'Gris', hex: '#6B7280' },
  { name: 'Gris foncé', hex: '#374151' },
  { name: 'Presque noir', hex: '#111827' },
  { name: 'Bleu', hex: '#1D4ED8' },
  { name: 'Bleu ciel', hex: '#0369A1' },
  { name: 'Turquoise', hex: '#0F766E' },
  { name: 'Vert', hex: '#15803D' },
  { name: 'Vert olive', hex: '#4D7C0F' },
  { name: 'Moutarde', hex: '#B45309' },
  { name: 'Orange', hex: '#C2410C' },
  { name: 'Rouge', hex: '#B91C1C' },
  { name: 'Rose', hex: '#BE185D' },
  { name: 'Violet', hex: '#6D28D9' },
  { name: 'Marron', hex: '#78350F' },
]

/**
 * Colour field for a non-technical owner: a palette of named colours to click,
 * plus a free picker for anything else. No hexadecimal is ever shown or typed;
 * the value stays a hex string, so the CSS injection and the live contrast
 * checker are unchanged.
 */
export const ColorInput: React.FC<Props> = ({ field, path }) => {
  const { value, setValue, showError, errorMessage } = useField<string>({ path })
  const label = field?.label
  const description = field?.admin?.description
  const current = typeof value === 'string' && HEX_RE.test(value) ? value : '#000000'
  const selected = typeof value === 'string' ? value.toLowerCase() : ''

  return (
    <div className="field-type" style={{ marginBottom: '1.5rem' }}>
      {label ? (
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
          {label}
          {field?.required ? ' *' : ''}
        </label>
      ) : null}

      <div role="group" aria-label={label ? `${label} — couleurs suggérées` : 'Couleurs suggérées'}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {PRESETS.map((preset) => {
            const isSelected = selected === preset.hex.toLowerCase()
            return (
              <button
                key={preset.hex}
                type="button"
                onClick={() => setValue(preset.hex)}
                title={preset.name}
                aria-label={preset.name}
                aria-pressed={isSelected}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  background: preset.hex,
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #111827' : '1px solid #D1D5DB',
                  outline: isSelected ? '2px solid #FFFFFF' : 'none',
                  outlineOffset: '-4px',
                  boxShadow: isSelected ? '0 0 0 1px #111827' : 'none',
                }}
              />
            )
          })}
        </div>
      </div>

      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          cursor: 'pointer',
          marginTop: '0.75rem',
        }}
      >
        <input
          type="color"
          value={current}
          onChange={(e) => setValue(e.target.value)}
          aria-label={label ? `${label} — choisir une autre couleur` : 'Choisir une autre couleur'}
          style={{
            width: 44,
            height: 32,
            padding: 0,
            border: '1px solid #D1D5DB',
            borderRadius: 8,
            cursor: 'pointer',
            background: 'none',
          }}
        />
        <span style={{ fontSize: '0.85rem', color: '#4B5563' }}>Ou choisir une autre couleur</span>
      </label>

      {description ? (
        <p style={{ fontSize: '0.8rem', color: '#4B5563', marginTop: '0.5rem' }}>{description}</p>
      ) : null}
      {showError && errorMessage ? (
        <p style={{ color: '#B91C1C', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errorMessage}</p>
      ) : null}
    </div>
  )
}
