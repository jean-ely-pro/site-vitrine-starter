import type { GlobalConfig } from 'payload'

// Sauvegardes et diagnostic décrivent l'installation, pas le site d'un
// client : sur une installation mutualisée ils relèvent de l'agence seule.
// Le super-administrateur doit y figurer, sans quoi le rôle le plus élevé
// perdrait un accès que le rôle en dessous conserve.
const adminOnly = ({ req }: { req: { user?: { role?: string } | null } }) =>
  req.user?.role === 'admin' || req.user?.role === 'super-admin'

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
