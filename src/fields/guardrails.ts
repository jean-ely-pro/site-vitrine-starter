import type { Field } from 'payload'

/**
 * Editing guardrails shown at the top of content documents: a non-blocking
 * warning about vague link labels, and a guard against leaving with unsaved
 * changes. Both are invisible until they have something to say.
 */
export const guardrailFields: Field[] = [
  {
    name: 'linkWarnings',
    type: 'ui',
    admin: {
      components: { Field: '/components/admin/LinkLabelWarnings#LinkLabelWarnings' },
    },
  },
  {
    name: 'unsavedGuard',
    type: 'ui',
    admin: {
      components: { Field: '/components/admin/UnsavedChangesGuard#UnsavedChangesGuard' },
    },
  },
]
