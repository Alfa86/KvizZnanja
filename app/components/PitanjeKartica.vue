<script setup lang="ts">
import type { Pitanje } from '~/types'

const props = defineProps<{ pitanje: Pitanje, redniBroj: number, odabrani: number | null }>()
const emit = defineEmits<{ odaberi: [indeks: number] }>()

const SLOVA = ['A', 'B', 'C', 'D']
const naslov = useTemplateRef<HTMLElement>('naslov')

// Pri prelasku na novo pitanje fokus ide na tekst pitanja (čitači zaslona, pomak na vrh)
watch(() => props.pitanje, () => nextTick(() => naslov.value?.focus()))
</script>

<template>
  <section class="kartica sm:p-8">
    <p class="mb-3 inline-block rounded-full bg-indigo-50 px-3 py-1 text-sm font-extrabold text-indigo-800" aria-hidden="true">
      Pitanje {{ redniBroj }}
    </p>
    <h2 ref="naslov" tabindex="-1" class="mb-5 text-2xl leading-snug font-extrabold sm:text-3xl">
      <span class="sr-only">Pitanje {{ redniBroj }}: </span>{{ pitanje.pitanje }}
    </h2>
    <SlikaPitanja v-if="pitanje.slika" :slika="pitanje.slika" />
    <PrikazPodataka v-if="pitanje.podaci" :podaci="pitanje.podaci" />
    <div class="flex flex-col gap-3" role="group" aria-label="Ponuđeni odgovori">
      <button
        v-for="(odgovor, i) in pitanje.ponudeni"
        :key="i"
        type="button"
        class="flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-xl font-semibold transition-colors"
        :class="odabrani === i
          ? 'border-indigo-700 bg-indigo-700 text-white'
          : 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50'"
        :aria-pressed="odabrani === i"
        @click="emit('odaberi', i)"
      >
        <span
          class="flex size-9 shrink-0 items-center justify-center rounded-full text-lg font-bold"
          :class="odabrani === i ? 'bg-white text-indigo-800' : 'bg-slate-100 text-slate-700'"
        >{{ SLOVA[i] }}</span>
        <span>{{ odgovor }}</span>
      </button>
    </div>
  </section>
</template>
