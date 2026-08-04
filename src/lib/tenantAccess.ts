import type { Access, FieldAccess, Where } from 'payload'

/**
 * Tenant isolation.
 *
 * Every client shares one database, so isolation is a property of this file
 * rather than of the infrastructure. Previously each client had its own
 * database and container: a mistake in an access function could not leak
 * anything, because there was nothing else to leak. That safety net is gone.
 *
 * The multi-tenant plugin filters the *admin UI* through `baseListFilter`. It
 * does NOT secure the REST API: `GET /api/pages?limit=500` obeys `access.read`
 * alone. An access function returning `true` therefore exposes every client's
 * data to any signed-in user. Scoping must happen here.
 *
 * The rule: an access function never returns a bare `true` for a tenant-owned
 * collection. It returns a `Where` clause naming the tenants the user may
 * touch, and Payload applies it to reads *and* to the row lookup behind
 * updates and deletes.
 */

/** A tenant reference as Payload may hydrate it: an id, or a populated doc. */
export type TenantRef =
  | number
  | string
  | { id?: number | string; tenant?: number | string | { id?: number | string } }

export type PlatformUser = {
  id?: number | string
  role?: string
  tenants?: TenantRef[] | null
}

export const ROLES = ['super-admin', 'admin', 'editor'] as const
export type Role = (typeof ROLES)[number]

const asUser = (user: unknown): PlatformUser | null =>
  user !== null && typeof user === 'object' ? (user as PlatformUser) : null

/** The agency: sees and manages every client. Nobody else crosses tenants. */
export const isSuperAdmin = (user: unknown): boolean => asUser(user)?.role === 'super-admin'

/** The client's own administrator: full rights, but on their tenants only. */
export const isTenantAdmin = (user: unknown): boolean => {
  const role = asUser(user)?.role
  return role === 'admin' || role === 'super-admin'
}

/**
 * Tenant ids attached to a user, whatever shape the relationship arrives in.
 *
 * The plugin stores an array of rows; depth and hasMany mean an entry can be a
 * raw id, `{ tenant: id }`, or `{ tenant: { id } }`. Reading only one shape
 * silently yields an empty list — which, with the access rules below, locks the
 * user out rather than over-exposing. That failure direction is deliberate.
 */
export const tenantIdsForUser = (user: unknown): Array<number | string> =>
  (asUser(user)?.tenants ?? [])
    .map((entry) => {
      if (typeof entry === 'number' || typeof entry === 'string') return entry
      const tenant = entry?.tenant
      if (typeof tenant === 'number' || typeof tenant === 'string') return tenant
      return tenant?.id ?? entry?.id
    })
    .filter((id): id is number | string => id !== undefined && id !== null)

export const userCanAccessTenant = (user: unknown, tenantId: number | string): boolean =>
  isSuperAdmin(user) || tenantIdsForUser(user).map(String).includes(String(tenantId))

/**
 * Restrict a query to the tenants a user owns.
 *
 * Returns `true` for a super-admin (no restriction), a `Where` for a scoped
 * user, and `false` when the user owns no tenant. Returning `false` — not an
 * empty filter — matters: a user with no tenant must see nothing, and an
 * `{ in: [] }` clause is not reliably empty across adapters.
 */
export const scopeToTenants = (user: unknown): true | false | Where => {
  if (isSuperAdmin(user)) return true
  const ids = tenantIdsForUser(user)
  if (ids.length === 0) return false
  return { tenant: { in: ids } }
}

/**
 * Read access for tenant-owned content that the public site consumes.
 *
 * Anonymous callers are the published static site: they must name a tenant, so
 * the endpoint filters by tenant itself. Here they get published documents only.
 */
export const tenantReadPublished: Access = ({ req }) => {
  if (!req.user) return { _status: { equals: 'published' } }
  return scopeToTenants(req.user)
}

/** Read access for tenant-owned content with no draft/publish cycle. */
export const tenantRead: Access = ({ req }) => {
  if (!req.user) return false
  return scopeToTenants(req.user)
}

/**
 * Write access for tenant-owned content.
 *
 * Payload runs this filter against the target row before an update or a delete,
 * so a `Where` here blocks writing another client's document, not merely
 * listing it.
 */
export const tenantWrite: Access = ({ req }) => {
  if (!req.user) return false
  return scopeToTenants(req.user)
}

/**
 * Settings a client owns but an editor does not touch: identity, colours,
 * contact details, opening hours, social links.
 *
 * An editor writes content; changing the company name or the brand colour is
 * the owner's decision. Still scoped to the tenant, so a client's administrator
 * only reaches their own.
 */
export const tenantSettingsWrite: Access = ({ req }) => {
  if (!isTenantAdmin(req.user)) return false
  return scopeToTenants(req.user)
}

/**
 * Hide a section from an editor's navigation.
 *
 * Cosmetic on its own — `admin.hidden` removes the entry from the sidebar but
 * not the underlying route or API. It always accompanies an access rule that
 * does the actual refusing; hiding alone would be a door left unlocked with the
 * sign taken down.
 */
export const hiddenFromEditors = ({ user }: { user?: unknown }): boolean => !isTenantAdmin(user)

/** Reserved to the agency: tenant records, and anything that spans clients. */
export const superAdminOnly: Access = ({ req }) => isSuperAdmin(req.user)

/** Field-level variant, for fields only the agency may set. */
export const superAdminOnlyField: FieldAccess = ({ req }) => isSuperAdmin(req.user)
