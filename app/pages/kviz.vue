<script setup lang="ts">
import { useKvizStore } from '~/stores/kviz'

const route = useRoute()
const store = useKvizStore()

const stanje = ref<'ucitavanje' | 'spremno' | 'greska'>('ucitavanje')
const potvrdaZavrsetka = ref(false)

useSeo({ naslov: 'Kviz | Kviz znanja', opis: OPIS_STRANICE, indeksiraj: false })

async function pripremi() {
  stanje.value = 'ucitavanje'
  potvrdaZavrsetka.value = false
  const postavke = parsirajPostavke(route.query, razredi)
  if (!postavke) return navigateTo('/', { replace: true })

  try {
    await store.pokreni(postavke)
  }
  catch {
    stanje.value = 'greska'
    return
  }
  if (!store.pitanja.length) {
    stanje.value = 'greska'
    return
  }
  if (store.zavrseno) return navigateTo({ path: '/rezultati', query: route.query }, { replace: true })
  stanje.value = 'spremno'
}

// Ponovno pripremi kviz kad se promijeni URL (npr. „Nova pitanja“), ali ne pri odlasku sa stranice
watch(() => (route.path === '/kviz' ? route.fullPath : null), (putanja) => {
  if (putanja) pripremi()
}, { immediate: true })

const { dohvatiPredmet } = useKurikulum()
const predmet = computed(() => store.postavke ? dohvatiPredmet(store.postavke.razred, store.postavke.predmetId) : undefined)
const tezina = computed(() => TEZINE.find(t => t.id === store.postavke?.tezina))

const prozorIzlaska = useTemplateRef('prozorIzlaska')

// Izlazak briše napredak, pa isti kviz kasnije kreće od prvog pitanja
function izadi() {
  const { razred, predmetId } = store.postavke!
  store.resetiraj()
  return navigateTo(`/razred/${razred}/${predmetId}`)
}

const pitanje = computed(() => store.pitanja[store.trenutnoPitanje])
const jeZadnje = computed(() => store.trenutnoPitanje === store.pitanja.length - 1)
const neodgovoreno = computed(() => store.pitanja.length - store.brojOdgovorenih)

function zavrsi() {
  if (neodgovoreno.value > 0 && !potvrdaZavrsetka.value) {
    potvrdaZavrsetka.value = true
    return
  }
  store.zavrsi()
  return navigateTo({ path: '/rezultati', query: route.query })
}
</script>

<template>
  <div>
    <p v-if="stanje === 'ucitavanje'" class="kartica text-center" role="status">
      <span class="mb-2 block text-4xl" aria-hidden="true">🧩</span>
      Slažemo tvoja pitanja…
    </p>

    <div v-else-if="stanje === 'greska'" class="kartica text-center">
      <p class="mb-4">Ups, ovaj kviz trenutno ne možemo složiti.</p>
      <NuxtLink to="/" class="gumb-glavni">Na početnu</NuxtLink>
    </div>

    <div v-else-if="pitanje" class="flex flex-col gap-5 sm:gap-6">
      <div class="flex items-center justify-between gap-3">
        <p
          v-if="predmet && tezina"
          class="rounded-full px-3 py-1.5 text-sm font-extrabold text-white"
          :style="{ backgroundColor: predmet.boja }"
        >
          <span aria-hidden="true">{{ predmet.ikona }}</span> {{ predmet.naziv }} ·
          <span aria-hidden="true">{{ tezina.ikona }}</span> {{ tezina.naziv }}
        </p>
        <button
          type="button"
          class="-mr-2 ml-auto inline-flex min-h-12 items-center gap-1.5 rounded-xl px-2 font-bold text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
          @click="prozorIzlaska?.otvori()"
        >
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          Izađi
        </button>
      </div>

      <TrakaNapretka
        :trenutno="store.trenutnoPitanje + 1"
        :ukupno="store.pitanja.length"
        :odgovoreno="store.brojOdgovorenih"
      />

      <PitanjeKartica
        :pitanje="pitanje"
        :redni-broj="store.trenutnoPitanje + 1"
        :odabrani="store.odgovori[store.trenutnoPitanje] ?? null"
        @odaberi="store.odaberiOdgovor"
      />

      <SavjetGumb
        :key="store.trenutnoPitanje"
        :savjet="pitanje.savjet"
        :otvoren="store.koristenSavjet[store.trenutnoPitanje] ?? false"
        @otvori="store.prikaziSavjet"
      />

      <div v-if="potvrdaZavrsetka" class="kartica bg-amber-50 ring-amber-300" role="alert">
        <p class="mb-4 font-semibold">
          Još {{ neodgovoreno }} {{ oblikUzBroj(neodgovoreno, ['pitanje nema', 'pitanja nemaju', 'pitanja nemaju']) }}
          odgovor. Želiš li ipak završiti?
        </p>
        <div class="flex flex-wrap gap-3">
          <button type="button" class="gumb-glavni" @click="zavrsi">Da, završi kviz</button>
          <button type="button" class="gumb-sporedni" @click="potvrdaZavrsetka = false">Nastavi rješavati</button>
        </div>
      </div>

      <div class="flex justify-between gap-3">
        <button type="button" class="gumb-sporedni flex-1 sm:flex-none" :disabled="store.trenutnoPitanje === 0" @click="store.natrag">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
          Natrag
        </button>
        <button v-if="!jeZadnje" type="button" class="gumb-glavni flex-1 sm:flex-none" @click="store.dalje">
          Dalje
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
        <button v-else-if="!potvrdaZavrsetka" type="button" class="gumb-glavni flex-1 sm:flex-none" @click="zavrsi">
          Završi kviz <span aria-hidden="true">🏁</span>
        </button>
      </div>

      <ProzorIzlaska
        ref="prozorIzlaska"
        :odgovoreno="store.brojOdgovorenih"
        :ukupno="store.pitanja.length"
        @izadi="izadi"
      />
    </div>
  </div>
</template>
