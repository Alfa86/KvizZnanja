import { kljucLekcije, ukupnoPitanja } from '../../app/utils/kurikulum'

// Sažetak stranice u Markdownu za AI asistente i tražilice odgovora (format llms.txt)
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event).public
  const url = adresaStranice(config.siteUrl)

  const indeks = izradiIndeksPitanja()
  const sadrzaj = razrediSaSadrzajem(indeks)
  // Navode se samo lekcije za koje već postoje pitanja
  const lekcijeSPitanjima = (razred: number, p: (typeof sadrzaj)[number]['predmeti'][number]) =>
    p.lekcije.filter(l => ukupnoPitanja(indeks, kljucLekcije(razred, p.id, l.id)) > 0).map(l => l.naziv).join('; ')

  const razredi = sadrzaj.flatMap(r => [
    `### ${r.broj}. razred`,
    '',
    `- [Svi predmeti za ${r.broj}. razred](${url(`/razred/${r.broj}`)})`,
    ...r.predmeti.map(p =>
      `- [${p.naziv}, ${r.broj}. razred](${url(`/razred/${r.broj}/${p.id}`)}): ${lekcijeSPitanjima(r.broj, p)}`
    ),
    ''
  ])

  const pitanja = cestaPitanja(sadrzaj, Boolean(config.keksPayUrl)).flatMap(p => [`### ${p.pitanje}`, '', p.odgovor, ''])

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return [
    `# ${NAZIV_STRANICE}`,
    '',
    `> ${OPIS_STRANICE}`,
    '',
    'Stranica je na hrvatskom jeziku i namijenjena je učenicima osnovne škole, roditeljima i učiteljima. '
    + 'Kviz se slaže od odabranih lekcija, težine (lagano, srednje, teško) i broja pitanja (10, 20 ili 30). '
    + 'Svako pitanje ima četiri ponuđena odgovora, neobavezan savjet i objašnjenje točnog odgovora.',
    '',
    '## Razredi i predmeti',
    '',
    ...razredi,
    '## Česta pitanja',
    '',
    ...pitanja
  ].join('\n')
})
