<script setup lang="ts">
defineProps<{ odgovoreno: number, ukupno: number }>()
const emit = defineEmits<{ izadi: [] }>()

const prozor = useTemplateRef<HTMLDialogElement>('prozor')

// Izvorni <dialog> sam zadržava fokus unutar prozora i zatvara se tipkom Escape
function otvori() {
  prozor.value?.showModal()
}

function zatvori() {
  prozor.value?.close()
}

defineExpose({ otvori })
</script>

<template>
  <dialog
    ref="prozor"
    aria-labelledby="izlazak-naslov"
    aria-describedby="izlazak-opis"
    class="m-auto w-[calc(100%-2.5rem)] max-w-[30rem] rounded-[1.75rem] bg-white p-6 text-slate-900 shadow-2xl backdrop:bg-slate-900/55 sm:p-9"
  >
    <div class="flex flex-col items-center gap-4 text-center">
      <span class="flex size-20 items-center justify-center rounded-full bg-amber-100 text-4xl" aria-hidden="true">🚪</span>
      <h2 id="izlazak-naslov" class="text-2xl font-extrabold sm:text-3xl">Želiš li izaći iz kviza?</h2>
      <p id="izlazak-opis" class="text-slate-700">
        Ako sada izađeš, tvoji odgovori se neće spremiti. Kviz ćeš morati početi ispočetka – od prvog pitanja.
      </p>
      <p class="rounded-full bg-indigo-50 px-4 py-2 text-base font-bold text-indigo-800">
        <span aria-hidden="true">📝</span> Odgovoreno: {{ odgovoreno }} od {{ ukupno }} pitanja
      </p>
      <div class="mt-1 flex w-full flex-col gap-3 sm:flex-row">
        <button type="button" class="gumb-glavni flex-1" autofocus @click="zatvori">Nastavi rješavati</button>
        <button type="button" class="gumb-opasni flex-1" @click="zatvori(); emit('izadi')">Da, izađi</button>
      </div>
    </div>
  </dialog>
</template>
