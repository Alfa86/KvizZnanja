<script setup lang="ts">
// Zadatak smještanja natpisa na kartu Hrvatske. Natpis se povlači na oznaku (mišem ili prstom),
// ili se dodirne natpis pa oznaka. U načinu „rjesenje“ prikazuje točne nazive uz oznake.
import type { RasporedNaKarti, ZadatakKarte } from '~/types'
import { KARTA_HRVATSKE } from '~/utils/kartaHrvatske'
import { okvirKarte } from '~/utils/projekcija'
import { omjerKarte, polozajiOznaka, PROMJER_OZNAKE, rasporediNatpise } from '~/utils/karta'

const props = withDefaults(defineProps<{
  zadatak: ZadatakKarte
  raspored: RasporedNaKarti | null
  nacin?: 'rjesavanje' | 'rjesenje'
}>(), { nacin: 'rjesavanje' })
const emit = defineEmits<{ promijeni: [raspored: RasporedNaKarti] }>()

const rjesenje = computed(() => props.nacin === 'rjesenje')
const viewBox = computed(() => okvirKarte(props.zadatak.okvir).join(' '))
const omjer = computed(() => omjerKarte(props.zadatak))
const oznake = computed(() => polozajiOznaka(props.zadatak))
const broj = computed(() => props.zadatak.mjesta.length)
const trenutni = computed<RasporedNaKarti>(() => props.raspored ?? Array.from({ length: broj.value }, () => null))

// Koji je natpis na kojoj oznaci (natpis i pripada oznaci i)
const naOznaci = computed(() => {
  const r: (number | null)[] = Array.from({ length: broj.value }, () => null)
  trenutni.value.forEach((oznaka, natpis) => {
    if (oznaka !== null) r[oznaka] = natpis
  })
  return r
})
const uLadici = computed(() => props.zadatak.mjesta.map((_, i) => i).filter(i => trenutni.value[i] === null))

function stavi(natpis: number, oznaka: number) {
  const novi = trenutni.value.map(o => (o === oznaka ? null : o))
  novi[natpis] = oznaka
  emit('promijeni', novi)
}

function makni(natpis: number) {
  const novi = [...trenutni.value]
  novi[natpis] = null
  emit('promijeni', novi)
}

// Veličina karte u pikselima, za smještaj natpisa uz oznake
const karta = useTemplateRef<HTMLElement>('karta')
const velicina = ref({ s: 0, v: 0 })
let promatrac: ResizeObserver | null = null
onMounted(() => {
  promatrac = new ResizeObserver(([e]) => {
    if (e) velicina.value = { s: e.contentRect.width, v: e.contentRect.height }
  })
  if (karta.value) promatrac.observe(karta.value)
})
onBeforeUnmount(() => promatrac?.disconnect())

// Na uskoj karti (mobitel) natpisi su manji
const usko = computed(() => velicina.value.s < 480)
const visinaNatpisa = computed(() => (usko.value ? 22 : 26))
const sirinaNatpisa = (tekst: string) => Math.ceil(tekst.length * (usko.value ? 6.3 : 7.4) + (usko.value ? 12 : 18))

// Natpisi na karti: u rješavanju stavljeni natpisi, u rješenju točan naziv svake oznake
const natpisiNaKarti = computed(() => {
  const { s, v } = velicina.value
  if (!s) return []
  const px = oznake.value.map(o => ({ x: (o.x / 100) * s, y: (o.y / 100) * v }))
  const popis = rjesenje.value
    ? props.zadatak.mjesta.map((m, oznaka) => ({ oznaka, natpis: oznaka, tekst: m.naziv }))
    : naOznaci.value.flatMap((natpis, oznaka) => (natpis === null ? [] : [{ oznaka, natpis, tekst: props.zadatak.mjesta[natpis]!.naziv }]))
  const mjesta = rasporediNatpise(px, popis.map(n => ({ oznaka: n.oznaka, sirina: sirinaNatpisa(n.tekst), visina: visinaNatpisa.value })), s, v)
  return popis.map((n, i) => {
    const m = mjesta[i]!
    // Crtica od oznake do natpisa kad natpis nije odmah uz svoju oznaku
    const o = px[n.oznaka]!
    const bx = Math.min(Math.max(o.x, m.x), m.x + m.s)
    const by = Math.min(Math.max(o.y, m.y), m.y + m.v)
    const daleko = Math.hypot(bx - o.x, by - o.y) > PROMJER_OZNAKE / 2 + 6
    return { ...n, ...m, crtica: daleko ? { x1: o.x, y1: o.y, x2: bx, y2: by } : null }
  })
})

