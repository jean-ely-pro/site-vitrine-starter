import type { Page } from '../../payload-types'
import type { SiteGlobals } from '../../lib/queries'
import { buildLocalBusinessJsonLd } from '../../lib/jsonLd'
import { BlockRenderer } from './BlockRenderer'

/**
 * Renders one published page: its LocalBusiness structured data, exactly one
 * <h1>, and its blocks. When the first block is a hero, that hero carries the
 * <h1>; otherwise the page title is rendered as the <h1>. Either way there is
 * one and only one <h1>, with no skipped heading levels below it.
 */
export const PageView = ({
  page,
  globals,
  serverUrl,
}: {
  page: Page
  globals: SiteGlobals
  serverUrl: string
}) => {
  const blocks = page.layout ?? []
  const heroFirst = blocks[0]?.blockType === 'hero'
  const jsonLd = buildLocalBusinessJsonLd(globals.identite, globals.contact, globals.horaires, serverUrl)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {!heroFirst ? (
        <div className="mx-auto w-full max-w-5xl px-6 pt-12">
          <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
        </div>
      ) : null}
      <BlockRenderer
        blocks={blocks}
        contact={globals.contact}
        horaires={globals.horaires}
        firstHeroAsH1={heroFirst}
      />
    </>
  )
}
