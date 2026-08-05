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
// L'adresse publique et l'état du client, avec la date de leur dernière
// lecture : contrairement à l'identifiant, ils changent en cours de vie de
// l'instance. L'adresse est même renseignée après coup, une fois l'hébergement
// du client connu — souvent après le premier rendu.
const domains = new Map<string, string | null>()
const domainSeenAt = new Map<string, number>()
const statuses = new Map<string, string>()
const statusSeenAt = new Map<string, number>()
const TENANT_TTL_MS = 30_000

/**
 * Resolve the configured slug to a tenant id.
 *
 * Throws rather than falling back to a default. A silent fallback is how a
 * misconfigured deployment ends up publishing another client's content under
 * the wrong domain: the failure must be loud and immediate.
 */
/**
 * A client that exists but is no longer served.
 *
 * Its own type, so the public pages can tell it apart from a misconfiguration:
 * a suspended client is a deliberate state with a page of its own, while a
 * missing `TENANT_SLUG` is an error to fix.
 */
export class TenantNotServed extends Error {
  readonly status: string

  constructor(slug: string, status: string) {
    super(`Client « ${slug} » ${status === 'archived' ? 'archivé' : 'suspendu'} : site non servi.`)
    this.name = 'TenantNotServed'
    this.status = status
  }
}

export const currentTenantId = async (payload: Payload): Promise<number | string> => {
  const slug = await tenantSlug()
  if (!slug) {
    throw new Error(
      'TENANT_SLUG manquant : impossible de savoir quel client ce site doit afficher.',
    )
  }
  const known = cached.get(slug)
  if (known !== undefined) {
    await assertServed(payload, slug)
    return known
  }

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
  // Cette requête ramène déjà l'état : l'enregistrer évite de le redemander
  // aussitôt après, la résolution initiale ne coûtant ainsi qu'un aller-retour.
  const status = (tenant as { status?: string }).status ?? 'active'
  statuses.set(slug, status)
  statusSeenAt.set(slug, Date.now())
  if (status !== 'active') throw new TenantNotServed(slug, status)

  cached.set(slug, tenant.id)
  return tenant.id
}

/**
 * Refuse to serve a client whose state is not `active`.
 *
 * The field promised it — « Un client suspendu ou archivé n'est plus servi
 * publiquement » — while nothing enforced it: suspending had no effect at all,
 * and no warning said so. Suspension is what one does for an unpaid invoice or
 * at a client's request, so it has to actually stop the site.
 *
 * Only the editing instance and the platform render are covered. A site already
 * exported to static hosting is a set of files that no longer depends on this
 * server; taking it down is a separate act.
 */
const assertServed = async (payload: Payload, slug: string): Promise<void> => {
  // L'identifiant d'un client ne change jamais et se garde indéfiniment ; son
  // état, si. Le relire à chaque page coûterait une requête par affichage, ne
  // jamais le relire ferait attendre un redémarrage — d'où cette fenêtre
  // courte : une suspension s'applique en moins d'une minute, sans peser sur
  // le rendu.
  const now = Date.now()
  const seen = statusSeenAt.get(slug)
  if (seen !== undefined && now - seen < TENANT_TTL_MS) {
    const cachedStatus = statuses.get(slug)
    if (cachedStatus && cachedStatus !== 'active') throw new TenantNotServed(slug, cachedStatus)
    return
  }

  const result = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    select: { status: true },
  })
  const status = (result.docs[0] as { status?: string } | undefined)?.status ?? 'active'
  statuses.set(slug, status)
  statusSeenAt.set(slug, now)
  if (status !== 'active') throw new TenantNotServed(slug, status)
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

  // Même fenêtre que l'état : l'adresse est renseignée après la création du
  // client, souvent après le premier rendu. Sans expiration, le `null` mis en
  // cache à ce moment-là survivait à la correction, et le site continuait
  // d'annoncer le repli — l'adresse du back-office — jusqu'au redémarrage.
  const now = Date.now()
  const seen = domainSeenAt.get(slug)
  if (seen !== undefined && now - seen < TENANT_TTL_MS) {
    const cachedDomain = domains.get(slug)
    if (cachedDomain !== undefined) return cachedDomain
  }

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
  domainSeenAt.set(slug, now)
  return domain
}

/** Test seam: forget the resolved tenants. */
export const resetTenantCache = (): void => {
  cached.clear()
  domains.clear()
  domainSeenAt.clear()
  statuses.clear()
  statusSeenAt.clear()
}
