import type { IndeksPitanja, Razred, RazredIzvor } from '../types'

// Svakom predmetu dodaje ravan popis lekcija iz svih cjelina, kojim se služe kviz, URL i provjere
export function pripremiRazrede(razredi: RazredIzvor[]): Razred[] {
  return razredi.map(r => ({
    ...r,
    predmeti: r.predmeti.map(p => ({ ...p, lekcije: p.cjeline.flatMap(c => c.lekcije) }))
  }))
}

export function kljucLekcije(razred: number, predmetId: string, lekcijaId: string): string {
  return `${razred}/${predmetId}/${lekcijaId}`
}

export function ukupnoPitanja(indeks: IndeksPitanja, kljuc: string): number {
  const broj = indeks[kljuc]
  return broj ? broj.lagano + broj.srednje + broj.tesko : 0
}

// Predmet ili razred je dostupan tek kad barem jedna njegova lekcija ima pitanja
export function predmetImaPitanja(indeks: IndeksPitanja, razred: number, predmet: { id: string, cjeline: { lekcije: { id: string }[] }[] }): boolean {
  return predmet.cjeline.some(c => c.lekcije.some(l => ukupnoPitanja(indeks, kljucLekcije(razred, predmet.id, l.id)) > 0))
}
