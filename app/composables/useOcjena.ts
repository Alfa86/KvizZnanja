export interface Ocjena {
  broj: 1 | 2 | 3 | 4 | 5
  naziv: string
}

// Donje granice postotka; postotak se ne zaokružuje prije usporedbe
export const GRANICE_OCJENA: (Ocjena & { min: number })[] = [
  { min: 90, broj: 5, naziv: 'odličan' },
  { min: 78, broj: 4, naziv: 'vrlo dobar' },
  { min: 63, broj: 3, naziv: 'dobar' },
  { min: 50, broj: 2, naziv: 'dovoljan' },
  { min: 0, broj: 1, naziv: 'nedovoljan' }
]

export function izracunajOcjenu(postotak: number): Ocjena {
  const granica = GRANICE_OCJENA.find(g => postotak >= g.min) ?? GRANICE_OCJENA.at(-1)!
  return { broj: granica.broj, naziv: granica.naziv }
}

export function useOcjena() {
  return { izracunajOcjenu, GRANICE_OCJENA }
}
