<script setup lang="ts">
import type { Crtez } from '~/types'

const props = defineProps<{ crtez: Crtez }>()

const J = 40      // piksela po jedinici mreže
const RUB = 1.2   // prostor oko crteža za oznake, u jedinicama mreže

interface V { x: number, y: number }
const v = (x: number, y: number): V => ({ x, y })
const zbroj = (a: V, b: V) => v(a.x + b.x, a.y + b.y)
const razlika = (a: V, b: V) => v(a.x - b.x, a.y - b.y)
const puta = (a: V, k: number) => v(a.x * k, a.y * k)
const duljina = (a: V) => Math.hypot(a.x, a.y)
const jedinicni = (a: V) => (duljina(a) ? puta(a, 1 / duljina(a)) : v(0, 0))

// Geometrija se računa u jedinicama mreže (y prema gore), a u SVG koordinate pretvara tek pri crtanju
const sx = (p: V) => p.x * J
const sy = (p: V) => -p.y * J

function tocka(ime: string): V {
  const t = props.crtez.tocke[ime]
  return t ? v(t[0], t[1]) : v(0, 0)
}

// Oznake se odmiču od središta crteža prema van
const teziste = computed(() => {
  const imena = props.crtez.poligoni?.length
    ? [...new Set(props.crtez.poligoni.flatMap(p => p.vrhovi))]
    : Object.keys(props.crtez.tocke)
  const tocke = imena.map(tocka)
  return puta(tocke.reduce(zbroj, v(0, 0)), 1 / Math.max(tocke.length, 1))
})

const okvir = computed(() => {
  const granice = Object.values(props.crtez.tocke).map(([x, y]) => ({ x, y, r: 0 }))
  for (const k of props.crtez.kruznice ?? []) granice.push({ ...tocka(k.sredite), r: k.polumjer })
  const minX = Math.min(...granice.map(g => g.x - g.r)) - RUB
  const maxX = Math.max(...granice.map(g => g.x + g.r)) + RUB
  const minY = Math.min(...granice.map(g => g.y - g.r)) - RUB
  const maxY = Math.max(...granice.map(g => g.y + g.r)) + RUB
  return { minX, maxY, sirina: maxX - minX, visina: maxY - minY }
})

const viewBox = computed(() => {
  const o = okvir.value
  return `${o.minX * J} ${-o.maxY * J} ${o.sirina * J} ${o.visina * J}`
})

// Visoki crteži se umanjuju da stanu u visinu okvira, pa im se tekst i crte podebljavaju
const m = computed(() => Math.max(1, okvir.value.visina / 8))

const poligoni = computed(() => (props.crtez.poligoni ?? []).map(p => ({
  tocke: p.vrhovi.map(tocka).map(t => `${sx(t)},${sy(t)}`).join(' '),
  ispuna: p.ispuna ?? false
})))

const kruznice = computed(() => (props.crtez.kruznice ?? []).map((k) => {
  const s = tocka(k.sredite)
  return { cx: sx(s), cy: sy(s), r: k.polumjer * J }
}))

interface Oznaka { x: number, y: number, tekst: string, jeTocka: boolean }

const duzine = computed(() => (props.crtez.duzine ?? []).map((d) => {
  const a = tocka(d.od)
  const b = tocka(d.do)
  const sredina = puta(zbroj(a, b), 0.5)
  const smjer = jedinicni(razlika(b, a))
  let okomica = v(-smjer.y, smjer.x)
  const vanjski = razlika(sredina, teziste.value)
  if (okomica.x * vanjski.x + okomica.y * vanjski.y < 0) okomica = puta(okomica, -1)

  const crtice = Array.from({ length: d.crtice ?? 0 }, (_, i) => {
    const c = zbroj(sredina, puta(smjer, (i - ((d.crtice ?? 1) - 1) / 2) * 0.15))
    const p = zbroj(c, puta(okomica, 0.18))
    const q = zbroj(c, puta(okomica, -0.18))
    return { x1: sx(p), y1: sy(p), x2: sx(q), y2: sy(q) }
  })
  const polozaj = zbroj(sredina, puta(okomica, 0.55))

  return {
    x1: sx(a), y1: sy(a), x2: sx(b), y2: sy(b),
    isprekidana: d.isprekidana ?? false,
    crtice,
    oznaka: d.oznaka ? { x: sx(polozaj), y: sy(polozaj), tekst: d.oznaka, jeTocka: false } as Oznaka : null
  }
}))

