'use client'

import { useFormModified } from '@payloadcms/ui'
import { useEffect } from 'react'

/**
 * Warns before the browser leaves (refresh, tab close, back) while the form has
 * unsaved changes. Payload already guards in-admin navigation; this covers the
 * hard-navigation case. Renders nothing.
 */
export const UnsavedChangesGuard: React.FC = () => {
  const modified = useFormModified()

  useEffect(() => {
    if (!modified) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [modified])

  return null
}
