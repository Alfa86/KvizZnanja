<script setup lang="ts">
import type { Cjelina, Tezina } from '~/types'

const props = defineProps<{
  korak: number
  cjeline: Cjelina[]
  pitanjaPoLekciji: Record<string, Record<Tezina, number>>
  tezina: Tezina
}>()
const odabrane = defineModel<string[]>({ required: true })

// Predmet s jednom cjelinom prikazuje se kao običan popis lekcija
const grupirano = computed(() => props.cjeline.length > 1)
const sveLekcije = computed(() => props.cjeline.flatMap(c => c.lekcije))

function ukupno(id: string): number {
  const broj = props.pitanjaPoLekciji[id]
  return broj ? broj.lagano + broj.srednje + broj.tesko : 0
}

const naTezini = (id: string) => props.pitanjaPoLekciji[id]?.[props.tezina] ?? 0
const dostupneU = (c: Cjelina) => c.lekcije.filter(l => ukupno(l.id) > 0).map(l => l.id)

const dostupne = computed(() => sveLekcije.value.filter(l => ukupno(l.id) > 0).map(l => l.id))
const sveOdabrane = computed(() => dostupne.value.length > 0 && dostupne.value.every(id => odabrane.value.includes(id)))

function promijeniSve() {
  odabrane.value = sveOdabrane.value ? [] : [...dostupne.value]
}

type StanjeCjeline = 'sve' | 'djelomicno' | 'nista' | 'uskoro'

function stanje(c: Cjelina): StanjeCjeline {
  const ids = dostupneU(c)
  if (!ids.length) return 'uskoro'
  const n = ids.filter(id => odabrane.value.includes(id)).length
  return n === ids.length ? 'sve' : n > 0 ? 'djelomicno' : 'nista'
}

function opisCjeline(c: Cjelina): string {
  const ids = dostupneU(c)
  if (!ids.length) return 'uskoro'
  const odabraneU = ids.filter(id => odabrane.value.includes(id))
  const pitanja = odabraneU.reduce((zbroj, id) => zbroj + naTezini(id), 0)
  const lekcija = `${odabraneU.length} od ${ids.length} ${oblikUzBroj(ids.length, ['lekcije', 'lekcije', 'lekcija'])}`
  return pitanja ? `${lekcija} · ${pitanja} ${oblikUzBroj(pitanja, ['pitanje', 'pitanja', 'pitanja'])}` : lekcija
}

function promijeniCjelinu(c: Cjelina) {
  const ids = dostupneU(c)
  odabrane.value = stanje(c) === 'sve'
    ? odabrane.value.filter(id => !ids.includes(id))
    : [...new Set([...odabrane.value, ...ids])]
}

const otvorene = ref<string[]>([])
const jeOtvorena = (id: string) => otvorene.value.includes(id)
function prebaciOtvorenost(id: string) {
  otvorene.value = jeOtvorena(id) ? otvorene.value.filter(x => x !== id) : [...otvorene.value, id]
}
</script>

