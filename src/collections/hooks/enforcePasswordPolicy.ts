import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

/**
 * Password policy (M3). Rules are duplicated in the client-side strength
 * meter (PasswordStrength.tsx) for immediate feedback, but THIS server-side
 * check is the actual guarantee — the UI can be bypassed, the API cannot.
 */
export const PASSWORD_RULES: Array<{ label: string; test: (value: string) => boolean }> = [
  { label: 'au moins 12 caractères', test: (v) => v.length >= 12 },
  { label: 'une lettre majuscule', test: (v) => /[A-Z]/.test(v) },
  { label: 'une lettre minuscule', test: (v) => /[a-z]/.test(v) },
  { label: 'un chiffre', test: (v) => /[0-9]/.test(v) },
  { label: 'un caractère spécial', test: (v) => /[^A-Za-z0-9]/.test(v) },
]

export const enforcePasswordPolicy: CollectionBeforeValidateHook = ({ data }) => {
  // `password` is only present when it is being set or changed. On other
  // updates it is absent and the policy simply does not apply.
  const password = (data as { password?: unknown } | undefined)?.password

  if (typeof password !== 'string' || password.length === 0) {
    return data
  }

  const failed = PASSWORD_RULES.filter((rule) => !rule.test(password)).map((rule) => rule.label)

  if (failed.length > 0) {
    throw new APIError(
      `Le mot de passe doit contenir : ${failed.join(', ')}.`,
      400,
      undefined,
      true,
    )
  }

  return data
}