// U rješenju: je li učenik na ovu oznaku stavio pravi natpis (null ako nije rješavao)
function tocnaOznaka(oznaka: number): boolean | null {
  if (!props.raspored) return null
  return naOznaci.value[oznaka] === oznaka
}

// ——— Odabir dodirom ili tipkovnicom ———
const odabrani = ref<number | null>(null)
watch(() => props.zadatak, () => (odabrani.value = null))

function klikNaOznaku(oznaka: number) {
  if (rjesenje.value) return
  if (odabrani.value !== null) {
    stavi(odabrani.value, oznaka)
    odabrani.value = null
  }
  else if (naOznaci.value[oznaka] !== null) {
    makni(naOznaci.value[oznaka]!)
  }
}

// ——— Povlačenje ———
const DOSEG = 40 // px: natpis pušten ovoliko blizu oznake ide na nju
const vucenje = ref<{ natpis: number, x: number, y: number, x0: number, y0: number, aktivno: boolean, saKarte: boolean } | null>(null)
let potisniKlik = false

function najblizaOznaka(x: number, y: number): number | null {
  const r = karta.value?.getBoundingClientRect()
  if (!r) return null
  let najbliza: number | null = null
  let najmanja = DOSEG
  oznake.value.forEach((o, i) => {
    const d = Math.hypot(r.left + (o.x / 100) * r.width - x, r.top + (o.y / 100) * r.height - y)
    if (d < najmanja) [najbliza, najmanja] = [i, d]
  })
  return najbliza
}
const ciljVucenja = computed(() => (vucenje.value?.aktivno ? najblizaOznaka(vucenje.value.x, vucenje.value.y) : null))

function pocni(e: PointerEvent, natpis: number, saKarte: boolean) {
  if (rjesenje.value || e.button !== 0) return
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  vucenje.value = { natpis, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, aktivno: false, saKarte }
}

function pomakni(e: PointerEvent) {
  const v = vucenje.value
  if (!v) return
  v.x = e.clientX
  v.y = e.clientY
  if (!v.aktivno && Math.hypot(v.x - v.x0, v.y - v.y0) > 6) {
    v.aktivno = true
    odabrani.value = null
  }
}

function zavrsi() {
  const v = vucenje.value
  vucenje.value = null
  if (!v?.aktivno) return
  // Klik koji preglednik pošalje odmah nakon povlačenja ne smije još i odabrati natpis;
  // ako klika nema (natpis je nestao iz ladice), zastavica se ionako briše
  potisniKlik = true
  setTimeout(() => (potisniKlik = false))
  const oznaka = najblizaOznaka(v.x, v.y)
  if (oznaka !== null) stavi(v.natpis, oznaka)
  else if (v.saKarte) makni(v.natpis)
}

function klikNaNatpis(natpis: number, saKarte: boolean) {
  if (potisniKlik) {
    potisniKlik = false
    return
  }
  if (saKarte) makni(natpis)
  else odabrani.value = odabrani.value === natpis ? null : natpis
}

// Dodir karte uz oznaku (ne točno na nju) kad je natpis odabran
function klikNaKartu(e: MouseEvent) {
  if (odabrani.value === null || e.target !== e.currentTarget) return
  const oznaka = najblizaOznaka(e.clientX, e.clientY)
  if (oznaka !== null) klikNaOznaku(oznaka)
}
</script>

