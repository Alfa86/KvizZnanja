// Kviz i rezultati ovise o URL parametrima pa se ne indeksiraju; AI asistenti smiju čitati javni sadržaj
export default defineEventHandler((event) => {
  const url = adresaStranice(useRuntimeConfig(event).public.siteUrl)

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /kviz',
    'Disallow: /rezultati',
    'Disallow: /pregled',
    '',
    `Sitemap: ${url('/sitemap.xml')}`,
    ''
  ].join('\n')
})
