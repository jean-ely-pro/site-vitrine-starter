import type { Endpoint, PayloadRequest } from 'payload'

import { readPublication, requestPublication } from '../lib/publication'

/**
 * Publishing is the owner's own gesture on their own site, so the guard matches
 * the backups': the manager, and the agency above them. An editor writes content
 * but does not decide when the site goes out.
 */
const canPublish = (req: PayloadRequest): boolean =>
  req.user?.role === 'admin' || req.user?.role === 'super-admin'

const forbidden = () => Response.json({ message: 'Réservé au gérant du site.' }, { status: 403 })

const stateEndpoint: Endpoint = {
  path: '/publication/state',
  method: 'get',
  handler: async (req) => {
    if (!canPublish(req)) return forbidden()
    return Response.json(await readPublication())
  },
}

const startEndpoint: Endpoint = {
  path: '/publication/start',
  method: 'post',
  handler: async (req) => {
    if (!canPublish(req)) return forbidden()
    const result = await requestPublication()
    if (result.state === 'failed') {
      req.payload.logger.error({ err: result.error }, 'Publication refusée par le serveur central')
    } else {
      req.payload.logger.info(`Publication demandée par ${req.user?.email ?? 'inconnu'}`)
    }
    return Response.json(result)
  },
}

export const publicationEndpoints: Endpoint[] = [stateEndpoint, startEndpoint]
