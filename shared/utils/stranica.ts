// Tekstovi o stranici koje dijele početna stranica, strukturirani podaci (JSON-LD) i llms.txt

export const NAZIV_STRANICE = 'Kviz znanja'

export const OPIS_STRANICE = 'Besplatni kvizovi iz školskog gradiva za učenike od 1. do 8. razreda osnovne škole. '
  + 'Bez prijave, s objašnjenjem za svako pitanje i savjetima kad zapne.'

interface PredmetSazetak { id: string, naziv: string, lekcije: { naziv: string }[] }
interface RazredSazetak { broj: number, predmeti: PredmetSazetak[] }

export interface CestoPitanje { pitanje: string, odgovor: string }

function popisPredmeta(razredi: RazredSazetak[]): string {
  const dostupni = razredi.filter(r => r.predmeti.length)
  if (!dostupni.length) return 'Prvi kvizovi stižu uskoro.'
  const dijelovi = dostupni.map(r => `${r.broj}. razred (${r.predmeti.map(p => p.naziv).join(', ')})`)
  return `Trenutačno su dostupni kvizovi za ${dijelovi.join(', ')}. Novi razredi i predmeti dodaju se postupno.`
}

// Pitanje o podršci dodaje se samo kad je postavljena KEKS Pay poveznica
export function cestaPitanja(razredi: RazredSazetak[], imaPodrsku = false): CestoPitanje[] {
  const podrska: CestoPitanje[] = imaPodrsku
    ? [{
        pitanje: 'Kako mogu podržati stranicu?',
        odgovor: 'Kviz znanja je besplatan i bez reklama. Roditelji i učitelji kojima pomaže mogu podržati njegov razvoj '
          + 'donacijom putem aplikacije KEKS Pay – gumb i QR kod nalaze se u dijelu „Za roditelje i učitelje”.'
      }]
    : []

  return [
    {
      pitanje: 'Što je Kviz znanja?',
      odgovor: 'Kviz znanja je besplatna stranica s kratkim kvizovima iz školskog gradiva za učenike od 1. do 8. razreda '
        + 'osnovne škole. Pitanja prate hrvatski kurikulum, a nakon kviza učenik vidi točne odgovore i objašnjenje za svako pitanje.'
    },
    {
      pitanje: 'Je li Kviz znanja besplatan?',
      odgovor: 'Da, svi kvizovi su potpuno besplatni.'
    },
    {
      pitanje: 'Treba li se prijaviti ili napraviti račun?',
      odgovor: 'Ne. Nema prijave ni korisničkog računa, a stranica ne prikuplja osobne podatke djece. Kviz se pokreće u nekoliko klikova.'
    },
    {
      pitanje: 'Za koje razrede i predmete postoje kvizovi?',
      odgovor: popisPredmeta(razredi)
    },
    {
      pitanje: 'Kako izgleda jedan kviz?',
      odgovor: 'Odabereš razred, predmet i lekcije, zatim težinu (lagano, srednje ili teško) i broj pitanja (10, 20 ili 30). '
        + 'Svako pitanje ima četiri ponuđena odgovora. Na kraju dobiješ ocjenu i pregled svih odgovora s objašnjenjima.'
    },
    {
      pitanje: 'Kako se računa ocjena?',
      odgovor: 'Ocjena ovisi o postotku točnih odgovora: od 90 % odličan (5), od 78 % vrlo dobar (4), od 63 % dobar (3), '
        + 'od 50 % dovoljan (2), a ispod 50 % nedovoljan (1).'
    },
    {
      pitanje: 'Što ako zapnem na pitanju?',
      odgovor: 'Klikni „Treba mi pomoć” i dobit ćeš savjet. Savjet nikad ne oduzima bodove – na kraju se samo vidi koliko je savjeta iskorišteno.'
    },
    {
      pitanje: 'Tko priprema pitanja?',
      odgovor: 'Pitanja se pripremaju uz pomoć AI alata prema hrvatskom kurikulumu, a svako pitanje prije objave pregledava čovjek.'
    },
    ...podrska
  ]
}
