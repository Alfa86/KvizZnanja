# Kontrolna lista za ručni pregled pitanja

Svako pitanje pregledava osoba prije objave. `npm run provjeri` hvata oblik, id-eve, duplikate i očite greške, ali ne zna je li odgovor točan. Zato je ova lista obavezna za svako pitanje, ne samo za uzorak.

Pitanje koje ne prolazi ispravi ili obriši. Pitanje koje je već objavljeno ne briši, nego mu dodaj `"skriveno": true`.

## Točnost (najvažnije)

- [ ] Je li označeni odgovor (`tocan`) stvarno točan?
- [ ] Je li to **jedini** točan odgovor, i prema drugom udžbeniku ili drugom tumačenju?
- [ ] Kod matematike: je li izračun provjeren ručno, neovisno o objašnjenju?
- [ ] Jesu li činjenice, nazivi i pravopis u skladu s hrvatskim udžbenicima?
- [ ] Je li objašnjenje točno i slaže li se s točnim odgovorom?

## Primjerenost

- [ ] Odnosi li se pitanje na gradivo ove lekcije i ovog razreda (ne na ono što se uči kasnije)?
- [ ] Odgovara li označenoj težini (lagano: prisjećanje, srednje: primjena, teško: povezivanje)?
- [ ] Je li rječnik primjeren dobi i je li rečenica jasna nakon jednog čitanja?
- [ ] Je li obraćanje rodno neutralno (bez „jesi li riješio“)?
- [ ] Hrvatski: ne citira li tekst iz čitanke ni književno djelo?
- [ ] Je li sadržaj prikladan djeci (bez nasilja, straha, reklama, stereotipa)?

## Pitanje i odgovori

- [ ] Otkriva li formulacija pitanja odgovor (riječ iz pitanja ponovljena samo u točnom odgovoru, gramatičko slaganje roda ili broja samo s točnim odgovorom)?
- [ ] Ističe li se točan odgovor duljinom, oblikom ili preciznošću?
- [ ] Jesu li netočni odgovori uvjerljivi, a ne besmisleni?
- [ ] Je li pitanje dvosmisleno ili trik-pitanje?
- [ ] Ponavlja li se isto pitanje s drugim brojevima ili riječima u istoj lekciji (dovoljno je jedno takvo)?

## Savjet

- [ ] Pomaže li savjet krenuti s rješavanjem?
- [ ] Ne otkriva li odgovor ni posredno (npr. „broj završava na 5“ kad je samo jedan takav ponuđen)?
- [ ] Ne isključuje li izravno ponuđene odgovore?

## Crteži (ako pitanje ima `slika`)

- [ ] Je li crtež pogledan na `/pregled` i izgleda li kako opis kaže?
- [ ] Jesu li oznake čitljive i ne preklapaju li se?
- [ ] Ne otkriva li crtež odgovor (npr. označen kut za koji se pita)?
- [ ] Opisuje li `opis` sliku dovoljno za učenika koji je ne vidi?

## Nakon pregleda

1. Pokreni `npm run provjeri` još jednom.
2. Ako se ista vrsta greške pojavila više puta, upiši je u tablicu „Uočene vrste grešaka“ u [uputama za generiranje](upute-za-generiranje.md) i doradi predložak prompta.
