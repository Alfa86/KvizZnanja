// npm run -s prompt -- {razred}/{predmet}/{lekcija} {tezina} [--broj 15] [--crtezi]
// Slaže prompt za generiranje pitanja iz blokova u sadrzaj/upute-za-generiranje.md i podataka lekcije
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import type { DatotekaLekcije, RazredIzvor, Tezina } from '../app/types'
import { TEZINE } from '../app/utils/konstante'
import { pripremiRazrede } from '../app/utils/kurikulum'

const KORIJEN = join(import.meta.dirname, '..')
const UPUTE = join(KORIJEN, 'sadrzaj', 'upute-za-generiranje.md')
const IZLAZ = join(KORIJEN, 'sadrzaj', 'zadnji-prompt.txt')

// Naslov odjeljka u uputama s dodatkom za predmet; predmeti kojih nema ne dobivaju dodatak
const DODATAK_PREDMETA: Record<string, string> = {
  'matematika': '**Matematika**',
  'hrvatski-jezik': '**Hrvatski jezik**',
  'engleski-jezik': '**Engleski jezik**',
  'informatika': '**Informatika**',
  'priroda-i-drustvo': '**Priroda i društvo,',
  'priroda': '**Priroda i društvo,',
  'biologija': '**Priroda i društvo,',
  'geografija': '**Priroda i društvo,',
  'povijest': '**Priroda i društvo,'
}

function prekini(poruka: string): never {
  console.error(`✗ ${poruka}`)
  console.error('Upotreba: npm run -s prompt -- 4/matematika/pisano-zbrajanje lagano|srednje|tesko [--broj 15] [--crtezi]')
  process.exit(1)
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { broj: { type: 'string', default: '15' }, crtezi: { type: 'boolean', default: false } }
})
const [put, tezina] = positionals as [string?, string?]
if (!put || !tezina) prekini('Nedostaje lekcija ili težina')
if (!TEZINE.some(t => t.id === tezina)) prekini(`Nepoznata težina "${tezina}" (lagano, srednje, tesko)`)
const broj = Number(values.broj)
if (!Number.isInteger(broj) || broj < 1 || broj > 30) prekini('--broj mora biti cijeli broj od 1 do 30')

const [razredTekst, predmetId, lekcijaId] = put.replace(/\.json$/, '').split('/')
const kurikulum = JSON.parse(readFileSync(join(KORIJEN, 'app', 'data', 'kurikulum.json'), 'utf8')) as { razredi: RazredIzvor[] }
const razred = pripremiRazrede(kurikulum.razredi).find(r => String(r.broj) === razredTekst)
const predmet = razred?.predmeti.find(p => p.id === predmetId)
const lekcija = predmet?.lekcije.find(l => l.id === lekcijaId)
if (!razred || !predmet || !lekcija) {
  const ponuda = predmet ? `Lekcije: ${predmet.lekcije.map(l => l.id).join(', ')}` : razred ? `Predmeti: ${razred.predmeti.map(p => p.id).join(', ')}` : ''
  prekini(`U kurikulumu nema ${put}. ${ponuda}`)
}

const datoteka = join(KORIJEN, 'public', 'pitanja', String(razred.broj), predmet.id, `${lekcija.id}.json`)
const postojeca = existsSync(datoteka) ? (JSON.parse(readFileSync(datoteka, 'utf8')) as DatotekaLekcije).pitanja : []

// Sljedeći slobodni broj; skrivena pitanja ostaju u datoteci pa se njihovi brojevi ne koriste ponovno
const najveci = Math.max(0, ...postojeca.map(p => Number(/-(\d+)$/.exec(p.id)?.[1] ?? 0)))
const prviId = `${razred.broj}-${predmet.id}-${lekcija.id}-${String(najveci + 1).padStart(3, '0')}`

const upute = readFileSync(UPUTE, 'utf8')
function blokNakon(oznaka: string): string {
  const pocetak = upute.indexOf(oznaka)
  const otvaranje = upute.indexOf('````text\n', pocetak)
  if (pocetak < 0 || otvaranje < 0) prekini(`U uputama nema bloka nakon „${oznaka}“`)
  const tijelo = otvaranje + '````text\n'.length
  return upute.slice(tijelo, upute.indexOf('\n````', tijelo))
}

const dodatak = DODATAK_PREDMETA[predmet.id]
const imaCrteze = values.crtezi || postojeca.some(p => p.slika)
let postojeciOdjeljak = ''
const aktivna = postojeca.filter(p => !p.skriveno)
if (aktivna.length) {
  const popis = aktivna.map(p => `- ${p.pitanje}`).join('\n')
  postojeciOdjeljak = blokNakon('### Dopuna postojeće lekcije').replace(/^- \{\{tekst pitanja 1\}\}\n- \{\{tekst pitanja 2\}\}$/m, () => popis)
}

// Zamjena funkcijom, jer bi se $& i slični nizovi u tekstu lekcije inače tumačili kao posebni
const vrijednosti: Record<string, string> = {
  'lagano | srednje | tesko': tezina,
  'BROJ': String(broj),
  'RAZRED': String(razred.broj),
  'PREDMET': predmet.naziv,
  'NAZIV LEKCIJE': lekcija.naziv,
  'OPIS': lekcija.opis,
  'KLJUČNI POJMOVI': lekcija.kljucniPojmovi.join(', '),
  'LEKCIJA ID': lekcija.id,
  'PRVI ID': prviId,
  'POSEBNO ZA PREDMET': dodatak ? blokNakon(dodatak) : '',
  'CRTEŽI': imaCrteze ? blokNakon('### Crteži') : '',
  'POSTOJEĆA PITANJA': postojeciOdjeljak
}
const mladi = razred.broj <= 2
const prompt = blokNakon('## Predložak prompta')
  .replace(/\{\{([^}]+)\}\}/g, (cijelo, ime: string) => {
    const granice = /^(\d+) \| (\d+)$/.exec(ime)
    if (granice) return mladi ? granice[2]! : granice[1]!
    return vrijednosti[ime] ?? cijelo
  })
  .replace(/\n{3,}/g, '\n\n')
  .trim()

const preostalo = prompt.match(/\{\{[^}]*\}\}/g)
if (preostalo) prekini(`Nepopunjena mjesta u predlošku: ${[...new Set(preostalo)].join(', ')}`)

writeFileSync(IZLAZ, prompt + '\n')
console.log(prompt)
console.error(`\n✓ Spremljeno u sadrzaj/zadnji-prompt.txt (prvi id ${prviId}, ${aktivna.length} postojećih pitanja${imaCrteze ? ', s crtežima' : ''})`)
