import { randomBytes } from 'crypto'

import type { Endpoint, PayloadRequest } from 'payload'
import { generateSecret, generateURI, verifySync } from 'otplib'
import QRCode from 'qrcode'

// Label shown inside the user's authenticator app (Google Authenticator, etc.).
const ISSUER = 'Site Vitrine'

const unauthorized = () =>
  Response.json({ message: 'Vous devez être connecté.' }, { status: 401 })

const readBody = async (req: PayloadRequest): Promise<Record<string, unknown>> => {
  try {
    return typeof req.json === 'function' ? ((await req.json()) as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

const generateBackupCode = (): string =>
  randomBytes(5).toString('hex').replace(/(.{5})/, '$1-').toUpperCase()

/**
 * Step 1 — start enrolment. Generates a fresh TOTP secret, stores it as
 * "pending" (2FA not enabled yet) and returns a QR code to scan.
 */
export const twoFactorSetup: Endpoint = {
  path: '/mfa/setup',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return unauthorized()

    const secret = generateSecret()
    const otpauth = generateURI({ issuer: ISSUER, label: req.user.email, secret })
    const qrDataUrl = await QRCode.toDataURL(otpauth)

    await req.payload.update({
      collection: 'users',
      id: req.user.id,
      data: { twoFactorSecret: secret, twoFactorEnabled: false },
      overrideAccess: true,
    })

    return Response.json({ otpauth, qrDataUrl })
  },
}

/**
 * Step 2 — confirm enrolment. The user types the 6-digit code from their app;
 * if it matches the pending secret, 2FA is enabled and backup codes are issued.
 */
export const twoFactorVerify: Endpoint = {
  path: '/mfa/verify',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return unauthorized()

    const body = await readBody(req)
    const token = String(body.token ?? '').replace(/\s/g, '')

    const user = await req.payload.findByID({
      collection: 'users',
      id: req.user.id,
      overrideAccess: true,
      showHiddenFields: true,
    })

    const secret = (user as { twoFactorSecret?: string }).twoFactorSecret
    if (!secret) {
      return Response.json(
        { message: 'Aucune configuration en cours. Relancez l’activation.' },
        { status: 400 },
      )
    }

    if (!verifySync({ secret, token, epochTolerance: 30 }).valid) {
      return Response.json({ message: 'Code invalide. Vérifiez l’heure de votre téléphone et réessayez.' }, { status: 400 })
    }

    const backupCodes = Array.from({ length: 8 }, generateBackupCode)

    await req.payload.update({
      collection: 'users',
      id: req.user.id,
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: backupCodes.map((code) => ({ code, used: false })),
      },
      overrideAccess: true,
    })

    return Response.json({ success: true, backupCodes })
  },
}

/** Turn 2FA off and wipe the secret and backup codes. */
export const twoFactorDisable: Endpoint = {
  path: '/mfa/disable',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return unauthorized()

    await req.payload.update({
      collection: 'users',
      id: req.user.id,
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: null },
      overrideAccess: true,
    })

    return Response.json({ success: true })
  },
}
