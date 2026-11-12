<script setup lang="ts">
import type { Odgovor, Pitanje } from '~/types'
import { jeOdgovorTocan } from '~/utils/karta'

const props = defineProps<{
  pitanje: Pitanje
  redniBroj: number
  odgovor: Odgovor | null
  koristenSavjet: boolean
}>()

const tocno = computed(() => jeOdgovorTocan(props.pitanje, props.odgovor))

// Natpisi s karte stavljeni na pogrešnu oznaku: [natpis, naziv mjesta na koje je stavljen]
const pogresnoNaKarti = computed(() => {
  const p = props.pitanje
  if (!p.karta || !Array.isArray(props.odgovor)) return []
  return props.odgovor.flatMap((oznaka, natpis) => (oznaka === natpis ? [] : [{
    natpis: p.karta!.mjesta[natpis]!.naziv,
    stavljeno: oznaka === null ? null : p.karta!.mjesta[oznaka]!.naziv
  }]))
})
</script>

<template>
  <li class="relative overflow-hidden rounded-3xl bg-white p-5 pl-7 ring-1 ring-slate-200">
    <span class="absolute inset-y-0 left-0 w-2" :class="tocno ? 'bg-green-600' : 'bg-red-500'" aria-hidden="true" />
    <div class="mb-3 flex items-start justify-between gap-3">
      <h3 class="font-bold leading-snug">
        {{ redniBroj }}. {{ pitanje.pitanje }}
      </h3>
      <span class="shrink-0" :class="tocno ? 'text-green-700' : 'text-red-700'" :aria-label="tocno ? 'Točno' : 'Netočno'" role="img">
        <svg v-if="tocno" aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        <svg v-else aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </span>
    </div>

    <SlikaPitanja v-if="pitanje.slika" :slika="pitanje.slika" />
    <PrikazPodataka v-if="pitanje.podaci" :podaci="pitanje.podaci" />

    <template v-if="pitanje.karta">
      <KartaZadatak :zadatak="pitanje.karta" :raspored="Array.isArray(odgovor) ? odgovor : null" nacin="rjesenje" />
      <ul v-if="pogresnoNaKarti.length" class="space-y-1 text-base">
        <li v-for="g in pogresnoNaKarti" :key="g.natpis">
          <span class="text-slate-600">Natpis</span> <span class="font-bold text-red-800">{{ g.natpis }}</span>
          <span class="text-slate-600">{{ g.stavljeno ? `stavljen je na mjesto gdje je ${g.stavljeno}.` : 'nije stavljen na kartu.' }}</span>
        </li>
      </ul>
    </template>

    <dl v-else class="space-y-1 text-base">
      <div v-if="!tocno" class="flex flex-wrap gap-x-2">
        <dt class="text-slate-600">Tvoj odgovor:</dt>
        <dd class="font-bold text-red-800" :class="{ italic: typeof odgovor !== 'number' }">
          {{ typeof odgovor === 'number' ? pitanje.ponudeni[odgovor] : 'bez odgovora' }}
        </dd>
      </div>
      <div class="flex flex-wrap gap-x-2">
        <dt class="text-slate-600">Točan odgovor:</dt>
        <dd class="font-bold text-green-800">{{ pitanje.ponudeni[pitanje.tocan] }}</dd>
      </div>
    </dl>

    <p class="mt-3 rounded-xl bg-slate-50 p-3 text-base">{{ pitanje.objasnjenje }}</p>

    <p v-if="koristenSavjet" class="mt-2 text-sm text-amber-900">
      <span aria-hidden="true">💡</span> Koristio se savjet
    </p>

    <PrijaviGresku :pitanje="pitanje" class="mt-3" />
  </li>
</template>
