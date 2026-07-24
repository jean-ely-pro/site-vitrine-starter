import type { GlobalConfig } from 'payload'

const adminOnly = ({ req }: { req: { user?: { role?: string } | null } }) =>
  req.user?.role === 'admin'

/**
 * Security & health diagnostic, rendered as a read-only admin page. Lives in a
 * global so it inherits the admin chrome (nav, header). Admin-only.
 */
export const Diagnostic: GlobalConfig = {
  slug: 'diagnostic',
  label: 'Diagnostic',
  admin: {
    group: 'Administration',
    description: 'État de sécurité et de santé du site.',
  },
  access: {
    read: adminOnly,
    update: adminOnly,
  },
  fields: [
    {
      name: 'view',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/DiagnosticView#DiagnosticView',
        },
      },
    },
  ],
}
