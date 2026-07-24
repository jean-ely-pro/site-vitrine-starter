import type { CollectionConfig } from 'payload'

import { guardrailFields } from '../fields/guardrails'
import { publicationFields } from '../fields/publication'
import { restrictedRichText } from '../fields/richText'
import { seoField } from '../fields/seo'
import { slugField } from '../fields/slug'
import { revalidateActualite, revalidateActualiteDelete } from './hooks/revalidateActualite'
import { stampPublishedAt } from './hooks/stampPublishedAt'

/**
 * News. An article carries a title, a category, a date, a cover image, a short
 * excerpt, and a body limited to Titre 2 / Titre 3 (the article's single <h1>
 * is the title, owned by the system). Draft vs. published is Payload's built-in
 * status; only published articles are public.
 */
export const Actualites: CollectionConfig = {
  slug: 'actualites',
  labels: {
    singular: 'Actualité',
    plural: 'Actualités',
  },
  admin: {
    group: 'Contenus',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedDate', '_status'],
    description: 'Vos actualités. Rédigez, choisissez une rubrique et une image, puis publiez.',
  },
  versions: {
    drafts: {
      autosave: false,
    },
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
    beforeChange: [stampPublishedAt],
    afterChange: [revalidateActualite],
    afterDelete: [revalidateActualiteDelete],
  },
  fields: [
    ...guardrailFields,
    ...publicationFields,
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Titre',
      admin: {
        description: 'Le titre de l’actualité, affiché en haut de l’article et dans la liste.',
      },
    },
    slugField({
      description:
        'L’adresse de l’article, par ex. « ouverture-boutique » pour /actualites/ouverture-boutique. Remplie automatiquement d’après le titre.',
    }),
    {
      name: 'publishedDate',
      type: 'date',
      label: 'Date',
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' },
        description: 'La date affichée sur l’article et servant à ordonner la liste.',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Rubrique',
      admin: {
        position: 'sidebar',
        description: 'La rubrique de cette actualité. Créez-en dans « Catégories ».',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Image',
      admin: {
        description: 'L’image de couverture, affichée dans la liste et en haut de l’article.',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Chapô',
      admin: {
        description:
          'Un court résumé affiché dans la liste des actualités et, à défaut de description SEO, dans les résultats de recherche.',
      },
    },
    {
      name: 'content',
      type: 'richText',
      editor: restrictedRichText,
      label: 'Contenu',
      admin: {
        description: 'Le corps de l’article. Sous-titres (Titre 2, Titre 3), listes et liens disponibles.',
      },
    },
    seoField,
  ],
}
