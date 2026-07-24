import type { Block } from 'payload'

/**
 * Renders the opening hours from the Horaires global. No hours are entered here
 * — the block just decides where on the page they appear, so they stay defined
 * in one place and feed the JSON-LD consistently.
 */
export const Hours: Block = {
  slug: 'hours',
  labels: { singular: 'Horaires', plural: 'Horaires' },
  imageAltText: 'Horaires',
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Titre de la section',
      defaultValue: 'Nos horaires',
      admin: { description: 'Affiché en Titre 2 au-dessus des horaires.' },
    },
    {
      name: 'note',
      type: 'text',
      label: 'Note',
      admin: { description: 'Optionnel. Ex. : « Fermé les jours fériés ».' },
    },
  ],
}
