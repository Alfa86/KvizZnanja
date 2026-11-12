import type { Pitanje } from '../types'
import { TEZINE } from './konstante'
import { jeDatoteka, provjeriCrtez } from './crtez'
import { provjeriPodatke } from './podaci'
import { provjeriKartu } from './karta'

const ZABRANJENI_ODGOVORI = /^(sve navedeno|ništa od navedenog|i a i b)\.?$/i

// Traži izraz kao cijelu riječ, kako odgovor „a“ ne bi odgovarao svakom tekstu sa slovom a
function sadrziCijeliIzraz(tekst: string, izraz: string): boolean {
  const escaped = izraz.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, 'iu').test(tekst)
}

// Provjera jednog pitanja; koriste je stranica za pregled i provjeriSadrzaj (npm run provjeri)
export function provjeriPitanje(p: Pitanje): string[] {
  const greske: string[] = []

  if (!p.id?.trim()) greske.push('Nedostaje id')
  if (!TEZINE.some(t => t.id === p.tezina)) greske.push(`Nepoznata težina "${p.tezina}"`)
  if (!p.pitanje?.trim()) greske.push('Nedostaje tekst pitanja')
  if (!p.objasnjenje?.trim()) greske.push('Nedostaje objašnjenje')

  if (p.karta) {
    if (p.ponudeni !== undefined || p.tocan !== undefined) greske.push('Pitanje s kartom nema ponuđene odgovore ni polje tocan')
    if (p.slika !== undefined || p.podaci !== undefined) greske.push('Pitanje s kartom ne može imati sliku ni podatke')
    greske.push(...provjeriKartu(p.karta).map(g => `Karta: ${g}`))
    const nazivi = p.karta.mjesta?.map(m => m.naziv).filter(n => typeof n === 'string') ?? []
    if (p.savjet && nazivi.some(n => sadrziCijeliIzraz(p.savjet!, n))) greske.push('Savjet sadrži naziv mjesta s karte')
    return [...greske, ...provjeriPravopis([p.pitanje, ...nazivi, p.objasnjenje, p.savjet ?? ''])]
  }

  if (!Array.isArray(p.ponudeni) || p.ponudeni.length !== 4) {
    greske.push('Pitanje mora imati točno 4 ponuđena odgovora')
  }
  else {
    if (p.ponudeni.some(o => !o?.trim())) greske.push('Neki ponuđeni odgovor je prazan')
    if (new Set(p.ponudeni.map(o => o.trim().toLowerCase())).size !== 4) greske.push('Ponuđeni odgovori se ponavljaju')
    if (p.ponudeni.some(o => ZABRANJENI_ODGOVORI.test(o.trim()))) greske.push('Zabranjen odgovor tipa „sve navedeno“')
  }

  if (!Number.isInteger(p.tocan) || p.tocan < 0 || p.tocan > 3) {
    greske.push('Indeks točnog odgovora mora biti 0–3')
  }
  else {
    const tocan = p.ponudeni?.[p.tocan]?.trim()
    if (p.savjet && tocan && sadrziCijeliIzraz(p.savjet, tocan)) greske.push('Savjet sadrži točan odgovor')
  }

  if (p.slika) {
    if (jeDatoteka(p.slika)) {
      if (!p.slika.opis?.trim()) greske.push('Slika nema opis')
      if (!p.slika.datoteka.startsWith('/slike/')) greske.push('Datoteka slike mora biti u /slike/')
    }
    else {
      greske.push(...provjeriCrtez(p.slika).map(g => `Crtež: ${g}`))
    }
  }

  if (p.podaci) greske.push(...provjeriPodatke(p.podaci).map(g => `Podaci: ${g}`))

  return [...greske, ...provjeriPravopis([p.pitanje, ...(p.ponudeni ?? []), p.objasnjenje, p.savjet ?? ''])]
}

// Pravopis brojeva i navodnika: 4567 i 12 345, „tekst“
function provjeriPravopis(sviTekstovi: unknown[]): string[] {
  const greske: string[] = []
  const tekstovi = sviTekstovi.filter((t): t is string => typeof t === 'string')
  if (tekstovi.some(t => /„[^“”]*”/.test(t))) greske.push('Zatvoreni navodnik piše se “ („tekst“), ne ”')
  if (tekstovi.some(t => /(?<![\d\p{L}])\d \d{3}(?![\d ])/u.test(t))) greske.push('Četveroznamenkasti broj piše se bez razmaka (1400)')
  if (tekstovi.some(t => /(?<![\d\p{L}.,])\d{5,}(?!\d)/u.test(t))) greske.push('Broj s pet i više znamenaka piše se s razmakom (12 345)')
  return greske
}
