import type { Crtez, KutCrteza, Slika, SlikaDatoteka, Tocka } from '../types'

export const RASPON_MREZE: [number, number] = [0, 10]

export function jeDatoteka(slika: Slika): slika is SlikaDatoteka {
  return 'datoteka' in slika
}

// Kraci kuta: zadani izravno ili susjedni vrhovi u prvom poligonu koji sadrži vrh
export function kraciKuta(crtez: Crtez, kut: KutCrteza): [string, string] | null {
  if (kut.kraci) return kut.kraci
  for (const poligon of crtez.poligoni ?? []) {
    const i = poligon.vrhovi.indexOf(kut.vrh)
    if (i >= 0) {
      const n = poligon.vrhovi.length
      return [poligon.vrhovi[(i - 1 + n) % n]!, poligon.vrhovi[(i + 1) % n]!]
    }
  }
  return null
}

// Veličina kuta AVB u stupnjevima (0–180)
export function velicinaKuta(v: Tocka, a: Tocka, b: Tocka): number {
  const u = [a[0] - v[0], a[1] - v[1]]
  const w = [b[0] - v[0], b[1] - v[1]]
  const duljine = Math.hypot(u[0]!, u[1]!) * Math.hypot(w[0]!, w[1]!)
  if (duljine === 0) return 0
  const cos = (u[0]! * w[0]! + u[1]! * w[1]!) / duljine
  return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI
}

// Vraća popis grešaka; prazan popis znači da je crtež ispravan
export function provjeriCrtez(crtez: Crtez): string[] {
  const greske: string[] = []
  const [min, max] = RASPON_MREZE
  const tocke = crtez.tocke ?? {}
  const postoji = (ime: string, gdje: string) => {
    if (!(ime in tocke)) greske.push(`${gdje}: točka ${ime} ne postoji`)
    return ime in tocke
  }

  if (!crtez.opis?.trim()) greske.push('Crtež nema opis')

  for (const [ime, t] of Object.entries(tocke)) {
    const ispravna = Array.isArray(t) && t.length === 2 && t.every(k => Number.isFinite(k) && k >= min && k <= max)
    if (!ispravna) greske.push(`Točka ${ime} mora imati dvije koordinate u rasponu ${min}–${max}`)
  }

  for (const poligon of crtez.poligoni ?? []) {
    if (poligon.vrhovi.length < 3) greske.push('Poligon mora imati barem 3 vrha')
    poligon.vrhovi.forEach(v => postoji(v, 'Poligon'))
  }

  for (const d of crtez.duzine ?? []) {
    postoji(d.od, `Dužina ${d.od}${d.do}`)
    postoji(d.do, `Dužina ${d.od}${d.do}`)
    if (d.od === d.do) greske.push(`Dužina ${d.od}${d.do} mora spajati dvije različite točke`)
  }

  for (const kut of crtez.kutovi ?? []) {
    if (!postoji(kut.vrh, 'Kut')) continue
    const kraci = kraciKuta(crtez, kut)
    if (!kraci) {
      greske.push(`Kut pri ${kut.vrh}: nedostaju kraci (dodaj "kraci" ili poligon s tim vrhom)`)
      continue
    }
    if (!kraci.every(k => postoji(k, `Kut pri ${kut.vrh}`))) continue

    const nacrtano = velicinaKuta(tocke[kut.vrh]!, tocke[kraci[0]]!, tocke[kraci[1]]!)
    if (nacrtano < 1 || nacrtano > 179) greske.push(`Kut pri ${kut.vrh} je ispružen ili nultočan`)
    if (kut.pravi && Math.abs(nacrtano - 90) > 1) {
      greske.push(`Kut pri ${kut.vrh} označen je kao pravi, a nacrtan je kao ${Math.round(nacrtano)}°`)
    }
    // Brojčano označen kut mora i izgledati tako (dopušteno odstupanje 5°)
    const broj = kut.oznaka?.match(/^(\d+(?:,\d+)?)°$/)
    if (broj && Math.abs(nacrtano - Number(broj[1]!.replace(',', '.'))) > 5) {
      greske.push(`Kut pri ${kut.vrh} označen je s ${kut.oznaka}, a nacrtan je kao ${Math.round(nacrtano)}°`)
    }
  }

  for (const k of crtez.kruznice ?? []) {
    if (!postoji(k.sredite, 'Kružnica')) continue
    const [x, y] = tocke[k.sredite]!
    if (!(k.polumjer > 0)) greske.push(`Kružnica sa središtem ${k.sredite} mora imati pozitivan polumjer`)
    else if (x - k.polumjer < min || x + k.polumjer > max || y - k.polumjer < min || y + k.polumjer > max) {
      greske.push(`Kružnica sa središtem ${k.sredite} izlazi izvan mreže ${min}–${max}`)
    }
  }

  for (const ime of [...(crtez.istaknuteTocke ?? []), ...(crtez.skrivenaImena ?? [])]) postoji(ime, 'Popis točaka')

  return greske
}
