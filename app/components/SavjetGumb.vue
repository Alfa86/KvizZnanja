<script setup lang="ts">
defineProps<{ savjet?: string, otvoren: boolean }>()
const emit = defineEmits<{ otvori: [] }>()
</script>

<template>
  <div v-if="savjet" aria-live="polite">
    <p v-if="otvoren" class="flex gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-300">
      <span class="text-2xl" aria-hidden="true">💡</span>
      <span><span class="font-bold">Savjet:</span> {{ savjet }}</span>
    </p>
    <button
      v-else
      type="button"
      class="inline-flex min-h-12 items-center gap-2 rounded-2xl px-4 font-semibold text-amber-900 hover:bg-amber-100"
      @click="emit('otvori')"
    >
      <span aria-hidden="true">💡</span> Treba mi pomoć
    </button>
  </div>
</template>
