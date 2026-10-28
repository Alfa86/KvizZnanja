import type { DatotekaLekcije, Pitanje, Razred, Tezina } from '../types'
import { TEZINE } from './konstante'
import { provjeriPitanje } from './provjera'

export const MINIMUM_PO_TEZINI = 30

// Upozorenja za predug tekst; za 1. i 2. razred granice su strože
const NAJVISE_ZNAKOVA = {
  mladi: { pitanje: 120, odgovor: 40, savjet: 100 },
  stariji: { pitanje: 250, odgovor: 80, savjet: 160 }
}

export interface UcitanaDatoteka {
  put: string               // npr. '4/matematika/pisano-zbrajanje.json', za poruke
  razred: string
  predmetId: string
  ime: string
  sadrzaj: unknown          // JSON kakav je pročitan; oblik se tek provjerava
}

export interface PokrivenostLekcije {
  put: string
  broj: Record<Tezina, number>
  saSavjetom: number
  ukupno: number
}

export interface IzvjestajProvjere {
  greske: string[]
  upozorenja: string[]
  pokrivenost: PokrivenostLekcije[]
}

function normaliziraj(tekst: string): string {
  return tekst.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

function provjeriOblik(sadrzaj: unknown): string | null {
  if (!sadrzaj || typeof sadrzaj !== 'object') return 'Datoteka nije JSON objekt'
  const d = sadrzaj as Partial<DatotekaLekcije>
  if (typeof d.lekcijaId !== 'string') return 'Nedostaje lekcijaId'
  if (!Array.isArray(d.pitanja)) return 'Nedostaje popis pitanja'
  if (d.pitanja.some(p => !p || typeof p !== 'object')) return 'Neko pitanje nije objekt'
  return null
}

// Provjera tipova polja koje provjeriPitanje pretpostavlja (JSON može sadržavati bilo što)
function provjeriTipove(p: Pitanje): string[] {
  const greske: string[] = []
  for (const polje of ['id', 'pitanje', 'objasnjenje'] as const) {
    if (typeof p[polje] !== 'string') greske.push(`Polje ${polje} mora biti tekst`)
  }
  if (!Array.isArray(p.ponudeni) || p.ponudeni.some(o => typeof o !== 'string')) greske.push('Ponuđeni odgovori moraju biti tekstovi')
  if (p.savjet !== undefined && typeof p.savjet !== 'string') greske.push('Savjet mora biti tekst')
  if (p.skriveno !== undefined && typeof p.skriveno !== 'boolean') greske.push('Polje skriveno mora biti true ili false')
  return greske
}

export function provjeriKurikulum(razredi: Razred[]): string[] {
  const greske: string[] = []
  for (const r of razredi) {
    for (const p of r.predmeti) {
      const oznaka = `kurikulum ${r.broj}/${p.id}`
      if (!p.cjeline.length) greske.push(`${oznaka}: nema cjelina`)
      for (const c of p.cjeline) {
        if (!c.lekcije.length) greske.push(`${oznaka}: cjelina ${c.id} nema lekcija`)
      }
      // Lekcija se veže uz datoteku s pitanjima pa id mora biti jedinstven unutar predmeta
      const lekcije = p.lekcije.map(l => l.id)
      for (const id of lekcije.filter((id, i) => lekcije.indexOf(id) !== i)) greske.push(`${oznaka}: lekcija ${id} se ponavlja`)
      const cjeline = p.cjeline.map(c => c.id)
      for (const id of cjeline.filter((id, i) => cjeline.indexOf(id) !== i)) greske.push(`${oznaka}: cjelina ${id} se ponavlja`)
    }
  }
  return greske
}

// Greške ruše build; upozorenja (duljina teksta, pokrivenost) samo se ispisuju
export function provjeriSadrzaj(razredi: Razred[], datoteke: UcitanaDatoteka[]): IzvjestajProvjere {
  const greske = provjeriKurikulum(razredi)
  const upozorenja: string[] = []
  const pokrivenost: PokrivenostLekcije[] = []
  const sviIdevi = new Map<string, string>()

  for (const d of datoteke) {
    const greskaOblika = provjeriOblik(d.sadrzaj)
    if (greskaOblika) {
      greske.push(`${d.put}: ${greskaOblika}`)
      continue
    }
    const { lekcijaId, pitanja } = d.sadrzaj as DatotekaLekcije
    const ocekivaniId = d.ime.replace(/\.json$/, '')
    const predmet = razredi.find(r => String(r.broj) === d.razred)?.predmeti.find(p => p.id === d.predmetId)
    if (!predmet) greske.push(`${d.put}: razred ${d.razred} nema predmet ${d.predmetId} u kurikulumu`)
    else if (!predmet.lekcije.some(l => l.id === ocekivaniId)) greske.push(`${d.put}: lekcija ${ocekivaniId} ne postoji u kurikulumu`)
    if (lekcijaId !== ocekivaniId) greske.push(`${d.put}: lekcijaId "${lekcijaId}" ne odgovara nazivu datoteke`)

    const granice = Number(d.razred) <= 2 ? NAJVISE_ZNAKOVA.mladi : NAJVISE_ZNAKOVA.stariji
    const tekstovi = new Map<string, string>()
    const broj = { lagano: 0, srednje: 0, tesko: 0 }
    let saSavjetom = 0

    for (const p of pitanja) {
      const oznaka = `${d.put} ${p.id ?? '(bez id-a)'}`
      const greskeTipova = provjeriTipove(p)
      if (greskeTipova.length) {
        greske.push(...greskeTipova.map(g => `${oznaka}: ${g}`))
        continue
      }
      greske.push(...provjeriPitanje(p).map(g => `${oznaka}: ${g}`))

      const prvi = sviIdevi.get(p.id)
      if (prvi) greske.push(`${oznaka}: id se već koristi u ${prvi}`)
      else sviIdevi.set(p.id, d.put)

      // Isti tekst uz različit crtež je drugo pitanje (npr. „Koliko iznosi kut γ?“)
      const kljuc = normaliziraj(p.pitanje) + (p.slika ? JSON.stringify(p.slika) : '')
      const isti = tekstovi.get(kljuc)
      if (isti) greske.push(`${oznaka}: isto pitanje kao ${isti}`)
      else tekstovi.set(kljuc, p.id)

      if (p.pitanje.length > granice.pitanje) upozorenja.push(`${oznaka}: pitanje ima ${p.pitanje.length} znakova (preporuka do ${granice.pitanje})`)
      const najduzi = Math.max(...p.ponudeni.map(o => o.length))
      if (najduzi > granice.odgovor) upozorenja.push(`${oznaka}: odgovor ima ${najduzi} znakova (preporuka do ${granice.odgovor})`)
      if (p.savjet && p.savjet.length > granice.savjet) upozorenja.push(`${oznaka}: savjet ima ${p.savjet.length} znakova (preporuka do ${granice.savjet})`)

      if (p.skriveno) continue
      if (p.tezina in broj) broj[p.tezina]++
      if (p.savjet) saSavjetom++
    }

    const ukupno = broj.lagano + broj.srednje + broj.tesko
    pokrivenost.push({ put: d.put, broj, saSavjetom, ukupno })
    const premalo = TEZINE.filter(t => broj[t.id] < MINIMUM_PO_TEZINI).map(t => `${t.naziv.toLowerCase()} ${broj[t.id]}`)
    if (premalo.length) upozorenja.push(`${d.put}: manje od ${MINIMUM_PO_TEZINI} pitanja po težini (${premalo.join(', ')})`)
  }

  return { greske, upozorenja, pokrivenost }
}
