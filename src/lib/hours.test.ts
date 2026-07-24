import { describe, expect, it } from 'vitest'

import { DAY_LABELS_FR, DAY_SCHEMA_ORG, formatDayHours, type WeekDay } from './hours'

const day = (over: Partial<WeekDay>): WeekDay => ({ day: 'monday', closed: false, slots: [], ...over })

describe('formatDayHours', () => {
  it('shows "Fermé" when closed', () => {
    expect(formatDayHours(day({ closed: true }))).toBe('Fermé')
  })
  it('shows "Fermé" when there are no slots', () => {
    expect(formatDayHours(day({ slots: [] }))).toBe('Fermé')
  })
  it('joins slots with an en dash and comma', () => {
    expect(
      formatDayHours(day({ slots: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '18:00' }] })),
    ).toBe('09:00 – 12:00, 14:00 – 18:00')
  })
})

describe('day maps', () => {
  it('maps to schema.org day codes', () => {
    expect(DAY_SCHEMA_ORG.monday).toBe('Monday')
    expect(DAY_SCHEMA_ORG.sunday).toBe('Sunday')
  })
  it('has a French label for every day', () => {
    expect(DAY_LABELS_FR.wednesday).toBe('Mercredi')
    expect(Object.keys(DAY_LABELS_FR)).toHaveLength(7)
  })
})
