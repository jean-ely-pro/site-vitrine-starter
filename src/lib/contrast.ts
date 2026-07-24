/**
 * WCAG contrast ratio between two hex colours. Used by the live checker in the
 * Couleurs settings and by the accessibility test. AA body text needs >= 4.5:1.
 */
export const AA_CONTRAST = 4.5

const parseHex = (hex: string): [number, number, number] | null => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return null
  const int = parseInt(m[1], 16)
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}

const toLinear = (channel: number): number => {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const luminance = (rgb: [number, number, number]): number =>
  0.2126 * toLinear(rgb[0]) + 0.7152 * toLinear(rgb[1]) + 0.0722 * toLinear(rgb[2])

/** Contrast ratio (1–21), or null if either colour is not a valid hex. */
export const contrastRatio = (a: string, b: string): number | null => {
  const rgbA = parseHex(a)
  const rgbB = parseHex(b)
  if (!rgbA || !rgbB) return null
  const l1 = luminance(rgbA)
  const l2 = luminance(rgbB)
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}
