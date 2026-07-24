'use client'

import React, { useState } from 'react'

/**
 * Admin control above the inbox: sends a message through the real public contact
 * endpoint so the owner can confirm the whole chain works (form → storage →
 * notification e-mail) and see a message land in the list.
 */
export const SendTestMessage: React.FC = () => {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const send = async () => {
    setState('sending')
    try {
      const res = await fetch('/api/messages/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Message de test',
          email: 'test@exemple.fr',
          message: 'Ceci est un message de test envoyé depuis l’administration.',
          consent: true,
        }),
      })
      if (!res.ok) {
        setState('error')
        return
      }
      setState('done')
      // Let the success note show briefly, then refresh to reveal the message.
      setTimeout(() => window.location.reload(), 1200)
    } catch {
      setState('error')
    }
  }

  return (
    <div style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <button type="button" className="btn btn--style-secondary" onClick={send} disabled={state === 'sending'}>
        {state === 'sending' ? 'Envoi…' : 'Envoyer un message test'}
      </button>
      {state === 'done' ? (
        <span style={{ color: '#15803D' }}>Message de test envoyé — actualisation…</span>
      ) : null}
      {state === 'error' ? (
        <span style={{ color: '#B91C1C' }}>L’envoi du test a échoué.</span>
      ) : null}
    </div>
  )
}
