<script setup lang="ts">
defineProps<{ to: string, natpis: string }>()
</script>

<template>
  <NuxtLink :to="to" class="-ml-2 inline-flex min-h-12 items-center gap-2 self-start rounded-xl px-2 font-bold text-indigo-800 hover:bg-indigo-50">
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
    {{ natpis }}
  </NuxtLink>
</template>
