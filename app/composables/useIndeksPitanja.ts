import type { IndeksPitanja } from '~/types'

// Broj pitanja po lekciji; pri statičkom buildu dolazi s poslužitelja u payloadu stranice
export async function useIndeksPitanja() {
  const { data } = await useFetch<IndeksPitanja>('/pitanja/indeks.json', { key: 'indeks-pitanja', default: () => ({}) })
  return data
}
