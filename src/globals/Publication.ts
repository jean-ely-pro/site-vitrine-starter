import type { GlobalConfig } from 'payload'

/**
 * Publishing belongs to the manager, not only to the agency: the whole point is
 * that they stop needing a command line. An editor writes content but does not
 * decide when the site goes out — the same split the endpoints enforce.
 */
const ownerOnly = ({ req }: { req: { user?: { role?: string | null } | null } }) =>
  req.user?.role === 'admin' || req.user?.role === 'super-admin'

/**
 * Mise en ligne du site public.
 *
 * A screen rather than a setting: it holds no data of its own, only the button
 * and the state of the last publication. It sits at the top of its own group so
 * the owner finds it without hunting through the settings.
 */
export const Publication: GlobalConfig = {
  slug: 'publication',
  label: 'Mise en ligne',
  admin: {
    group: 'Mon site',
    description: 'Envoyez vos modifications sur votre site public.',
  },
  access: {
    read: ownerOnly,
    update: ownerOnly,
  },
  fields: [
    {
      name: 'manager',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/PublishSite#PublishSite',
        },
      },
    },
  ],
}
