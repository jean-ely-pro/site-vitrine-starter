/** Format an ISO date as a long French date, e.g. "3 mars 2026". Empty if invalid. */
export const formatFrenchDate = (iso: string | null | undefined): string => {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    date,
  )
}
