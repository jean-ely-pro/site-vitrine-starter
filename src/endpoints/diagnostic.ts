import type { Endpoint, PayloadRequest } from 'payload'

import { backupToolingAvailable, listBackups } from '../lib/backup'

const isAdmin = (req: PayloadRequest): boolean => req.user?.role === 'admin'

const daysSince = (iso: string | null | undefined): number | null => {
  if (!iso) return null
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return null
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24))
}

const FRESH_LIMIT_DAYS: Record<string, number> = { daily: 2, weekly: 8, manual: Infinity }

/**
 * Security & health diagnostic for the admin dashboard: 2FA coverage, password
 * age, backup freshness, legal pages present, and active accesses. Admin-only.
 */
export const diagnosticEndpoint: Endpoint = {
  path: '/diagnostic',
  method: 'get',
  handler: async (req) => {
    if (!isAdmin(req)) return Response.json({ message: 'Réservé aux administrateurs.' }, { status: 403 })

    const payload = req.payload

    const [activeAdmins, admins2fa, activeUsers, totalUsers, legal, backups, tooling, sauvegardes] =
      await Promise.all([
        payload.count({ collection: 'users', where: { and: [{ role: { equals: 'admin' } }, { disabled: { not_equals: true } }] } }),
        payload.count({ collection: 'users', where: { and: [{ role: { equals: 'admin' } }, { disabled: { not_equals: true } }, { twoFactorEnabled: { equals: true } }] } }),
        payload.count({ collection: 'users', where: { disabled: { not_equals: true } } }),
        payload.count({ collection: 'users' }),
        payload.find({ collection: 'legal-pages', where: { _status: { equals: 'published' } }, depth: 0, limit: 50, pagination: false, select: { type: true } }),
        listBackups(),
        backupToolingAvailable(),
        payload.findGlobal({ slug: 'sauvegardes' }),
      ])

    const publishedTypes = new Set((legal.docs as { type?: string }[]).map((d) => d.type))
    const lastBackup = backups[0]?.createdAt ?? null
    const backupAge = daysSince(lastBackup)
    const frequency = (sauvegardes as { frequency?: string }).frequency ?? 'daily'
    const backupFresh = backupAge != null && backupAge <= (FRESH_LIMIT_DAYS[frequency] ?? 2)

    const passwordAge = daysSince((req.user as { passwordChangedAt?: string })?.passwordChangedAt)

    return Response.json({
      access: {
        totalUsers: totalUsers.totalDocs,
        activeUsers: activeUsers.totalDocs,
        activeAdmins: activeAdmins.totalDocs,
      },
      twoFactor: {
        adminsWithout2fa: activeAdmins.totalDocs - admins2fa.totalDocs,
        allAdminsCovered: activeAdmins.totalDocs > 0 && admins2fa.totalDocs === activeAdmins.totalDocs,
      },
      password: {
        ageDays: passwordAge,
        // A password older than a year is worth rotating.
        stale: passwordAge != null && passwordAge > 365,
      },
      backups: {
        toolingAvailable: tooling,
        count: backups.length,
        lastBackup,
        ageDays: backupAge,
        fresh: backupFresh,
        frequency,
      },
      legal: {
        mentionsLegales: publishedTypes.has('mentions-legales'),
        confidentialite: publishedTypes.has('confidentialite'),
        cgu: publishedTypes.has('cgu'),
      },
    })
  },
}
