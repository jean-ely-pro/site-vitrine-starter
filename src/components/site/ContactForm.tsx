'use client'

import React, { useState } from 'react'

// In the static model the form posts to the central editing server, whose URL
// is baked in at build time. Empty means same-origin (development).
const CONTACT_API = process.env.NEXT_PUBLIC_CONTACT_API || ''
const ENDPOINT = `${CONTACT_API}/api/messages/contact`

type Status = 'idle' | 'sending' | 'sent' | 'error'

/**
 * Accessible contact form. Posts as JSON to the central contact endpoint, shows
 * inline success/error, and carries a honeypot the server checks. The consent
 * checkbox is never pre-checked (RGPD) and links to the privacy policy.
 */
export const ContactForm = ({ privacyHref }: { privacyHref?: string | null }) => {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string>('')

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    setStatus('sending')
    setError('')

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          message: data.get('message'),
          consent: data.get('consent') === 'on',
          website: data.get('website'), // honeypot
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string }
        setError(body.message || 'L’envoi a échoué. Merci de réessayer.')
        setStatus('error')
        return
      }
      form.reset()
      setStatus('sent')
    } catch {
      setError('L’envoi a échoué. Vérifiez votre connexion et réessayez.')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <p role="status" className="rounded-md border border-black/10 bg-brand/10 px-4 py-3">
        Merci, votre message a bien été envoyé. Nous vous répondrons rapidement.
      </p>
    )
  }

  const fieldClass = 'mt-1 w-full rounded-md border border-black/20 px-3 py-2'

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4" noValidate>
      {/* Honeypot: hidden from users, tempting to bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px]" style={{ position: 'absolute', left: '-9999px' }}>
        <label>
          Ne remplissez pas ce champ
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label htmlFor="cf-name" className="font-medium">
          Nom
        </label>
        <input id="cf-name" name="name" type="text" required autoComplete="name" className={fieldClass} />
      </div>

      <div>
        <label htmlFor="cf-email" className="font-medium">
          E-mail
        </label>
        <input id="cf-email" name="email" type="email" required autoComplete="email" className={fieldClass} />
      </div>

      <div>
        <label htmlFor="cf-message" className="font-medium">
          Message
        </label>
        <textarea id="cf-message" name="message" required rows={5} className={fieldClass} />
      </div>

      <div className="flex items-start gap-2">
        <input id="cf-consent" name="consent" type="checkbox" required className="mt-1" />
        <label htmlFor="cf-consent">
          J’accepte que mes informations soient utilisées pour me recontacter.{' '}
          {privacyHref ? (
            <a href={privacyHref} className="text-brand underline">
              Politique de confidentialité
            </a>
          ) : null}
        </label>
      </div>

      {status === 'error' ? (
        <p role="alert" className="font-medium text-[#B91C1C]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="inline-block rounded-md bg-brand px-6 py-3 font-semibold text-white shadow transition-shadow hover:shadow-lg disabled:cursor-not-allowed"
      >
        {status === 'sending' ? 'Envoi…' : 'Envoyer'}
      </button>
    </form>
  )
}
