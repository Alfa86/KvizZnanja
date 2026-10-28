# Plan razvoja: edukativna kviz stranica za osnovnu školu

## 1. Pregled projekta

Web stranica na kojoj učenici od 1. do 8. razreda rješavaju kvizove iz školskih predmeta. Kviz se slaže iz banke pitanja prema odabranom razredu, predmetu, lekcijama, broju zadataka i težini. Ako učenik zapne, može otvoriti savjet koji ga usmjerava prema rješenju, ali ga ne otkriva. Na kraju kviza prikazuju se točni i netočni odgovori s objašnjenjima, broj bodova i ocjena.

Pitanja priprema administrator **izvan aplikacije** (npr. uz pomoć AI alata po izboru), pregledava ih i sprema u JSON datoteke u repozitoriju. Aplikacija sama ne poziva AI ni jedan vanjski servis za sadržaj.

**Zašto ne generiranje AI-em uživo:** uvjeti korištenja AI API-ja (npr. Gemini) ograničavaju upotrebu u servisima namijenjenima maloljetnicima; svako pitanje koje dijete vidi prethodno je pregledano; nema troškova, kvota, API ključeva ni server koda u prve dvije faze.

### Tok korisnika

```
Početna → Odabir razreda → Odabir predmeta → Opcije kviza → Kviz → Rezultati
                                              (lekcije,
                                               broj zadataka,
                                               težina)
```

### Tok sadržaja

```
Opis lekcije (kurikulum.json) → Generiranje izvan aplikacije → JSON datoteka
→ npm run provjeri (automatska validacija) → Ručni pregled → Commit → Deploy
```

### Tehnološki stog

| Područje | Tehnologija | Napomena |
|---|---|---|
| Framework | Nuxt (Vue 3, TypeScript) | U MVP 1–2 statična stranica (`nuxt generate`) |
| Stilovi / UI | Tailwind CSS (+ po želji Nuxt UI) | Brza izrada responzivnog sučelja |
| Stanje aplikacije | Pinia | Čuva postavke, pitanja i odgovore |
| Validacija | Vlastita provjera (`app/utils/provjeraSadrzaja.ts`), Zod tek za API u MVP 3 | Provjera JSON datoteka s pitanjima |
| Sadržaj | JSON datoteke u repozitoriju | Git je ujedno povijest izmjena i „administracija“ |
| Baza (MVP 3) | Supabase (PostgreSQL), besplatni plan | Samo za prijave grešaka |
| Hosting | Vercel, Netlify ili Cloudflare Pages | Statični hosting, kasnije jedna server ruta |

### Načela koja vrijede kroz sve faze

1. **Aplikacija ne koristi AI.** Sav sadržaj su statične JSON datoteke koje je pregledao administrator.
2. **Ništa ne ide u produkciju bez validacije.** Skripta za provjeru sadržaja pokreće se prije svakog builda; neispravna datoteka ruši build.
3. **Bez osobnih podataka djece.** Nema registracije ni kolačića za praćenje.
4. **Stranica je statična dokle god je moguće.** Server kod uvodi se tek kad je stvarno potreban (prijave grešaka u MVP 3).
5. **Točni odgovori su u javnim JSON datotekama.** To je svjesno prihvaćeno: kviz služi za vježbu, rezultati se nigdje ne upisuju.

---

## 2. MVP 1: Frontend i tok aplikacije

### Cilj

Kompletan, klikabilan tok od početne stranice do rezultata, s pravom bankom pitanja u konačnom formatu podataka za 1–2 razreda i 2–3 predmeta.

### Opseg

- Struktura gradiva (`kurikulum.json`) i datoteke s pitanjima po lekcijama
- Sve stranice i komponente toka
- Odabir pitanja iz banke i miješanje odgovora uz ponovljiv „seed“
- Pinia store za stanje kviza
- Logika bodovanja i ocjenjivanja
- Responzivni dizajn prilagođen djeci (veliki gumbi, jasni fontovi, boje po predmetima)

### Struktura projekta

Projekt koristi Nuxt 4, u kojem je kod aplikacije (komponente, stranice, store, tipovi, `data/`) u direktoriju `app/`, a `public/` ostaje u korijenu. Prikaz ispod je pojednostavljen.

