import type { TextField } from 'payload'

/**
 * A brand colour, stored as a hex string. The live contrast checker that warns
 * below 4.5:1 is a Lot 6 guardrail; here we only guarantee a valid hex value so
 * the public site can inject it as a CSS variable without sanitising at render.
 */
export const hexColorField = (config: {
  name: string
  label: string
  defaultValue: string
  description: string
}): TextField => ({
  name: config.name,
  type: 'text',
  label: config.label,
  required: true,
  defaultValue: config.defaultValue,
  admin: {
    description: config.description,
    placeholder: '#1D4ED8',
    components: {
      // Native colour picker + hex box, instead of a bare text field.
      Field: '/components/admin/ColorInput#ColorInput',
    },
  },
  validate: (value: string | null | undefined) => {
    if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value)) {
      return 'Utilisez un code couleur hexadécimal à 6 chiffres, par exemple #1D4ED8.'
    }
    return true
  },
})
