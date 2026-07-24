/**
 * Detect non-explicit link labels ("cliquez ici", "en savoir plus"…) in a
 * Lexical rich-text value. The training teaches that link text should describe
 * its destination; the editor surfaces these as a non-blocking warning.
 */
const VAGUE_LABELS = new Set([
  'cliquez ici',
  'cliquer ici',
  'clique ici',
  'ici',
  'cliquez',
  'en savoir plus',
  'en savoir +',
  'lire la suite',
  'lire plus',
  'voir plus',
  'plus',
  'ce lien',
  'lien',
  'click here',
  'read more',
])

type LexNode = { type?: string; text?: string; children?: LexNode[] }

const nodeText = (node: LexNode): string => {
  if (typeof node.text === 'string') return node.text
  return (node.children ?? []).map(nodeText).join('')
}

const walk = (node: LexNode, found: string[]): void => {
  if (node.type === 'link' || node.type === 'autolink') {
    const label = nodeText(node).trim()
    if (label && VAGUE_LABELS.has(label.toLowerCase())) found.push(label)
  }
  ;(node.children ?? []).forEach((child) => walk(child, found))
}

/** Return the vague link labels found in a Lexical value (empty if none/invalid). */
export const findVagueLinkLabels = (value: unknown): string[] => {
  const root = (value as { root?: LexNode } | null)?.root
  if (!root) return []
  const found: string[] = []
  walk(root, found)
  return found
}