```
/
├── app.vue
├── nuxt.config.ts
├── assets/
│   └── css/main.css
├── components/
│   ├── KarticaRazreda.vue
│   ├── KarticaPredmeta.vue
│   ├── OdabirLekcija.vue
│   ├── OdabirBrojaZadataka.vue
│   ├── OdabirTezine.vue
│   ├── PitanjeKartica.vue
│   ├── SavjetGumb.vue
│   ├── TrakaNapretka.vue
│   └── PregledOdgovora.vue
├── composables/
│   ├── useOcjena.ts
│   └── useOdabirPitanja.ts               # filtriranje, raspodjela, miješanje
├── data/
│   └── kurikulum.json                    # razredi, predmeti, lekcije (mali, ide u bundle)
├── public/
│   └── pitanja/
│       └── 5/
│           └── priroda/
│               ├── biljni-organi.json    # učitava se tek kad je lekcija odabrana
│               └── fotosinteza.json
├── pages/
│   ├── index.vue                         # odabir razreda
│   ├── razred/
│   │   └── [razred]/
│   │       ├── index.vue                 # odabir predmeta
│   │       └── [predmet].vue             # opcije kviza
│   ├── kviz.vue                          # rješavanje
│   └── rezultati.vue                     # bodovi, ocjena, pregled
├── stores/
│   └── kviz.ts
├── types/
│   └── index.ts
└── utils/
    └── slucajno.ts                       # generator slučajnih brojeva sa seedom
```

### Rute

| Ruta | Sadržaj |
|---|---|
| `/` | Kartice razreda 1–8 |
| `/razred/5` | Predmeti za 5. razred |
| `/razred/5/priroda` | Odabir lekcija, broja zadataka (10/20/30) i težine |
| `/kviz?r=5&p=priroda&l=biljni-organi,fotosinteza&n=20&t=srednje&s=8f3a2c` | Jedno pitanje po ekranu, traka napretka, gumbi „Dalje“ / „Natrag“ |
| `/rezultati` | Bodovi, postotak, ocjena, pregled svih pitanja s objašnjenjima |

**Kviz je u potpunosti opisan URL-om.** Parametar `s` (seed) određuje koja su pitanja odabrana i redoslijed ponuđenih odgovora. Posljedice:

- Osvježavanje stranice ne gubi kviz
- Link se može podijeliti: učitelj pošalje link i cijeli razred dobije isti kviz, bez baze podataka
- Odgovori u tijeku spremaju se u `sessionStorage` pod ključem seeda, pa preživljavaju osvježavanje
- Ako se datoteka s pitanjima kasnije promijeni, stari link može dati malo drugačiji kviz, što je prihvatljivo

Ako `/rezultati` nema podataka (npr. izravan dolazak), preusmjerava na početnu.

### Format podataka

**Datoteka lekcije** (`public/pitanja/{razred}/{predmet}/{lekcija}.json`):

```json
{
  "lekcijaId": "fotosinteza",
  "pitanja": [
    {
      "id": "5-priroda-fotosinteza-001",
      "tezina": "lagano",
      "pitanje": "Koji organ u biljci upija vodu iz tla?",
      "ponudeni": ["List", "Korijen", "Cvijet", "Plod"],
      "tocan": 1,
      "objasnjenje": "Korijen upija vodu i mineralne tvari iz tla.",
      "savjet": "Razmisli koji se dio biljke nalazi ispod zemlje."
    }
  ]
}
```

- `savjet` je neobavezan; ako ga pitanje nema, gumb za savjet se ne prikazuje
- `slika` je neobavezna (vidi „Slike i geometrijski crteži“)

### Slike i geometrijski crteži

Pitanje može imati crtež opisan podacima, koji komponenta `GeometrijskiCrtez.vue` iscrtava kao SVG. Koordinate su na mreži 0–10, s ishodištem dolje lijevo.

```json
"slika": {
  "opis": "Trokut ABC s kutovima α = 50° i β = 60°",
  "tocke": { "A": [1, 1], "B": [9, 1], "C": [5.74, 6.65] },
  "poligoni": [{ "vrhovi": ["A", "B", "C"], "ispuna": true }],
  "duzine": [{ "od": "A", "do": "B", "oznaka": "c", "crtice": 1 }],
  "kutovi": [{ "vrh": "A", "oznaka": "50°" }, { "vrh": "C", "pravi": true }],
  "kruznice": [{ "sredite": "S", "polumjer": 4 }],
  "istaknuteTocke": ["S"]
}
```

