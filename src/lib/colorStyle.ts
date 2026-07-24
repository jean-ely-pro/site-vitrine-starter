import type { Couleur } from '../payload-types'

/**
 * Build the CSS that carries the owner's brand colours. Injected once in the
 * document head, it overrides the fallbacks in styles.css so every `bg-brand` /
 * `text-ink` utility follows the Couleurs global.
 */
export const brandColorStyle = (couleurs: Couleur): string =>
  `:root{` +
  `--brand-primary:${couleurs.primary};` +
  `--brand-secondary:${couleurs.secondary};` +
  `--brand-text:${couleurs.text};` +
  `--brand-background:${couleurs.background};` +
  `}`
