import type { DatotekaLekcije, Pitanje, Tezina } from '../types'
import { napraviGenerator, promijesaj } from '../utils/slucajno'

const ucitaneLekcije = new Map<string, Promise<DatotekaLekcije | null>>()

// Datoteka lekcije koja ne postoji (gradivo još nije pripremljeno) vraća null.
// Pamte se samo uspješno učitane datoteke, kako bi se nova datoteka pojavila bez ponovnog učitavanja stranice.
export function ucitajLekciju(razred: number, predmetId: string, lekcijaId: string): Promise<DatotekaLekcije | null> {
  const putanja = `/pitanja/${razred}/${predmetId}/${lekcijaId}.json`
  let ucitavanje = ucitaneLekcije.get(putanja)
  if (!ucitavanje) {
    ucitavanje = $fetch<DatotekaLekcije>(putanja)
      .then(d => (d && typeof d === 'object' && Array.isArray(d.pitanja) ? d : null))
      .catch(() => null)
      .then((d) => {
        if (!d) ucitaneLekcije.delete(putanja)
        return d
      })
    ucitaneLekcije.set(putanja, ucitavanje)
  }
  return ucitavanje
}

export function aktivnaPitanja(datoteka: DatotekaLekcije | null, tezina: Tezina): Pitanje[] {
  return datoteka?.pitanja.filter(p => p.tezina === tezina && !p.skriveno) ?? []
}

export function prebrojiPoTezini(datoteka: DatotekaLekcije | null): Record<Tezina, number> {
  return {
    lagano: aktivnaPitanja(datoteka, 'lagano').length,
    srednje: aktivnaPitanja(datoteka, 'srednje').length,
    tesko: aktivnaPitanja(datoteka, 'tesko').length
  }
}

export function promijesajOdgovore(pitanje: Pitanje, slucajno: () => number): Pitanje {
  const redoslijed = promijesaj(pitanje.ponudeni.map((_, i) => i), slucajno)
  return {
    ...pitanje,
    ponudeni: redoslijed.map(i => pitanje.ponudeni[i]!),
    tocan: redoslijed.indexOf(pitanje.tocan)
  }
}

// Ravnomjerno uzima pitanja iz svake lekcije (redom, jedno po jedno); kad lekciji ponestane
// pitanja, ostatak se popunjava iz ostalih. Prvo se troše pitanja koja učenik još nije vidio,
// a već viđena tek kad neviđenih nema dovoljno. Isti seed i ista viđena pitanja daju isti kviz.
export function odaberiPitanja(
  datoteke: DatotekaLekcije[],
  tezina: Tezina,
  broj: number,
  seed: string,
  vidjena: (lekcijaId: string) => Set<string> = () => new Set()
): Pitanje[] {
  const slucajno = napraviGenerator(seed)
  const promijesani = datoteke.map(d => ({ pitanja: promijesaj(aktivnaPitanja(d, tezina), slucajno), vidjena: vidjena(d.lekcijaId) }))
  const nevidjena = promijesani.map(b => b.pitanja.filter(p => !b.vidjena.has(p.id)))
  const vec = promijesani.map(b => b.pitanja.filter(p => b.vidjena.has(p.id)))
  const odabrana: Pitanje[] = []
  for (const bazeni of [nevidjena, vec]) {
    for (let i = 0; odabrana.length < broj && bazeni.some(b => b.length); i++) {
      const pitanje = bazeni[i % bazeni.length]!.shift()
      if (pitanje) odabrana.push(pitanje)
    }
  }
  return promijesaj(odabrana, slucajno).map(p => promijesajOdgovore(p, slucajno))
}

export function useOdabirPitanja() {
  return { ucitajLekciju, odaberiPitanja, prebrojiPoTezini }
}
