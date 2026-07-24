import type { GlobalConfig } from 'payload'

import { revalidateSite } from './hooks/revalidateSite'

/**
 * Footer content: columns of links plus a copyright line. Legal-page links are
 * wired in Lot 5 when the legal pages exist; here the owner can already build
 * columns pointing at their own pages.
 */
export const PiedDePage: GlobalConfig = {
  slug: 'pied-de-page',
  label: 'Pied de page',
  admin: {
    group: 'Navigation',
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [revalidateSite],
  },
  fields: [
    {
      name: 'columns',
      type: 'array',
      label: 'Colonnes',
      maxRows: 4,
      labels: { singular: 'Colonne', plural: 'Colonnes' },
      admin: {
        description: 'Chaque colonne affiche un titre et une liste de liens en bas de chaque page.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Titre de la colonne',
          required: true,
        },
        {
          name: 'links',
          type: 'array',
          label: 'Liens',
          labels: { singular: 'Lien', plural: 'Liens' },
          fields: [
            {
              name: 'page',
              type: 'relationship',
              relationTo: 'pages',
              label: 'Page',
              required: true,
              admin: { description: 'La page ouverte par ce lien.' },
            },
            {
              name: 'label',
              type: 'text',
              label: 'Texte affiché (optionnel)',
              admin: { description: 'Par défaut, le titre de la page est utilisé.' },
            },
          ],
        },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      label: 'Mention de copyright',
      admin: {
        description:
          'Affichée tout en bas. Laissez vide pour afficher automatiquement « © année + nom de l’entreprise ».',
      },
    },
  ],
}
