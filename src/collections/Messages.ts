import type { CollectionConfig } from 'payload'

import { contactEndpoint } from './endpoints/contact'

/**
 * Contact-form submissions. The public never writes here directly: create is
 * closed, and the only way in is the `/contact` endpoint (which validates,
 * checks the honeypot, rate-limits, and writes with overrideAccess). Staff read
 * the inbox and mark messages read; the submitted fields are read-only because
 * a received message is a record, not something to edit.
 */
export const Messages: CollectionConfig = {
  slug: 'messages',
  labels: {
    singular: 'Message',
    plural: 'Boîte de réception',
  },
  admin: {
    group: 'Messages',
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'read', 'createdAt'],
    description: 'Les messages reçus via le formulaire de contact du site.',
    components: {
      beforeListTable: ['/components/admin/SendTestMessage#SendTestMessage'],
    },
  },
  access: {
    // Messages are private to the site's staff.
    read: ({ req }) => Boolean(req.user),
    // No public writes; submissions come only through the /contact endpoint.
    create: () => false,
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  endpoints: [contactEndpoint],
  fields: [
    {
      name: 'read',
      type: 'checkbox',
      label: 'Lu',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Cochez une fois le message traité.',
      },
    },
    {
      name: 'name',
      type: 'text',
      label: 'Nom',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'email',
      type: 'email',
      label: 'E-mail',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Message',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'consent',
      type: 'checkbox',
      label: 'Consentement donné',
      admin: {
        readOnly: true,
        description: 'Preuve que la case de consentement a été cochée à l’envoi.',
      },
    },
  ],
}