const kutovi = computed(() => (props.crtez.kutovi ?? []).flatMap((kut) => {
  const kraci = kraciKuta(props.crtez, kut)
  if (!kraci) return []
  const vrh = tocka(kut.vrh)
  const a = razlika(tocka(kraci[0]), vrh)
  const b = razlika(tocka(kraci[1]), vrh)
  const u1 = jedinicni(a)
  const u2 = jedinicni(b)
  const simetrala = jedinicni(zbroj(u1, u2))
  const velicina = velicinaKuta([vrh.x, vrh.y], [vrh.x + a.x, vrh.y + a.y], [vrh.x + b.x, vrh.y + b.y])

  let putanja: string
  let udaljenostOznake: number
  if (kut.pravi) {
    const s = 0.45
    const p1 = zbroj(vrh, puta(u1, s))
    const p2 = zbroj(vrh, puta(zbroj(u1, u2), s))
    const p3 = zbroj(vrh, puta(u2, s))
    putanja = `M ${sx(p1)} ${sy(p1)} L ${sx(p2)} ${sy(p2)} L ${sx(p3)} ${sy(p3)}`
    udaljenostOznake = s * Math.SQRT2 + 0.45
  }
  else {
    const r = Math.min(0.9, Math.max(0.45, 0.3 * Math.min(duljina(a), duljina(b))))
    const pocetak = zbroj(vrh, puta(u1, r))
    const kraj = zbroj(vrh, puta(u2, r))
    // U SVG-u y raste prema dolje, pa se smjer luka određuje iz okrenutih vektora
    const smjerLuka = u1.x * -u2.y - -u1.y * u2.x > 0 ? 1 : 0
    putanja = `M ${sx(pocetak)} ${sy(pocetak)} A ${r * J} ${r * J} 0 0 ${smjerLuka} ${sx(kraj)} ${sy(kraj)}`
    udaljenostOznake = r + 0.6 * m.value
  }

  // Oznaka se odmiče po simetrali dok njezin pravokutnik ne bude dovoljno daleko od oba kraka
  if (kut.oznaka) {
    const poluSirina = 0.17 * kut.oznaka.length * m.value
    const poluVisina = 0.25 * m.value
    const potrebno = Math.max(...[u1, u2].map(u => poluSirina * Math.abs(u.y) + poluVisina * Math.abs(u.x))) + 0.12
    const odmak = potrebno / Math.sin((velicina * Math.PI) / 360)
    udaljenostOznake = Math.min(Math.max(udaljenostOznake, odmak), 2.6)
  }

  const polozaj = zbroj(vrh, puta(simetrala, udaljenostOznake))
  return [{
    putanja,
    oznaka: kut.oznaka ? { x: sx(polozaj), y: sy(polozaj), tekst: kut.oznaka, jeTocka: false } as Oznaka : null
  }]
}))

const istaknuteTocke = computed(() => (props.crtez.istaknuteTocke ?? []).map(tocka).map(t => ({ cx: sx(t), cy: sy(t) })))

const oznake = computed<Oznaka[]>(() => {
  const skrivena = new Set(props.crtez.skrivenaImena ?? [])
  const imenaTocaka = Object.keys(props.crtez.tocke).filter(ime => !skrivena.has(ime)).map((ime) => {
    const t = tocka(ime)
    let smjer = jedinicni(razlika(t, teziste.value))
    if (!duljina(smjer)) smjer = jedinicni(v(1, 1))
    const polozaj = zbroj(t, puta(smjer, 0.5))
    return { x: sx(polozaj), y: sy(polozaj), tekst: ime, jeTocka: true }
  })
  return [
    ...imenaTocaka,
    ...duzine.value.flatMap(d => (d.oznaka ? [d.oznaka] : [])),
    ...kutovi.value.flatMap(k => (k.oznaka ? [k.oznaka] : []))
  ]
})

// Varijable (a, x, α, 2x) pišu se kurzivom, kao u udžbeniku
const jeVarijabla = (tekst: string) => /^\d*[a-zα-ω]$/.test(tekst)
</script>

<template>
  <svg :viewBox="viewBox" role="img" :aria-label="crtez.opis" class="mx-auto block max-h-80 w-full">
    <title>{{ crtez.opis }}</title>

    <polygon
      v-for="(p, i) in poligoni"
      :key="`p${i}`"
      :points="p.tocke"
      :fill="p.ispuna ? '#e0e7ff' : 'none'"
      stroke="#1e293b"
      :stroke-width="3 * m"
      stroke-linejoin="round"
    />

    <circle v-for="(k, i) in kruznice" :key="`k${i}`" v-bind="k" fill="none" stroke="#1e293b" :stroke-width="3 * m" />

    <g v-for="(d, i) in duzine" :key="`d${i}`" stroke="#1e293b">
      <line
        :x1="d.x1" :y1="d.y1" :x2="d.x2" :y2="d.y2"
        :stroke-width="(d.isprekidana ? 2 : 3) * m"
        :stroke-dasharray="d.isprekidana ? `${8 * m} ${6 * m}` : undefined"
        stroke-linecap="round"
      />
      <line v-for="(c, j) in d.crtice" :key="j" v-bind="c" :stroke-width="2.5 * m" />
    </g>

    <path v-for="(k, i) in kutovi" :key="`u${i}`" :d="k.putanja" fill="none" stroke="#4338ca" :stroke-width="2.5 * m" />

    <circle v-for="(t, i) in istaknuteTocke" :key="`t${i}`" v-bind="t" :r="5 * m" fill="#1e293b" />

    <text
      v-for="(o, i) in oznake"
      :key="`o${i}`"
      :x="o.x"
      :y="o.y"
      text-anchor="middle"
      dominant-baseline="central"
      :font-size="(o.jeTocka ? 22 : 21) * m"
      :font-weight="o.jeTocka ? 700 : 600"
      :font-style="!o.jeTocka && jeVarijabla(o.tekst) ? 'italic' : 'normal'"
      :font-family="!o.jeTocka && jeVarijabla(o.tekst) ? 'Cambria, \'Times New Roman\', serif' : undefined"
      :fill="o.jeTocka ? '#0f172a' : '#3730a3'"
      stroke="#ffffff"
      :stroke-width="6 * m"
      stroke-linejoin="round"
      paint-order="stroke"
    >{{ o.tekst }}</text>
  </svg>
</template>
