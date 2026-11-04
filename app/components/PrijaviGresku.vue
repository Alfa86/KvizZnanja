<script setup lang="ts">
// Gumb za prijavu pogreške u pitanju – prikazuje se samo u razvojnom načinu (npm run dev).
// Prijava se sprema u sadrzaj/ispravci.json preko /api/ispravci.
import type { Pitanje } from '~/types'

const props = defineProps<{ pitanje: Pitanje }>()

const dev = import.meta.dev
const prozor = useTemplateRef<HTMLDialogElement>('prozor')
const opis = ref('')
const stanje = ref<'uređivanje' | 'slanje' | 'spremljeno' | 'greska'>('uređivanje')
const poruka = ref('')

function otvori() {
  opis.value = ''
  stanje.value = 'uređivanje'
  prozor.value?.showModal()
}

async function posalji() {
  if (!opis.value.trim()) return
  stanje.value = 'slanje'
  try {
    const { ukupnoZaPitanje } = await $fetch<{ ukupnoZaPitanje: number }>('/api/ispravci', {
      method: 'POST',
      body: {
        id: props.pitanje.id,
        opis: opis.value,
        pitanje: props.pitanje.pitanje,
        ponudeni: props.pitanje.ponudeni,
        tocan: props.pitanje.tocan,
        stranica: location.pathname + location.search
      }
    })
    stanje.value = 'spremljeno'
    poruka.value = ukupnoZaPitanje > 1 ? `Spremljeno (${ukupnoZaPitanje}. prijava za ovo pitanje).` : 'Spremljeno.'
    setTimeout(() => prozor.value?.close(), 900)
  }
  catch (e) {
    stanje.value = 'greska'
    poruka.value = e instanceof Error ? e.message : 'Spremanje nije uspjelo.'
  }
}
</script>

<template>
  <div v-if="dev">
    <button
      type="button"
      class="inline-flex items-center gap-1 rounded-lg border border-dashed border-rose-400 px-2 py-1 text-sm font-bold text-rose-700 hover:bg-rose-50"
      :title="`Prijavi grešku u pitanju ${pitanje.id}`"
      @click="otvori"
    >
      <span aria-hidden="true">🚩</span> Prijavi grešku
    </button>

    <dialog
      ref="prozor"
      class="m-auto w-[calc(100%-2.5rem)] max-w-[34rem] rounded-2xl bg-white p-6 text-slate-900 shadow-2xl backdrop:bg-slate-900/55"
    >
      <form class="flex flex-col gap-3" @submit.prevent="posalji">
        <h2 class="text-xl font-extrabold">Prijava greške</h2>
        <p class="text-sm text-slate-600">
          ID: <code class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-900 select-all">{{ pitanje.id }}</code>
        </p>
        <p class="rounded-lg bg-slate-50 p-2 text-sm">{{ pitanje.pitanje }}</p>
        <label class="flex flex-col gap-1 text-sm font-bold">
          Opis problema
          <textarea
            v-model="opis"
            rows="4"
            autofocus
            required
            class="rounded-lg border border-slate-300 p-2 font-normal"
            placeholder="Što ne valja i kako bi trebalo biti?"
            @keydown.ctrl.enter="posalji"
          />
        </label>
        <p v-if="stanje === 'spremljeno'" class="text-sm font-bold text-green-700" role="status">{{ poruka }}</p>
        <p v-if="stanje === 'greska'" class="text-sm font-bold text-red-700" role="alert">{{ poruka }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="gumb-sporedni" @click="prozor?.close()">Odustani</button>
          <button type="submit" class="gumb-glavni" :disabled="!opis.trim() || stanje === 'slanje'">Spremi</button>
        </div>
      </form>
    </dialog>
  </div>
</template>
