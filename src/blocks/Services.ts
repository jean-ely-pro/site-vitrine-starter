import type { Block } from 'payload'

/** A grid of service cards — title + short description per card. */
export const Services: Block = {
  slug: 'services',
  labels: { singular: 'Services (cartes)', plural: 'Services (cartes)' },
  imageAltText: 'Services',
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Titre de la section',
      admin: { description: 'Affiché en Titre 2 au-dessus des cartes. Ex. : « Nos prestations ».' },
    },
    {
      name: 'intro',
      type: 'textarea',
      label: 'Texte d’introduction',
      admin: { description: 'Optionnel. Une ou deux phrases sous le titre.' },
    },
    {
      name: 'cards',
      type: 'array',
      label: 'Cartes',
      minRows: 1,
      labels: { singular: 'Carte', plural: 'Cartes' },
      admin: { description: 'Une carte par service ou prestation.' },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Titre de la carte',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
          required: true,
        },
      ],
    },
  ],
}