| Element | Značenje |
|---|---|
| `opis` | Obavezan alternativni tekst za čitače zaslona |
| `tocke` | Imenovane točke; imena se ispisuju izvan lika (osim onih u `skrivenaImena`) |
| `poligoni` | Zatvoreni likovi, po želji ispunjeni |
| `duzine` | Dužine s oznakom (a, 5 cm, x, ?), isprekidane i/ili s crticama jednakosti |
| `kutovi` | Luk s oznakom ili kvadratić za pravi kut; kraci se uzimaju iz poligona ili se zadaju s `"kraci": ["C", "D"]` (npr. za vanjski kut) |
| `kruznice` | Kružnica sa središtem u zadanoj točki |

Brojčano označen kut mora biti i nacrtan približno te veličine (odstupanje do 5°), a kut označen kao pravi mora biti nacrtan kao 90°. Za slike koje se ne mogu opisati crtežom koristi se datoteka: `"slika": { "datoteka": "/slike/6/matematika/kocka.svg", "opis": "…" }`.

Oznake u tekstu pišu se Unicode znakovima: α β γ δ, °, ∠ABC, △ABC, ⊥, ∥, cm², √, ·.

### Pregled sadržaja

U razvojnom načinu (`npm run dev`) stranica `/pregled` prikazuje sva pitanja lekcije s crtežima, točnim odgovorima i greškama provjere. Gumb „Osvježi“ ponovno učitava datoteku nakon izmjene. Te stranice ne ulaze u produkcijski build.
- `id` je globalno jedinstven i **nikad se ne koristi ponovno**, ni kad se pitanje obriše (potreban je za prijave grešaka u MVP 3)
- Pitanje koje treba privremeno ukloniti dobiva `"skriveno": true` umjesto brisanja

### Cjeline i izvori kurikuluma

Izvedbeni planovi po predmetu nalaze se u `app/kurikulum/{razred}/{Predmet}/*_poglavlja.{txt,csv}` (jedan redak = jedan nastavni sat, stupac `table` u csv-u je tjedan). U istoj mapi `grupiranje.json` grupira sate u cjeline i lekcije za odabir u kvizu; polje `izvori` čuva brojeve redaka. Lekcije su pojmovne (ne vežu se uz pojedinu pjesmu ili jedinicu udžbenika) jer škole koriste različite udžbenike. Iz `grupiranje.json` prenose se cjeline i lekcije (bez `izvori`) u `app/data/kurikulum.json`.

Broj pitanja po lekciji i težini daje ruta `/pitanja/indeks.json` (pri statičkom buildu prerenderirana). Predmet ili razred bez ijednoga pitanja prikazuje se kao „uskoro“, a sitemap i llms.txt navode samo lekcije koje imaju pitanja.

### Tipovi podataka

```ts
// types/index.ts
export type Tezina = 'lagano' | 'srednje' | 'tesko'
export type BrojZadataka = 10 | 20 | 30

export interface Lekcija {
  id: string
  naziv: string
  opis: string            // 3–5 rečenica prema kurikulumu, koristi se pri generiranju pitanja
  kljucniPojmovi: string[]
}

// Cjelina grupira srodne lekcije (npr. „Brojevi do milijun“); predmet bez podjele ima jednu cjelinu
export interface Cjelina {
  id: string
  naziv: string
  ikona: string
  lekcije: Lekcija[]
}

export interface Predmet {
  id: string              // npr. 'priroda'
  naziv: string
  ikona: string
  boja: string
  cjeline: Cjelina[]      // zapisano u kurikulum.json
  lekcije: Lekcija[]      // ravan popis svih lekcija, izvodi ga pripremiRazrede() pri učitavanju
}

export interface Razred {
  broj: number            // 1–8
  predmeti: Predmet[]
}

export interface Pitanje {
  id: string
  tezina: Tezina
  pitanje: string
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
```

### Odabir pitanja (`useOdabirPitanja`)

1. Učitati datoteke odabranih lekcija
2. Zadržati pitanja odabrane težine koja nisu skrivena
3. Ravnomjerno rasporediti traženi broj po lekcijama; ako jedna lekcija nema dovoljno pitanja, razliku popuniti iz ostalih
4. Nasumično odabrati pitanja i promiješati redoslijed ponuđenih odgovora (uz ažuriranje `tocan`), sve s generatorom inicijaliziranim seedom
5. Na stranici opcija onemogućiti broj zadataka veći od broja dostupnih pitanja (uz kratko objašnjenje)

