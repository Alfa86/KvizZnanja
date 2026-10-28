import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import kurikulumJson from '../../app/data/kurikulum.json'
import type { IndeksPitanja, RazredIzvor, Tezina } from '../../app/types'
import { kljucLekcije, predmetImaPitanja, pripremiRazrede } from '../../app/utils/kurikulum'

export const sviRazredi = pripremiRazrede((kurikulumJson as { razredi: RazredIzvor[] }).razredi)

// Datoteke s pitanjima čitaju se pri buildu (statička stranica), pa je korijen mapa projekta
export function izradiIndeksPitanja(): IndeksPitanja {
  const korijen = join(process.cwd(), 'public', 'pitanja')
  const indeks: IndeksPitanja = {}
  const datoteke = readdirSync(korijen, { recursive: true, encoding: 'utf8' }).filter(f => f.endsWith('.json') && !f.startsWith('indeks'))
  for (const datoteka of datoteke) {
    const [razred, predmetId, ime] = relative(korijen, join(korijen, datoteka)).split(sep)
    if (!razred || !predmetId || !ime) continue
    const { pitanja } = JSON.parse(readFileSync(join(korijen, datoteka), 'utf8')) as { pitanja: { tezina: Tezina }[] }
    const broj = { lagano: 0, srednje: 0, tesko: 0 }
    for (const p of pitanja) broj[p.tezina]++
    indeks[kljucLekcije(Number(razred), predmetId, ime.replace(/\.json$/, ''))] = broj
  }
  return indeks
}

// Razredi i predmeti koji imaju barem jedno pitanje (za sitemap, llms.txt i česta pitanja)
export function razrediSaSadrzajem(indeks = izradiIndeksPitanja()) {
  return sviRazredi
    .map(r => ({ ...r, predmeti: r.predmeti.filter(p => predmetImaPitanja(indeks, r.broj, p)) }))
    .filter(r => r.predmeti.length)
}

export function adresaStranice(siteUrl: string) {
  const baza = siteUrl.replace(/\/+$/, '')
  return (put: string) => baza + put
}
