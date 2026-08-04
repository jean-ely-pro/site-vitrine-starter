import type { GlobalConfig } from 'payload'

// Sauvegardes et diagnostic décrivent l'installation, pas le site d'un
// client : sur une installation mutualisée ils relèvent de l'agence seule.
// Le super-administrateur doit y figurer, sans quoi le rôle le plus élevé
// perdrait un accès que le rôle en dessous conserve.
const adminOnly = ({ req }: { req: { user?: { role?: string } | null } }) =>
  req.user?.role === 'admin' || req.user?.role === 'super-admin'

/**
 * Backup settings and manager. The frequency drives the automatic backups (see
 * the scheduler in payload.config); the manager below lets an admin create,
 * download, and restore backups. Restricted to administrators.
 */
export const Sauvegardes: GlobalConfig = {
  slug: 'sauvegardes',
  label: 'Sauvegardes',
  admin: {
    group: 'Administration',
    description: 'Sauvegardez votre site et restaurez-le en cas de besoin.',
  },
  access: {
    read: adminOnly,
    update: adminOnly,
  },
  fields: [
    {
      name: 'frequency',
      type: 'select',
      label: 'Fréquence des sauvegardes automatiques',
      defaultValue: 'daily',
      options: [
        { label: 'Manuelle uniquement', value: 'manual' },
        { label: 'Quotidienne', value: 'daily' },
        { label: 'Hebdomadaire', value: 'weekly' },
      ],
      admin: {
        description: 'À quelle fréquence le site se sauvegarde tout seul. Vous pouvez aussi sauvegarder à la main ci-dessous.',
      },
    },
    {
      name: 'manager',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/BackupManager#BackupManager',
        },
      },
    },
  ],
}
