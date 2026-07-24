'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

// Validated colours (no opacity on text): all clear 4.5:1 on white.
const COLORS = {
  url: '#15803D',
  title: '#1A0DAB',
  description: '#3C4043',
  muted: '#4B5563',
  ok: '#15803D',
  warn: '#B45309',
  over: '#B91C1C',
}

const RECOMMENDED = 155
const MAX = 165

const serverUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://votre-site.fr').replace(/\/$/, '')

/**
 * Live Google-result preview + meta-description counter for the SEO group.
 * Shows the owner exactly how the page will look in search results and nudges
 * the description toward ~155 characters, using the same fallbacks as the site.
 */
export const SeoPreview: React.FC = () => {
  const { pageTitle, slug, seoTitle, seoDescription } = useFormFields(([fields]) => ({
    pageTitle: (fields?.title?.value as string) || '',
    slug: (fields?.slug?.value as string) || '',
    seoTitle: (fields?.['seo.title']?.value as string) || '',
    seoDescription: (fields?.['seo.description']?.value as string) || '',
  }))

  const shownTitle = seoTitle || pageTitle || 'Titre de la page'
  const shownDescription =
    seoDescription || 'La description de votre activité sera utilisée si ce champ reste vide.'
  const url = `${serverUrl}/${slug || ''}`

  const len = seoDescription.length
  const counterColor = len === 0 ? COLORS.muted : len > MAX ? COLORS.over : len > 160 ? COLORS.warn : COLORS.ok
  const counterMessage =
    len === 0
      ? 'Vide : la description de votre activité sera utilisée.'
      : len < 70
        ? 'Un peu court : visez environ 155 caractères.'
        : len > MAX
          ? 'Trop long : Google coupera la fin.'
          : 'Bonne longueur.'

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <p style={{ fontSize: '0.8rem', color: COLORS.muted, marginBottom: '0.5rem' }}>
        Aperçu dans les résultats de recherche Google
      </p>
      <div
        style={{
          border: '1px solid #D1D5DB',
          borderRadius: 8,
          padding: '0.75rem 1rem',
          background: '#FFFFFF',
          maxWidth: 600,
        }}
      >
        <div style={{ color: COLORS.url, fontSize: '0.8rem', wordBreak: 'break-all' }}>{url}</div>
        <div style={{ color: COLORS.title, fontSize: '1.15rem', lineHeight: 1.3, margin: '2px 0' }}>
          {shownTitle}
        </div>
        <div style={{ color: COLORS.description, fontSize: '0.875rem', lineHeight: 1.4 }}>
          {shownDescription}
        </div>
      </div>
      <p style={{ fontSize: '0.8rem', color: counterColor, marginTop: '0.5rem', fontWeight: 600 }}>
        {len} caractère{len > 1 ? 's' : ''} — {counterMessage}
      </p>
    </div>
  )
}
