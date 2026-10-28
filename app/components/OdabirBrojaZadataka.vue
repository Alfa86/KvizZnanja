<script setup lang="ts">
import type { BrojZadataka } from '~/types'

const props = defineProps<{ korak: number, dostupno: number }>()
const broj = defineModel<BrojZadataka>({ required: true })

// Kad nisu svi brojevi mogući, učeniku se kaže za koje ima dovoljno pitanja
const moguci = computed(() => BROJEVI_ZADATAKA.filter(n => n <= props.dostupno))
</script>

<template>
  <fieldset>
    <legend class="mb-3">
      <NaslovKoraka :korak="korak">Koliko pitanja?</NaslovKoraka>
    </legend>
    <div class="grid grid-cols-3 gap-3">
      <label
        v-for="n in BROJEVI_ZADATAKA"
        :key="n"
        class="flex min-h-16 items-center justify-center rounded-2xl border-2 text-3xl font-extrabold has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-blue-900"
        :class="n <= dostupno
          ? 'cursor-pointer border-slate-200 bg-white hover:border-indigo-400 has-checked:border-indigo-700 has-checked:bg-indigo-50'
          : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500'"
      >
        <input v-model="broj" type="radio" name="broj-zadataka" :value="n" :disabled="n > dostupno" class="sr-only">
        {{ n }}
      </label>
    </div>
    <p class="mt-3 text-base text-slate-600">
      Za ovaj odabir ima {{ dostupno }} {{ oblikUzBroj(dostupno, ['pitanje', 'pitanja', 'pitanja']) }}<template v-if="moguci.length && moguci.length < BROJEVI_ZADATAKA.length">
        – dovoljno za {{ moguci.join(' ili ') }}</template>.
    </p>
  </fieldset>
</template>
