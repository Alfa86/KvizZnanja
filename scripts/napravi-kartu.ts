// npx tsx scripts/napravi-kartu.ts <mapa-s-geojson-datotekama>
// Iz podataka Natural Earth (javno vlasništvo, https://www.naturalearthdata.com/) slaže
// pojednostavljenu kartu Hrvatske i susjednih država u app/utils/kartaHrvatske.ts.
// Potrebne datoteke (github.com/nvkelso/natural-earth-vector, mapa geojson):
//   ne_10m_admin_0_countries.geojson, ne_10m_rivers_lake_centerlines.geojson, ne_10m_rivers_europe.geojson
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { OKVIR_HRVATSKE, projiciraj, SIRINA_KARTE, VISINA_KARTE } from '../app/utils/projekcija'

type Polozaj = [number, number]
type Geometrija = { type: string, coordinates: unknown }
type Znacajka = { properties: Record<string, unknown>, geometry: Geometrija }

const mapa = process.argv[2]
if (!mapa) {
  console.error('Upotreba: npx tsx scripts/napravi-kartu.ts <mapa-s-geojson-datotekama>')
  process.exit(1)
}
const ucitaj = (ime: string): Znacajka[] => JSON.parse(readFileSync(join(mapa, `${ime}.geojson`), 'utf8')).features

const RUB = 30 // točke daleko izvan karte stežu se na rub, pa se nevidljivi dijelovi susjeda ne pamte
const stegni = ([x, y]: Polozaj): Polozaj => [
  Math.min(SIRINA_KARTE + RUB, Math.max(-RUB, x)),
  Math.min(VISINA_KARTE + RUB, Math.max(-RUB, y))
]

// Douglas–Peucker: izbacuje točke koje od pravca odstupaju manje od tolerancije
function pojednostavi(tocke: Polozaj[], tol: number): Polozaj[] {
  if (tocke.length < 3) return tocke
  const [a, b] = [tocke[0]!, tocke[tocke.length - 1]!]
  let max = 0
  let indeks = 0
  for (let i = 1; i < tocke.length - 1; i++) {
    const [x, y] = tocke[i]!
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const d = dx || dy
      ? Math.abs(dy * x - dx * y + b[0] * a[1] - b[1] * a[0]) / Math.hypot(dx, dy)
      : Math.hypot(x - a[0], y - a[1])
    if (d > max) [max, indeks] = [d, i]
  }
  if (max <= tol) return [a, b]
  return [...pojednostavi(tocke.slice(0, indeks + 1), tol).slice(0, -1), ...pojednostavi(tocke.slice(indeks), tol)]
}

const povrsina = (t: Polozaj[]) => Math.abs(t.reduce((s, [x, y], i) => {
  const [x2, y2] = t[(i + 1) % t.length]!
  return s + x * y2 - x2 * y
}, 0) / 2)

const zaokruzi = (n: number) => Math.round(n * 10) / 10
const uPutanju = (t: Polozaj[], zatvori: boolean) =>
  'M' + t.map(([x, y]) => `${zaokruzi(x)} ${zaokruzi(y)}`).join('L') + (zatvori ? 'Z' : '')

function prstenovi(g: Geometrija): Polozaj[][] {
  if (g.type === 'Polygon') return g.coordinates as Polozaj[][]
  if (g.type === 'MultiPolygon') return (g.coordinates as Polozaj[][][]).flat()
  return []
}

function crte(g: Geometrija): Polozaj[][] {
  if (g.type === 'LineString') return [g.coordinates as Polozaj[]]
  if (g.type === 'MultiLineString') return g.coordinates as Polozaj[][]
  return []
}

function putanjaPovrsina(znacajke: Znacajka[], tol: number, najmanja: number) {
  return znacajke.flatMap(z => prstenovi(z.geometry))
    .map(p => pojednostavi(p.map(t => stegni(projiciraj(t))), tol))
    .filter(p => p.length > 3 && povrsina(p) >= najmanja)
    .map(p => uPutanju(p, true))
    .join('')
}

const unutar = ([lon, lat]: Polozaj) =>
  lon > OKVIR_HRVATSKE[0] - 1 && lon < OKVIR_HRVATSKE[2] + 1 && lat > OKVIR_HRVATSKE[1] - 1 && lat < OKVIR_HRVATSKE[3] + 1

const drzave = ucitaj('ne_10m_admin_0_countries')
const hrvatska = drzave.filter(z => z.properties.ADM0_A3 === 'HRV')
const susjedi = drzave.filter(z => z.properties.ADM0_A3 !== 'HRV' && prstenovi(z.geometry).some(p => p.some(unutar)))

// Rijeke važne za snalaženje na karti; Kupa i Una dolaze iz europskog dodatka Natural Earth
const RIJEKE = new Set(['Sava', 'Drau', 'Mur', 'Danube', 'Kupa', 'Una'])
const rijeke = [...ucitaj('ne_10m_rivers_lake_centerlines'), ...ucitaj('ne_10m_rivers_europe')]
  .filter(z => RIJEKE.has(String(z.properties.name)))
  .flatMap(z => crte(z.geometry))
  .filter(c => c.some(unutar))
  .map(c => uPutanju(pojednostavi(c.map(t => stegni(projiciraj(t))), 0.8), false))
  .join('')

const izlaz = `// Generirano naredbom scripts/napravi-kartu.ts iz podataka Natural Earth (javno vlasništvo). Ne uređivati ručno.
export const KARTA_HRVATSKE = {
  hrvatska: '${putanjaPovrsina(hrvatska, 0.6, 4)}',
  susjedi: '${putanjaPovrsina(susjedi, 1, 20)}',
  rijeke: '${rijeke}'
}
`
const cilj = join(import.meta.dirname, '..', 'app', 'utils', 'kartaHrvatske.ts')
writeFileSync(cilj, izlaz)
console.log(`✓ ${cilj} (${Math.round(izlaz.length / 1024)} KB, susjedi: ${susjedi.map(z => z.properties.ADM0_A3).join(', ')})`)
