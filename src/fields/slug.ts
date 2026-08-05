import type { Field } from 'payload'

import { slugify } from '../lib/slugify'

/**
 * The document's web address. Auto-filled from a source field (the title by
 * default) when left blank, so the owner never has to think about URLs, but
 * editable for those who want a specific address. Always normalised on save.
 */
export const slugField = (options?: {
  source?: string
  label?: string
  description?: string
}): Field => {
  const source = options?.source ?? 'title'
  return {
    name: 'slug',
    type: 'text',
    label: options?.label ?? 'Adresse de la page',
    // Pas `unique: true` : ce serait une contrainte sur toute la base, et un
    // seul client pourrait alors avoir une page `/contact`. L'unicité est
    // portée par l'index composite `(tenant, slug)` déclaré sur chaque
    // collection concernée — unique là où il le faut, par client.
    index: true,
    admin: {
      position: 'sidebar',
      description:
        options?.description ??
        'L’adresse de la page sur le site, par ex. « services » pour /services. Remplie automatiquement d’après le titre ; modifiable.',
    },
    hooks: {
      beforeValidate: [
        ({ value, data }) => {
          const raw = typeof value === 'string' && value.length > 0 ? value : (data?.[source] ?? '')
          return slugify(String(raw))
        },
      ],
    },
  }
}
