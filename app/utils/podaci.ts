import type { PrikazPodataka } from '../types'

const LIJEPI_KORACI = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000]

// Razmak crta na osi stupčastog dijagrama: zadani ili najmanji „lijepi“ korak s najviše 10 crta
export function korakDijagrama(p: PrikazPodataka): number {
  if (p.korak) return p.korak
  const najveca = Math.max(...p.vrijednosti, 1)
  return LIJEPI_KORACI.find(k => najveca / k <= 10) ?? LIJEPI_KORACI.at(-1)!
}

// Vraća popis grešaka; prazan popis znači da se podaci mogu ispravno prikazati
export function provjeriPodatke(p: PrikazPodataka): string[] {
  const greske: string[] = []
  if (!['tablica', 'stupcasti', 'slikovni'].includes(p.vrsta)) greske.push(`Nepoznata vrsta prikaza "${p.vrsta}"`)
  if (!p.naslov?.trim()) greske.push('Prikaz nema naslov')
  if (!Array.isArray(p.oznake) || !Array.isArray(p.vrijednosti) || p.oznake.length !== p.vrijednosti.length) {
    greske.push('Oznaka i vrijednosti mora biti jednako mnogo')
    return greske
  }
  if (p.oznake.length < 2 || p.oznake.length > 10) greske.push('Prikaz mora imati 2–10 kategorija')
  if (new Set(p.oznake).size !== p.oznake.length) greske.push('Oznake se ponavljaju')
  if (p.vrijednosti.some(v => !Number.isInteger(v) || v < 0)) greske.push('Vrijednosti moraju biti cijeli brojevi ≥ 0')

  if (p.vrsta === 'stupcasti') {
    const korak = korakDijagrama(p)
    if (!(korak > 0)) greske.push('Korak mora biti pozitivan')
    else if (p.vrijednosti.some(v => v % korak !== 0)) greske.push(`Vrijednosti moraju biti višekratnici koraka ${korak} kako bi se točno očitale`)
  }
  if (p.vrsta === 'slikovni') {
    const n = p.vrijednostSimbola
    if (!p.simbol?.trim() || !n || !Number.isInteger(n) || n < 1) greske.push('Slikovni prikaz treba simbol i vrijednost simbola')
    else if (p.vrijednosti.some(v => v % n !== 0)) greske.push(`Vrijednosti moraju biti višekratnici vrijednosti simbola ${n}`)
    else if (Math.max(...p.vrijednosti) / n > 12) greske.push('Najviše 12 simbola u retku')
  }
  return greske
}
