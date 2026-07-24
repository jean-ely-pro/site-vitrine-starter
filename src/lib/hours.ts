import type { Horaire } from '../payload-types'

export type WeekDay = NonNullable<Horaire['week']>[number]

export const DAY_LABELS_FR: Record<WeekDay['day'], string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
}

// schema.org day codes for the LocalBusiness openingHoursSpecification.
export const DAY_SCHEMA_ORG: Record<WeekDay['day'], string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

/** Human-readable hours for one day, e.g. "09:00 – 12:00, 14:00 – 18:00". */
export const formatDayHours = (day: WeekDay): string => {
  if (day.closed || !day.slots || day.slots.length === 0) return 'Fermé'
  return day.slots.map((s) => `${s.from} – ${s.to}`).join(', ')
}
