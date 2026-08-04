import { headers } from 'next/headers'
import type { Payload, Where } from 'payload'

/**
 * Which client the public site is rendering.
 *
 * The editing back-office knows its tenant from the signed-in user. The public
 * site has no user, so the tenant comes from the request or from configuration:
 *
 *  1. the `X-Tenant-Slug` header, when a mutualised instance renders several
 *     clients — one container cannot carry one client's slug in its environment
 *     and still serve the others;
 *  2. `TENANT_SLUG`, when a deployment serves a single client.
 *
 * Both are read at runtime, never inlined at build time: the same image serves
 * every client, and a value frozen into the bundle would make every site render
 * the first client's content (the defect already fixed for `SERVER_URL`).
 */
export const tenantSlug = async (): Promise<string> => {
  // Only trusted when explicitly enabled: the header comes from the network, so
  // accepting it unconditionally would let a crafted request read any client's
  // content from a single-tenant deployment.
  if (process.env.TENANT_FROM_HEADER === 'true') {
    const fromHeader = (await headers()).get('x-tenant-slug')?.trim()
    if (fromHeader) return fromHeader
  }
  return process.env.TENANT_SLUG?.trim() || ''
}

// Keyed by slug, not a single entry: a mutualised instance alternates between
// clients from one request to the next, and a single slot would be refilled on
// every switch — one extra query per page rather than one per client.
const cached = new Map<string, number | string>()
// Même mise en cache pour l'adresse publique, lue à chaque page rendue.
const domains = new Map<string, string | null>()

/**
 * Resolve the configured slug to a tenant id.
 *
 * Throws rather than falling back to a default. A silent fallback is how a
 * misconfigured deployment ends up publishing another client's content under
 * the wrong domain: the failure must be loud and immediate.
 */
export const currentTenantId = async (payload: Payload): Promise<number | string> => {
  const slug = await tenantSlug()
  if (!slug) {
    throw new Error(
      'TENANT_SLUG manquant : impossible de savoir quel client ce site doit afficher.',
    )
  }
  const known = cached.get(slug)
  if (known !== undefined) return known

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
  cached.set(slug, tenant.id)
  return tenant.id
}

/** Restrict a public query to the configured client. */
export const currentTenantWhere = async (payload: Payload): Promise<Where> => ({
  tenant: { equals: await currentTenantId(payload) },
})

/**
 * The public address of the client being rendered, from their tenant record.
 *
 * `SERVER_URL` names one site, which is right for a dedicated instance. A
 * mutualised one serves clients that each have their own domain: using the
 * shared value would make every published site advertise the platform's own
 * sitemap — the back-office address, which no visitor can reach.
 *
 * Returns null when nothing is recorded, so the caller keeps its own fallback
 * rather than inventing an address.
 */
export const currentTenantDomain = async (payload: Payload): Promise<string | null> => {
  const slug = await tenantSlug()
  if (!slug) return null
  const cachedDomain = domains.get(slug)
  if (cachedDomain !== undefined) return cachedDomain

  const result = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const raw = (result.docs[0] as { publicDomain?: string } | undefined)?.publicDomain?.trim()
  const domain = raw ? (/^https?:\/\//i.test(raw) ? raw : `https://${raw}`) : null
  domains.set(slug, domain)
  return domain
}

/** Test seam: forget the resolved tenants. */
export const resetTenantCache = (): void => {
  cached.clear()
  domains.clear()
}
