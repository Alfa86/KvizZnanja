// Ručni pregled pitanja na stranici /pregled (samo u razvojnom načinu).
// Oznake se čuvaju u pregledniku (localStorage), a nalazi AI recenzije čitaju se iz sadrzaj/pregled/*.json.

export interface NalazRecenzije {
  id: string
  razina: 'greska' | 'sumnja'
  kategorija: string
  opis: string
  prijedlog: string
}

export interface OznakaPregleda {
  stanje: 'u-redu' | 'oznaceno'
  napomena?: string
}

const KLJUC = 'pregled:oznake'

// Nalazi se učitavaju pri izgradnji stranice; Vite ih osvježava kad se datoteke promijene
const datotekeNalaza = import.meta.glob<{ nalazi?: NalazRecenzije[] }>('../../sadrzaj/pregled/*.json', { eager: true, import: 'default' })
const naloziPoPitanju = new Map<string, NalazRecenzije[]>()
for (const d of Object.values(datotekeNalaza)) {
  for (const n of d.nalazi ?? []) naloziPoPitanju.set(n.id, [...(naloziPoPitanju.get(n.id) ?? []), n])
}

function procitaj(): Record<string, OznakaPregleda> {
  try {
    return JSON.parse(localStorage.getItem(KLJUC) ?? '{}')
  }
  catch {
    return {}
  }
}

const oznake = ref<Record<string, OznakaPregleda>>({})
let ucitano = false

export function useRecenzija() {
  if (import.meta.client && !ucitano) {
    oznake.value = procitaj()
    ucitano = true
  }

  function spremi() {
    try {
      localStorage.setItem(KLJUC, JSON.stringify(oznake.value))
    }
    catch {
      // bez spremanja oznake vrijede samo do osvježavanja stranice
    }
  }

  function postavi(id: string, oznaka: OznakaPregleda | null) {
    const nove = { ...oznake.value }
    if (oznaka) nove[id] = oznaka
    else delete nove[id]
    oznake.value = nove
    spremi()
  }

  const nalazi = (id: string) => naloziPoPitanju.get(id) ?? []

  // Brojevi za popis lekcija; id pitanja počinje s '{razred}-{predmet}-{lekcija}-'
  function stanjeLekcije(prefiks: string) {
    const svoje = Object.entries(oznake.value).filter(([id]) => id.startsWith(prefiks))
    return {
      pregledano: svoje.length,
      oznaceno: svoje.filter(([, o]) => o.stanje === 'oznaceno').length,
      nalazi: [...naloziPoPitanju.keys()].filter(id => id.startsWith(prefiks)).length
    }
  }

  // Označena pitanja s napomenama, za slanje na ispravak
  function izvozNapomena(): string {
    const oznacena = Object.entries(oznake.value)
      .filter(([, o]) => o.stanje === 'oznaceno')
      .map(([id, o]) => `- ${id}: ${o.napomena?.trim() || '(bez napomene)'}`)
    return oznacena.length ? `Označena pitanja (${oznacena.length}):\n${oznacena.join('\n')}` : 'Nema označenih pitanja.'
  }

  return { oznake, postavi, nalazi, stanjeLekcije, izvozNapomena }
}
