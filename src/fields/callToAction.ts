import type { Field } from 'payload'

/**
 * A single call-to-action button. "action" keeps the owner from ever typing a
 * raw URL for the common cases (call, e-mail, another page); a free external
 * link is offered too but is the last option, not the default.
 */
export const callToActionField = (config?: { name?: string; label?: string; required?: boolean }): Field => ({
  name: config?.name ?? 'cta',
  type: 'group',
  label: config?.label ?? 'Bouton',
  fields: [
    {
      name: 'label',
      type: 'text',
      label: 'Texte du bouton',
      required: config?.required ?? false,
    },
    {
      name: 'action',
      type: 'select',
      label: 'Action au clic',
      defaultValue: 'page',
      options: [
        { label: 'Ouvrir une page du site', value: 'page' },
        { label: 'Appeler le téléphone', value: 'phone' },
        { label: 'Écrire à l’e-mail', value: 'email' },
        { label: 'Ouvrir un lien externe', value: 'external' },
      ],
    },
    {
      name: 'page',
      type: 'relationship',
      relationTo: 'pages',
      label: 'Page à ouvrir',
      admin: { condition: (_, s) => s?.action === 'page' },
    },
    {
      name: 'url',
      type: 'text',
      label: 'Adresse du lien',
      admin: {
        condition: (_, s) => s?.action === 'external',
        description: 'L’adresse complète, par exemple https://exemple.fr.',
      },
    },
  ],
})
