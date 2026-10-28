<script setup lang="ts">
defineProps<{ broj: number, dostupan: boolean }>()
</script>

<template>
  <NuxtLink
    v-if="dostupan"
    :to="`/razred/${broj}`"
    class="flex h-30 flex-col items-center justify-center rounded-3xl bg-indigo-700 text-white shadow-md transition hover:-translate-y-0.5 hover:bg-indigo-800 sm:h-38"
  >
    <span class="text-5xl leading-none font-extrabold">{{ broj }}.</span>
    <span class="mt-1 text-xl font-semibold">razred</span>
  </NuxtLink>
  <div
    v-else
    class="flex h-30 flex-col items-center justify-center rounded-3xl bg-slate-100 text-slate-600 ring-1 ring-slate-200 sm:h-38"
    aria-disabled="true"
  >
    <span class="text-5xl leading-none font-extrabold">{{ broj }}.</span>
    <span class="mt-1 text-xl font-semibold">razred</span>
    <span class="text-sm">uskoro</span>
  </div>
</template>
