// Projekcija zemljopisnih koordinata na kartu Hrvatske (koordinate SVG-a, y raste prema dolje).
// Ekvidistantna projekcija s mjerilom duljine na 44,5° sjeverne širine – za kartu jedne države dovoljno točna.

// [zapadna dužina, južna širina, istočna dužina, sjeverna širina] u stupnjevima
export type Okvir = [number, number, number, number]

export const OKVIR_HRVATSKE: Okvir = [13.3, 42.3, 19.6, 46.65]

const KOSINUS = Math.cos((44.5 * Math.PI) / 180)
export const SIRINA_KARTE = 1000
const MJERILO = SIRINA_KARTE / ((OKVIR_HRVATSKE[2] - OKVIR_HRVATSKE[0]) * KOSINUS)
export const VISINA_KARTE = Math.round((OKVIR_HRVATSKE[3] - OKVIR_HRVATSKE[1]) * MJERILO)

// [dužina, širina] → [x, y] na karti
export function projiciraj([lon, lat]: [number, number]): [number, number] {
  return [(lon - OKVIR_HRVATSKE[0]) * KOSINUS * MJERILO, (OKVIR_HRVATSKE[3] - lat) * MJERILO]
}

// Okvir u stupnjevima → viewBox SVG-a [x, y, širina, visina]
export function okvirKarte(okvir: Okvir = OKVIR_HRVATSKE): [number, number, number, number] {
  const [x1, y1] = projiciraj([okvir[0], okvir[3]])
  const [x2, y2] = projiciraj([okvir[2], okvir[1]])
  return [x1, y1, x2 - x1, y2 - y1]
}

export function jeUnutarOkvira([lon, lat]: [number, number], okvir: Okvir = OKVIR_HRVATSKE): boolean {
  return lon >= okvir[0] && lon <= okvir[2] && lat >= okvir[1] && lat <= okvir[3]
}
