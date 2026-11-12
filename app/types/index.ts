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
  krak?: boolean          // krak kuta (polupravac iz vrha): oznaka malim slovom stoji uz kraj, ne na sredini
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
  mreza?: boolean             // kvadratna mreža s jediničnim kvadratima ispod oznaka
}

// Za slike koje se ne mogu opisati crtežom (npr. kocka); datoteka je u public/slike/
export interface SlikaDatoteka {
  datoteka: string
  opis: string
}

export type Slika = Crtez | SlikaDatoteka

// Podaci za čitanje iz tablice ili dijagrama: kategorije i njihove vrijednosti
export interface PrikazPodataka {
  vrsta: 'tablica' | 'stupcasti' | 'slikovni'
  naslov: string              // naslov prikaza, ujedno opis za čitače zaslona
  oznake: string[]            // kategorije, npr. dani ili boje
  vrijednosti: number[]       // cijeli brojevi, isto ih je koliko i oznaka
  nazivOznaka?: string        // zaglavlje stupca s kategorijama (tablica)
  nazivVrijednosti?: string   // zaglavlje vrijednosti ili natpis osi (npr. „Broj učenika“)
  korak?: number              // stupčasti: razmak crta na osi; vrijednosti moraju biti njegovi višekratnici
  simbol?: string             // slikovni: znak koji se ponavlja (npr. ⭐)
  vrijednostSimbola?: number  // slikovni: koliko vrijedi jedan znak
}

// Mjesto na karti: natpis koji učenik povlači i zemljopisni položaj na koji pripada
export interface MjestoNaKarti {
  naziv: string               // npr. 'Hrvatsko zagorje'
  polozaj: [number, number]   // [zemljopisna dužina, širina] u stupnjevima, npr. [15.9, 46.1]
}

// Zadatak smještanja natpisa na kartu Hrvatske; svaki natpis ide na točno jedno mjesto
export interface ZadatakKarte {
  mjesta: MjestoNaKarti[]     // 3–8 mjesta
  okvir?: [number, number, number, number] // prikazani dio karte [zapad, jug, istok, sjever]; inače cijela Hrvatska
}

interface PitanjeOsnova {
  id: string
  tezina: Tezina
  pitanje: string
  objasnjenje: string
  savjet?: string         // pomoć tijekom rješavanja, ne smije otkriti odgovor
  skriveno?: boolean
}

export interface PitanjeIzbor extends PitanjeOsnova {
  slika?: Slika
  podaci?: PrikazPodataka  // tablica ili dijagram s podacima (lekcije o podacima)
  ponudeni: string[]      // uvijek 4 odgovora
  tocan: number           // indeks 0–3
  karta?: undefined
}

export interface PitanjeKarta extends PitanjeOsnova {
  karta: ZadatakKarte
  ponudeni?: undefined
  tocan?: undefined
  slika?: undefined
  podaci?: undefined
}

export type Pitanje = PitanjeIzbor | PitanjeKarta

// Odgovor na pitanje s izborom je indeks odgovora; na kartu je za svaki natpis (redom kao u mjesta)
// indeks mjesta na koje je stavljen, ili null dok nije stavljen
export type RasporedNaKarti = (number | null)[]
export type Odgovor = number | RasporedNaKarti

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