Miješanje odgovora pri prikazu znači da položaj točnog odgovora u JSON datoteci nije bitan.

### Pinia store

Store `kviz` čuva:

- `postavke: PostavkeKviza | null`
- `pitanja: Pitanje[]` (već odabrana i promiješana)
- `odgovori: (number | null)[]` (odabrani indeks po pitanju)
- `koristenSavjet: boolean[]` (je li učenik otvorio savjet za pitanje)
- `trenutnoPitanje: number`
- akcije: `pokreni(postavke)`, `odaberiOdgovor(indeks)`, `prikaziSavjet()`, `dalje()`, `natrag()`, `zavrsi()`, `resetiraj()`
- getteri: `brojTocnih`, `brojSavjeta`, `postotak`, `ocjena`, `jeZavrseno`

Odgovori i korišteni savjeti spremaju se zajedno u `sessionStorage`.

### Savjet

- Gumb „Treba mi pomoć“ ispod ponuđenih odgovora, samo ako pitanje ima `savjet`
- Klik otvara savjet ispod pitanja; jednom otvoren savjet ostaje vidljiv i nakon povratka na pitanje
- Savjet ne oduzima bodove; kviz je za učenje i cilj je da dijete ne odustane
- Na rezultatima se uz pitanje prikazuje ikona ako je korišten savjet, a u sažetku ukupan broj savjeta („Riješio/la si 17 od 20, uz 3 savjeta“)

### Bodovanje i ocjena

Svako točno pitanje nosi 1 bod. Ocjena se određuje prema postotku i donjim granicama:

| Postotak | Ocjena |
|---|---|
| < 50 % | nedovoljan (1) |
| ≥ 50 % | dovoljan (2) |
| ≥ 63 % | dobar (3) |
| ≥ 78 % | vrlo dobar (4) |
| ≥ 90 % | odličan (5) |

Postotak se ne zaokružuje prije usporedbe (npr. 18/30 = 60 % → dovoljan, 19/30 = 63,3 % → dobar). Granice se drže u jednom objektu u `composables/useOcjena.ts` kako bi se lako mijenjale.

### Smjernice za dizajn (prilagođeno djeci)

- Minimalna veličina gumba 48 px, font teksta pitanja barem 18–20 px
- Svaki predmet ima svoju boju i ikonu radi lakšeg snalaženja
- Jedno pitanje po ekranu, bez žurbe i bez odbrojavanja vremena
- Gumb za savjet vidljiv, ali vizualno manje istaknut od ponuđenih odgovora, s prijateljskom ikonom (npr. žarulja)
- Pozitivne poruke na rezultatima bez obzira na ocjenu („Odlično si napredovao/la, probaj ponovno!“)
- Kontrast boja prema WCAG AA standardu

### Zadaci

1. Inicijalizirati Nuxt projekt s TypeScriptom, Tailwindom i Pinijom
2. Napisati `types/index.ts` i `data/kurikulum.json` za prve razrede
3. Pripremiti pitanja za barem jedan predmet (najmanje 15 po lekciji i težini)
4. Izraditi stranice odabira (razred → predmet → opcije)
5. Izraditi `utils/slucajno.ts`, `useOdabirPitanja`, stranicu kviza i store
6. Izraditi stranicu rezultata i `useOcjena`
7. Testirati na mobitelu, tabletu i računalu

### Kriteriji završetka

- [ ] Moguće je proći cijeli tok od početne do rezultata
- [ ] Kviz poštuje odabrani broj zadataka, težinu i ravnomjernu raspodjelu po lekcijama
- [ ] Isti URL uvijek daje isti kviz; osvježavanje stranice ne gubi napredak
- [ ] Ocjena se računa ispravno na granicama (testirati `useOcjena` izravno: 0 %, 49,9 %, 50 %, 62,9 %, 63 %, 100 %)
- [ ] Rezultati prikazuju točan odgovor i objašnjenje za svako pitanje
- [ ] Savjet se prikazuje na zahtjev, ne utječe na bodove i vidljiv je u pregledu rezultata
- [ ] Stranica je upotrebljiva na mobitelu

