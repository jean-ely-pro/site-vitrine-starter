import type { GlobalConfig } from 'payload'

import { revalidateSite } from './hooks/revalidateSite'

/**
 * Social network links, rendered in the footer. Kept as a simple ordered list
 * so the owner adds only the networks they actually use.
 */
export const Reseaux: GlobalConfig = {
  slug: 'reseaux',
  label: 'Réseaux sociaux',
  admin: {
    group: 'Réglages du site',
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
      name: 'links',
      type: 'array',
      label: 'Liens vers vos réseaux',
      labels: { singular: 'Réseau', plural: 'Réseaux' },
      admin: {
        description: 'Affichés dans le pied de page. Laissez vide les réseaux que vous n’utilisez pas.',
      },
      fields: [
        {
          name: 'platform',
          type: 'select',
          label: 'Réseau',
          required: true,
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'X (Twitter)', value: 'x' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'Autre', value: 'other' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          label: 'Adresse du profil',
          required: true,
          admin: { description: 'L’adresse complète, par exemple https://facebook.com/votre-page.' },
        },
      ],
    },
  ],
}
