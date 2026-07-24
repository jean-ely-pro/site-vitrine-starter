import type {
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  CollectionBeforeLoginHook,
  PayloadRequest,
} from 'payload'
import { APIError } from 'payload'

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
