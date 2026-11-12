import type { Odgovor, Pitanje, ZadatakKarte } from '../types'
import { jeUnutarOkvira, okvirKarte, OKVIR_HRVATSKE, projiciraj, type Okvir } from './projekcija'

export const NAJMANJE_MJESTA = 3
export const NAJVISE_MJESTA = 8

// Najuža karta na kojoj se zadatak mora moći riješiti (mobitel) i najmanji razmak oznaka na njoj
export const NAJUZA_KARTA = 320
export const PROMJER_OZNAKE = 30
const RAZMAK_OZNAKA = PROMJER_OZNAKE + 6

export interface Tocka2D { x: number, y: number }

// Položaji oznaka (pribadača) u postocima širine i visine prikazane karte
export function polozajiOznaka(z: ZadatakKarte): Tocka2D[] {
  const [vx, vy, vs, vv] = okvirKarte(z.okvir)
  return z.mjesta.map((m) => {
    const [x, y] = projiciraj(m.polozaj)
    return { x: ((x - vx) / vs) * 100, y: ((y - vy) / vv) * 100 }
  })
}

export function omjerKarte(z: ZadatakKarte): number {
  const [, , vs, vv] = okvirKarte(z.okvir)
  return vv / vs
}

export function jeOdgovorTocan(p: Pitanje, o: Odgovor | null | undefined): boolean {
  if (p.karta) return Array.isArray(o) && o.length === p.karta.mjesta.length && o.every((cilj, i) => cilj === i)
  return o === p.tocan
}

// Pitanje s kartom je odgovoreno tek kad su svi natpisi na karti
export function jeOdgovorPotpun(o: Odgovor | null | undefined): boolean {
  if (o == null) return false
  return !Array.isArray(o) || o.every(cilj => cilj !== null)
}

export interface Pravokutnik { x: number, y: number, s: number, v: number }

const povrsinaPreklapanja = (a: Pravokutnik, b: Pravokutnik) =>
  Math.max(0, Math.min(a.x + a.s, b.x + b.s) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.v, b.y + b.v) - Math.max(a.y, b.y))

// Smješta natpise uz njihove oznake (desno, lijevo, gore, dolje, pa ukoso) tako da se što manje
// preklapaju međusobno, s oznakama i s rubom karte. Sve je u pikselima prikazane karte.
export function rasporediNatpise(
  oznake: Tocka2D[],
  natpisi: { oznaka: number, sirina: number, visina: number }[],
  sirinaKarte: number,
  visinaKarte: number
): Pravokutnik[] {
  const r = PROMJER_OZNAKE / 2 + 3
  const zauzeto: Pravokutnik[] = oznake.map(o => ({ x: o.x - r, y: o.y - r, s: 2 * r, v: 2 * r }))
  return natpisi.map(({ oznaka, sirina: s, visina: v }) => {
    const { x, y } = oznake[oznaka]!
    const kandidati: Pravokutnik[] = [
      { x: x + r, y: y - v / 2, s, v },
      { x: x - r - s, y: y - v / 2, s, v },
      { x: x - s / 2, y: y - r - v, s, v },
      { x: x - s / 2, y: y + r, s, v },
      { x: x + r * 0.7, y: y - r * 0.7 - v, s, v },
      { x: x - r * 0.7 - s, y: y - r * 0.7 - v, s, v },
      { x: x + r * 0.7, y: y + r * 0.7, s, v },
      { x: x - r * 0.7 - s, y: y + r * 0.7, s, v }
    ]
    const kazna = (k: Pravokutnik) => {
      const izvan = Math.max(0, -k.x) + Math.max(0, k.x + k.s - sirinaKarte) + Math.max(0, -k.y) + Math.max(0, k.y + k.v - visinaKarte)
      return zauzeto.reduce((n, z) => n + povrsinaPreklapanja(k, z), 0) + izvan * 1000
    }
    let najbolji = kandidati[0]!
    let najmanja = Infinity
    for (const k of kandidati) {
      const n = kazna(k)
      if (n < najmanja) [najbolji, najmanja] = [k, n]
      if (n === 0) break
    }
    // Natpis koji bi izašao preko ruba gura se natrag na kartu
    najbolji = {
      ...najbolji,
      x: Math.min(Math.max(0, najbolji.x), sirinaKarte - s),
      y: Math.min(Math.max(0, najbolji.y), visinaKarte - v)
    }
    zauzeto.push(najbolji)
    return najbolji
  })
}

export function provjeriKartu(z: ZadatakKarte): string[] {
  const greske: string[] = []
  if (!Array.isArray(z.mjesta) || z.mjesta.length < NAJMANJE_MJESTA || z.mjesta.length > NAJVISE_MJESTA) {
    return [`Karta mora imati ${NAJMANJE_MJESTA}–${NAJVISE_MJESTA} mjesta`]
  }
  if (z.mjesta.some(m => typeof m.naziv !== 'string' || !m.naziv.trim())) return ['Neko mjesto nema naziv']
  if (new Set(z.mjesta.map(m => m.naziv.trim().toLowerCase())).size !== z.mjesta.length) greske.push('Nazivi mjesta se ponavljaju')

  let okvir: Okvir = OKVIR_HRVATSKE
  if (z.okvir !== undefined) {
    const o = z.okvir
    if (!Array.isArray(o) || o.length !== 4 || !(o[0] < o[2] && o[1] < o[3]) || !jeUnutarOkvira([o[0], o[1]]) || !jeUnutarOkvira([o[2], o[3]])) {
      greske.push(`Okvir mora biti [zapad, jug, istok, sjever] unutar [${OKVIR_HRVATSKE.join(', ')}]`)
      return greske
    }
    okvir = o
  }
  const izvan = z.mjesta.filter(m => !Array.isArray(m.polozaj) || m.polozaj.length !== 2 || !jeUnutarOkvira(m.polozaj, okvir))
  if (izvan.length) {
    greske.push(`Položaj izvan prikazane karte: ${izvan.map(m => m.naziv).join(', ')} (položaj je [dužina, širina])`)
    return greske
  }

  // Na najužoj karti oznake moraju biti dovoljno razmaknute da se mogu pogoditi prstom
  const visina = NAJUZA_KARTA * omjerKarte(z)
  const px = polozajiOznaka(z).map(p => ({ x: (p.x / 100) * NAJUZA_KARTA, y: (p.y / 100) * visina }))
  px.forEach((a, i) => {
    px.slice(i + 1).forEach((b, k) => {
      if (Math.hypot(a.x - b.x, a.y - b.y) < RAZMAK_OZNAKA) {
        greske.push(`Oznake za „${z.mjesta[i]!.naziv}“ i „${z.mjesta[i + 1 + k]!.naziv}“ preblizu su na mobitelu (razmakni ih ili smanji okvir karte)`)
      }
    })
  })
  return greske
}
