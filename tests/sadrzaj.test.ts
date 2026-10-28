import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import kurikulum from '../app/data/kurikulum.json'
import type { Pitanje, RazredIzvor } from '../app/types'
import { pripremiRazrede } from '../app/utils/kurikulum'
import { provjeriSadrzaj, type UcitanaDatoteka } from '../app/utils/provjeraSadrzaja'

const KORIJEN = join(__dirname, '..', 'public', 'pitanja')
const razredi = pripremiRazrede(kurikulum.razredi as RazredIzvor[])

// Isto što i npm run provjeri, da bi i testovi pali na neispravnom sadržaju
describe('sadržaj u public/pitanja', () => {
  it('nema grešaka', () => {
    const datoteke = readdirSync(KORIJEN, { recursive: true, encoding: 'utf8' })
      .filter(f => f.endsWith('.json'))
      .map((f) => {
        const [razred, predmetId, ime] = relative(KORIJEN, join(KORIJEN, f)).split(sep) as [string, string, string]
        return { put: f, razred, predmetId, ime, sadrzaj: JSON.parse(readFileSync(join(KORIJEN, f), 'utf8')) }
      })
    expect(provjeriSadrzaj(razredi, datoteke).greske).toEqual([])
  })
})

describe('provjeriSadrzaj', () => {
  const predmet = razredi.find(r => r.broj === 4)!.predmeti.find(p => p.id === 'matematika')!
  const lekcija = predmet.lekcije[0]!.id

  const pitanje = (id: string, izmjene: Partial<Pitanje> = {}): Pitanje => ({
    id,
    tezina: 'lagano',
    pitanje: `Koliko je ${id}?`,
    ponudeni: ['1', '2', '3', '4'],
    tocan: 0,
    objasnjenje: 'Zato.',
    ...izmjene
  })

  const datoteka = (pitanja: unknown[], izmjene: Partial<UcitanaDatoteka> = {}): UcitanaDatoteka => ({
    put: `4/matematika/${lekcija}.json`,
    razred: '4',
    predmetId: 'matematika',
    ime: `${lekcija}.json`,
    sadrzaj: { lekcijaId: lekcija, pitanja },
    ...izmjene
  })

  it('prihvaća ispravnu datoteku i broji pokrivenost bez skrivenih pitanja', () => {
    const r = provjeriSadrzaj(razredi, [datoteka([pitanje('a', { savjet: 'Broji.' }), pitanje('b', { tezina: 'tesko' }), pitanje('c', { skriveno: true })])])
    expect(r.greske).toEqual([])
    expect(r.pokrivenost[0]).toMatchObject({ broj: { lagano: 1, srednje: 0, tesko: 1 }, saSavjetom: 1, ukupno: 2 })
    expect(r.upozorenja.some(u => u.includes('manje od 15'))).toBe(true)
  })

  it('javlja lekciju koja ne postoji i krivi lekcijaId', () => {
    const r = provjeriSadrzaj(razredi, [datoteka([pitanje('a')], { ime: 'nema-je.json' })])
    expect(r.greske.some(g => g.includes('ne postoji u kurikulumu'))).toBe(true)
    expect(r.greske.some(g => g.includes('ne odgovara nazivu datoteke'))).toBe(true)
  })

  it('javlja id koji se ponavlja u drugoj datoteci', () => {
    const r = provjeriSadrzaj(razredi, [datoteka([pitanje('a')]), datoteka([pitanje('a', { pitanje: 'Drugo?' })], { put: 'druga.json' })])
    expect(r.greske.some(g => g.includes('id se već koristi'))).toBe(true)
  })

  it('javlja duplikat teksta, ali ne uz različit crtež', () => {
    const r = provjeriSadrzaj(razredi, [datoteka([pitanje('a', { pitanje: 'Koliko je 2 + 2?' }), pitanje('b', { pitanje: 'koliko je 2+2' })])])
    expect(r.greske.some(g => g.includes('isto pitanje kao a'))).toBe(true)

    const crtez = (x: number) => ({ opis: 'Dužina', tocke: { A: [1, 1] as [number, number], B: [x, 1] as [number, number] }, duzine: [{ od: 'A', do: 'B' }] })
    const s = provjeriSadrzaj(razredi, [datoteka([pitanje('a', { pitanje: 'Kolika je dužina?', slika: crtez(5) }), pitanje('b', { pitanje: 'Kolika je dužina?', slika: crtez(8) })])])
    expect(s.greske).toEqual([])
  })

  it('javlja pogrešne tipove i neispravan oblik datoteke', () => {
    const r = provjeriSadrzaj(razredi, [
      datoteka([pitanje('a', { savjet: 5 as unknown as string })]),
      datoteka([], { put: 'prazna.json', sadrzaj: { pitanja: [] } })
    ])
    expect(r.greske).toContain(`4/matematika/${lekcija}.json a: Savjet mora biti tekst`)
    expect(r.greske).toContain('prazna.json: Nedostaje lekcijaId')
  })

  it('upozorava na predug tekst strože za 1. i 2. razred', () => {
    const dugo = 'x'.repeat(130) + '?'
    const r = provjeriSadrzaj(razredi, [datoteka([pitanje('a', { pitanje: dugo })])])
    expect(r.upozorenja.some(u => u.includes('pitanje ima'))).toBe(false)
    const mladi = provjeriSadrzaj(razredi, [datoteka([pitanje('a', { pitanje: dugo })], { razred: '2' })])
    expect(mladi.upozorenja.some(u => u.includes('pitanje ima 131 znakova'))).toBe(true)
  })
})
