<script setup lang="ts">
import type { BrojZadataka, Tezina } from '~/types'

const route = useRoute()
const { dohvatiPredmet } = useKurikulum()

const razred = Number(route.params.razred)
const predmet = dohvatiPredmet(razred, String(route.params.predmet))
if (!predmet) {
  throw createError({ statusCode: 404, statusMessage: 'Predmet nije pronađen', fatal: true })
}

const indeks = await useIndeksPitanja()
const nula: Record<Tezina, number> = { lagano: 0, srednje: 0, tesko: 0 }
const pitanjaPoLekciji = computed(() =>
  Object.fromEntries(predmet.lekcije.map(l => [l.id, indeks.value[kljucLekcije(razred, predmet.id, l.id)] ?? nula]))
)
const imaPitanja = (id: string) => Object.values(pitanjaPoLekciji.value[id] ?? nula).some(n => n > 0)

const apsolutni = useApsolutniUrl()
// Predmet s više cjelina u opisu navodi cjeline, a ostali lekcije, da opis ne bude predug
const sCjelinama = predmet.cjeline.length > 1
const opis = `${predmet.naziv} za ${razred}. razred – kviz iz ${sCjelinama ? 'cjelina' : 'lekcija'}: `
  + `${(sCjelinama ? predmet.cjeline : predmet.lekcije).map(x => x.naziv).join(', ')}. `
  + 'Tri razine težine, savjeti kad zapne i objašnjenje za svako pitanje. Besplatno i bez prijave.'

useSeo({
  naslov: `${predmet.naziv} za ${razred}. razred – kviz | Kviz znanja`,
  opis,
  strukturirano: [
    {
      '@type': 'Quiz',
      'name': `${predmet.naziv} – ${razred}. razred`,
      'description': opis,
      'url': apsolutni(`/razred/${razred}/${predmet.id}`),
      'inLanguage': 'hr',
      'educationalLevel': `${razred}. razred osnovne škole`,
      'learningResourceType': 'Quiz',
      'isAccessibleForFree': true,
      'audience': { '@type': 'EducationalAudience', 'educationalRole': 'student' },
      'about': predmet.lekcije.filter(l => imaPitanja(l.id)).map(l => ({ '@type': 'Thing', 'name': l.naziv, 'description': l.opis })),
      'isPartOf': { '@type': 'WebSite', 'name': NAZIV_STRANICE, 'url': apsolutni('/') }
    },
    mrvice(apsolutni, [
      { naziv: 'Početna', put: '/' },
      { naziv: `${razred}. razred`, put: `/razred/${razred}` },
      { naziv: predmet.naziv, put: `/razred/${razred}/${predmet.id}` }
    ])
  ]
})

// Kratak popis lekcija odmah je odabran; kod predmeta s cjelinama učenik sam bira što ponavlja
const odabraneLekcije = ref<string[]>(sCjelinama ? [] : predmet.lekcije.filter(l => imaPitanja(l.id)).map(l => l.id))
const tezina = ref<Tezina>('lagano')
const brojZadataka = ref<BrojZadataka>(10)

const dostupno = computed(() =>
  odabraneLekcije.value.reduce((zbroj, id) => zbroj + (pitanjaPoLekciji.value[id]?.[tezina.value] ?? 0), 0)
)

// Ako odabrani broj zadataka postane prevelik, prebaci na najveći mogući
watch(dostupno, (d) => {
  if (brojZadataka.value <= d) return
  const moguci = BROJEVI_ZADATAKA.filter(n => n <= d)
  if (moguci.length) brojZadataka.value = moguci.at(-1)!
})

const odabranaTezina = computed(() => TEZINE.find(t => t.id === tezina.value)!)

const mozeKrenuti = computed(() => odabraneLekcije.value.length > 0 && brojZadataka.value <= dostupno.value)

function kreni() {
  // Lekcije se zapisuju redom iz kurikuluma kako bi isti odabir uvijek dao isti URL
  const lekcijeIds = predmet!.lekcije.map(l => l.id).filter(id => odabraneLekcije.value.includes(id))
  return navigateTo({
    path: '/kviz',
    query: postavkeUQuery({
      razred,
      predmetId: predmet!.id,
      lekcijeIds,
      brojZadataka: brojZadataka.value,
      tezina: tezina.value,
      seed: noviSeed()
    })
  })
}
</script>

<template>
  <div class="flex flex-col gap-6 sm:gap-7">
    <PoveznicaNatrag :to="`/razred/${razred}`" :natpis="`${razred}. razred`" />

    <header class="flex items-center gap-4 rounded-3xl p-5 text-white sm:gap-5 sm:p-7" :style="{ backgroundColor: predmet.boja }">
      <span class="flex size-15 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-4xl sm:size-19 sm:text-5xl" aria-hidden="true">
        {{ predmet.ikona }}
      </span>
      <div>
        <h1 class="text-3xl font-extrabold sm:text-[2.5rem] sm:leading-tight">{{ predmet.naziv }}</h1>
        <p class="text-base sm:text-lg">{{ razred }}. razred · složi svoj kviz u 3 koraka</p>
      </div>
    </header>

    <form class="flex flex-col gap-6" @submit.prevent="kreni">
      <div class="kartica flex flex-col gap-8 sm:gap-9 sm:p-8">
        <OdabirLekcija
          v-model="odabraneLekcije"
          :korak="1"
          :cjeline="predmet.cjeline"
          :pitanja-po-lekciji="pitanjaPoLekciji"
          :tezina="tezina"
        />
        <OdabirTezine v-model="tezina" :korak="2" />
        <OdabirBrojaZadataka v-model="brojZadataka" :korak="3" :dostupno="dostupno" />
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p v-if="!odabraneLekcije.length" class="text-center font-semibold text-slate-700 sm:text-left" role="status">
          Odaberi barem jednu lekciju.
        </p>
        <p v-else-if="dostupno < BROJEVI_ZADATAKA[0]!" class="text-center font-semibold text-slate-700 sm:text-left" role="status">
          Za ovaj odabir još nema dovoljno pitanja. Probaj drugu težinu ili dodaj lekciju.
        </p>
        <p v-else class="text-center font-bold text-slate-700 sm:text-left">
          <span aria-hidden="true">📝</span> {{ brojZadataka }} pitanja ·
          <span aria-hidden="true">{{ odabranaTezina.ikona }}</span> {{ odabranaTezina.naziv }} ·
          {{ odabraneLekcije.length }} {{ oblikUzBroj(odabraneLekcije.length, ['lekcija', 'lekcije', 'lekcija']) }}
        </p>
        <button type="submit" class="gumb-glavni w-full text-xl sm:w-auto" :disabled="!mozeKrenuti">
          Kreni s kvizom <span aria-hidden="true">🚀</span>
        </button>
      </div>
    </form>
  </div>
</template>
