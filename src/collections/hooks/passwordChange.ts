import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Record when the password was last set, so the diagnostic can flag a stale
 * password. Payload does not track this out of the box.
 */
export const stampPasswordChange: CollectionBeforeChangeHook = ({ data, operation }) => {
  const changingPassword = typeof data.password === 'string' && data.password.length > 0
  if (changingPassword || (operation === 'create' && !data.passwordChangedAt)) {
    return { ...data, passwordChangedAt: new Date().toISOString() }
  }
  return data
}
