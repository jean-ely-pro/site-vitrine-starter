import type { CollectionConfig } from 'payload'

import { contactEndpoint } from './endpoints/contact'
import { tenantRead, tenantWrite } from '../lib/tenantAccess'

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
    // Messages carry visitors' names and e-mail addresses: private to the
    // staff of the client that received them, and to nobody else. This is the
    // collection where a cross-tenant leak would be a personal-data breach.
    read: tenantRead,
    // No public writes; submissions come only through the /contact endpoint,
    // which sets the tenant server-side from the requested slug.
    create: () => false,
    update: tenantWrite,
    delete: tenantWrite,
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
