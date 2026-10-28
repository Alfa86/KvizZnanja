<script setup lang="ts">
defineProps<{ korak: number }>()
</script>

<template>
  <!-- Sadržaj legende u koraku postavki kviza: redni broj u krugu i naslov -->
  <span class="flex items-center gap-3 text-xl font-bold sm:text-2xl">
    <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-700 text-lg font-extrabold text-white" aria-hidden="true">
      {{ korak }}
    </span>
    <slot />
  </span>
</template>
