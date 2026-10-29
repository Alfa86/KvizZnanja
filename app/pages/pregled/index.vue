<script setup lang="ts">
// Pregled sadržaja za administratora; postoji samo u razvojnom načinu (npm run dev)
if (!import.meta.dev) throw createError({ statusCode: 404, fatal: true })

const { razredi } = useKurikulum()
const { stanjeLekcije, izvozNapomena } = useRecenzija()
const kopirano = ref(false)

async function kopirajNapomene() {
  try {
    await navigator.clipboard.writeText(izvozNapomena())
    kopirano.value = true
    setTimeout(() => (kopirano.value = false), 2000)
  }
  catch {
    // kopiranje nije dopušteno (npr. stranica nije u fokusu)
  }
}

useHead({ title: 'Pregled sadržaja' })
</script>

<template>
  <div>
    <h1 class="mb-2 text-3xl font-extrabold">Pregled sadržaja</h1>
    <p class="mb-4 text-slate-700">
      Odaberi lekciju za pregled svih pitanja, crteža i točnih odgovora. Pitanja označi kao „U redu“ ili „Označi za ispravak“;
      oznake se čuvaju u ovom pregledniku.
    </p>
    <button type="button" class="gumb-sporedni mb-6" @click="kopirajNapomene">
      {{ kopirano ? 'Kopirano ✓' : 'Kopiraj sve moje napomene' }}
    </button>

    <template v-for="razred in razredi" :key="razred.broj">
      <section v-for="predmet in razred.predmeti" :key="predmet.id" class="kartica mb-4">
        <h2 class="mb-2 text-xl font-bold">{{ razred.broj }}. razred · {{ predmet.naziv }}</h2>
        <ul class="flex flex-col gap-1">
          <li v-for="lekcija in predmet.lekcije" :key="lekcija.id" class="flex flex-wrap items-baseline gap-x-3">
            <NuxtLink
              :to="`/pregled/${razred.broj}/${predmet.id}/${lekcija.id}`"
              class="inline-flex min-h-10 items-center font-semibold text-indigo-800 underline underline-offset-4"
            >
              {{ lekcija.naziv }}
            </NuxtLink>
            <span v-for="s in [stanjeLekcije(`${razred.broj}-${predmet.id}-${lekcija.id}-`)]" :key="lekcija.id" class="text-sm text-slate-600">
              <template v-if="s.pregledano">pregledano {{ s.pregledano }}</template>
              <template v-if="s.oznaceno"> · <span class="text-red-700">označeno {{ s.oznaceno }}</span></template>
              <template v-if="s.nalazi"> · <span class="text-amber-800">AI nalazi {{ s.nalazi }}</span></template>
            </span>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
