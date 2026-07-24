/**
 * Build a Lexical rich-text value from a simple list of sections. Used to
 * pre-fill generated legal pages with real prose the owner can then edit.
 */
type Section = { heading?: string; text?: string }

const textNode = (text: string) => ({
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
  version: 1,
})

const heading = (text: string) => ({
  type: 'heading',
  tag: 'h2',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: [textNode(text)],
})

const paragraph = (text: string) => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  textFormat: 0,
  children: [textNode(text)],
})

export const buildRichText = (sections: Section[]) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: sections.flatMap((section) => {
      const nodes: unknown[] = []
      if (section.heading) nodes.push(heading(section.heading))
      if (section.text) nodes.push(paragraph(section.text))
      return nodes
    }),
  },
})
