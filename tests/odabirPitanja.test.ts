import { describe, expect, it } from 'vitest'
import { odaberiPitanja, prebrojiPoTezini, promijesajOdgovore } from '../app/composables/useOdabirPitanja'
import { napraviGenerator } from '../app/utils/slucajno'
import { dodajVidjeno } from '../app/utils/vidjenaPitanja'
import type { DatotekaLekcije, Pitanje, Tezina } from '../app/types'

function pitanje(id: string, tezina: Tezina = 'lagano', skriveno = false): Pitanje {
  return {
    id,
    tezina,
    pitanje: `Pitanje ${id}`,
    ponudeni: ['a', 'b', 'c', 'd'],
    tocan: 2,
    objasnjenje: '',
    ...(skriveno ? { skriveno } : {})
  }
}

function lekcija(lekcijaId: string, broj: number, tezina: Tezina = 'lagano'): DatotekaLekcije {
  return {
    lekcijaId,
    pitanja: Array.from({ length: broj }, (_, i) => pitanje(`${lekcijaId}-${i}`, tezina))
  }
}

describe('odaberiPitanja', () => {
  it('isti seed daje isti kviz, drugi seed drugačiji', () => {
    const datoteke = [lekcija('a', 30), lekcija('b', 30)]
    const prvi = odaberiPitanja(datoteke, 'lagano', 20, 'abc123')
    const drugi = odaberiPitanja(datoteke, 'lagano', 20, 'abc123')
    const treci = odaberiPitanja(datoteke, 'lagano', 20, 'xyz789')
    expect(drugi).toEqual(prvi)
    expect(treci.map(p => p.id)).not.toEqual(prvi.map(p => p.id))
  })

  it('ravnomjerno raspoređuje pitanja po lekcijama', () => {
    const odabrana = odaberiPitanja([lekcija('a', 30), lekcija('b', 30)], 'lagano', 20, 's1')
    expect(odabrana.filter(p => p.id.startsWith('a-'))).toHaveLength(10)
    expect(odabrana.filter(p => p.id.startsWith('b-'))).toHaveLength(10)
  })

  it('kad lekciji ponestane pitanja, popunjava iz ostalih', () => {
    const odabrana = odaberiPitanja([lekcija('a', 3), lekcija('b', 30)], 'lagano', 20, 's1')
    expect(odabrana).toHaveLength(20)
    expect(odabrana.filter(p => p.id.startsWith('a-'))).toHaveLength(3)
  })

  it('poštuje težinu, preskače skrivena pitanja i nema duplikata', () => {
    const datoteka: DatotekaLekcije = {
      lekcijaId: 'a',
      pitanja: [
        ...lekcija('l', 10, 'lagano').pitanja,
        ...lekcija('s', 10, 'srednje').pitanja,
        pitanje('skriveno', 'srednje', true)
      ]
    }
    const odabrana = odaberiPitanja([datoteka], 'srednje', 20, 's1')
    expect(odabrana).toHaveLength(10)
    expect(odabrana.every(p => p.tezina === 'srednje' && !p.skriveno)).toBe(true)
    expect(new Set(odabrana.map(p => p.id)).size).toBe(10)
  })
})

describe('promijesajOdgovore', () => {
  it('točan indeks prati točan odgovor', () => {
    const slucajno = napraviGenerator('test')
    for (let i = 0; i < 50; i++) {
      const p = promijesajOdgovore(pitanje(String(i)), slucajno)
      expect(p.ponudeni[p.tocan]).toBe('c')
      expect([...p.ponudeni].sort()).toEqual(['a', 'b', 'c', 'd'])
    }
  })

  it('točan odgovor završava na različitim pozicijama', () => {
    const slucajno = napraviGenerator('raspodjela')
    const pozicije = new Set(Array.from({ length: 40 }, (_, i) => promijesajOdgovore(pitanje(String(i)), slucajno).tocan))
    expect(pozicije.size).toBe(4)
  })
})

describe('prebrojiPoTezini', () => {
  it('broji samo aktivna pitanja, a nepostojeća datoteka daje nule', () => {
    const datoteka: DatotekaLekcije = {
      lekcijaId: 'a',
      pitanja: [pitanje('1'), pitanje('2', 'tesko'), pitanje('3', 'tesko', true)]
    }
    expect(prebrojiPoTezini(datoteka)).toEqual({ lagano: 1, srednje: 0, tesko: 1 })
    expect(prebrojiPoTezini(null)).toEqual({ lagano: 0, srednje: 0, tesko: 0 })
  })
})

describe('viđena pitanja', () => {
  const sviIz = (lekcijaId: string, do_: number) => new Set(Array.from({ length: do_ }, (_, i) => `${lekcijaId}-${i}`))

  it('prvo bira pitanja koja učenik još nije vidio', () => {
    const vidjena = sviIz('a', 20)
    const odabrana = odaberiPitanja([lekcija('a', 30)], 'lagano', 10, 's1', () => vidjena)
    expect(odabrana.every(p => !vidjena.has(p.id))).toBe(true)
  })

  it('uzima viđena tek kad neviđenih nema dovoljno', () => {
    const vidjena = sviIz('a', 25)
    const odabrana = odaberiPitanja([lekcija('a', 30)], 'lagano', 10, 's1', () => vidjena)
    expect(odabrana.filter(p => !vidjena.has(p.id))).toHaveLength(5)
  })

  it('neviđena iz druge lekcije imaju prednost pred viđenima', () => {
    const vidjena: Record<string, Set<string>> = { a: sviIz('a', 28), b: new Set() }
    const odabrana = odaberiPitanja([lekcija('a', 30), lekcija('b', 30)], 'lagano', 10, 's1', id => vidjena[id]!)
    expect(odabrana.filter(p => p.id.startsWith('a-'))).toHaveLength(2)
    expect(odabrana.filter(p => p.id.startsWith('b-'))).toHaveLength(8)
  })

  it('bez viđenih daje isti kviz kao prije', () => {
    const datoteke = [lekcija('a', 30), lekcija('b', 30)]
    expect(odaberiPitanja(datoteke, 'lagano', 20, 'abc', () => new Set())).toEqual(odaberiPitanja(datoteke, 'lagano', 20, 'abc'))
  })
})

describe('dodajVidjeno', () => {
  const aktivni = ['x', 'y', 'z']

  it('dodaje pitanje i izbacuje id-eve koji više nisu aktivni', () => {
    expect(dodajVidjeno(new Set(['x', 'obrisano']), aktivni, 'y')).toEqual(['x', 'y'])
  })

  it('kad su viđena sva pitanja, počinje novi krug', () => {
    expect(dodajVidjeno(new Set(['x', 'y']), aktivni, 'z')).toEqual([])
  })
})
