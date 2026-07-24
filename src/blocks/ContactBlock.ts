import type { Block } from 'payload'

/**
 * Renders the contact details from the Contact global (clickable phone/e-mail,
 * address). Like the Hours block, it holds no data of its own — it places the
 * shared contact information on the page.
 */
export const ContactBlock: Block = {
  slug: 'contactDetails',
  labels: { singular: 'Contact', plural: 'Contact' },
  imageAltText: 'Contact',
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Titre de la section',
      defaultValue: 'Nous contacter',
      admin: { description: 'Affiché en Titre 2 au-dessus des coordonnées.' },
    },
    {
      name: 'intro',
      type: 'textarea',
      label: 'Texte d’introduction',
      admin: { description: 'Optionnel. Une phrase invitant à vous contacter.' },
    },
  ],
}
