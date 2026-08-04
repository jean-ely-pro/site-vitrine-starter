import type { Payload, Where } from 'payload'

/**
 * Which client the public site is rendering.
 *
 * The editing back-office knows its tenant from the signed-in user. The public
 * site has no user, so the tenant must come from configuration: one deployment
 * serves one client's site, named by `TENANT_SLUG`.
 *
 * Read at runtime, never inlined at build time — the same image serves every
 * client, and a value frozen into the bundle would make every site render the
 * first client's content (the defect already fixed for `SERVER_URL`).
 */
export const tenantSlug = (): string => process.env.TENANT_SLUG?.trim() || ''

let cached: { slug: string; id: number | string } | null = null

/**
 * Resolve the configured slug to a tenant id.
 *
 * Throws rather than falling back to a default. A silent fallback is how a
 * misconfigured deployment ends up publishing another client's content under
 * the wrong domain: the failure must be loud and immediate.
 */
export const currentTenantId = async (payload: Payload): Promise<number | string> => {
  const slug = tenantSlug()
  if (!slug) {
    throw new Error(
      'TENANT_SLUG manquant : impossible de savoir quel client ce site doit afficher.',
    )
  }
  if (cached?.slug === slug) return cached.id

  const result = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    // The public site has no user, and `tenants` is reserved to the agency.
    // Reading one's own tenant record is the one exception.
    overrideAccess: true,
  })
  const tenant = result.docs[0]
  if (!tenant) {
    throw new Error(`Client « ${slug} » introuvable : vérifiez TENANT_SLUG.`)
  }
  cached = { slug, id: tenant.id }
  return tenant.id
}

/** Restrict a public query to the configured client. */
export const currentTenantWhere = async (payload: Payload): Promise<Where> => ({
  tenant: { equals: await currentTenantId(payload) },
})

/** Test seam: forget the resolved tenant. */
export const resetTenantCache = (): void => {
  cached = null
}