---

## 3. MVP 2: Proces izrade sadržaja i prvi deploy

### Cilj

Uspostaviti pouzdan i ponovljiv način dodavanja pitanja: jasne upute za generiranje izvan aplikacije, automatska validacija i kontrolna lista za ručni pregled. Objaviti stranicu javno.

### Opseg

- Skripta za provjeru sadržaja (`npm run provjeri`)
- Upute i predložak prompta za generiranje pitanja izvan aplikacije
- Kontrolna lista za ručni pregled
- Izvještaj o pokrivenosti (koliko pitanja ima svaka lekcija po težini)
- Deploy statične stranice

### Nove datoteke

```
app/utils/provjeraSadrzaja.ts     # provjeriSadrzaj(): oblik, tipovi, kurikulum, id-evi, duplikati, pokrivenost
scripts/
├── provjeri-sadrzaj.ts           # npm run provjeri: čita datoteke, ispisuje izvještaj, izlazi s 1 kod greške
└── prompt.ts                     # npm run -s prompt -- 4/matematika/pisano-zbrajanje tesko: slaže prompt iz uputa
sadrzaj/
├── upute-za-generiranje.md       # predložak prompta i tijek rada
└── kontrolna-lista.md            # što provjeriti pri ručnom pregledu
```

Umjesto Zoda oblik i tipove polja provjerava sam `provjeriSadrzaj` (dovoljno za jednostavan format, bez dodatne ovisnosti). Istu funkciju poziva test `tests/sadrzaj.test.ts`. U `package.json` su `"provjeri": "tsx scripts/provjeri-sadrzaj.ts"` te `prebuild` i `pregenerate` koji je pokreću. ✅ Gotovo 28. 10. 2026.

### Što provjerava skripta

1. Svaka datoteka je ispravan JSON zadanog oblika, a polja imaju ispravne tipove
2. Putanja datoteke odgovara postojećem razredu, predmetu i lekciji u `kurikulum.json`, a `lekcijaId` odgovara nazivu datoteke
3. Svi `id`-evi su jedinstveni u cijelom repozitoriju
4. Točno 4 ponuđena odgovora, svi neprazni i međusobno različiti; `tocan` u rasponu 0–3
5. Nema duplikata pitanja unutar lekcije (usporedba normaliziranog teksta)
6. Nema zabranjenih odgovora („sve navedeno“, „ništa od navedenog“, „i A i B“)
7. Savjet ne sadrži točan odgovor kao cijeli izraz; crteži imaju opis, postojeće točke, koordinate u mreži i kutove nacrtane kako su označeni (`app/utils/provjera.ts` i `app/utils/crtez.ts`, koje već koriste test `tests/sadrzaj.test.ts` i stranica `/pregled`)
8. Ograničenje duljine teksta (pitanje, odgovori, savjet), strože za 1. i 2. razred
9. Izvještaj o pokrivenosti: broj aktivnih pitanja po lekciji i težini, s upozorenjem ispod minimuma (15), te udio pitanja sa savjetom

Greške 1–7 ruše build; 8 i 9 su upozorenja.

### Tijek rada za novu lekciju

1. Upisati lekciju u `kurikulum.json` (naziv, opis prema kurikulumu, ključni pojmovi)
2. Generirati pitanja izvan aplikacije prema predlošku iz `sadrzaj/upute-za-generiranje.md`
3. Spremiti rezultat u `public/pitanja/{razred}/{predmet}/{lekcija}.json` i dodijeliti `id`-eve
4. Pokrenuti `npm run provjeri` i ispraviti greške
5. Ručno pregledati pitanja prema kontrolnoj listi
6. Commit i deploy

### Predložak prompta (za `upute-za-generiranje.md`)

**Uloga i pravila:**

- Uloga: iskusni učitelj koji sastavlja provjere znanja za osnovnu školu u Hrvatskoj
- Jezik: hrvatski standardni jezik, rječnik primjeren dobi učenika
- Svako pitanje ima točno 4 ponuđena odgovora i samo jedan nedvojbeno točan
- Netočni odgovori moraju biti uvjerljivi, ali jasno netočni
- Bez trik-pitanja, dvostrukih negacija i odgovora tipa „sve navedeno“
- Objašnjenje u 1–2 rečenice, napisano djetetu
- Savjet u jednoj rečenici: usmjerava razmišljanje (podsjeća na pojam, pravilo ili prvi korak), ali ne navodi točan odgovor i ne isključuje izravno ponuđene odgovore
- Pitanja se smiju odnositi isključivo na zadano gradivo
- Izlaz isključivo kao JSON u zadanom formatu

