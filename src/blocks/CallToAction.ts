import type { Block } from 'payload'

import { callToActionField } from '../fields/callToAction'

/** A highlighted band inviting the visitor to take one action. */
export const CallToAction: Block = {
  slug: 'callToAction',
  labels: { singular: 'Appel à l’action', plural: 'Appels à l’action' },
  imageAltText: 'Appel à l’action',
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Titre',
      required: true,
      admin: { description: 'Le message principal. Ex. : « Prêt à démarrer votre projet ? ».' },
    },
    {
      name: 'text',
      type: 'textarea',
      label: 'Texte',
      admin: { description: 'Optionnel. Une phrase de renfort sous le titre.' },
    },
    callToActionField({ name: 'button', label: 'Bouton', required: true }),
  ],
}
