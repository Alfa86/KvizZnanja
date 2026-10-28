import type { BrojZadataka, PostavkeKviza, Razred, Tezina } from '../types'
import { BROJEVI_ZADATAKA, TEZINE } from './konstante'

function prviTekst(vrijednost: unknown): string | null {
  const v = Array.isArray(vrijednost) ? vrijednost[0] : vrijednost
  return typeof v === 'string' ? v : null
}

// Čita postavke iz URL-a (?r=5&p=priroda&l=a,b&n=20&t=srednje&s=8f3a2c) i provjerava ih prema kurikulumu
export function parsirajPostavke(query: Record<string, unknown>, razredi: Razred[]): PostavkeKviza | null {
  const razred = Number(prviTekst(query.r))
  const predmetId = prviTekst(query.p)
  const lekcijeIds = [...new Set((prviTekst(query.l) ?? '').split(',').filter(Boolean))]
  const brojZadataka = Number(prviTekst(query.n)) as BrojZadataka
  const tezina = prviTekst(query.t) as Tezina
  const seed = prviTekst(query.s)

  const predmet = razredi.find(r => r.broj === razred)?.predmeti.find(p => p.id === predmetId)
  if (!predmet || !predmetId) return null
  if (!lekcijeIds.length || !lekcijeIds.every(id => predmet.lekcije.some(l => l.id === id))) return null
  if (!BROJEVI_ZADATAKA.includes(brojZadataka)) return null
  if (!TEZINE.some(t => t.id === tezina)) return null
  if (!seed || !/^[a-z0-9]{1,16}$/.test(seed)) return null

  return { razred, predmetId, lekcijeIds, brojZadataka, tezina, seed }
}

export function postavkeUQuery(postavke: PostavkeKviza): Record<string, string> {
  return {
    r: String(postavke.razred),
    p: postavke.predmetId,
    l: postavke.lekcijeIds.join(','),
    n: String(postavke.brojZadataka),
    t: postavke.tezina,
    s: postavke.seed
  }
}

// Jedinstveni ključ kviza, koristi se za spremanje odgovora u sessionStorage
export function kljucPostavki(postavke: PostavkeKviza): string {
  return new URLSearchParams(postavkeUQuery(postavke)).toString()
}
