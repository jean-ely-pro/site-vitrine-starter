import type { GlobalConfig } from 'payload'

import { hexColorField } from '../fields/hexColor'
import { revalidateSite } from './hooks/revalidateSite'

/**
 * Brand colours, injected into the public site as CSS variables. Defaults are
 * chosen to already pass the 4.5:1 contrast requirement on white. The live
 * contrast checker that warns the owner below 4.5:1 arrives in Lot 6.
 */
export const Couleurs: GlobalConfig = {
  slug: 'couleurs',
  label: 'Couleurs',
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
      name: 'contrastChecker',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/ContrastChecker#ContrastChecker',
        },
      },
    },
    hexColorField({
      name: 'primary',
      label: 'Couleur principale',
      defaultValue: '#1D4ED8',
      description: 'Boutons, liens et éléments mis en avant.',
    }),
    hexColorField({
      name: 'secondary',
      label: 'Couleur secondaire',
      defaultValue: '#0F766E',
      description: 'Accents et éléments complémentaires.',
    }),
    hexColorField({
      name: 'text',
      label: 'Couleur du texte',
      defaultValue: '#1F2937',
      description: 'La couleur du texte courant sur les fonds clairs.',
    }),
    hexColorField({
      name: 'background',
      label: 'Couleur de fond',
      defaultValue: '#FFFFFF',
      description: 'La couleur de fond des pages.',
    }),
  ],
}