**Definicije težine:**

| Težina | Što se traži |
|---|---|
| Lagano | Prepoznavanje i prisjećanje osnovnih pojmova i činjenica |
| Srednje | Razumijevanje i primjena na jednostavnim primjerima |
| Teško | Povezivanje više pojmova, zaključivanje, primjena u novoj situaciji |

**Podaci koji se ubacuju u prompt:** razred, predmet, naziv, opis i ključni pojmovi lekcije, težina i broj pitanja. Generirati po jednu težinu odjednom, u serijama od 10–20 pitanja. Za dopunu postojeće lekcije priložiti popis postojećih pitanja uz uputu da se ne ponavljaju.

**Crteži:** za pitanja kojima treba slika tražiti polje `slika` u zadanom formatu, s koordinatama na mreži 0–10, likovima koji zauzimaju veći dio mreže i kratkim `opis`om. Kutove s brojčanom oznakom tražiti nacrtane u stvarnoj veličini. Svaki crtež provjeriti na stranici `/pregled`.

**Prilagodba po dobi:** za 1. i 2. razred kraća pitanja i jednostavnije rečenice. Za matematiku tražiti da se izračun provjeri prije navođenja točnog odgovora, a pri pregledu svaki izračun provjeriti ručno.

### Kontrolna lista za ručni pregled

- Je li točan odgovor stvarno točan, i jedini točan?
- Odgovara li pitanje opisu lekcije i dobi učenika?
- Je li hrvatski jezik ispravan (padeži, pravopis, terminologija iz udžbenika)?
- Odgovara li pitanje označenoj težini?
- Je li objašnjenje točno i razumljivo djetetu?
- Pomaže li savjet bez da otkriva odgovor?
- Otkriva li formulacija pitanja odgovor?

Uočene vrste grešaka bilježiti u `sadrzaj/upute-za-generiranje.md` i prema njima doraditi predložak prompta.

### Zadaci

1. ~~Napisati `scripts/provjeri-sadrzaj.ts`~~ (gotovo)
2. ~~Napisati `upute-za-generiranje.md` i `kontrolna-lista.md`~~ (gotovo, u mapi `sadrzaj/`)
3. Isprobati predložak na najmanje 3 predmeta × 3 težine i doraditi ga
4. Popuniti pitanja za sve lekcije planiranih razreda za prvo izdanje
5. Postaviti deploy (statični build) na Vercel, Netlify ili Cloudflare Pages
6. Dodati na stranicu napomenu da su pitanja pripremljena uz pomoć AI alata i pregledana

### Kriteriji završetka

- [x] Build pada ako bilo koja datoteka s pitanjima nije ispravna
- [ ] Svaka objavljena lekcija ima barem 15 pitanja po težini
- [ ] Ručno je pregledano barem 100 pitanja i zabilježene su uočene vrste grešaka
- [ ] Dodavanje nove lekcije prema uputama traje manje od sat vremena
- [ ] Aplikacija je javno dostupna na testnoj domeni

---

## 4. MVP 3: Prijava grešaka, privatnost i proširenje gradiva

### Cilj

Omogućiti korisnicima da prijave grešku u pitanju, dodati politiku privatnosti i analitiku te proširiti gradivo na sve razrede i predmete.

### Arhitektura

```
┌──────────────┐  statične stranice i JSON  ┌──────────────────────┐
│  Preglednik  │ ◀───────────────────────── │  CDN (statični build) │
│  (Vue/Pinia) │                            └──────────────────────┘
│              │  POST prijava              ┌──────────────────────┐      ┌──────────────┐
│              │ ─────────────────────────▶ │  Nitro server ruta   │ ───▶ │   Supabase   │
└──────────────┘                            │  (validacija, limit) │      │ (PostgreSQL) │
                                            └──────────────────────┘      └──────────────┘
```

Sve osim prijava ostaje statično. Supabase servisni ključ koristi se samo na serveru, a na tablici je uključen Row Level Security.

### Model podataka

