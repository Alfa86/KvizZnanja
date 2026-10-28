import { defineStore } from 'pinia'
import type { DatotekaLekcije, Pitanje, PostavkeKviza } from '~/types'
import { izracunajOcjenu, type Ocjena } from '~/composables/useOcjena'
import { aktivnaPitanja, odaberiPitanja, ucitajLekciju } from '~/composables/useOdabirPitanja'
import { kljucPostavki } from '~/utils/postavkeKviza'
import { dodajVidjeno, procitajVidjena, zapisiVidjena } from '~/utils/vidjenaPitanja'

interface SpremljenoStanje {
  // Odabrana pitanja se spremaju jer odabir ovisi i o viđenim pitanjima, koja se tijekom kviza mijenjaju
  pitanja?: Pitanje[]
  odgovori: (number | null)[]
  koristenSavjet: boolean[]
  trenutnoPitanje: number
  zavrseno: boolean
}

const PREFIKS = 'kviz:'

// sessionStorage može biti nedostupan (privatni način, blokirani podaci), pa se greške ignoriraju
function procitaj(kljuc: string): SpremljenoStanje | null {
  try {
    const tekst = sessionStorage.getItem(PREFIKS + kljuc)
    return tekst ? JSON.parse(tekst) as SpremljenoStanje : null
  }
  catch {
    return null
  }
}

function zapisi(kljuc: string, stanje: SpremljenoStanje | null) {
  try {
    if (stanje) sessionStorage.setItem(PREFIKS + kljuc, JSON.stringify(stanje))
    else sessionStorage.removeItem(PREFIKS + kljuc)
  }
  catch {
    // napredak se tada samo ne čuva pri osvježavanju
  }
}

export const useKvizStore = defineStore('kviz', {
  state: () => ({
    postavke: null as PostavkeKviza | null,
    pitanja: [] as Pitanje[],
    // Id-evi aktivnih pitanja odabrane težine po lekciji, za bilježenje viđenih pitanja
    aktivniPoLekciji: {} as Record<string, string[]>,
    odgovori: [] as (number | null)[],
    koristenSavjet: [] as boolean[],
    trenutnoPitanje: 0,
    zavrseno: false
  }),

  getters: {
    kljuc: (s): string | null => (s.postavke ? kljucPostavki(s.postavke) : null),
    brojTocnih: s => s.pitanja.reduce((n, p, i) => n + (s.odgovori[i] === p.tocan ? 1 : 0), 0),
    brojSavjeta: s => s.koristenSavjet.filter(Boolean).length,
    brojOdgovorenih: s => s.odgovori.filter(o => o !== null).length,
    postotak(): number {
      return this.pitanja.length ? (this.brojTocnih / this.pitanja.length) * 100 : 0
    },
    ocjena(): Ocjena {
      return izracunajOcjenu(this.postotak)
    },
    jeZavrseno: s => s.zavrseno
  },

  actions: {
    // Slaže kviz iz postavki (prvo neviđena pitanja) ili vraća spremljeni kviz i napredak ako postoji
    async pokreni(postavke: PostavkeKviza) {
      const kljuc = kljucPostavki(postavke)
      if (this.kljuc === kljuc && this.pitanja.length) return

      const datoteke = (await Promise.all(
        postavke.lekcijeIds.map(id => ucitajLekciju(postavke.razred, postavke.predmetId, id))
      )).filter((d): d is DatotekaLekcije => d !== null)
      const { razred, predmetId, tezina } = postavke
      const spremljeno = procitaj(kljuc)
      const pitanja = spremljeno?.pitanja?.length
        ? spremljeno.pitanja
        : odaberiPitanja(datoteke, tezina, postavke.brojZadataka, postavke.seed, id => procitajVidjena(razred, predmetId, id, tezina))

      this.postavke = postavke
      this.pitanja = pitanja
      this.aktivniPoLekciji = Object.fromEntries(datoteke.map(d => [d.lekcijaId, aktivnaPitanja(d, tezina).map(p => p.id)]))
      this.odgovori = pitanja.map(() => null)
      this.koristenSavjet = pitanja.map(() => false)
      this.trenutnoPitanje = 0
      this.zavrseno = false

      if (spremljeno && spremljeno.odgovori.length === pitanja.length) {
        this.odgovori = spremljeno.odgovori
        this.koristenSavjet = spremljeno.koristenSavjet
        this.trenutnoPitanje = Math.min(spremljeno.trenutnoPitanje, pitanja.length - 1)
        this.zavrseno = spremljeno.zavrseno
      }
    },

    spremi() {
      if (!this.kljuc) return
      zapisi(this.kljuc, {
        pitanja: this.pitanja,
        odgovori: this.odgovori,
        koristenSavjet: this.koristenSavjet,
        trenutnoPitanje: this.trenutnoPitanje,
        zavrseno: this.zavrseno
      })
    },

    odaberiOdgovor(indeks: number) {
      if (this.zavrseno) return
      if (this.odgovori[this.trenutnoPitanje] === null) this.zabiljeziVidjeno(this.pitanja[this.trenutnoPitanje]!.id)
      this.odgovori[this.trenutnoPitanje] = indeks
      this.spremi()
    },

    zabiljeziVidjeno(id: string) {
      if (!this.postavke) return
      const { razred, predmetId, tezina } = this.postavke
      const lekcija = Object.entries(this.aktivniPoLekciji).find(([, idevi]) => idevi.includes(id))
      if (!lekcija) return
      const [lekcijaId, aktivni] = lekcija
      zapisiVidjena(razred, predmetId, lekcijaId, tezina, dodajVidjeno(procitajVidjena(razred, predmetId, lekcijaId, tezina), aktivni, id))
    },

    prikaziSavjet() {
      if (this.zavrseno) return
      this.koristenSavjet[this.trenutnoPitanje] = true
      this.spremi()
    },

    dalje() {
      if (this.trenutnoPitanje < this.pitanja.length - 1) {
        this.trenutnoPitanje++
        this.spremi()
      }
    },

    natrag() {
      if (this.trenutnoPitanje > 0) {
        this.trenutnoPitanje--
        this.spremi()
      }
    },

    zavrsi() {
      this.zavrseno = true
      this.spremi()
    },

    resetiraj() {
      if (this.kljuc) zapisi(this.kljuc, null)
      this.$reset()
    }
  }
})
