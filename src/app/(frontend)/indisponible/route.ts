/**
 * La page servie quand le site d'un client n'est plus actif.
 *
 * Une route et non une page, pour une seule raison : le code HTTP. Une page
 * rendue par React répond 200, ce qui ferait indexer « Site indisponible »
 * comme le contenu légitime du site — et un client suspendu pour un impayé,
 * remis en service la semaine suivante, retrouverait ce texte dans les
 * résultats de recherche.
 *
 * 503 et non 404 : le site existe et peut revenir. Un 404 le ferait
 * désindexer. `Retry-After` dit aux robots de repasser plutôt que de conclure.
 * Un client archivé ne revient pas : 410 le dit mieux.
 *
 * Le HTML est écrit à la main : Next.js interdit `react-dom/server` dans une
 * route, et la page ne contient de toute façon ni donnée ni interaction.
 */
export const dynamic = 'force-dynamic'

const page = (archived: boolean) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Site indisponible</title>
<style>
  body { margin:0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
         background:#fff; color:#111; }
  main { min-height:100vh; display:flex; flex-direction:column; justify-content:center;
         align-items:center; text-align:center; padding:2rem 1.5rem; }
  h1 { font-size:1.875rem; font-weight:700; margin:0; letter-spacing:-0.02em; }
  p  { margin:1rem 0 0; font-size:1.125rem; color:#4b5563; max-width:34rem; }
  .note { margin-top:2rem; font-size:0.875rem; color:#6b7280; }
  @media (prefers-color-scheme: dark) {
    body { background:#0b0b0c; color:#f3f4f6; }
    p { color:#9ca3af; } .note { color:#6b7280; }
  }
</style>
</head>
<body>
<main>
  <h1>Site indisponible</h1>
  <p>${
    archived
      ? 'Ce site n’est plus en ligne.'
      : 'Ce site est momentanément indisponible. Merci de réessayer plus tard.'
  }</p>
  <p class="note">Si vous êtes le propriétaire de ce site, contactez votre prestataire.</p>
</main>
</body>
</html>`

export const GET = async (request: Request): Promise<Response> => {
  const archived = new URL(request.url).searchParams.get('etat') === 'archived'

  return new Response(page(archived), {
    status: archived ? 410 : 503,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      ...(archived ? {} : { 'retry-after': '3600' }),
      'cache-control': 'no-store',
    },
  })
}
