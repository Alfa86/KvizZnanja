import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()]
  },
  app: {
    head: {
      htmlAttrs: { lang: 'hr' },
      title: 'Kviz znanja',
      meta: [
        { name: 'description', content: 'Kvizovi iz školskih predmeta za učenike od 1. do 8. razreda.' },
        { name: 'theme-color', content: '#4338CA' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },
  // Javna adresa stranice za kanonske poveznice, sitemap i robots.txt; postavlja se varijablom NUXT_PUBLIC_SITE_URL pri buildu
  runtimeConfig: {
    public: {
      siteUrl: 'http://localhost:3000',
      // KEKS Pay poveznica za donacije (može se zamijeniti s NUXT_PUBLIC_KEKS_PAY_URL); kad je prazna, podrška se nigdje ne prikazuje
      keksPayUrl: 'https://kekspay.hr/joinevent?eventcode=MoMFLgqAyw'
    }
  },
  // Datoteke za tražilice i AI asistente generiraju se iz kurikuluma pri statičkom buildu
  nitro: {
    prerender: {
      routes: ['/sitemap.xml', '/robots.txt', '/llms.txt', '/pitanja/indeks.json']
    }
  },
  // Stranice za pregled sadržaja (/pregled) služe samo administratoru i ne ulaze u produkcijski build
  $production: {
    hooks: {
      'pages:extend'(stranice) {
        const zaPregled = stranice.filter(s => s.path.startsWith('/pregled'))
        for (const s of zaPregled) stranice.splice(stranice.indexOf(s), 1)
      }
    }
  },
  // Kviz i rezultati ovise o URL parametrima i sessionStorageu, pa se renderiraju samo u pregledniku
  routeRules: {
    '/kviz': { ssr: false },
    '/rezultati': { ssr: false },
    '/pregled/**': { ssr: false }
  }
})
