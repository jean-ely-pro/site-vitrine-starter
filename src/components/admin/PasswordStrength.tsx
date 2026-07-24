'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'

// Kept in sync with the server-side policy in enforcePasswordPolicy.ts.
const RULES: Array<{ label: string; test: (value: string) => boolean }> = [
  { label: 'Au moins 12 caractères', test: (v) => v.length >= 12 },
  { label: 'Une lettre majuscule', test: (v) => /[A-Z]/.test(v) },
  { label: 'Une lettre minuscule', test: (v) => /[a-z]/.test(v) },
  { label: 'Un chiffre', test: (v) => /[0-9]/.test(v) },
  { label: 'Un caractère spécial', test: (v) => /[^A-Za-z0-9]/.test(v) },
]

const LEVELS = [
  { label: 'Très faible', color: '#B91C1C' },
  { label: 'Faible', color: '#C2410C' },
  { label: 'Moyen', color: '#A16207' },
  { label: 'Bon', color: '#15803D' },
  { label: 'Excellent', color: '#166534' },
]

export const PasswordStrength: React.FC = () => {
  const password = useFormFields(([fields]) => (fields?.password?.value as string) || '')

  // The password field only registers once the user starts (re)typing a
  // password, so this stays hidden until it is actually relevant.
  if (!password) return null

  const passed = RULES.filter((rule) => rule.test(password)).length
  const ratio = passed / RULES.length
  const level = LEVELS[Math.max(0, passed - 1)] ?? LEVELS[0]

  return (
    <div style={{ margin: '0 0 1.5rem' }}>
      <div
        aria-hidden="true"
        style={{ height: 6, borderRadius: 999, background: '#E5E7EB', overflow: 'hidden' }}
      >
        <div
          style={{
            width: `${ratio * 100}%`,
            height: '100%',
            background: level.color,
            transition: 'width 150ms ease',
          }}
        />
      </div>
      <p style={{ margin: '0.4rem 0 0.6rem', fontSize: '0.8rem', color: level.color, fontWeight: 600 }}>
        Robustesse : {level.label}
      </p>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '0.8rem', lineHeight: 1.7 }}>
        {RULES.map((rule) => {
          const ok = rule.test(password)
          return (
            <li key={rule.label} style={{ color: ok ? '#166534' : '#6B7280' }}>
              <span aria-hidden="true">{ok ? '✓' : '○'}</span> {rule.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
