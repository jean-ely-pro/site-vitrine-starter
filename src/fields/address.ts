import type { Field } from 'payload'

/**
 * A postal address, reused by Identité (head office) and Contact.
 * Kept as a group so the pieces stay structured for the LocalBusiness JSON-LD.
 */
export const addressField = (overrides?: { label?: string; description?: string }): Field => ({
  name: 'address',
  type: 'group',
  label: overrides?.label ?? 'Adresse',
  admin: {
    description: overrides?.description,
  },
  fields: [
    {
      name: 'street',
      type: 'text',
      label: 'Rue',
      admin: { description: 'Numéro et nom de rue. Ex. : 12 rue des Fleurs.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'postalCode',
          type: 'text',
          label: 'Code postal',
          admin: { width: '30%' },
        },
        {
          name: 'city',
          type: 'text',
          label: 'Ville',
          admin: { width: '70%' },
        },
      ],
    },
  ],
})
