import type { Tezina } from '../types'

// Pamti koja je pitanja učenik već vidio (odgovorio) po lekciji i težini, kako bi se pri sljedećem
// kvizu prvo prikazala neviđena. Podaci ostaju samo u pregledniku (localStorage).
const PREFIKS = 'vidjeno:'

function kljuc(razred: number, predmetId: string, lekcijaId: string, tezina: Tezina) {
  return `${PREFIKS}${razred}/${predmetId}/${lekcijaId}/${tezina}`
}

// localStorage može biti nedostupan (privatni način, blokirani podaci); tada se sva pitanja smatraju neviđenima
export function procitajVidjena(razred: number, predmetId: string, lekcijaId: string, tezina: Tezina): Set<string> {
  try {
    const tekst = localStorage.getItem(kljuc(razred, predmetId, lekcijaId, tezina))
    const idevi = tekst ? JSON.parse(tekst) : []
    return new Set(Array.isArray(idevi) ? idevi.filter((id): id is string => typeof id === 'string') : [])
  }
  catch {
    return new Set()
  }
}

export function zapisiVidjena(razred: number, predmetId: string, lekcijaId: string, tezina: Tezina, idevi: string[]) {
  try {
    localStorage.setItem(kljuc(razred, predmetId, lekcijaId, tezina), JSON.stringify(idevi))
  }
  catch {
    // bez spremanja se pitanja samo mogu ponoviti ranije
  }
}

// Dodaje pitanje među viđena. Kad su viđena sva aktivna pitanja lekcije, počinje novi krug (prazan popis).
// Id-evi pitanja koja su u međuvremenu obrisana ili skrivena se izbacuju.
export function dodajVidjeno(vidjena: Set<string>, aktivni: string[], id: string): string[] {
  const novi = aktivni.filter(a => vidjena.has(a) || a === id)
  return novi.length >= aktivni.length ? [] : novi
}
