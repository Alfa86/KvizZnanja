<script setup lang="ts">
import type { Pitanje } from '~/types'

const props = defineProps<{
  pitanje: Pitanje
  redniBroj: number
  odgovor: number | null
  koristenSavjet: boolean
}>()

const tocno = computed(() => props.odgovor === props.pitanje.tocan)
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

    <dl class="space-y-1 text-base">
      <div v-if="!tocno" class="flex flex-wrap gap-x-2">
        <dt class="text-slate-600">Tvoj odgovor:</dt>
        <dd class="font-bold text-red-800" :class="{ italic: odgovor === null }">
          {{ odgovor === null ? 'bez odgovora' : pitanje.ponudeni[odgovor] }}
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
  </li>
</template>
