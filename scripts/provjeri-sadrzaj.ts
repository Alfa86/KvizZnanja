// npm run provjeri: provjera kurikuluma i svih datoteka s pitanjima; pokreće se i prije builda
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import type { RazredIzvor } from '../app/types'
import { pripremiRazrede } from '../app/utils/kurikulum'
import { provjeriSadrzaj, type UcitanaDatoteka } from '../app/utils/provjeraSadrzaja'

const KORIJEN = join(import.meta.dirname, '..')
const MAPA_PITANJA = join(KORIJEN, 'public', 'pitanja')

const kurikulum = JSON.parse(readFileSync(join(KORIJEN, 'app', 'data', 'kurikulum.json'), 'utf8')) as { razredi: RazredIzvor[] }
const razredi = pripremiRazrede(kurikulum.razredi)

const greskeCitanja: string[] = []
const datoteke: UcitanaDatoteka[] = []
for (const datoteka of readdirSync(MAPA_PITANJA, { recursive: true, encoding: 'utf8' })) {
  if (!datoteka.endsWith('.json')) continue
  const dijelovi = relative(MAPA_PITANJA, join(MAPA_PITANJA, datoteka)).split(sep)
  const put = dijelovi.join('/')
  if (dijelovi.length !== 3) {
    greskeCitanja.push(`${put}: datoteka mora biti u mapi {razred}/{predmet}/`)
    continue
  }
  const [razred, predmetId, ime] = dijelovi as [string, string, string]
  try {
    datoteke.push({ put, razred, predmetId, ime, sadrzaj: JSON.parse(readFileSync(join(MAPA_PITANJA, datoteka), 'utf8')) })
  }
  catch (e) {
    greskeCitanja.push(`${put}: neispravan JSON (${(e as Error).message})`)
  }
}

const { greske, upozorenja, pokrivenost } = provjeriSadrzaj(razredi, datoteke)
greske.unshift(...greskeCitanja)

console.log('Pokrivenost (aktivna pitanja: lagano / srednje / teško, udio sa savjetom)\n')
const sirina = Math.max(...pokrivenost.map(p => p.put.length))
for (const p of pokrivenost) {
  const savjet = p.ukupno ? Math.round(p.saSavjetom / p.ukupno * 100) : 0
  console.log(`  ${p.put.padEnd(sirina)}  ${[p.broj.lagano, p.broj.srednje, p.broj.tesko].map(n => String(n).padStart(3)).join(' /')}   ${String(savjet).padStart(3)} %`)
}

const bezPitanja = razredi.flatMap(r => r.predmeti.map(p => ({
  oznaka: `${r.broj}/${p.id}`,
  ukupno: p.lekcije.length,
  prazne: p.lekcije.filter(l => !pokrivenost.some(k => k.put === `${r.broj}/${p.id}/${l.id}.json`)).length
}))).filter(p => p.prazne)
if (bezPitanja.length) {
  console.log('\nLekcije bez pitanja')
  for (const p of bezPitanja) console.log(`  ${p.oznaka}: ${p.prazne} od ${p.ukupno}`)
}

if (upozorenja.length) {
  console.log(`\nUpozorenja (${upozorenja.length})`)
  for (const u of upozorenja) console.log(`  ⚠ ${u}`)
}

if (greske.length) {
  console.error(`\nGreške (${greske.length})`)
  for (const g of greske) console.error(`  ✗ ${g}`)
  process.exit(1)
}
console.log(`\n✓ Provjereno ${datoteke.length} datoteka, ${pokrivenost.reduce((z, p) => z + p.ukupno, 0)} aktivnih pitanja, bez grešaka.`)
