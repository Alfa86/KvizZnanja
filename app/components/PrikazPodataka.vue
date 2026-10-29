<script setup lang="ts">
import type { PrikazPodataka } from '~/types'
import { korakDijagrama } from '~/utils/podaci'

const props = defineProps<{ podaci: PrikazPodataka }>()

// Stupčasti dijagram crta se u SVG-u stalne širine; os y ide od 0 do prve crte iznad najveće vrijednosti
const SIRINA = 360
const VISINA = 230
const LIJEVO = 44
const DOLJE = 34
const GORE = 12

const dijagram = computed(() => {
  const p = props.podaci
  const korak = korakDijagrama(p)
  const vrh = Math.max(korak, Math.ceil(Math.max(...p.vrijednosti) / korak) * korak)
  const visinaPodrucja = VISINA - DOLJE - GORE
  const y = (v: number) => GORE + visinaPodrucja * (1 - v / vrh)
  const sirinaMjesta = (SIRINA - LIJEVO - 8) / p.oznake.length
  const crte = Array.from({ length: vrh / korak + 1 }, (_, i) => ({ vrijednost: i * korak, y: y(i * korak) }))
  const stupci = p.vrijednosti.map((v, i) => ({
    x: LIJEVO + i * sirinaMjesta + sirinaMjesta * 0.2,
    sirina: sirinaMjesta * 0.6,
    y: y(v),
    visina: y(0) - y(v),
    oznaka: p.oznake[i]!,
    sredina: LIJEVO + (i + 0.5) * sirinaMjesta
  }))
  return { crte, stupci, dno: y(0) }
})

const simboli = (v: number) => props.podaci.simbol!.repeat(v / props.podaci.vrijednostSimbola!)
</script>

<template>
  <figure class="my-4 rounded-2xl bg-white p-3">
    <figcaption class="mb-2 text-center text-base font-bold text-slate-800">{{ podaci.naslov }}</figcaption>

    <table v-if="podaci.vrsta === 'tablica'" class="mx-auto border-collapse text-base">
      <thead>
        <tr class="bg-indigo-50">
          <th class="border border-slate-300 px-4 py-1.5 text-left font-semibold">{{ podaci.nazivOznaka ?? '' }}</th>
          <th class="border border-slate-300 px-4 py-1.5 text-right font-semibold">{{ podaci.nazivVrijednosti ?? '' }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(o, i) in podaci.oznake" :key="o">
          <td class="border border-slate-300 px-4 py-1.5">{{ o }}</td>
          <td class="border border-slate-300 px-4 py-1.5 text-right tabular-nums">{{ podaci.vrijednosti[i] }}</td>
        </tr>
      </tbody>
    </table>

    <svg
      v-else-if="podaci.vrsta === 'stupcasti'"
      :viewBox="`0 0 ${SIRINA} ${VISINA}`"
      role="img"
      :aria-label="podaci.naslov"
      class="mx-auto block w-full max-w-md"
    >
      <g v-for="c in dijagram.crte" :key="c.vrijednost">
        <line :x1="LIJEVO" :x2="SIRINA - 8" :y1="c.y" :y2="c.y" stroke="#cbd5e1" stroke-width="1" />
        <text :x="LIJEVO - 6" :y="c.y" text-anchor="end" dominant-baseline="central" font-size="12" fill="#334155">{{ c.vrijednost }}</text>
      </g>
      <g v-for="s in dijagram.stupci" :key="s.oznaka">
        <rect :x="s.x" :y="s.y" :width="s.sirina" :height="s.visina" fill="#6366f1" rx="2" />
        <text :x="s.sredina" :y="dijagram.dno + 16" text-anchor="middle" font-size="12" fill="#1e293b">{{ s.oznaka }}</text>
      </g>
      <line :x1="LIJEVO" :x2="SIRINA - 8" :y1="dijagram.dno" :y2="dijagram.dno" stroke="#1e293b" stroke-width="1.5" />
      <line :x1="LIJEVO" :x2="LIJEVO" :y1="GORE - 4" :y2="dijagram.dno" stroke="#1e293b" stroke-width="1.5" />
    </svg>

    <div v-else-if="podaci.vrsta === 'slikovni'" class="mx-auto w-fit text-base">
      <div v-for="(o, i) in podaci.oznake" :key="o" class="flex items-center gap-3 border-b border-slate-200 py-1.5 last:border-0">
        <span class="w-24 shrink-0 font-semibold">{{ o }}</span>
        <span class="text-xl tracking-wider" :aria-label="`${o}: ${podaci.vrijednosti[i]}`">{{ simboli(podaci.vrijednosti[i]!) }}</span>
      </div>
      <p class="mt-2 text-sm text-slate-600">{{ podaci.simbol }} = {{ podaci.vrijednostSimbola }}</p>
    </div>

    <p v-if="podaci.vrsta === 'stupcasti' && podaci.nazivVrijednosti" class="mt-1 text-center text-sm text-slate-600">{{ podaci.nazivVrijednosti }}</p>
  </figure>
</template>
