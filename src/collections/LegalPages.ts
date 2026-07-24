import type { CollectionConfig } from 'payload'

import { guardrailFields } from '../fields/guardrails'
import { publicationFields } from '../fields/publication'
import { restrictedRichText } from '../fields/richText'
import { slugField } from '../fields/slug'
import { LEGAL_TYPE_OPTIONS } from '../lib/legalTemplates'
import { applyLegalTemplate } from './hooks/applyLegalTemplate'
import { revalidateLegal, revalidateLegalDelete } from './hooks/revalidateLegal'
import { stampPublishedAt } from './hooks/stampPublishedAt'

/**
 * Legal pages (legal notice, privacy policy, terms). Choosing a type on creation
 * pre-fills the page with real French text built from the company data, which
 * the owner then edits. Published legal pages are linked automatically in the
 * footer. Only published pages are public.
 */
export const LegalPages: CollectionConfig = {
  slug: 'legal-pages',
  labels: {
    singular: 'Page légale',
    plural: 'Pages légales',
  },
  admin: {
    group: 'Contenus',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    description: 'Mentions légales, confidentialité, CGU — pré-remplies depuis votre identité, puis modifiables.',
  },
  versions: {
    drafts: { autosave: false },
    maxPerDoc: 10,
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true
      return { _status: { equals: 'published' } }
    },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [applyLegalTemplate, stampPublishedAt],
    afterChange: [revalidateLegal],
    afterDelete: [revalidateLegalDelete],
  },
  fields: [
    ...guardrailFields,
    ...publicationFields,
    {
      name: 'type',
      type: 'select',
      label: 'Type de page',
      required: true,
      options: LEGAL_TYPE_OPTIONS,
      admin: {
        position: 'sidebar',
        description: 'Choisi à la création pour générer le texte. Le contenu reste ensuite entièrement modifiable.',
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Titre',
      admin: { description: 'Rempli automatiquement d’après le type. Modifiable.' },
    },
    slugField({
      description: 'L’adresse de la page (ex. /mentions-legales). Remplie automatiquement.',
    }),
    {
      name: 'content',
      type: 'richText',
      editor: restrictedRichText,
      label: 'Contenu',
      admin: { description: 'Le texte de la page légale. Relisez-le et complétez les mentions entre crochets.' },
    },
  ],
}
