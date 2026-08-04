import type { CollectionConfig, GlobalConfig } from 'payload'

import { tenantRead, tenantWrite } from './tenantAccess'

/**
 * Turn an existing Payload global into one document per tenant.
 *
 * A global holds a single document for the whole database. Mutualised, that
 * would give every client the same identity, colours and opening hours. This
 * reuses the global's field definitions unchanged — the seven `globals/*.ts`
 * files keep working as written — while the multi-tenant plugin stores and
 * enforces one document per tenant.
 *
 * Adapted from the multi-tenant work of pascal-fortunati, whose version left
 * `read`/`create`/`update` at `Boolean(req.user)`: in a shared database that
 * exposes every client's settings to any signed-in user. Access is scoped to
 * the caller's tenants here.
 */
export const tenantSingleton = (definition: GlobalConfig): CollectionConfig => ({
  slug: definition.slug,
  labels: {
    singular: typeof definition.label === 'string' ? definition.label : definition.slug,
    plural: typeof definition.label === 'string' ? definition.label : definition.slug,
  },
  admin: {
    group: definition.admin?.group,
    description: definition.admin?.description,
  },
  access: {
    read: tenantRead,
    // Creation is the plugin's business: it makes the row when a tenant first
    // opens the section. Scoped like the rest so a client cannot seed another's.
    create: tenantWrite,
    update: tenantWrite,
    // A settings document is not deletable: the site would lose its identity or
    // its colours with no way back through the admin.
    delete: () => false,
  },
  fields: definition.fields,
})
