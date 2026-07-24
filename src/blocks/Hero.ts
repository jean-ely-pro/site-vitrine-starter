import type { Block } from 'payload'

import { callToActionField } from '../fields/callToAction'

/**
 * Top-of-page banner. The image is a real <img> at render time (never a CSS
 * background) so it carries an alt and is visible to crawlers.
 */
export const Hero: Block = {
  slug: 'hero',
  labels: { singular: 'Bannière', plural: 'Bannières' },
  imageAltText: 'Bannière',
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Titre',
      required: true,
      admin: { description: 'Le grand titre affiché en haut de la bannière.' },
    },
    {
      name: 'subheading',
      type: 'textarea',
      label: 'Sous-titre',
      admin: { description: 'Une phrase d’accroche sous le titre.' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Image de fond',
      admin: { description: 'L’image affichée derrière le titre. Le texte alternatif est demandé à l’envoi.' },
    },
    callToActionField({ name: 'cta', label: 'Bouton principal' }),
  ],
}
