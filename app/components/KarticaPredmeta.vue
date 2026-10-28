<script setup lang="ts">
import type { Predmet } from '~/types'

defineProps<{ razred: number, predmet: Predmet, dostupan: boolean }>()
</script>

<template>
  <NuxtLink
    v-if="dostupan"
    :to="`/razred/${razred}/${predmet.id}`"
    class="flex min-h-28 items-center gap-4 rounded-3xl p-5 text-white shadow-md transition hover:-translate-y-0.5 hover:brightness-110 sm:min-h-32"
    :style="{ backgroundColor: predmet.boja }"
  >
    <span class="text-5xl" aria-hidden="true">{{ predmet.ikona }}</span>
    <span class="flex flex-col">
      <span class="text-2xl font-extrabold">{{ predmet.naziv }}</span>
      <span class="text-base">
        {{ predmet.lekcije.length }} {{ oblikUzBroj(predmet.lekcije.length, ['lekcija', 'lekcije', 'lekcija']) }}
      </span>
    </span>
  </NuxtLink>
  <div
    v-else
    class="flex min-h-28 items-center gap-4 rounded-3xl bg-slate-100 p-5 text-slate-600 ring-1 ring-slate-200 sm:min-h-32"
    aria-disabled="true"
  >
    <span class="text-5xl opacity-60" aria-hidden="true">{{ predmet.ikona }}</span>
    <span class="flex flex-col">
      <span class="text-2xl font-extrabold">{{ predmet.naziv }}</span>
      <span class="text-base">uskoro</span>
    </span>
  </div>
</template>
