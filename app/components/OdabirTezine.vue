<script setup lang="ts">
import type { Tezina } from '~/types'

defineProps<{ korak: number }>()
const tezina = defineModel<Tezina>({ required: true })
</script>

<template>
  <fieldset>
    <legend class="mb-3">
      <NaslovKoraka :korak="korak">Koliko teško?</NaslovKoraka>
    </legend>
    <div class="grid gap-3 sm:grid-cols-3">
      <label
        v-for="t in TEZINE"
        :key="t.id"
        class="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 hover:border-indigo-400 has-checked:border-indigo-700 has-checked:bg-indigo-50 has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-blue-900"
      >
        <input v-model="tezina" type="radio" name="tezina" :value="t.id" class="sr-only">
        <span class="text-3xl" aria-hidden="true">{{ t.ikona }}</span>
        <span class="flex flex-col">
          <span class="font-bold">{{ t.naziv }}</span>
          <span class="text-sm leading-snug text-slate-600">{{ t.opis }}</span>
        </span>
      </label>
    </div>
  </fieldset>
</template>
