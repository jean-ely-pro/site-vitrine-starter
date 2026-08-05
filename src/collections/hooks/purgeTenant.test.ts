import { describe, expect, it } from 'vitest'

import { guardTenantHasNoUsers, purgeTenantContent, tenantOwnedCollections } from './purgeTenant'

/**
 * Supprimer un client efface ses données.
 *
 * Sans cela, les clés étrangères en `ON DELETE set null` détachent les contenus
 * au lieu de les retirer — et un `tenant_id` nul ne correspond à aucun filtre
 * d'isolation, donc plus personne ne peut les voir ni les supprimer. Pour
 * `messages`, ce sont des adresses de visiteurs conservées indéfiniment.
 */

type Hook = (a: unknown) => Promise<unknown>

const payloadWith = (collections: Array<{ slug: string; fields: unknown[] }>) => {
  const deletes: Array<{ collection: string; where: unknown; overrideAccess?: boolean }> = []
  return {
    deletes,
    payload: {
      config: { collections },
      logger: { error: () => {} },
      count: async () => ({ totalDocs: 0 }),
      delete: async (args: { collection: string; where: unknown; overrideAccess?: boolean }) => {
        deletes.push(args)
        return { docs: [] }
      },
    },
  }
}

const avecTenant = (slug: string) => ({ slug, fields: [{ name: 'tenant', type: 'relationship' }] })
const sansTenant = (slug: string) => ({ slug, fields: [{ name: 'titre', type: 'text' }] })

describe('collections à purger', () => {
  it('se déduit de la configuration, pas d’une liste écrite à la main', () => {
    // Une collection ajoutée plus tard serait sinon oubliée en silence, et
    // l'oubli ne se verrait que sous la forme de données invisibles.
    const { payload } = payloadWith([
      avecTenant('pages'),
      avecTenant('messages'),
      sansTenant('sauvegardes'),
    ])
    expect(tenantOwnedCollections(payload as never)).toEqual(['pages', 'messages'])
  })

  it('exclut `tenants` et `users`', () => {
    // `tenants` est la collection supprimée elle-même ; `users` porte ses
    // clients dans un tableau et survit à la suppression de l'un d'eux.
    const { payload } = payloadWith([
      avecTenant('pages'),
      avecTenant('tenants'),
      avecTenant('users'),
    ])
    expect(tenantOwnedCollections(payload as never)).toEqual(['pages'])
  })
})

describe('purge du contenu', () => {
  it('supprime le contenu de chaque collection rattachée', async () => {
    const { payload, deletes } = payloadWith([avecTenant('pages'), avecTenant('messages')])
    await (purgeTenantContent as unknown as Hook)({ id: 7, req: { payload } })

    expect(deletes.map((d) => d.collection)).toEqual(['pages', 'messages'])
    expect(deletes[0].where).toEqual({ tenant: { equals: 7 } })
  })

  it('outrepasse les droits : le client n’existe déjà plus pour l’acteur', async () => {
    const { payload, deletes } = payloadWith([avecTenant('pages')])
    await (purgeTenantContent as unknown as Hook)({ id: 7, req: { payload } })
    expect(deletes[0].overrideAccess).toBe(true)
  })

  it('poursuit malgré l’échec d’une collection', async () => {
    // Ce qui reste derrière est invisible pour de bon : une purge partielle
    // vaut mieux qu'aucune.
    const vues: string[] = []
    const payload = {
      config: { collections: [avecTenant('pages'), avecTenant('messages')] },
      logger: { error: () => {} },
      delete: async ({ collection }: { collection: string }) => {
        vues.push(collection)
        if (collection === 'pages') throw new Error('table verrouillée')
        return { docs: [] }
      },
    }
    await (purgeTenantContent as unknown as Hook)({ id: 7, req: { payload } })
    expect(vues).toEqual(['pages', 'messages'])
  })
})

describe('comptes encore rattachés', () => {
  const reqAvec = (totalDocs: number) => ({
    payload: { count: async () => ({ totalDocs }) },
  })

  it('refuse la suppression tant qu’un compte y est rattaché', async () => {
    // Supprimer les comptes en effet de bord retirerait l'accès de personnes
    // réelles, ce que l'action ne dit pas faire.
    await expect(
      (guardTenantHasNoUsers as unknown as Hook)({ id: 7, req: reqAvec(2) }),
    ).rejects.toThrow(/2 compte\(s\) sont encore rattachés/)
  })

  it('mentionne l’archivage, qui n’efface rien', async () => {
    await expect(
      (guardTenantHasNoUsers as unknown as Hook)({ id: 7, req: reqAvec(1) }),
    ).rejects.toThrow(/archivez le client/)
  })

  it('laisse faire quand plus aucun compte n’y est rattaché', async () => {
    await expect(
      (guardTenantHasNoUsers as unknown as Hook)({ id: 7, req: reqAvec(0) }),
    ).resolves.toBeUndefined()
  })
})
