// Popis javnih stranica za tražilice: početna, razredi sa sadržajem i njihovi predmeti
export default defineEventHandler((event) => {
  const url = adresaStranice(useRuntimeConfig(event).public.siteUrl)

  const putevi = ['/']
  for (const r of razrediSaSadrzajem()) {
    putevi.push(`/razred/${r.broj}`)
    for (const p of r.predmeti) putevi.push(`/razred/${r.broj}/${p.id}`)
  }

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...putevi.map(p => `  <url><loc>${url(p)}</loc></url>`),
    '</urlset>',
    ''
  ].join('\n')
})
