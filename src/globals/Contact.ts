import type { GlobalConfig } from 'payload'

import { addressField } from '../fields/address'
import { revalidateSite } from './hooks/revalidateSite'

/**
 * Contact details. Phone and e-mail are rendered as clickable tel: / mailto:
 * links on the public site — on mobile that is the contact gesture of a small
 * business. Also feeds the LocalBusiness JSON-LD.
 */
export const Contact: GlobalConfig = {
  slug: 'contact',
  label: 'Contact',
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
      name: 'email',
      type: 'email',
      label: 'Adresse e-mail',
      admin: {
        description: 'Affichée comme lien cliquable. Un clic ouvre le logiciel de messagerie du visiteur.',
      },
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Téléphone',
      admin: {
        description: 'Affiché comme lien cliquable. Sur mobile, un clic lance l’appel.',
      },
    },
    addressField({
      description: 'L’adresse où l’on peut vous rendre visite, affichée sur la page de contact.',
    }),
    {
      name: 'ctaButtons',
      type: 'array',
      label: 'Boutons d’appel à l’action',
      maxRows: 3,
      labels: { singular: 'Bouton', plural: 'Boutons' },
      admin: {
        description:
          'Affichés dans le bloc « Contact » d’une page, par exemple « Appelez-nous » ou « Écrivez-nous ».',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Texte du bouton',
          required: true,
        },
        {
          name: 'action',
          type: 'select',
          label: 'Action au clic',
          required: true,
          defaultValue: 'phone',
          options: [
            { label: 'Appeler le téléphone', value: 'phone' },
            { label: 'Écrire à l’e-mail', value: 'email' },
            { label: 'Ouvrir une page du site', value: 'page' },
          ],
          admin: {
            description: 'Ce que fait le bouton. « Appeler » et « Écrire » utilisent le téléphone et l’e-mail ci-dessus.',
          },
        },
        {
          name: 'page',
          type: 'relationship',
          relationTo: 'pages',
          label: 'Page à ouvrir',
          admin: {
            condition: (_, siblingData) => siblingData?.action === 'page',
            description: 'La page vers laquelle le bouton mène.',
          },
        },
      ],
    },
  ],
}
