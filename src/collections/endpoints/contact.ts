import type { Endpoint, PayloadRequest } from 'payload'

import { currentTenantId } from '../../lib/currentTenant'

// Simple per-IP rate limit, in memory. The editing server is a single long-lived
// process, so a Map is enough; it resets on restart, which is acceptable here.
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()

const rateLimited = (ip: string): boolean => {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > MAX_PER_WINDOW
}

const clientIp = (req: PayloadRequest): string => {
  const fwd = req.headers?.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers?.get('x-real-ip') ?? 'unknown'
}

const isEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const badRequest = (message: string) => Response.json({ message }, { status: 400 })

const readBody = async (req: PayloadRequest): Promise<Record<string, unknown>> => {
  try {
    return typeof req.json === 'function' ? ((await req.json()) as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/**
 * Public contact submission. Reachable cross-origin from the client's static
 * site (see the `cors` config): validates, drops honeypot spam, rate-limits per
 * IP, stores the message, and best-effort emails a notification. Never a
 * third-party service, so no visitor data leaves the stack.
 */
export const contactEndpoint: Endpoint = {
  path: '/contact',
  method: 'post',
  handler: async (req) => {
    const body = await readBody(req)

    // Honeypot: real users never fill this hidden field. Pretend success so bots
    // get no signal, but store nothing.
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      return Response.json({ success: true })
    }

    if (rateLimited(clientIp(req))) {
      return Response.json(
        { message: 'Trop de messages envoyés. Réessayez dans quelques minutes.' },
        { status: 429 },
      )
    }

    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim()
    const message = String(body.message ?? '').trim()
    const consent = body.consent === true || body.consent === 'true'

    if (!name) return badRequest('Merci d’indiquer votre nom.')
    if (!isEmail(email)) return badRequest('Merci d’indiquer une adresse e-mail valide.')
    if (!message) return badRequest('Merci d’écrire votre message.')
    if (message.length > 5000) return badRequest('Votre message est trop long.')
    if (!consent) return badRequest('Merci de cocher la case de consentement pour envoyer.')

    // The tenant comes from the server's configuration, never from the request
    // body: a submitted tenant would let anyone drop messages into another
    // client's inbox. Without it the message would be orphaned and invisible.
    // Postgres ids are numeric; the resolver's wider type covers other adapters.
    const tenant = Number(await currentTenantId(req.payload))

    await req.payload.create({
      collection: 'messages',
      data: { tenant, name, email, message, consent: true, read: false },
      overrideAccess: true,
    })

    // Notify the site owner. Best-effort: a missing e-mail setup must not fail
    // the submission.
    try {
      const settings = await req.payload.find({
        collection: 'contact',
        where: { tenant: { equals: tenant } },
        limit: 1,
        overrideAccess: true,
      })
      const contact = settings.docs[0] ?? {}
      const to = (contact as { email?: string }).email || process.env.CONTACT_NOTIFY_EMAIL
      if (to) {
        await req.payload.sendEmail({
          to,
          subject: `Nouveau message de ${name}`,
          text: `Nom : ${name}\nE-mail : ${email}\n\n${message}`,
        })
      }
    } catch (err) {
      req.payload.logger.error({ err }, 'Échec de l’envoi de l’e-mail de notification de contact')
    }

    return Response.json({ success: true })
  },
}
