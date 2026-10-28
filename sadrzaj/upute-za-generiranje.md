# Upute za generiranje pitanja

Pitanja se generiraju izvan aplikacije (u chatu s AI alatom), ručno pregledavaju i tek onda spremaju u repozitorij. Aplikacija sama ne poziva nikakav AI.

## Tijek rada za jednu lekciju

1. **Pripremi podatke lekcije.** U `app/data/kurikulum.json` pronađi lekciju i prepiši njezin `id`, `naziv`, `opis` i `kljucniPojmovi`. Ako opis ne odgovara onome što se stvarno uči, prvo ispravi opis.
2. **Odredi prvi slobodni broj id-a.** Id ima oblik `{razred}-{predmet}-{lekcija}-{broj}`, npr. `4-matematika-pisano-zbrajanje-017`. Ako datoteka već postoji, nastavi od najvećeg postojećeg broja. Id se nikad ne koristi ponovno, ni nakon brisanja pitanja.
3. **Generiraj jednu težinu odjednom**, u serijama od 10 do 20 pitanja, prema predlošku ispod. Za lekciju je cilj najmanje 15 pitanja po težini, pa su obično potrebne dvije serije po težini.
4. **Spremi rezultat** u `public/pitanja/{razred}/{predmet}/{lekcija}.json`. Kod dopune postojeće datoteke kopiraj samo nova pitanja na kraj popisa `pitanja`.
5. **Pokreni `npm run provjeri`** i ispravi sve greške (✗). Upozorenja (⚠) pročitaj i ispravi ako imaju smisla.
6. **Pregledaj crteže** na stranici `/pregled` (`npm run dev`), ako ih lekcija ima.
7. **Ručno pregledaj svako pitanje** prema [kontrolnoj listi](kontrolna-lista.md). Pitanje koje ne valja ispravi ili obriši; pitanje koje je već objavljeno ne briši nego mu dodaj `"skriveno": true`.
8. **Zabilježi nove vrste grešaka** u tablicu na dnu ove datoteke i po potrebi doradi predložak.

## Predložak prompta

Najlakše je da prompt složi naredba, iz ovih blokova i podataka lekcije:

```
npm run -s prompt -- 4/matematika/pisano-zbrajanje tesko
npm run -s prompt -- 4/matematika/pisano-zbrajanje lagano --broj 20 --crtezi
```

Ispisuje gotov prompt i sprema ga u `sadrzaj/zadnji-prompt.txt` (ne ide u git), odakle ga je lako kopirati. Sama upisuje sljedeći slobodni id, postojeća pitanja lekcije, granice duljine prema razredu i dodatak za predmet. Odjeljak o crtežima dodaje ako lekcija već ima pitanja s crtežom; za novu geometrijsku lekciju dodaj `--crtezi`. `--broj` je broj pitanja (zadano 15). Ako mijenjaš predložak, mijenjaj blokove u ovoj datoteci; naredba ih čita odavde.

