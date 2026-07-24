import type { GlobalConfig } from 'payload'

import { revalidateSite } from './hooks/revalidateSite'

const DAY_OPTIONS = [
  { label: 'Lundi', value: 'monday' },
  { label: 'Mardi', value: 'tuesday' },
  { label: 'Mercredi', value: 'wednesday' },
  { label: 'Jeudi', value: 'thursday' },
  { label: 'Vendredi', value: 'friday' },
  { label: 'Samedi', value: 'saturday' },
  { label: 'Dimanche', value: 'sunday' },
]

// Pre-fill the week so the owner edits rows instead of building them from scratch.
const defaultWeek = DAY_OPTIONS.map(({ value }) => ({
  day: value,
  closed: value === 'sunday',
  slots: value === 'sunday' ? [] : [{ from: '09:00', to: '18:00' }],
}))

const validateTime = (value: string | null | undefined) => {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return 'Indiquez une heure au format 24 h, par exemple 09:00 ou 14:30.'
  }
  return true
}

/**
 * Opening hours. Each day can be closed or hold one or more time ranges (e.g. a
 * lunch break splits the day into two). This structure maps directly onto the
 * schema.org openingHours used by the LocalBusiness JSON-LD.
 */
export const Horaires: GlobalConfig = {
  slug: 'horaires',
  label: 'Horaires d’ouverture',
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
      name: 'week',
      type: 'array',
      label: 'Semaine',
      defaultValue: defaultWeek,
      labels: { singular: 'Jour', plural: 'Jours' },
      admin: {
        description:
          'Pour chaque jour, indiquez « fermé » ou une ou plusieurs plages horaires. Une pause déjeuner se traduit par deux plages.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'day',
              type: 'select',
              label: 'Jour',
              required: true,
              options: DAY_OPTIONS,
              admin: { width: '50%' },
            },
            {
              name: 'closed',
              type: 'checkbox',
              label: 'Fermé ce jour',
              defaultValue: false,
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'slots',
          type: 'array',
          label: 'Plages horaires',
          labels: { singular: 'Plage', plural: 'Plages' },
          admin: {
            condition: (_, siblingData) => !siblingData?.closed,
            description: 'Ex. : de 09:00 à 12:00, puis de 14:00 à 18:00.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'from',
                  type: 'text',
                  label: 'De',
                  required: true,
                  validate: validateTime,
                  admin: { width: '50%', placeholder: '09:00' },
                },
                {
                  name: 'to',
                  type: 'text',
                  label: 'À',
                  required: true,
                  validate: validateTime,
                  admin: { width: '50%', placeholder: '18:00' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
