import type { GlobalConfig } from 'payload'

import { addressField } from '../fields/address'
import { revalidateSite } from './hooks/revalidateSite'

/**
 * Company identity. Feeds the site header, the browser tab, the default SEO
 * description, and the legal pages generated in Lot 5.
 */
export const Identite: GlobalConfig = {
  slug: 'identite',
  label: 'Identité',
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
      name: 'companyName',
      type: 'text',
      label: 'Nom de l’entreprise',
      required: true,
      admin: {
        description: 'Apparaît en haut du site et dans l’onglet du navigateur.',
      },
    },
    {
      name: 'slogan',
      type: 'text',
      label: 'Slogan',
      admin: {
        description: 'Une phrase courte affichée sous le nom, dans l’en-tête.',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo',
      admin: {
        description: 'Affiché dans l’en-tête du site. Le texte alternatif est demandé à l’envoi.',
      },
    },
    {
      name: 'activityDescription',
      type: 'textarea',
      label: 'Description de l’activité',
      admin: {
        description:
          'Présente votre activité en quelques phrases. Sert aussi de description par défaut dans les moteurs de recherche.',
      },
    },
    {
      name: 'legalName',
      type: 'text',
      label: 'Raison sociale',
      admin: {
        description: 'La dénomination officielle de l’entreprise, reprise dans les mentions légales.',
      },
    },
    {
      name: 'siret',
      type: 'text',
      label: 'SIRET',
      admin: {
        description: 'Votre numéro SIRET (14 chiffres). Apparaît dans les mentions légales.',
      },
    },
    addressField({
      label: 'Adresse du siège',
      description: 'Utilisée pour la fiche établissement affichée aux moteurs de recherche.',
    }),
  ],
}
