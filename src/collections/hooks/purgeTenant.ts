import type { CollectionBeforeDeleteHook, CollectionSlug, Payload } from 'payload'
import { APIError } from 'payload'

/**
 * Erase a client's data when the client itself is deleted.
 *
 * Every tenant-owned row points at `tenants` with `ON DELETE set null`, so
 * deleting a client does not remove its content — it detaches it. And a
 * detached row is worse than an orphan: every access rule filters on
 * `tenant IN (…)`, which `NULL` never matches, so the documents become
 * invisible to everyone, the agency included. They cannot be listed, exported
 * or deleted from the interface, and they stay in the database indefinitely.
 *
 * For `messages` that means visitors' names, e-mail addresses and message
 * bodies, kept after the client they belonged to is gone — collected for a
 * purpose that no longer exists, and no longer reachable by the one request
 * that would remove them.
 *
 * Deleting a client is therefore treated as erasing their data. A client who
 * merely stops being served is *archived* (`status`), which keeps everything.
 */

/**
 * Collections carrying a `tenant` field, read from the running config rather
 * than listed here: a collection added later would otherwise be silently left
 * behind, and the omission would only surface as data nobody can see.
 */
export const tenantOwnedCollections = (payload: Payload): CollectionSlug[] =>
  payload.config.collections
    .filter(
      (collection) =>
        collection.slug !== 'tenants' &&
        collection.slug !== 'users' &&
        collection.fields.some(
          (field) => 'name' in field && field.name === 'tenant',
        ),
    )
    .map((collection) => collection.slug)

/**
 * Refuse to delete a client while accounts are still attached to it.
 *
 * `users` carries its tenants in an array, and those rows cascade — the account
 * survives the deletion with one client fewer. An account left with none is in
 * the lock-out this codebase already guards against elsewhere: it can list only
 * itself and create nothing.
 *
 * Refusing is the honest answer. Deleting the accounts would remove people's
 * access as a side effect of removing a client, which is not what the action
 * says it does.
 */
export const guardTenantHasNoUsers: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const attached = await req.payload.count({
    collection: 'users',
    overrideAccess: true,
    where: { 'tenants.tenant': { equals: id } },
  })
  if (attached.totalDocs > 0) {
    throw new APIError(
      `Impossible : ${attached.totalDocs} compte(s) sont encore rattachés à ce client. ` +
        'Supprimez ou rattachez ces accès ailleurs d’abord — ou archivez le client, ' +
        'ce qui cesse de le servir sans rien effacer.',
      400,
      undefined,
      true,
    )
  }
}

/**
 * Delete the client's content, before the client row itself goes.
 *
 * It has to be `beforeDelete`. The foreign keys are `ON DELETE set null`, so
 * the moment the tenant row disappears every `tenant_id` becomes `NULL` — and
 * `where: { tenant: { equals: id } }` then matches nothing. An `afterDelete`
 * purge would run against rows it can no longer find.
 *
 * The cost of that ordering: content is erased first, so a deletion that fails
 * afterwards leaves a client with nothing. `guardTenantHasNoUsers` runs before
 * this and rejects the common cause of failure; beyond that, the action is
 * destructive by design, and *archiving* is the operation that keeps the data.
 *
 * `overrideAccess` is required: the rows belong to a client the acting user may
 * not be scoped to.
 */
export const purgeTenantContent: CollectionBeforeDeleteHook = async ({ id, req }) => {
  for (const collection of tenantOwnedCollections(req.payload)) {
    try {
      await req.payload.delete({
        collection,
        where: { tenant: { equals: id } },
        overrideAccess: true,
      })
    } catch (error) {
      // One collection failing must not stop the others: whatever is left
      // behind is invisible for good, so partial erasure beats none. Logged so
      // the remainder can be dealt with.
      req.payload.logger.error(
        `Purge du client ${id} : échec sur « ${collection} » — ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }
}