| Tablica | Ključna polja | Svrha |
|---|---|---|
| `prijave_gresaka` | `id`, `pitanje_id`, `razlog`, `komentar`, `ip_hash`, `created_at` | Prijave s gumba „Prijavi grešku“ |

Razlozi su unaprijed zadani (npr. „netočan odgovor“, „nejasno pitanje“, „pravopisna greška“, „ostalo“), a komentar je neobavezan i ograničene duljine.

### API

`POST /api/prijava` → tijelo `{ "pitanjeId": "5-priroda-fotosinteza-001", "razlog": "netocan-odgovor", "komentar": "" }`

- Validacija Zodom i provjera da `pitanjeId` postoji
- Najviše jedna prijava istog pitanja po IP hashu dnevno i ograničen ukupni broj prijava po IP hashu (škole dijele jednu IP adresu, pa granice ne smiju biti preniske)
- IP adresa se sprema samo kao hash

### Obrada prijava

Administrator pregledava prijave u Supabase sučelju (pogled grupiran po `pitanje_id`, poredan po broju prijava), ispravlja ili skriva pitanje u JSON datoteci i objavljuje novu verziju. Automatsko skrivanje pitanja nije predviđeno jer bi ga djeca mogla zloupotrijebiti, a sadržaj je ionako statičan.

### Sigurnost i privatnost

- Bez korisničkih računa za djecu i bez prikupljanja osobnih podataka
- Stranica s jednostavnom politikom privatnosti
- Analitika bez kolačića (npr. Plausible ili Umami), pa nije potreban pristanak na kolačiće
- Napomena da su pitanja pripremljena uz pomoć AI alata i da je moguće prijaviti grešku

### Zadaci

1. Kreirati Supabase projekt i tablicu `prijave_gresaka`, uključiti Row Level Security
2. Napisati server rutu `POST /api/prijava` s validacijom i ograničenjem
3. Dodati gumb „Prijavi grešku“ uz svako pitanje na stranici rezultata
4. Napraviti pogled za pregled prijava u Supabaseu
5. Dodati politiku privatnosti i analitiku bez kolačića
6. Proširiti gradivo na sve razrede i predmete

### Kriteriji završetka

- [ ] Prijava greške radi i vidljiva je administratoru
- [ ] Ponovljene prijave istog pitanja s iste adrese se ne bilježe
- [ ] Stranica i dalje radi kao statična ako server ruta nije dostupna (gumb prikazuje poruku o grešci)
- [ ] Gradivo je uneseno za sve planirane razrede i predmete

---

## 5. Ideje za kasnije faze

- Čitanje pitanja naglas (Web Speech API) za 1. i 2. razred
- Više vrsta crteža (brojevni pravac, koordinatni sustav, grafikoni) i fotografije za prirodu i geografiju
- Druge vrste zadataka: točno/netočno, spajanje parova, upisivanje odgovora
- Način „Vježba“ s trenutnim objašnjenjem nakon svakog pitanja
- Mješovita težina (dio pitanja svake težine)
- Korisnički računi i praćenje napretka (uz privolu roditelja prema GDPR-u, dob digitalnog pristanka u Hrvatskoj je 16 godina)
- Učiteljski način: učitelj ručno odabere pitanja i podijeli link s razredom
- Ispis kviza u PDF za rad u razredu
- Jednostavno administratorsko sučelje za uređivanje JSON datoteka, ako rad kroz git postane nepraktičan

---

## 6. Rizici i kako ih smanjiti

| Rizik | Mjera |
|---|---|
| Netočna pitanja | Automatska validacija, ručni pregled prema kontrolnoj listi, prijava grešaka |
| Velik posao izrade i pregleda sadržaja | Početi s malim brojem razreda i predmeta, serijsko generiranje, predložak prompta koji se stalno dorađuje |
| Premala banka pitanja (ponavljanje pri ponovnom rješavanju) | Minimum pitanja po lekciji i težini, izvještaj o pokrivenosti, onemogućen prevelik broj zadataka |
| Lošija kvaliteta hrvatskog jezika | Isprobati više AI alata za generiranje, jezične upute u promptu, ručni pregled |
| Gradivo se ne poklapa s nastavom | Opisi lekcija prema službenom kurikulumu, povratne informacije od učitelja |
| Točni odgovori vidljivi u JSON datotekama | Svjesno prihvaćeno: kviz je za vježbu i nema posljedica za učenika |
