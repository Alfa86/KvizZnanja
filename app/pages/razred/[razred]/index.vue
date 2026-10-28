<script setup lang="ts">
import type { Predmet } from '~/types'

const route = useRoute()
const { dohvatiRazred } = useKurikulum()

const broj = Number(route.params.razred)
const razred = dohvatiRazred(broj)
if (!razred) {
  throw createError({ statusCode: 404, statusMessage: 'Razred nije pronađen', fatal: true })
}

const indeks = await useIndeksPitanja()
const apsolutni = useApsolutniUrl()
const imaPitanja = (p: Predmet) => predmetImaPitanja(indeks.value, broj, p)
const nazivi = razred.predmeti.filter(imaPitanja).map(p => p.naziv).join(', ')

useSeo({
  naslov: `Kvizovi za ${broj}. razred osnovne škole | Kviz znanja`,
  opis: nazivi
    ? `Kvizovi za ${broj}. razred: ${nazivi}. Vježbaj školsko gradivo kroz kratke kvizove s objašnjenjima – besplatno i bez prijave.`
    : `Kvizovi za ${broj}. razred stižu uskoro.`,
  // Razred bez pitanja nema sadržaja pa ne ide u tražilice
  indeksiraj: Boolean(nazivi),
  strukturirano: [
    mrvice(apsolutni, [
      { naziv: 'Početna', put: '/' },
      { naziv: `${broj}. razred`, put: `/razred/${broj}` }
    ])
  ]
})
</script>

<template>
  <div class="flex flex-col gap-6 sm:gap-7">
    <PoveznicaNatrag to="/#razredi" natpis="Svi razredi" />

    <header class="flex flex-col items-start gap-2 sm:gap-3">
      <p class="rounded-full bg-indigo-100 px-3.5 py-1 text-sm font-extrabold text-indigo-800">
        <span aria-hidden="true">🎒</span> {{ broj }}. razred
      </p>
      <h1 class="text-3xl font-extrabold tracking-tight sm:text-[2.75rem] sm:leading-tight">
        Što danas vježbamo? <span aria-hidden="true">📚</span>
      </h1>
      <p class="text-slate-600 sm:text-xl">Odaberi predmet. U svakom te čekaju lekcije iz tvog udžbenika.</p>
    </header>

    <ul v-if="razred.predmeti.length" class="grid gap-3 sm:grid-cols-2 sm:gap-5">
      <li v-for="predmet in razred.predmeti" :key="predmet.id">
        <KarticaPredmeta :razred="broj" :predmet="predmet" :dostupan="imaPitanja(predmet)" />
      </li>
      <li class="flex min-h-25 items-center gap-4 rounded-3xl border-2 border-dashed border-slate-300 bg-white p-5 sm:min-h-32">
        <span class="text-4xl sm:text-5xl" aria-hidden="true">🚧</span>
        <span class="flex flex-col">
          <span class="text-xl font-extrabold text-slate-700">Uskoro još predmeta</span>
          <span class="text-base text-slate-500">Novi predmeti i lekcije dodaju se postupno.</span>
        </span>
      </li>
    </ul>
    <p v-else class="kartica">Za ovaj razred još pripremamo pitanja. Navrati uskoro!</p>

    <p class="flex items-center gap-3 rounded-3xl bg-amber-50 px-5 py-4 text-amber-900 ring-1 ring-amber-300">
      <span class="text-2xl" aria-hidden="true">💡</span>
      <span><strong>Savjet:</strong> kreni s predmetom iz kojeg uskoro pišeš test!</span>
    </p>
  </div>
</template>
