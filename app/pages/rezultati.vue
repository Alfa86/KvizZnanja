<script setup lang="ts">
import { useKvizStore } from '~/stores/kviz'

const route = useRoute()
const store = useKvizStore()
const spremno = ref(false)

useSeo({ naslov: 'Rezultati | Kviz znanja', opis: OPIS_STRANICE, indeksiraj: false })

const PORUKE: Record<number, string> = {
  5: 'Bravo, odličan rezultat! Tvoj mozak je danas bio u top formi.',
  4: 'Vrlo dobro, samo tako nastavi!',
  3: 'Dobar posao! Pogledaj objašnjenja i sljedeći put bit će još bolje.',
  2: 'Dobar početak! Probaj ponovno i vidjet ćeš napredak.',
  1: 'Svaki pokušaj je korak naprijed. Pogledaj objašnjenja i probaj ponovno!'
}

const postavke = parsirajPostavke(route.query, razredi)

const ikone = computed(() => store.ocjena.broj >= 4 ? '🎉 🏆 🎉' : store.ocjena.broj >= 2 ? '⭐' : '🌱')
const brojNetocnih = computed(() => store.pitanja.length - store.brojTocnih)

onMounted(async () => {
  if (!postavke) return navigateTo('/', { replace: true })
  try {
    await store.pokreni(postavke)
  }
  catch {
    return navigateTo('/', { replace: true })
  }
  // Rezultati postoje tek kad je kviz predan; inače se učenik vraća na rješavanje
  if (!store.zavrseno) return navigateTo({ path: '/kviz', query: route.query }, { replace: true })
  spremno.value = true
})

function novaPitanja() {
  return navigateTo({ path: '/kviz', query: postavkeUQuery({ ...postavke!, seed: noviSeed() }) })
}

function ponoviIsti() {
  store.resetiraj()
  return navigateTo({ path: '/kviz', query: route.query })
}
</script>

<template>
  <div v-if="spremno && postavke" class="flex flex-col gap-8">
    <section class="flex flex-col items-center gap-4 rounded-[1.75rem] bg-white px-5 py-7 text-center ring-1 ring-slate-200 sm:gap-5 sm:px-12 sm:py-11">
      <p class="text-5xl sm:text-6xl" aria-hidden="true">{{ ikone }}</p>
      <h1 class="text-[2.125rem] leading-tight font-extrabold tracking-tight first-letter:uppercase sm:text-5xl">
        {{ store.ocjena.naziv }} ({{ store.ocjena.broj }})!
      </h1>
      <p class="text-xl font-semibold text-indigo-800">{{ PORUKE[store.ocjena.broj] }}</p>

      <div class="flex w-full flex-col items-center gap-3 rounded-3xl bg-indigo-50 p-5">
        <p class="flex items-end gap-2 text-indigo-800">
          <span class="text-6xl leading-none font-extrabold text-indigo-700 sm:text-7xl">{{ store.brojTocnih }}</span>
          <span class="text-2xl font-bold">/ {{ store.pitanja.length }} točno</span>
        </p>
        <div
          class="h-3.5 w-full overflow-hidden rounded-full bg-white"
          role="progressbar"
          aria-label="Postotak točnih odgovora"
          :aria-valuenow="Math.round(store.postotak)"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div class="h-full rounded-full bg-green-700" :style="{ width: `${store.postotak}%` }" />
        </div>
        <p class="text-base font-bold text-indigo-800">{{ Math.round(store.postotak) }} % točnih odgovora</p>
      </div>

      <ul class="flex flex-wrap justify-center gap-2 text-base font-extrabold">
        <li class="rounded-full bg-green-50 px-3.5 py-1.5 text-green-800"><span aria-hidden="true">✅</span> {{ store.brojTocnih }} točno</li>
        <li class="rounded-full bg-red-50 px-3.5 py-1.5 text-red-800"><span aria-hidden="true">❌</span> {{ brojNetocnih }} netočno</li>
        <li v-if="store.brojSavjeta" class="rounded-full bg-amber-50 px-3.5 py-1.5 text-amber-900">
          <span aria-hidden="true">💡</span>
          {{ store.brojSavjeta }} {{ oblikUzBroj(store.brojSavjeta, ['savjet', 'savjeta', 'savjeta']) }}
        </li>
      </ul>

      <div class="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
        <button type="button" class="gumb-glavni" @click="novaPitanja">
          Nova pitanja
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
        <button type="button" class="gumb-sporedni" @click="ponoviIsti">Ponovi isti kviz</button>
        <NuxtLink :to="`/razred/${postavke.razred}/${postavke.predmetId}`" class="gumb-tekstualni">
          Promijeni postavke
        </NuxtLink>
      </div>
    </section>

    <section aria-labelledby="naslov-pregled">
      <h2 id="naslov-pregled" class="text-2xl font-extrabold sm:text-3xl">Pregled odgovora <span aria-hidden="true">🔍</span></h2>
      <p class="mt-1 mb-4 text-slate-600">Pogledaj objašnjenja – posebno za pitanja koja su ti zadala muke.</p>
      <ol class="flex flex-col gap-4">
        <PregledOdgovora
          v-for="(p, i) in store.pitanja"
          :key="p.id"
          :pitanje="p"
          :redni-broj="i + 1"
          :odgovor="store.odgovori[i] ?? null"
          :koristen-savjet="store.koristenSavjet[i] ?? false"
        />
      </ol>
    </section>
  </div>
  <p v-else class="kartica text-center" role="status">Računam rezultat…</p>
</template>
