import { describe, expect, it } from 'vitest'

import { payloadSecret } from './payload.config'

/**
 * The secret signing every authentication token.
 *
 * The failure guarded here is silent: an empty secret lets the application boot
 * and sign its tokens with a guessable key. Nothing logs, nothing breaks — the
 * first sign of trouble would be a forged token being accepted.
 */

describe('secret de signature', () => {
  it('utilise le secret fourni', () => {
    expect(payloadSecret({ PAYLOAD_SECRET: 's3cr3t' })).toBe('s3cr3t')
  })

  it('refuse de démarrer en production sans secret', () => {
    expect(() => payloadSecret({ NODE_ENV: 'production' })).toThrow(/PAYLOAD_SECRET manquant/)
  })

  it('refuse en production un secret vide ou fait d’espaces', () => {
    // `PAYLOAD_SECRET=` dans un .env, ou une substitution qui n'a rien donné :
    // la variable existe, mais ne signe rien.
    for (const value of ['', '   ']) {
      expect(() => payloadSecret({ NODE_ENV: 'production', PAYLOAD_SECRET: value })).toThrow(
        /PAYLOAD_SECRET manquant/,
      )
    }
  })

  it('laisse la construction de l’image aboutir sans secret', () => {
    // `next build` charge cette configuration et n'a pas de secret à sa
    // disposition : le stage builder du Dockerfile n'est pas NODE_ENV=production.
    // Exiger le secret ici casserait la publication de l'image.
    expect(payloadSecret({})).toBeTruthy()
  })
})
