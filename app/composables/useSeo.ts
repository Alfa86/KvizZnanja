interface PostavkeSeo {
  naslov: string
  opis: string
  // Stranice koje ovise o URL parametrima (kviz, rezultati) ne trebaju u tražilice
  indeksiraj?: boolean
  // Schema.org objekti; svaki postaje zaseban <script type="application/ld+json">
  strukturirano?: Record<string, unknown>[]
}

export function useApsolutniUrl() {
  const adresa = useRuntimeConfig().public.siteUrl.replace(/\/+$/, '')
  return (put: string) => adresa + (put.startsWith('/') ? put : `/${put}`)
}

export function useSeo(p: PostavkeSeo) {
  const route = useRoute()
  const apsolutni = useApsolutniUrl()
  const url = apsolutni(route.path)
  const indeksiraj = p.indeksiraj ?? true

  useSeoMeta({
    title: p.naslov,
    description: p.opis,
    robots: indeksiraj ? 'index, follow, max-image-preview:large' : 'noindex, follow',
    ogType: 'website',
    ogSiteName: NAZIV_STRANICE,
    ogLocale: 'hr_HR',
    ogTitle: p.naslov,
    ogDescription: p.opis,
    ogUrl: url,
    ogImage: apsolutni('/og-slika.png'),
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: 'Kviz znanja – Pokaži što znaš! Vježbaj kroz igru.',
    twitterCard: 'summary_large_image'
  })

  useHead({
    link: indeksiraj ? [{ rel: 'canonical', href: url }] : [],
    script: (p.strukturirano ?? []).map(podaci => ({
      type: 'application/ld+json',
      innerHTML: JSON.stringify({ '@context': 'https://schema.org', ...podaci })
    }))
  })
}

// Navigacijski put (Početna › 4. razred › Matematika) za rezultate pretraživanja
export function mrvice(apsolutni: (put: string) => string, koraci: { naziv: string, put: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    'itemListElement': koraci.map((k, i) => ({
      '@type': 'ListItem',
      'position': i + 1,
      'name': k.naziv,
      'item': apsolutni(k.put)
    }))
  }
}