<template>
  <fieldset>
    <!-- Legenda mora biti prvo dijete fieldseta, pa gumb „Odaberi sve“ pluta desno od nje -->
    <legend class="float-left mb-3 min-h-12 content-center">
      <NaslovKoraka :korak="korak">Što želiš ponoviti?</NaslovKoraka>
    </legend>
    <button
      v-if="dostupne.length > 1"
      type="button"
      class="float-right mb-3 min-h-12 rounded-xl px-2 font-bold text-indigo-800 underline underline-offset-4 hover:bg-indigo-50"
      @click="promijeniSve"
    >
      {{ sveOdabrane ? 'Poništi odabir' : 'Odaberi sve' }}
    </button>

    <!-- Jedna cjelina: običan popis lekcija -->
    <div v-if="!grupirano" class="clear-both flex flex-col gap-3">
      <label
        v-for="lekcija in sveLekcije"
        :key="lekcija.id"
        class="flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-2.5 has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-blue-900"
        :class="ukupno(lekcija.id) > 0
          ? 'cursor-pointer border-slate-200 bg-white hover:border-indigo-400 has-checked:border-indigo-700 has-checked:bg-indigo-50'
          : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-600'"
      >
        <input v-model="odabrane" type="checkbox" :value="lekcija.id" :disabled="ukupno(lekcija.id) === 0" class="peer sr-only">
        <KvacicaOznaka />
        <span class="flex-1 font-bold leading-snug">{{ lekcija.naziv }}</span>
        <span class="shrink-0 text-sm text-slate-600">
          <template v-if="ukupno(lekcija.id) === 0">uskoro</template>
          <template v-else>{{ naTezini(lekcija.id) }} {{ oblikUzBroj(naTezini(lekcija.id), ['pitanje', 'pitanja', 'pitanja']) }}</template>
        </span>
      </label>
    </div>

    <!-- Više cjelina: kvačica cjeline bira sve njezine lekcije, a naziv otvara popis lekcija -->
    <template v-else>
      <p class="clear-both mb-3 text-base text-slate-600">Odaberi cijelu cjelinu ili je otvori i odaberi pojedine lekcije.</p>
      <ul class="flex flex-col gap-2">
        <li
          v-for="c in cjeline"
          :key="c.id"
          class="overflow-hidden rounded-2xl border-2"
          :class="{
            'border-slate-200 bg-slate-100 text-slate-600': stanje(c) === 'uskoro',
            'border-indigo-700 bg-indigo-50': stanje(c) === 'sve',
            'border-indigo-700 bg-white': stanje(c) === 'djelomicno' || (stanje(c) === 'nista' && jeOtvorena(c.id)),
            'border-slate-200 bg-white': stanje(c) === 'nista' && !jeOtvorena(c.id)
          }"
        >
          <div class="flex items-center gap-1 pr-2">
            <label class="flex size-12 shrink-0 items-center justify-center has-focus-visible:outline-3 has-focus-visible:-outline-offset-3 has-focus-visible:outline-blue-900" :class="stanje(c) === 'uskoro' ? 'cursor-not-allowed' : 'cursor-pointer'">
              <input
                type="checkbox"
                class="peer sr-only"
                :checked="stanje(c) === 'sve'"
                :indeterminate="stanje(c) === 'djelomicno'"
                :disabled="stanje(c) === 'uskoro'"
                :aria-label="`Odaberi cijelu cjelinu ${c.naziv}`"
                @change="promijeniCjelinu(c)"
              >
              <KvacicaOznaka />
            </label>
            <button
              type="button"
              class="flex min-h-14 flex-1 items-center gap-3 rounded-xl py-2 pr-1 text-left disabled:cursor-not-allowed"
              :disabled="stanje(c) === 'uskoro'"
              :aria-expanded="stanje(c) === 'uskoro' ? undefined : jeOtvorena(c.id)"
              :aria-controls="`cjelina-${c.id}`"
              @click="prebaciOtvorenost(c.id)"
            >
              <span class="text-2xl sm:text-[1.75rem]" :class="{ 'opacity-60': stanje(c) === 'uskoro' }" aria-hidden="true">{{ c.ikona }}</span>
              <span class="flex flex-1 flex-col">
                <span class="font-extrabold leading-snug">{{ c.naziv }}</span>
                <span class="text-sm text-slate-600">{{ opisCjeline(c) }}</span>
              </span>
              <span
                v-if="stanje(c) !== 'uskoro'"
                class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-800"
                aria-hidden="true"
              >
                <svg class="transition-transform" :class="{ 'rotate-180': jeOtvorena(c.id) }" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
              </span>
            </button>
          </div>

          <div v-show="jeOtvorena(c.id)" :id="`cjelina-${c.id}`" class="mx-3 border-t border-indigo-200 pt-1.5 pb-2 sm:ml-12 sm:mr-4">
            <label
              v-for="lekcija in c.lekcije"
              :key="lekcija.id"
              class="flex min-h-12 items-start gap-3 rounded-xl px-2 py-2.5 has-focus-visible:outline-3 has-focus-visible:outline-blue-900 sm:items-center"
              :class="ukupno(lekcija.id) > 0 ? 'cursor-pointer hover:bg-indigo-50' : 'cursor-not-allowed text-slate-500'"
            >
              <input v-model="odabrane" type="checkbox" :value="lekcija.id" :disabled="ukupno(lekcija.id) === 0" class="peer sr-only">
              <KvacicaOznaka />
              <span class="flex flex-1 flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <span class="font-semibold leading-snug">{{ lekcija.naziv }}</span>
                <span class="shrink-0 text-sm text-slate-600">
                  <template v-if="ukupno(lekcija.id) === 0">uskoro</template>
                  <template v-else>{{ naTezini(lekcija.id) }} {{ oblikUzBroj(naTezini(lekcija.id), ['pitanje', 'pitanja', 'pitanja']) }}</template>
                </span>
              </span>
            </label>
          </div>
        </li>
      </ul>
    </template>
  </fieldset>
</template>