Ručno: kopiraj blok, zamijeni sve `{{…}}` vrijednostima lekcije i pošalji. Odjeljak „Posebno za predmet“ zamijeni odgovarajućim odjeljkom iz [Dodataka po predmetu](#dodaci-po-predmetu), a „Crteži“ ostavi samo ako su lekciji potrebni crteži.

````text
Ti si iskusni učitelj koji sastavlja provjere znanja za osnovnu školu u Hrvatskoj.
Sastavi {{BROJ}} pitanja s višestrukim izborom za kviz kojim učenici sami vježbaju.

## Lekcija
- Razred: {{RAZRED}}. razred osnovne škole
- Predmet: {{PREDMET}}
- Lekcija: {{NAZIV LEKCIJE}}
- Što učenici uče: {{OPIS}}
- Ključni pojmovi: {{KLJUČNI POJMOVI}}
- Težina svih pitanja: {{lagano | srednje | tesko}}

## Težine
- lagano: prepoznavanje i prisjećanje osnovnih pojmova i činjenica
- srednje: razumijevanje i primjena na jednostavnim primjerima
- tesko: povezivanje više pojmova, zaključivanje, primjena u novoj situaciji
Sva pitanja moraju odgovarati zadanoj težini. Teško pitanje nije duže ni zbunjujuće, nego traži više razmišljanja.

## Pravila za pitanja
1. Pitanja se odnose isključivo na gradivo ove lekcije i na ono što učenik tog razreda već zna.
2. Hrvatski standardni jezik, pravilni padeži i pravopis, nazivi kakvi se koriste u hrvatskim udžbenicima.
3. Rečenice kratke i jasne, rječnik primjeren dobi. Pitanje najviše {{250 | 120}} znakova.
4. Učeniku se obraćaj u 2. licu jednine, ali rodno neutralno: bez glagolskog pridjeva radnog („jesi li riješio“), umjesto toga „Izračunaj…“, „Odaberi…“, „Koji…“.
5. Bez trik-pitanja, dvostrukih negacija i nejasnih riječi („uvijek“, „nikad“) koje pitanje čine dvosmislenim.
6. Formulacija pitanja ne smije otkrivati točan odgovor.
7. Pitanja se međusobno ne ponavljaju; ako dva pitanja provjeravaju isto, neka se razlikuju primjerom.
8. Pitanje ne smije ovisiti o drugom pitanju ni o slici koja nije zadana.

## Pravila za ponuđene odgovore
1. Točno 4 ponuđena odgovora, točno jedan nedvojbeno točan.
2. Netočni odgovori su uvjerljivi (tipične pogreške učenika), ali jasno netočni za onoga tko zna gradivo.
3. Svi odgovori su sličnog oblika i duljine, tako da se točan ne ističe; najviše {{80 | 40}} znakova po odgovoru.
4. Zabranjeni su odgovori „sve navedeno“, „ništa od navedenog“, „i A i B“ i pozivanje na druge odgovore, jer se odgovori miješaju pri prikazu.
5. `tocan` je indeks točnog odgovora (0–3); položaj točnog odgovora mijenjaj od pitanja do pitanja.

## Objašnjenje i savjet
- `objasnjenje`: 1–2 rečenice napisane djetetu, zašto je točan odgovor točan. Prikazuje se nakon kviza.
- `savjet`: jedna rečenica (najviše {{160 | 100}} znakova) koja usmjerava razmišljanje: podsjeća na pojam, pravilo ili prvi korak. Ne smije sadržavati točan odgovor ni izravno isključivati ponuđene odgovore. Svako pitanje ima savjet.

## Brojevi i znakovi
- Tisućice odvajaj razmakom (50 000), decimalni znak je zarez (3,5).
- Koristi Unicode znakove: · : − ° α β γ ∠ △ ⊥ ∥ cm² √.

{{POSEBNO ZA PREDMET}}

{{CRTEŽI}}

## Provjera prije odgovora
Prije ispisa za svako pitanje provjeri: je li označeni odgovor stvarno točan i jedini točan, odgovara li težini i je li savjet bez odgovora. Svaki izračun izračunaj dvaput.

## Format izlaza
Odgovori isključivo jednim JSON objektom, bez ikakvog teksta prije ili poslije i bez komentara u JSON-u.
Id-eve dodijeli redom, počevši od "{{PRVI ID}}" (zadnji broj raste za 1).

{
  "lekcijaId": "{{LEKCIJA ID}}",
  "pitanja": [
    {
      "id": "{{PRVI ID}}",
      "tezina": "{{lagano | srednje | tesko}}",
      "pitanje": "…",
      "ponudeni": ["…", "…", "…", "…"],
      "tocan": 0,
      "objasnjenje": "…",
      "savjet": "…"
    }
  ]
}

{{POSTOJEĆA PITANJA}}
````

Vrijednosti u `{{a | b}}` biraju se prema razredu: prva za 3.–8., druga za 1. i 2. razred.

### Dopuna postojeće lekcije

Umjesto `{{POSTOJEĆA PITANJA}}` dodaj:

````text
## Postojeća pitanja
Ova pitanja već postoje. Ne ponavljaj ih i ne sastavljaj pitanja koja provjeravaju isto na isti način:
- {{tekst pitanja 1}}
- {{tekst pitanja 2}}
````

Kod nove lekcije taj odjeljak izostavi.

### Crteži

Za lekcije iz geometrije umjesto `{{CRTEŽI}}` dodaj:

````text
## Crteži
Pitanje kojem treba slika dobiva polje "slika" s crtežem opisanim podacima:

"slika": {
  "opis": "Trokut ABC s kutovima α = 50° i β = 60°",
  "tocke": { "A": [1, 1], "B": [9, 1], "C": [5.74, 6.65] },
  "poligoni": [{ "vrhovi": ["A", "B", "C"], "ispuna": true }],
  "duzine": [{ "od": "A", "do": "B", "oznaka": "c", "crtice": 1 }],
  "kutovi": [{ "vrh": "A", "oznaka": "50°" }, { "vrh": "C", "pravi": true }],
  "kruznice": [{ "sredite": "S", "polumjer": 4 }],
  "istaknuteTocke": ["S"]
}

- Koordinate su na mreži od 0 do 10, ishodište je dolje lijevo. Lik neka zauzima veći dio mreže.
- "opis" je obavezan i kratko opisuje sliku za učenike koji je ne vide.
- Svaka točka koja se koristi u poligonima, dužinama, kutovima i kružnicama mora biti navedena u "tocke".
- Kut s brojčanom oznakom nacrtaj u stvarnoj veličini (odstupanje najviše 5°), a pravi kut točno 90°. Izračunaj koordinate prije ispisa.
- "duzine" služe za oznake stranica (a, 5 cm, x, ?), "crtice" (1, 2 ili 3) označavaju jednake dužine, "isprekidana": true crta isprekidanu dužinu.
- Imena točaka ispisuju se uz lik; točke čije ime ne treba prikazati navedi u "skrivenaImena": ["D"].
- Za vanjski kut zadaj krake: { "vrh": "B", "kraci": ["C", "D"], "oznaka": "β'" }.
- Crtež ne smije otkrivati odgovor (npr. ne označavaj kut za koji se pita brojem).
````

Opis svih polja je u planu, u odjeljku „Slike i geometrijski crteži“. Svaki crtež obavezno pogledaj na `/pregled`, jer `npm run provjeri` hvata samo dio pogrešaka.

## Dodaci po predmetu

Umjesto `{{POSEBNO ZA PREDMET}}` umetni odgovarajući odjeljak.

**Matematika**

````text
## Posebno za matematiku
- Računski zadatak zadaj uputom, ne pitanjem „Koliko je…?“: „Izračunaj 3000 + 4000.“ ili „Izračunaj koliko je 3000 + 4000.“ Pitanje koje nije računanje može ostati pitanje (npr. „Koliko stranica ima trokut?“).
- Netočne odgovore izvedi iz tipičnih pogrešaka: zaboravljeni prijenos, zamijenjena mjesna vrijednost, kriva računska operacija, pogrešna mjerna jedinica.
- Brojevi u zadatku moraju biti u rasponu koji je učenik tog razreda već učio.
- Zadaci riječima opisuju svakodnevne situacije djeci bliske, s imenima različitih osoba.
- Mjerne jedinice piši kraticama s razmakom (5 cm, 3 kg, 2 h).
````

**Hrvatski jezik**

````text
## Posebno za hrvatski jezik
- Ne navodi i ne citiraj književna djela, pjesme ni tekstove iz čitanki, jer škole koriste različite čitanke i tekstovi su zaštićeni.
- Za primjere sastavi vlastite kratke rečenice i riječi.
- Pitanja o književnosti odnose se na pojmove (npr. što je kitica, tko je pripovjedač), ne na pojedina djela.
- Pravopis prema važećem hrvatskom pravopisu; u pitanjima o pravopisu samo jedan odgovor smije biti ispravno napisan.
````

**Engleski jezik**

````text
## Posebno za engleski jezik
- Uputa i pitanje pišu se na hrvatskom, a riječi i rečenice na engleskom stavljaju se u navodnike, npr. Kako se na engleskom kaže „jabuka“?
- Ponuđeni odgovori na engleskom pišu se bez navodnika.
- Koristi samo riječi i strukture iz ključnih pojmova i ono što učenik tog razreda već zna.
- Britanski pravopis (colour, favourite).
````

**Priroda i društvo, Priroda, Biologija, Geografija, Povijest**

````text
## Posebno za ovaj predmet
- Činjenice moraju biti točne i u skladu s hrvatskim udžbenicima; ako činjenica nije sigurna, ne koristi je.
- Primjeri iz Hrvatske su dobrodošli, ali ne pitaj o lokalnim pojedinostima koje znaju samo učenici iz jednog kraja.
- Bez brojeva i godina koje se ne uče napamet u tom razredu.
````

**Informatika**

````text
## Posebno za informatiku
- Pitanja ne ovise o određenom programu, operacijskom sustavu ni nazivima izbornika, jer škole koriste različite alate.
- Pitanja o programiranju koriste pseudokod ili opis koraka riječima, ne određeni programski jezik, osim ako je jezik naveden u opisu lekcije.
- Pitanja o sigurnosti na internetu daju jasne, provjerene preporuke.
````

## Uočene vrste grešaka

Ovdje bilježi greške koje se ponavljaju pri pregledu, s primjerom i doradom predloška koja ih sprječava.

| Datum | Predmet | Vrsta greške | Primjer | Dorada predloška |
|---|---|---|---|---|
| | | | | |
