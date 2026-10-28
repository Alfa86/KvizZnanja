import { describe, expect, it } from 'vitest'
import { kraciKuta, provjeriCrtez, velicinaKuta } from '../app/utils/crtez'
import { provjeriPitanje } from '../app/utils/provjera'
import type { Crtez, Pitanje } from '../app/types'

const trokut: Crtez = {
  opis: 'Pravokutan trokut',
  tocke: { A: [1, 1], B: [5, 1], C: [1, 4] },
  poligoni: [{ vrhovi: ['A', 'B', 'C'] }]
}

describe('velicinaKuta i kraciKuta', () => {
  it('računa kut u stupnjevima', () => {
    expect(velicinaKuta([0, 0], [1, 0], [0, 1])).toBeCloseTo(90)
    expect(velicinaKuta([0, 0], [1, 0], [1, 1])).toBeCloseTo(45)
  })

  it('uzima susjedne vrhove iz poligona ako kraci nisu zadani', () => {
    expect(kraciKuta(trokut, { vrh: 'A' })).toEqual(['C', 'B'])
    expect(kraciKuta(trokut, { vrh: 'B', kraci: ['A', 'C'] })).toEqual(['A', 'C'])
    expect(kraciKuta({ ...trokut, poligoni: [] }, { vrh: 'A' })).toBeNull()
  })
})

describe('provjeriCrtez', () => {
  it('prihvaća ispravan crtež', () => {
    expect(provjeriCrtez({ ...trokut, kutovi: [{ vrh: 'A', pravi: true }, { vrh: 'B', oznaka: '37°' }] })).toEqual([])
  })

  it('pronalazi nepostojeće točke i koordinate izvan mreže', () => {
    const greske = provjeriCrtez({ ...trokut, tocke: { ...trokut.tocke, D: [11, 2] }, duzine: [{ od: 'A', do: 'X' }] })
    expect(greske.some(g => g.includes('D'))).toBe(true)
    expect(greske.some(g => g.includes('točka X ne postoji'))).toBe(true)
  })

  it('pronalazi kut koji ne izgleda kako je označen', () => {
    expect(provjeriCrtez({ ...trokut, kutovi: [{ vrh: 'B', pravi: true }] })[0]).toMatch(/pravi/)
    expect(provjeriCrtez({ ...trokut, kutovi: [{ vrh: 'B', oznaka: '60°' }] })[0]).toMatch(/60°/)
  })

  it('pronalazi kružnicu koja izlazi iz mreže', () => {
    expect(provjeriCrtez({ ...trokut, kruznice: [{ sredite: 'A', polumjer: 3 }] })[0]).toMatch(/izvan mreže/)
  })
})

describe('provjeriPitanje', () => {
  const pitanje: Pitanje = {
    id: 'x-1',
    tezina: 'lagano',
    pitanje: 'Kako se označava stranica BC?',
    ponudeni: ['a', 'b', 'c', 'α'],
    tocan: 0,
    objasnjenje: 'Stranica nasuprot vrha A je a.',
    savjet: 'Pogledaj koji vrh leži nasuprot, a koji uz stranicu.'
  }

  it('savjet smije sadržavati slovo odgovora unutar riječi, ali ne i sam odgovor', () => {
    expect(provjeriPitanje({ ...pitanje, savjet: 'Pogledaj suprotan vrh.' })).toEqual([])
    expect(provjeriPitanje({ ...pitanje, ponudeni: ['70°', '80°', '60°', '90°'], savjet: 'Rezultat je 70°.' }))
      .toContain('Savjet sadrži točan odgovor')
  })

  it('provjerava i crtež', () => {
    const greske = provjeriPitanje({ ...pitanje, savjet: undefined, slika: { ...trokut, opis: '' } })
    expect(greske).toContain('Crtež: Crtež nema opis')
  })
})
