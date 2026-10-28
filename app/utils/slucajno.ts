// Ponovljivi generator slučajnih brojeva (mulberry32): isti seed uvijek daje isti niz brojeva
export function napraviGenerator(seed: string): () => number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Fisher–Yates; vraća novi niz, original ostaje netaknut
export function promijesaj<T>(niz: readonly T[], slucajno: () => number): T[] {
  const kopija = [...niz]
  for (let i = kopija.length - 1; i > 0; i--) {
    const j = Math.floor(slucajno() * (i + 1))
    const privremeno = kopija[i]!
    kopija[i] = kopija[j]!
    kopija[j] = privremeno
  }
  return kopija
}

export function noviSeed(): string {
  return Math.random().toString(36).slice(2, 8).padEnd(6, '0')
}
