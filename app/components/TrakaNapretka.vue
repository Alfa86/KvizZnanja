<script setup lang="ts">
const props = defineProps<{ trenutno: number, ukupno: number, odgovoreno: number }>()

const postotak = computed(() => (props.ukupno ? (props.odgovoreno / props.ukupno) * 100 : 0))
</script>

<template>
  <div>
    <div class="mb-2 flex justify-between text-base font-semibold text-slate-700">
      <span>Pitanje {{ trenutno }} od {{ ukupno }}</span>
      <span>Odgovoreno: {{ odgovoreno }}</span>
    </div>
    <div
      class="h-3 overflow-hidden rounded-full bg-slate-200"
      role="progressbar"
      aria-label="Odgovorena pitanja"
      :aria-valuenow="odgovoreno"
      aria-valuemin="0"
      :aria-valuemax="ukupno"
    >
      <div class="h-full rounded-full bg-indigo-600 transition-all" :style="{ width: `${postotak}%` }" />
    </div>
  </div>
</template>
