import type {
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  CollectionBeforeLoginHook,
  PayloadRequest,
} from 'payload'
import { APIError } from 'payload'

import { isSuperAdmin, tenantIdsForUser } from '../../lib/tenantAccess'

// Count admins that can still sign in, optionally excluding one id.
const countActiveAdmins = async (req: PayloadRequest, excludeId?: string | number): Promise<number> => {
  const result = await req.payload.count({
    collection: 'users',
    where: {
      and: [
        { role: { equals: 'admin' } },
        { disabled: { not_equals: true } },
        ...(excludeId != null ? [{ id: { not_equals: excludeId } }] : []),
      ],
    },
  })
  return result.totalDocs
}

/** Refuse login for a revoked access. */
export const blockDisabledLogin: CollectionBeforeLoginHook = ({ user }) => {
  if ((user as { disabled?: boolean }).disabled) {
    throw new APIError('Cet accès a été révoqué. Contactez un administrateur.', 403, undefined, true)
  }
  return user
}

/**
 * Never let the site end up with no one who can sign in as admin: block
 * revoking or demoting the last active administrator.
 */
export const guardLastAdmin: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req }) => {
  if (operation !== 'update' || !originalDoc) return data

  const wasActiveAdmin = originalDoc.role === 'admin' && !originalDoc.disabled
  const newRole = (data.role ?? originalDoc.role) as string
  const newDisabled = (data.disabled ?? originalDoc.disabled) as boolean | undefined
  const becomesInactive = newDisabled === true || newRole !== 'admin'

  if (wasActiveAdmin && becomesInactive) {
    const others = await countActiveAdmins(req, originalDoc.id)
    if (others === 0) {
      throw new APIError(
        'Impossible : c’est le dernier administrateur actif. Créez ou réactivez un autre administrateur d’abord.',
        400,
        undefined,
        true,
      )
    }
  }
  return data
}

/**
 * Stop a client's admin from creating an account outside their own scope.
 *
 * Field-level access covers updates but not creation: without this, a client
 * admin could create a `super-admin`, or attach a new account to another
 * client's tenant, and reach data that is not theirs. The first account of a
 * fresh installation is exempt — someone has to be able to sign in.
 */
export const guardTenantEscalation: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') return data
  if (isSuperAdmin(req.user)) return data

  // Bootstrap: no account yet, so this one becomes the agency's super-admin.
  const existing = await req.payload.count({ collection: 'users', overrideAccess: true })
  if (existing.totalDocs === 0) return { ...data, role: 'super-admin' }

  if (!req.user) {
    throw new APIError('Authentification requise.', 401, undefined, true)
  }

  if (data.role === 'super-admin') {
    throw new APIError(
      'Seul un super-administrateur peut attribuer ce rôle.',
      403,
      undefined,
      true,
    )
  }

  // Any tenant named on the new account must be one the creator owns.
  const allowed = tenantIdsForUser(req.user).map(String)
  const requested = tenantIdsForUser(data).map(String)
  const foreign = requested.filter((id) => !allowed.includes(id))
  if (foreign.length > 0) {
    throw new APIError(
      'Vous ne pouvez créer un accès que pour vos propres clients.',
      403,
      undefined,
      true,
    )
  }

  // Attach to the creator's tenant by default, so an account is never orphaned
  // — an orphan would be invisible to its own administrator.
  if (requested.length === 0 && allowed.length > 0) {
    return { ...data, tenants: tenantIdsForUser(req.user) }
  }
  return data
}

/** Block deleting the last active administrator. */
export const preventLastAdminDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const doc = await req.payload.findByID({ collection: 'users', id, overrideAccess: true })
  if (doc.role === 'admin' && !(doc as { disabled?: boolean }).disabled) {
    const others = await countActiveAdmins(req, id)
    if (others === 0) {
      throw new APIError('Impossible de supprimer le dernier administrateur actif.', 400, undefined, true)
    }
  }
}
