import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The header is a Next.js request API; the tests drive it directly.
let headerValue: string | null = null
vi.mock('next/headers', () => ({
  headers: async () => ({ get: (name: string) => (name === 'x-tenant-slug' ? headerValue : null) }),
}))


import { currentTenantId, currentTenantWhere, resetTenantCache, tenantSlug } from './currentTenant'

/**
 * Resolving which client the public site renders.
 *
 * The failure that matters here is silent: a deployment that cannot resolve its
 * tenant must stop, not fall back to a default. Falling back is how one client's
 * content ends up published under another client's domain.
 */

const payloadWith = (docs: Array<{ id: number }>) => {
  let calls = 0
  return {
    client: { find: async () => ({ docs: (calls++, docs) }) } as never,
    calls: () => calls,
  }
}

const original = process.env.TENANT_SLUG

beforeEach(() => {
  resetTenantCache()
})

afterEach(() => {
  if (original === undefined) delete process.env.TENANT_SLUG
  else process.env.TENANT_SLUG = original
  resetTenantCache()
})

describe('lecture du slug', () => {
  it("est lu à l'exécution, pas figé à la construction", async () => {
    // Même image pour tous les clients : une valeur figée au build ferait
    // afficher à chaque site le contenu du premier client.
    process.env.TENANT_SLUG = 'demo-boulanger'
    expect(await tenantSlug()).toBe('demo-boulanger')
    process.env.TENANT_SLUG = 'demo-fleuriste'
    expect(await tenantSlug()).toBe('demo-fleuriste')
  })

  it('ignore les espaces autour', async () => {
    process.env.TENANT_SLUG = '  demo-boulanger  '
    expect(await tenantSlug()).toBe('demo-boulanger')
  })
})

describe('en-tête X-Tenant-Slug (instance mutualisée)', () => {
  afterEach(() => {
    delete process.env.TENANT_FROM_HEADER
    headerValue = null
  })

  it("est ignoré tant qu'il n'est pas explicitement activé", async () => {
    // Une instance dédiée à un client ne doit pas changer de contenu parce
    // qu'une requête le demande : l'en-tête vient du réseau.
    headerValue = 'demo-fleuriste'
    process.env.TENANT_SLUG = 'demo-boulanger'
    expect(await tenantSlug()).toBe('demo-boulanger')
  })

  it('prime sur la configuration une fois activé', async () => {
    // Une seule instance sert tous les clients : son environnement ne peut pas
    // porter le slug de l'un sans priver les autres.
    process.env.TENANT_FROM_HEADER = 'true'
    headerValue = 'demo-fleuriste'
    process.env.TENANT_SLUG = 'demo-boulanger'
    expect(await tenantSlug()).toBe('demo-fleuriste')
  })

  it('retombe sur la configuration quand il est absent', async () => {
    process.env.TENANT_FROM_HEADER = 'true'
    headerValue = null
    process.env.TENANT_SLUG = 'demo-boulanger'
    expect(await tenantSlug()).toBe('demo-boulanger')
  })
})

describe('résolution', () => {
  it('échoue bruyamment quand le slug est absent', async () => {
    delete process.env.TENANT_SLUG
    const { client } = payloadWith([{ id: 10 }])
    await expect(currentTenantId(client)).rejects.toThrow(/TENANT_SLUG manquant/)
  })

  it('échoue bruyamment quand le client est introuvable', async () => {
    // Surtout ne pas retomber sur un client par défaut : le site publierait le
    // contenu de quelqu'un d'autre sous le mauvais domaine.
    process.env.TENANT_SLUG = 'client-inexistant'
    const { client } = payloadWith([])
    await expect(currentTenantId(client)).rejects.toThrow(/introuvable/)
  })

  it('rend un filtre utilisable directement dans une requête', async () => {
    process.env.TENANT_SLUG = 'demo-boulanger'
    const { client } = payloadWith([{ id: 10 }])
    expect(await currentTenantWhere(client)).toEqual({ tenant: { equals: 10 } })
  })

  it('ne réinterroge pas la base à chaque page', async () => {
    process.env.TENANT_SLUG = 'demo-boulanger'
    const { client, calls } = payloadWith([{ id: 10 }])
    await currentTenantId(client)
    await currentTenantId(client)
    await currentTenantId(client)
    expect(calls()).toBe(1)
  })

  it('remet en cause son cache si le slug change', async () => {
    // Sinon un changement de configuration continuerait de servir l'ancien
    // client jusqu'au redémarrage.
    process.env.TENANT_SLUG = 'demo-boulanger'
    const { client } = payloadWith([{ id: 10 }])
    expect(await currentTenantId(client)).toBe(10)

    process.env.TENANT_SLUG = 'demo-fleuriste'
    const autre = payloadWith([{ id: 20 }])
    expect(await currentTenantId(autre.client)).toBe(20)
  })
})
