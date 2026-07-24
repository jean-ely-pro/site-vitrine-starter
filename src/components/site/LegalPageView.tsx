import { RichText } from '@payloadcms/richtext-lexical/react'

import type { LegalPage } from '../../payload-types'

/** Renders a legal page: its single <h1> title and its rich-text body. */
export const LegalPageView = ({ page }: { page: LegalPage }) => (
  <article className="mx-auto max-w-3xl px-6 py-12">
    <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
    {page.content ? <RichText data={page.content} className="rich-text mt-8" /> : null}
  </article>
)