<template>
  <div class="mb-5 flex flex-col gap-3">
    <div
      ref="karta"
      class="relative -mx-3 w-[calc(100%+1.5rem)] touch-manipulation sm:mx-0 sm:w-full overflow-hidden rounded-2xl bg-sky-100 ring-1 ring-slate-300 select-none"
      :style="{ aspectRatio: `1 / ${omjer}` }"
      @click="klikNaKartu"
    >
      <svg :viewBox="viewBox" class="pointer-events-none absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden="true">
        <path :d="KARTA_HRVATSKE.susjedi" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
        <path :d="KARTA_HRVATSKE.hrvatska" fill="#fef9c3" stroke="#475569" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
        <path :d="KARTA_HRVATSKE.rijeke" fill="none" stroke="#3b82f6" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" />
      </svg>

      <svg class="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
        <template v-for="n in natpisiNaKarti" :key="`c${n.natpis}`">
          <line v-if="n.crtica" v-bind="n.crtica" stroke="#1e1b4b" stroke-width="2" stroke-dasharray="3 2" />
        </template>
      </svg>

      <button
        v-for="(o, i) in oznake"
        :key="`o${i}`"
        type="button"
        class="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] shadow transition-transform"
        :class="[
          rjesenje
            ? (tocnaOznaka(i) === false ? 'border-red-600 bg-red-100' : 'border-green-700 bg-green-100')
            : naOznaci[i] !== null ? 'border-indigo-800 bg-indigo-600' : 'border-indigo-700 bg-white',
          ciljVucenja === i ? 'scale-125 ring-4 ring-amber-400' : '',
          odabrani !== null && !rjesenje ? 'animate-pulse' : ''
        ]"
        :style="{ left: `${o.x}%`, top: `${o.y}%`, width: `${PROMJER_OZNAKE}px`, height: `${PROMJER_OZNAKE}px` }"
        :aria-label="rjesenje
          ? `Oznaka ${i + 1}: ${zadatak.mjesta[i]!.naziv}`
          : `Oznaka ${i + 1}: ${naOznaci[i] !== null ? zadatak.mjesta[naOznaci[i]!]!.naziv : 'prazno'}`"
        :disabled="rjesenje"
        @click.stop="klikNaOznaku(i)"
      >
        <span class="size-2.5 rounded-full" :class="!rjesenje && naOznaci[i] !== null ? 'bg-white' : 'bg-indigo-700'" :style="rjesenje ? { background: tocnaOznaka(i) === false ? '#dc2626' : '#15803d' } : {}" />
      </button>

      <template v-for="n in natpisiNaKarti" :key="`n${n.natpis}`">
        <span
          v-if="rjesenje"
          class="absolute flex items-center justify-center rounded-lg font-extrabold whitespace-nowrap text-white shadow"
          :class="[usko ? 'px-1 text-[11px]' : 'px-2 text-[13px]', tocnaOznaka(n.oznaka) === false ? 'bg-red-700' : 'bg-green-700']"
          :style="{ left: `${n.x}px`, top: `${n.y}px`, width: `${n.s}px`, height: `${n.v}px` }"
        >{{ n.tekst }}</span>
        <button
          v-else
          type="button"
          class="absolute flex cursor-grab touch-none items-center justify-center rounded-lg bg-indigo-700 font-extrabold whitespace-nowrap text-white shadow-md"
          :class="[usko ? 'px-1 text-[11px]' : 'px-2 text-[13px]', vucenje?.aktivno && vucenje.natpis === n.natpis ? 'opacity-30' : '']"
          :style="{ left: `${n.x}px`, top: `${n.y}px`, width: `${n.s}px`, height: `${n.v}px` }"
          :aria-label="`${n.tekst} – makni s karte`"
          @pointerdown="pocni($event, n.natpis, true)"
          @pointermove="pomakni"
          @pointerup="zavrsi"
          @pointercancel="vucenje = null"
          @click.stop="klikNaNatpis(n.natpis, true)"
        >
          {{ n.tekst }}
        </button>
      </template>
    </div>

    <template v-if="!rjesenje">
      <p class="text-sm text-slate-600">
        Povuci natpis na pravu točku na karti ili dodirni natpis pa točku. Natpis s karte vraćaš dodirom.
      </p>
      <div class="flex min-h-12 flex-wrap gap-2" role="group" aria-label="Natpisi za kartu">
        <button
          v-for="i in uLadici"
          :key="`l${i}`"
          type="button"
          class="min-h-11 cursor-grab touch-none rounded-xl border-2 px-3 py-1.5 text-base font-bold transition-colors"
          :class="[
            odabrani === i ? 'border-indigo-700 bg-indigo-700 text-white' : 'border-indigo-300 bg-white text-indigo-900 hover:bg-indigo-50',
            vucenje?.aktivno && vucenje.natpis === i ? 'opacity-30' : ''
          ]"
          :aria-pressed="odabrani === i"
          @pointerdown="pocni($event, i, false)"
          @pointermove="pomakni"
          @pointerup="zavrsi"
          @pointercancel="vucenje = null"
          @click="klikNaNatpis(i, false)"
        >
          {{ zadatak.mjesta[i]!.naziv }}
        </button>
        <p v-if="!uLadici.length" class="self-center font-semibold text-green-800">
          <span aria-hidden="true">✓</span> Svi su natpisi na karti.
        </p>
      </div>
    </template>

    <Teleport to="body">
      <div
        v-if="vucenje?.aktivno"
        class="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-indigo-700 px-3 py-1.5 font-extrabold whitespace-nowrap text-white shadow-xl"
        :style="{ left: `${vucenje.x}px`, top: `${vucenje.y}px` }"
        aria-hidden="true"
      >
        {{ zadatak.mjesta[vucenje.natpis]!.naziv }}
      </div>
    </Teleport>
  </div>
</template>
