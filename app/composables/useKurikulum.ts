import kurikulumJson from '~/data/kurikulum.json'
import type { Predmet, Razred, RazredIzvor } from '~/types'
import { pripremiRazrede } from '~/utils/kurikulum'

export const razredi = pripremiRazrede((kurikulumJson as { razredi: RazredIzvor[] }).razredi)

export function useKurikulum() {
  function dohvatiRazred(broj: number): Razred | undefined {
    return razredi.find(r => r.broj === broj)
  }

  function dohvatiPredmet(broj: number, predmetId: string): Predmet | undefined {
    return dohvatiRazred(broj)?.predmeti.find(p => p.id === predmetId)
  }

  return { razredi, dohvatiRazred, dohvatiPredmet }
}
