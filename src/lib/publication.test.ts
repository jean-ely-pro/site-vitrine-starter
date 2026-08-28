import { describe, expect, it, vi } from 'vitest'

import { publicationConfigured, readPublication, requestPublication } from './publication'

/**
 * Asking the central host to publish this site.
 *
 * The failure that matters is the reassuring one: an unreachable central, or one
 * that has not been set up, must never read as « en ligne ». The owner would
 * believe their visitors see changes that never left this container.
 */

const env = {
  CENTRAL_PUBLISH_URL: 'http://gateway/_central/publish',
  CENTRAL_PUBLISH_TOKEN: 'jeton',
}

const responding = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch

describe('publication depuis l’administration', () => {
  it('n’est configurée que si l’adresse et le jeton sont fournis', () => {
    expect(publicationConfigured(env)).toBe(true)
    expect(publicationConfigured({ CENTRAL_PUBLISH_URL: 'http://x' })).toBe(
      false,
    )
    expect(publicationConfigured({})).toBe(false)
  })

  it('se déclare indisponible hors d’une installation rattachée', async () => {
    const fetchFn = vi.fn() as unknown as typeof fetch
    // Un poste de développement n'a pas de central à qui demander : proposer le
    // bouton n'y mènerait qu'à une erreur.
    expect(await readPublication({}, fetchFn)).toEqual({
      state: 'unavailable',
    })
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('transmet le jeton, et jamais le client', async () => {
    const fetchFn = responding(200, { state: 'idle' })
    await requestPublication(env, fetchFn)

    const [url, init] = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('http://gateway/_central/publish')
    expect((init as RequestInit).method).toBe('POST')
    expect((init as RequestInit).headers).toMatchObject({ 'x-publish-token': 'jeton' })
    // Le slug vient du nom d'hôte, côté central. L'envoyer d'ici laisserait une
    // instance publier le site d'un autre client.
    expect((init as RequestInit).body ?? null).toBeNull()
  })

  it('relaie l’état renvoyé par le central', async () => {
    const state = { state: 'running', startedAt: '2026-08-06T10:00:00.000Z' }
    expect(await readPublication(env, responding(200, state))).toEqual(state)
  })

  it('traduit un 503 en « non disponible », pas en échec', async () => {
    // Le central répond ainsi quand la publication n'y est pas configurée :
    // annoncer un échec enverrait le gérant chercher une panne inexistante.
    expect(await readPublication(env, responding(503, {}))).toEqual({ state: 'unavailable' })
  })

  it('signale un refus du central comme un échec', async () => {
    const result = await requestPublication(env, responding(403, {}))
    expect(result.state).toBe('failed')
    expect(result.error).toMatch(/403/)
  })

  it('signale un central injoignable plutôt que de rester muet', async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error('ECONNREFUSED')
    }) as unknown as typeof fetch

    const result = await requestPublication(env, fetchFn)
    expect(result.state).toBe('failed')
    expect(result.error).toMatch(/ECONNREFUSED/)
  })
})
