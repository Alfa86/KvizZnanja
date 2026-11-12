import { describe, expect, it } from 'vitest'
import type { PitanjeKarta } from '../app/types'
import { jeOdgovorPotpun, jeOdgovorTocan, provjeriKartu, rasporediNatpise } from '../app/utils/karta'
import { provjeriPitanje } from '../app/utils/provjera'
import { odaberiPitanja, promijesajOdgovore } from '../app/composables/useOdabirPitanja'
import { napraviGenerator } from '../app/utils/slucajno'
import { projiciraj, SIRINA_KARTE, VISINA_KARTE } from '../app/utils/projekcija'

const karta: PitanjeKarta = {
  id: 'k1',
  tezina: 'srednje',
  pitanje: 'Smjesti na kartu ove krajeve.',
  karta: {
    mjesta: [
      { naziv: 'Hrvatsko zagorje', polozaj: [15.95, 46.08] },
      { naziv: 'Baranja', polozaj: [18.65, 45.75] },
      { naziv: 'Kordun', polozaj: [15.65, 45.2] }
    ]
  },
  objasnjenje: 'Objašnjenje.',
  savjet: 'Pomoći će ti rijeke.'
}

describe('projekcija', () => {
  it('Hrvatska stane u kartu', () => {
    for (const t of [[13.5, 45.2], [19.45, 45.2], [16.4, 46.55], [18.5, 42.4]] as [number, number][]) {
      const [x, y] = projiciraj(t)
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(SIRINA_KARTE)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(VISINA_KARTE)
    }
  })
})

describe('odgovor na kartu', () => {
  it('točan je samo kad je svaki natpis na svojoj oznaci', () => {
    expect(jeOdgovorTocan(karta, [0, 1, 2])).toBe(true)
    expect(jeOdgovorTocan(karta, [1, 0, 2])).toBe(false)
    expect(jeOdgovorTocan(karta, [0, 1, null])).toBe(false)
    expect(jeOdgovorTocan(karta, null)).toBe(false)
  })

  it('odgovoreno je tek kad su svi natpisi na karti', () => {
    expect(jeOdgovorPotpun([0, null, 2])).toBe(false)
    expect(jeOdgovorPotpun([2, 0, 1])).toBe(true)
    expect(jeOdgovorPotpun(0)).toBe(true)
    expect(jeOdgovorPotpun(null)).toBe(false)
  })

  it('miješanje mijenja redoslijed mjesta, a ne sadržaj', () => {
    const p = promijesajOdgovore(karta, napraviGenerator('x')) as PitanjeKarta
    expect([...p.karta.mjesta].sort((a, b) => a.naziv.localeCompare(b.naziv))).toEqual(
      [...karta.karta.mjesta].sort((a, b) => a.naziv.localeCompare(b.naziv))
    )
  })
})

describe('odabir pitanja s kartom', () => {
  const obicna = Array.from({ length: 30 }, (_, i) => ({
    id: `p${i}`, tezina: 'srednje' as const, pitanje: `P${i}`, ponudeni: ['a', 'b', 'c', 'd'], tocan: 0, objasnjenje: ''
  }))
  const lekcija = { lekcijaId: 'l', pitanja: [...obicna, karta] }

  it('svaki kviz dobiva neviđeno pitanje s kartom', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e']) {
      expect(odaberiPitanja([lekcija], 'srednje', 10, seed).some(p => p.karta)).toBe(true)
    }
  })

  it('viđeno pitanje s kartom ne ponavlja se dok ima neviđenih', () => {
    expect(odaberiPitanja([lekcija], 'srednje', 10, 'a', () => new Set(['k1'])).some(p => p.karta)).toBe(false)
  })
})

describe('provjera karte', () => {
  it('ispravna karta prolazi', () => {
    expect(provjeriPitanje(karta)).toEqual([])
  })

  it('javlja premalo mjesta, položaj izvan karte i preblizu oznake', () => {
    expect(provjeriKartu({ mjesta: karta.karta.mjesta.slice(0, 2) })[0]).toMatch(/3–8 mjesta/)
    expect(provjeriKartu({ mjesta: [...karta.karta.mjesta.slice(0, 2), { naziv: 'Pariz', polozaj: [2.35, 48.85] }] })[0]).toMatch(/izvan/)
    expect(provjeriKartu({ mjesta: [...karta.karta.mjesta, { naziv: 'Krapina', polozaj: [15.87, 46.16] }] }).join()).toMatch(/preblizu/)
  })

  it('savjet ne smije sadržavati naziv mjesta, a pitanje s kartom nema ponuđene odgovore', () => {
    expect(provjeriPitanje({ ...karta, savjet: 'Baranja je na istoku.' })).toContain('Savjet sadrži naziv mjesta s karte')
    expect(provjeriPitanje({ ...karta, ponudeni: ['a', 'b', 'c', 'd'] } as unknown as PitanjeKarta).join()).toMatch(/nema ponuđene/)
  })
})

describe('raspored natpisa', () => {
  it('natpisi bliskih oznaka ne preklapaju se kad ima mjesta', () => {
    const r = rasporediNatpise(
      [{ x: 100, y: 100 }, { x: 140, y: 100 }],
      [{ oznaka: 0, sirina: 60, visina: 22 }, { oznaka: 1, sirina: 60, visina: 22 }],
      400, 300
    )
    const [a, b] = r as [typeof r[0], typeof r[0]]
    const preklapanje = a.x < b.x + b.s && b.x < a.x + a.s && a.y < b.y + b.v && b.y < a.y + a.v
    expect(preklapanje).toBe(false)
  })
})
