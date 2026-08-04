import { describe, expect, it } from 'vitest'

import { guardTenantEscalation } from './accessGuards'

/**
 * Privilege escalation at account creation.
 *
 * Field-level `access.update` on `role` covers edits, not creation — a hole the
 * analysed repository left open. These tests describe what a client's
 * administrator must not be able to do when creating an account.
 */

const call = (args: {
  data: Record<string, unknown>
  user: unknown
  existingUsers?: number
  operation?: string
}) =>
  (guardTenantEscalation as unknown as (a: unknown) => Promise<Record<string, unknown>>)({
    data: args.data,
    operation: args.operation ?? 'create',
    req: {
      user: args.user,
      payload: {
        count: async () => ({ totalDocs: args.existingUsers ?? 5 }),
      },
    },
  })

const superAdmin = { id: 1, role: 'super-admin' }
const boulangerAdmin = { id: 2, role: 'admin', tenants: [{ tenant: 10 }] }

describe('création du premier compte', () => {
  it('devient super-administrateur, sans authentification', async () => {
    // Sinon une installation neuve n'a personne pour se connecter.
    const data = await call({ data: { email: 'a@b.c' }, user: null, existingUsers: 0 })
    expect(data.role).toBe('super-admin')
  })

  it('ne s’applique plus dès qu’un compte existe', async () => {
    await expect(call({ data: { email: 'a@b.c' }, user: null, existingUsers: 1 })).rejects.toThrow(
      /Authentification requise/,
    )
  })
})

describe('escalade de privilèges', () => {
  it('un administrateur de client ne peut pas créer de super-administrateur', async () => {
    await expect(
      call({ data: { email: 'x@y.z', role: 'super-admin' }, user: boulangerAdmin }),
    ).rejects.toThrow(/Seul un super-administrateur/)
  })

  it("il ne peut pas rattacher un compte au client d'un autre", async () => {
    await expect(
      call({ data: { email: 'x@y.z', role: 'editor', tenants: [11] }, user: boulangerAdmin }),
    ).rejects.toThrow(/vos propres clients/i)
  })

  it('il peut créer un éditeur sur son propre client', async () => {
    const data = await call({
      data: { email: 'x@y.z', role: 'editor', tenants: [10] },
      user: boulangerAdmin,
    })
    expect(data.role).toBe('editor')
  })

  it('un compte créé sans client hérite de celui de son créateur', async () => {
    // Un compte orphelin serait invisible pour l'administrateur qui l'a créé.
    const data = await call({ data: { email: 'x@y.z', role: 'editor' }, user: boulangerAdmin })
    expect(data.tenants).toEqual([10])
  })

  it("le super-admin de l'agence n'est pas contraint", async () => {
    const data = await call({
      data: { email: 'x@y.z', role: 'super-admin', tenants: [11] },
      user: superAdmin,
    })
    expect(data.role).toBe('super-admin')
  })
})

describe('portée du garde', () => {
  it('ne s’applique qu’à la création', async () => {
    // Les modifications sont couvertes par l'access du champ `role`.
    const data = await call({
      data: { role: 'super-admin' },
      user: boulangerAdmin,
      operation: 'update',
    })
    expect(data.role).toBe('super-admin')
  })
})
