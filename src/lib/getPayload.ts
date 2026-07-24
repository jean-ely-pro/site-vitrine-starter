import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Local Payload instance for server components and route handlers. Payload
 * caches the instance internally, so calling this per request is cheap. Never
 * import this from Edge code — Payload needs the full Node runtime.
 */
export const getPayloadClient = async () => getPayload({ config: configPromise })
