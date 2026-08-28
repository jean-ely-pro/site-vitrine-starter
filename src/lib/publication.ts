/**
 * Talking to the central host about publishing this site.
 *
 * Publishing means snapshotting this instance and uploading the result to the
 * client's hosting. Neither is ours to do: the deployment credentials and the
 * client's configuration live on the central host, deliberately outside this
 * container. So we ask, and report back what we are told.
 *
 * Without `CENTRAL_PUBLISH_URL` the feature is simply absent from the admin —
 * an instance running on a developer's machine has no central to ask.
 */

export type PublicationState = 'idle' | 'running' | 'done' | 'failed' | 'unavailable'

export type Publication = {
  state: PublicationState
  startedAt?: string
  endedAt?: string
  error?: string
  output?: string
}

/**
 * Only what this module reads, so a test can pass a plain object rather than a
 * whole ProcessEnv. The index signature keeps `process.env` assignable to it.
 */
export type PublicationEnv = {
  CENTRAL_PUBLISH_URL?: string
  CENTRAL_PUBLISH_TOKEN?: string
  [key: string]: string | undefined
}

/** Configured only where a central host actually stands behind this instance. */
export const publicationConfigured = (env: PublicationEnv = process.env): boolean =>
  Boolean(env.CENTRAL_PUBLISH_URL && env.CENTRAL_PUBLISH_TOKEN)

const endpoint = (env: PublicationEnv): string => String(env.CENTRAL_PUBLISH_URL)

/**
 * The central host answers for the client it routes to; this instance never
 * names it. The slug is settled by the hostname the request arrived on, so an
 * instance cannot publish another client's site by asking nicely.
 */
const call = async (
  method: 'GET' | 'POST',
  env: PublicationEnv,
  fetchFn: typeof fetch,
): Promise<Publication> => {
  if (!publicationConfigured(env)) return { state: 'unavailable' }

  try {
    const res = await fetchFn(endpoint(env), {
      method,
      headers: { 'x-publish-token': String(env.CENTRAL_PUBLISH_TOKEN) },
    })

    if (!res.ok) {
      // 503 is the central saying the feature is not set up on its side. Showing
      // « échec » there would send the client chasing a publication that was
      // never attempted.
      if (res.status === 503) return { state: 'unavailable' }
      return {
        state: 'failed',
        error: `Le serveur central a répondu ${res.status}.`,
      }
    }

    return (await res.json()) as Publication
  } catch (err) {
    return {
      state: 'failed',
      error: err instanceof Error ? err.message : 'Serveur central injoignable.',
    }
  }
}

/** Where the publication of this site stands. */
export const readPublication = (
  env: PublicationEnv = process.env,
  fetchFn: typeof fetch = fetch,
): Promise<Publication> => call('GET', env, fetchFn)

/** Ask the central host to publish this site. */
export const requestPublication = (
  env: PublicationEnv = process.env,
  fetchFn: typeof fetch = fetch,
): Promise<Publication> => call('POST', env, fetchFn)
