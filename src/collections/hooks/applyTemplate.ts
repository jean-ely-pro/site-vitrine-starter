import type { CollectionBeforeChangeHook } from 'payload'

import { getTemplateBlocks, type PageTemplate } from '../../lib/pageTemplates'

/**
 * On page creation, if a template was chosen and the layout is still empty,
 * pre-fill the blocks from that template. Runs only on create so editing an
 * existing page never overwrites the owner's content.
 */
export const applyTemplate: CollectionBeforeChangeHook = ({ data, operation }) => {
  if (operation !== 'create') return data

  const template = (data.template ?? 'blank') as PageTemplate
  const hasBlocks = Array.isArray(data.layout) && data.layout.length > 0

  if (template !== 'blank' && !hasBlocks) {
    return { ...data, layout: getTemplateBlocks(template) }
  }

  return data
}
