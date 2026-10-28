import { describe, expect, it } from 'vitest'
import { parsirajPostavke, postavkeUQuery } from '../app/utils/postavkeKviza'
import { oblikUzBroj } from '../app/utils/tekst'
import kurikulum from '../app/data/kurikulum.json'
import type { RazredIzvor } from '../app/types'
import { pripremiRazrede } from '../app/utils/kurikulum'

const razredi = pripremiRazrede(kurikulum.razredi as RazredIzvor[])
const ispravno = { r: '5', p: 'priroda', l: 'biljni-organi,fotosinteza', n: '20', t: 'srednje', s: 'abc123' }

describe('parsirajPostavke', () => {
  it('čita ispravan URL i vraća isti query', () => {
    const postavke = parsirajPostavke(ispravno, razredi)
    expect(postavke).toEqual({
      razred: 5,
      predmetId: 'priroda',
      lekcijeIds: ['biljni-organi', 'fotosinteza'],
      brojZadataka: 20,
      tezina: 'srednje',
      seed: 'abc123'
    })
    expect(postavkeUQuery(postavke!)).toEqual(ispravno)
  })

  it.each([
    ['nepostojeći razred', { r: '9' }],
    ['nepostojeći predmet', { p: 'kemija' }],
    ['lekcija iz drugog predmeta', { l: 'prirodni-brojevi' }],
    ['bez lekcija', { l: '' }],
    ['nedopušten broj zadataka', { n: '15' }],
    ['nepoznata težina', { t: 'ekstremno' }],
    ['neispravan seed', { s: '<script>' }]
  ])('odbija: %s', (_, izmjena) => {
    expect(parsirajPostavke({ ...ispravno, ...izmjena }, razredi)).toBeNull()
  })

  it('uklanja ponovljene lekcije', () => {
    expect(parsirajPostavke({ ...ispravno, l: 'fotosinteza,fotosinteza' }, razredi)?.lekcijeIds).toEqual(['fotosinteza'])
  })
})

describe('oblikUzBroj', () => {
  const oblici: [string, string, string] = ['pitanje', 'pitanja', 'pitanja']
  it.each([
    [1, 'pitanje'], [2, 'pitanja'], [5, 'pitanja'], [11, 'pitanja'], [21, 'pitanje'], [22, 'pitanja'], [12, 'pitanja']
  ])('%d %s', (broj, ocekivano) => {
    expect(oblikUzBroj(broj, oblici)).toBe(ocekivano)
  })

  it('razlikuje sva tri oblika', () => {
    const lekcija: [string, string, string] = ['lekcija', 'lekcije', 'lekcija']
    expect([1, 3, 5, 13, 24].map(n => oblikUzBroj(n, lekcija))).toEqual(['lekcija', 'lekcije', 'lekcija', 'lekcija', 'lekcije'])
  })
})
