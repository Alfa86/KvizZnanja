export type Tezina = 'lagano' | 'srednje' | 'tesko'
export type BrojZadataka = 10 | 20 | 30

export interface Lekcija {
  id: string
  naziv: string
  opis: string            // 3–5 rečenica prema kurikulumu, koristi se pri generiranju pitanja
  kljucniPojmovi: string[]
}

export interface Cjelina {
  id: string              // npr. 'brojevi-do-milijun'
  naziv: string
  ikona: string
  lekcije: Lekcija[]
}

export interface Predmet {
  id: string              // npr. 'priroda'
  naziv: string
  ikona: string
  boja: string
  cjeline: Cjelina[]      // predmet bez podjele ima jednu cjelinu
  lekcije: Lekcija[]      // sve lekcije redom, izvedeno iz cjelina pri učitavanju
}

export interface Razred {
  broj: number            // 1–8
  predmeti: Predmet[]
}

// Oblik zapisa u kurikulum.json, prije izvođenja popisa svih lekcija
export interface RazredIzvor {
  broj: number
  predmeti: Omit<Predmet, 'lekcije'>[]
}

// Broj pitanja po težini za svaku lekciju, ključ je 'razred/predmet/lekcija'
export type IndeksPitanja = Record<string, Record<Tezina, number>>

// Koordinate na mreži 0–10, ishodište dolje lijevo (y raste prema gore)
export type Tocka = [number, number]

export interface DuzinaCrteza {
  od: string
  do: string
  oznaka?: string         // npr. 'a', '5 cm', 'x', '?'
  isprekidana?: boolean
  crtice?: 1 | 2 | 3      // oznaka jednakih duljina
}

export interface KutCrteza {
  vrh: string
  kraci?: [string, string] // ako se izostavi, uzimaju se susjedni vrhovi iz poligona
  oznaka?: string         // npr. 'α', '50°', 'x', '?'
  pravi?: boolean         // crta kvadratić umjesto luka
}

export interface PoligonCrteza {
  vrhovi: string[]
  ispuna?: boolean
}

export interface KruznicaCrteza {
  sredite: string
  polumjer: number
  ispuna?: boolean        // krug (ispunjen) umjesto same kružnice
}

export interface Crtez {
  opis: string            // alternativni tekst za čitače zaslona
  tocke: Record<string, Tocka>
  poligoni?: PoligonCrteza[]
  duzine?: DuzinaCrteza[]
  kutovi?: KutCrteza[]
  kruznice?: KruznicaCrteza[]
  istaknuteTocke?: string[]   // crtaju se kao točkice
  skrivenaImena?: string[]    // točke čije se ime ne ispisuje
}

// Za slike koje se ne mogu opisati crtežom (npr. kocka); datoteka je u public/slike/
export interface SlikaDatoteka {
  datoteka: string
  opis: string
}

export type Slika = Crtez | SlikaDatoteka

export interface Pitanje {
  id: string
  tezina: Tezina
  pitanje: string
  slika?: Slika
  ponudeni: string[]      // uvijek 4 odgovora
  tocan: number           // indeks 0–3
  objasnjenje: string
  savjet?: string         // pomoć tijekom rješavanja, ne smije otkriti odgovor
  skriveno?: boolean
}

export interface DatotekaLekcije {
  lekcijaId: string
  pitanja: Pitanje[]
}

export interface PostavkeKviza {
  razred: number
  predmetId: string
  lekcijeIds: string[]
  brojZadataka: BrojZadataka
  tezina: Tezina
  seed: string
}
