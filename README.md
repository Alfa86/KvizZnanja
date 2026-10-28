# Kviz znanja

Besplatni kvizovi iz školskih predmeta za učenike osnovne škole (1.–8. razred). Učenik odabere razred, predmet, lekcije, težinu i broj zadataka, rješava pitanja jedno po jedno uz neobavezan savjet i na kraju dobije ocjenu s objašnjenjem svakog odgovora.

Stranica je statična: nema prijave, baze podataka ni prikupljanja osobnih podataka. Pitanja su obične JSON datoteke u repozitoriju. Pripremaju se uz pomoć AI alata izvan aplikacije, a svako pitanje pregledava osoba prije objave.

## Tehnologije

- [Nuxt 4](https://nuxt.com) (Vue 3, TypeScript), statični build
- [Tailwind CSS 4](https://tailwindcss.com) i font Nunito
- [Pinia](https://pinia.vuejs.org) za stanje kviza (sprema se u `sessionStorage`)
- [Vitest](https://vitest.dev) za testove

## Pokretanje

Potreban je Node.js `^22.21.0`, `^24.11.0` ili `>=26` (starije verzije rade, ali Nuxt upozorava).

```bash
npm install
npm run dev
```

Stranica je dostupna na http://localhost:3000.

## Naredbe

| Naredba | Što radi |
|---|---|
| `npm run dev` | Razvojni server s automatskim osvježavanjem; uključuje stranicu `/pregled` |
| `npm run generate` | Statični build za objavu u `.output/public/` (prije toga pokreće `npm run provjeri`) |
| `npm run build` | Build sa serverom (Node); također pokreće `npm run provjeri` |
| `npm run preview` | Lokalni pregled builda |
| `npm test` | Svi testovi (logika kviza, ocjene, crteži i sav sadržaj) |
| `npm run typecheck` | Provjera TypeScript tipova |
| `npm run provjeri` | Provjera kurikuluma i svih pitanja, izvještaj o pokrivenosti |
| `npm run -s prompt -- {razred}/{predmet}/{lekcija} {težina}` | Slaže prompt za generiranje novih pitanja za lekciju |

Ako nova Vue komponenta ne dobije Tailwind stilove, ponovno pokreni `npm run dev`.

## Kako radi aplikacija

```
Početna → Razred → Predmet (odabir lekcija, težine i broja zadataka) → Kviz → Rezultati
```

- **Kurikulum** je u `app/data/kurikulum.json`: razredi → predmeti → cjeline → lekcije, svaka lekcija s opisom i ključnim pojmovima.
- **Pitanja** su u `public/pitanja/{razred}/{predmet}/{lekcija}.json` i učitavaju se tek kad kviz počne.
- **Odabir pitanja** (`app/composables/useOdabirPitanja.ts`) ravnomjerno uzima pitanja odabrane težine iz svih odabranih lekcija i miješa pitanja i odgovore generatorom sa seedom. Sve postavke i seed su u URL-u. Preglednik pamti koja je pitanja učenik već odgovorio (`app/utils/vidjenaPitanja.ts`, u `localStorage`) i prvo nudi neviđena; kad vidi sva pitanja lekcije, počinje novi krug. Odabrana pitanja spremaju se za sesiju, pa osvježavanje stranice ne mijenja kviz.
- **Savjet** ne oduzima bodove; na rezultatima se vidi koliko je savjeta korišteno.
- **Ocjena** se računa iz postotka točnih odgovora (`app/composables/useOcjena.ts`): ispod 50 % nedovoljan, od 50 % dovoljan, od 63 % dobar, od 78 % vrlo dobar, od 90 % odličan.
- **Geometrijski crteži** opisani su podacima u polju `slika` i iscrtavaju se kao SVG (`app/components/GeometrijskiCrtez.vue`), bez slikovnih datoteka.
- **Broj pitanja po lekciji** daje `/pitanja/indeks.json`, koji se generira pri buildu. Predmeti i razredi bez pitanja prikazuju se kao „uskoro“.
- **SEO**: `useSeo()` postavlja meta oznake, Open Graph i strukturirane podatke; `sitemap.xml`, `robots.txt` i `llms.txt` generiraju se iz kurikuluma (`server/routes/`).

## Struktura projekta

```
app/
├── pages/            stranice (početna, razred, predmet, kviz, rezultati, /pregled)
├── components/       UI komponente
├── composables/      odabir pitanja, ocjena, kurikulum, SEO
├── stores/kviz.ts    stanje kviza (Pinia)
├── utils/            provjera pitanja i crteža, generator slučajnih brojeva, kurikulum
├── types/index.ts    tipovi podataka
├── data/kurikulum.json
└── kurikulum/        izvedbeni planovi po predmetu i grupiranje sati u lekcije
public/pitanja/       pitanja po razredu, predmetu i lekciji
sadrzaj/              upute i predložak prompta za pitanja, kontrolna lista za pregled
scripts/              npm run provjeri i npm run prompt
server/               sitemap, robots.txt, llms.txt i indeks pitanja
shared/utils/         tekstovi stranice i česta pitanja
tests/                testovi
```

Detaljan plan razvoja, odluke i format podataka su u [`plan-razvoja-kviz-stranice.md`](plan-razvoja-kviz-stranice.md).

## Dodavanje pitanja

Potpune upute su u [`sadrzaj/upute-za-generiranje.md`](sadrzaj/upute-za-generiranje.md). Ukratko:

1. Provjeri da lekcija postoji u `app/data/kurikulum.json` i da joj opis odgovara gradivu.
2. Složi prompt i kopiraj ga u AI alat:
   ```bash
   npm run -s prompt -- 4/matematika/pisano-zbrajanje lagano
   npm run -s prompt -- 4/matematika/pojam-kuta srednje --broj 20 --crtezi
   ```
   Prompt se ispiše i spremi u `sadrzaj/zadnji-prompt.txt`. Sam upisuje sljedeći slobodni id i postojeća pitanja lekcije.
3. Spremi odgovor u `public/pitanja/{razred}/{predmet}/{lekcija}.json` (kod dopune dodaj nova pitanja na kraj popisa).
4. Pokreni `npm run provjeri` i ispravi sve greške.
5. Pogledaj pitanja na http://localhost:3000/pregled (posebno crteže).
6. Pregledaj svako pitanje prema [`sadrzaj/kontrolna-lista.md`](sadrzaj/kontrolna-lista.md).
7. Commit i push.

Primjer jednog pitanja:

```json
{
  "id": "4-matematika-pisano-zbrajanje-001",
  "tezina": "lagano",
  "pitanje": "Izračunaj 3000 + 4000.",
  "ponudeni": ["6000", "7000", "8000", "3400"],
  "tocan": 1,
  "objasnjenje": "3 tisućice i 4 tisućice su 7 tisućica.",
  "savjet": "Zbroji tisućice kao da zbrajaš 3 + 4."
}
```

- `tezina` je `lagano`, `srednje` ili `tesko`; cilj je barem 30 pitanja po težini za svaku lekciju.
- `id` se nikad ne koristi ponovno. Pitanje se ne briše nego skriva s `"skriveno": true`.
- Položaj točnog odgovora nije bitan jer se odgovori miješaju pri prikazu.

## Provjera sadržaja

`npm run provjeri` ispisuje broj pitanja po lekciji i težini, lekcije bez pitanja te upozorenja i greške. Greške zaustavljaju build:

- neispravan JSON ili oblik datoteke, polja pogrešnog tipa
- datoteka koja ne odgovara lekciji iz kurikuluma
- id koji se ponavlja bilo gdje u projektu
- pitanje koje se ponavlja u istoj lekciji
- broj odgovora različit od 4, prazni ili jednaki odgovori, odgovori tipa „sve navedeno“
- savjet koji sadrži točan odgovor
- neispravan crtež (nepostojeće točke, koordinate izvan mreže, kut nacrtan drugačije nego što je označen)

Upozorenja (ne zaustavljaju build) su predug tekst (strože za 1. i 2. razred) i manje od 30 pitanja po težini.

## Objava

```bash
NUXT_PUBLIC_SITE_URL=https://primjer.hr npm run generate
```

Sadržaj mape `.output/public/` objavljuje se na bilo kojem statičnom hostingu (Cloudflare Pages, Netlify, Vercel). Na tim servisima naredba za build je `npm run generate`, a izlazna mapa `.output/public`.

| Varijabla | Značenje |
|---|---|
| `NUXT_PUBLIC_SITE_URL` | Javna adresa stranice za kanonske poveznice, sitemap i robots.txt (zadano `http://localhost:3000`) |
| `NUXT_PUBLIC_KEKS_PAY_URL` | Poveznica za podršku putem KEKS Paya; prazna vrijednost skriva podršku na cijeloj stranici |

## Izvori gradiva

Izvor kurikuluma i izvedbenih planova za sve razrede i predmete je [i-nastava](https://i-nastava.gov.hr/), javno dostupna platforma Ministarstva znanosti, obrazovanja i mladih. Planovi preuzeti odande nalaze se u `app/kurikulum/{razred}/{Predmet}/`, a iz njih su složene cjeline i lekcije u `app/data/kurikulum.json`. Lekcije su pojmovne i ne vežu se uz određeni udžbenik ni čitanku, jer škole koriste različite.
