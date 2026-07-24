import type { GlobalConfig } from 'payload'

import { revalidateSite } from './hooks/revalidateSite'

/**
 * Primary navigation. Each entry points at a page the owner has created, so
 * "create a page and add it to the menu" (a core training gesture) is a single,
 * obvious action. Order in this list is the order in the menu.
 */
export const Menu: GlobalConfig = {
  slug: 'menu',
  label: 'Menu de navigation',
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
      name: 'items',
      type: 'array',
      label: 'Entrées du menu',
      labels: { singular: 'Entrée', plural: 'Entrées' },
      admin: {
        description:
          'Les liens du menu, dans l’ordre d’affichage. Glissez-déposez pour réordonner.',
      },
      fields: [
        {
          name: 'page',
          type: 'relationship',
          relationTo: 'pages',
          label: 'Page',
          required: true,
          admin: {
            description: 'La page ouverte par cette entrée du menu.',
          },
        },
        {
          name: 'label',
          type: 'text',
          label: 'Texte affiché (optionnel)',
          admin: {
            description: 'Par défaut, le titre de la page est utilisé. Renseignez pour afficher un texte plus court.',
          },
        },
      ],
    },
  ],
}
