<script setup lang="ts">
definePageMeta({ punaSirina: true })

const { razredi } = useKurikulum()
const indeks = await useIndeksPitanja()
const imaPodrsku = Boolean(useRuntimeConfig().public.keksPayUrl)

// Razred je dostupan tek kad neki njegov predmet ima pitanja
const razrediSPitanjima = razredi
  .map(r => ({ ...r, predmeti: r.predmeti.filter(p => predmetImaPitanja(indeks.value, r.broj, p)) }))
  .filter(r => r.predmeti.length)
const dostupan = (broj: number) => razrediSPitanjima.some(r => r.broj === broj)
const pitanja = cestaPitanja(razrediSPitanjima, imaPodrsku)
const apsolutni = useApsolutniUrl()

useSeo({
  naslov: 'Kviz znanja – besplatni školski kvizovi za 1. do 8. razred',
  opis: OPIS_STRANICE,
  strukturirano: [
    {
      '@type': 'WebSite',
      'name': NAZIV_STRANICE,
      'url': apsolutni('/'),
      'description': OPIS_STRANICE,
      'inLanguage': 'hr',
      'isAccessibleForFree': true,
      'audience': { '@type': 'EducationalAudience', 'educationalRole': 'student' }
    },
    {
      '@type': 'FAQPage',
      'mainEntity': pitanja.map(p => ({
        '@type': 'Question',
        'name': p.pitanje,
        'acceptedAnswer': { '@type': 'Answer', 'text': p.odgovor }
      }))
    }
  ]
})

const kratkePrednosti = [
  { ikona: '✅', tekst: 'Besplatno' },
  { ikona: '🙌', tekst: 'Bez prijave' },
  { ikona: '📚', tekst: 'Po školskom gradivu' }
]

const koraci = [
  { ikona: '🎒', naslov: 'Odaberi razred', opis: 'Klikni na svoj razred – od 1. do 8.', broj: 'bg-indigo-700', pozadina: 'bg-indigo-50' },
  { ikona: '📚', naslov: 'Odaberi predmet i lekcije', opis: 'Matematika, Priroda… Uzmi jednu lekciju ili više njih odjednom.', broj: 'bg-teal-700', pozadina: 'bg-teal-100' },
  { ikona: '🎯', naslov: 'Odaberi težinu', opis: 'Lagano, srednje ili teško – i 10, 20 ili 30 pitanja. Ti odlučuješ!', broj: 'bg-yellow-700', pozadina: 'bg-amber-100' },
  { ikona: '🏆', naslov: 'Riješi i pogledaj rezultat', opis: 'Na kraju vidiš što znaš i dobiješ objašnjenje za svaku grešku.', broj: 'bg-green-700', pozadina: 'bg-green-100' }
]

const prednosti = [
  { ikona: '💪', naslov: 'Bolje ocjene, manje treme', opis: 'Kad gradivo provježbaš unaprijed, test te neće iznenaditi.', pozadina: 'bg-indigo-50' },
  { ikona: '💡', naslov: 'Pomoć kad zapne', opis: 'Klikni „Treba mi pomoć” i dobit ćeš savjet. Savjet ti nikad ne oduzima bodove!', pozadina: 'bg-amber-100' },
  { ikona: '🔍', naslov: 'Učiš iz grešaka', opis: 'Za svako pitanje vidiš točan odgovor i objašnjenje zašto je baš takav.', pozadina: 'bg-pink-100' },
  { ikona: '🎯', naslov: 'Znaš što ponoviti', opis: 'Rezultat ti pokaže što već dobro znaš, a što trebaš još malo ponoviti.', pozadina: 'bg-teal-100' },
  { ikona: '🔁', naslov: 'Vježbaj koliko želiš', opis: 'Igraj iznova i iznova. Vježba čini majstora!', pozadina: 'bg-green-100' },
  { ikona: '📱', naslov: 'Uvijek pri ruci', opis: 'Na mobitelu, tabletu ili računalu – u autobusu, kod bake ili za stolom.', pozadina: 'bg-sky-100' }
]
</script>

<template>
  <div>
    <!-- Uvod -->
    <section class="omotac grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[1fr_480px] lg:gap-12 lg:py-18">
      <div class="flex flex-col items-start gap-5 sm:gap-6">
        <p class="flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-extrabold text-amber-900 sm:text-base">
          <span aria-hidden="true">⭐</span> Za učenike od 1. do 8. razreda
        </p>
        <h1 class="text-[2.5rem] leading-[1.1] font-extrabold tracking-tight sm:text-6xl">
          Pokaži što znaš!<br>
          Vježbaj <span class="text-indigo-700">kroz igru.</span>
        </h1>
        <p class="max-w-[33rem] text-slate-700 sm:text-xl">
          Kratki kvizovi iz gradiva koje upravo učiš u školi. Odgovaraj na pitanja, otkrij što već znaš, a što još trebaš
          ponoviti – i gledaj kako svakim kvizom znaš sve više!
        </p>
        <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <NuxtLink to="#razredi" class="gumb-glavni">
            Kreni s kvizom
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </NuxtLink>
          <NuxtLink to="#kako-radi" class="gumb-sporedni">Kako to radi?</NuxtLink>
        </div>
        <ul class="flex flex-wrap gap-x-5 gap-y-1 text-base font-bold text-slate-700">
          <li v-for="p in kratkePrednosti" :key="p.tekst" class="flex items-center gap-1.5">
            <span aria-hidden="true">{{ p.ikona }}</span> {{ p.tekst }}
          </li>
        </ul>
      </div>

      <IlustracijaKviza />
    </section>

    <!-- Odabir razreda -->
    <section id="razredi" class="bg-white py-12 sm:py-22" aria-labelledby="naslov-razredi">
      <div class="omotac flex flex-col items-center gap-8 sm:gap-10">
        <header class="flex max-w-2xl flex-col items-center gap-2 text-center">
          <p class="nadnaslov text-teal-700">Kreni odavde</p>
          <h2 id="naslov-razredi" class="naslov-sekcije">Bok! Koji si razred? <span aria-hidden="true">👋</span></h2>
          <p class="text-slate-600 sm:text-xl">Odaberi svoj razred i kreni. Novi razredi i predmeti stižu uskoro!</p>
        </header>
        <div class="grid w-full grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          <KarticaRazreda
            v-for="razred in razredi"
            :key="razred.broj"
            :broj="razred.broj"
            :dostupan="dostupan(razred.broj)"
          />
        </div>
      </div>
    </section>

    <!-- Kako radi -->
    <section id="kako-radi" class="py-12 sm:py-22" aria-labelledby="naslov-kako">
      <div class="omotac flex flex-col items-center gap-8 sm:gap-12">
        <header class="flex max-w-2xl flex-col items-center gap-2 text-center">
          <p class="nadnaslov text-indigo-700">Četiri koraka do kviza</p>
          <h2 id="naslov-kako" class="naslov-sekcije">Kako to radi? <span aria-hidden="true">🤔</span></h2>
          <p class="text-slate-600 sm:text-xl">Nema prijave, nema čekanja. Za manje od minute već rješavaš prvo pitanje!</p>
        </header>
        <ol class="grid w-full gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          <li
            v-for="(k, i) in koraci"
            :key="k.naslov"
            class="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-3xl p-5 lg:grid-cols-[auto_1fr] lg:items-start lg:px-6 lg:py-7"
            :class="k.pozadina"
          >
            <span class="flex size-10 items-center justify-center rounded-full text-xl font-extrabold text-white lg:size-11" :class="k.broj">
              {{ i + 1 }}
            </span>
            <span class="order-last justify-self-end text-3xl lg:order-none lg:text-[44px] lg:leading-none" aria-hidden="true">{{ k.ikona }}</span>
            <div class="flex flex-col gap-1 lg:col-span-2 lg:gap-3">
              <h3 class="leading-snug font-extrabold lg:text-2xl lg:font-bold">{{ k.naslov }}</h3>
              <p class="text-base text-slate-700 lg:text-lg">{{ k.opis }}</p>
            </div>
          </li>
        </ol>
        <NuxtLink to="#razredi" class="gumb-glavni w-full sm:w-auto">
          Odaberi svoj razred
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </NuxtLink>
      </div>
    </section>

    <!-- Što dobivaš -->
    <section id="zasto" class="bg-white py-12 sm:py-22" aria-labelledby="naslov-zasto">
      <div class="omotac flex flex-col items-center gap-8 sm:gap-12">
        <header class="flex max-w-2xl flex-col items-center gap-2 text-center">
          <p class="nadnaslov text-pink-700">Zašto vježbati?</p>
          <h2 id="naslov-zasto" class="naslov-sekcije">Što dobivaš? <span aria-hidden="true">🎁</span></h2>
          <p class="text-slate-600 sm:text-xl">
            Svaki kviz je mali trening za tvoj mozak. A mozak je kao mišić – što ga više vježbaš, to je jači!
          </p>
        </header>
        <ul class="grid w-full gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          <li v-for="p in prednosti" :key="p.naslov" class="flex gap-4 rounded-3xl bg-white p-4 ring-1 ring-slate-200 sm:p-6">
            <span class="flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl sm:size-14 sm:text-3xl" :class="p.pozadina" aria-hidden="true">
              {{ p.ikona }}
            </span>
            <div class="flex flex-col gap-1">
              <h3 class="leading-snug font-extrabold sm:text-xl">{{ p.naslov }}</h3>
              <p class="text-base text-slate-600">{{ p.opis }}</p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- Česta pitanja: isti tekst ide u FAQPage strukturirane podatke i llms.txt -->
    <section id="pitanja" class="py-12 sm:py-22" aria-labelledby="naslov-pitanja">
      <div class="omotac flex flex-col items-center gap-8 sm:gap-12">
        <header class="flex max-w-2xl flex-col items-center gap-2 text-center">
          <p class="nadnaslov text-teal-700">Imaš pitanje?</p>
          <h2 id="naslov-pitanja" class="naslov-sekcije">Česta pitanja <span aria-hidden="true">💬</span></h2>
        </header>
        <div class="flex w-full max-w-3xl flex-col gap-3">
          <details
            v-for="p in pitanja"
            :key="p.pitanje"
            class="group rounded-3xl bg-white ring-1 ring-slate-200 open:ring-indigo-300"
          >
            <summary class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-3xl px-5 py-4 font-extrabold sm:px-6 sm:text-xl [&::-webkit-details-marker]:hidden">
              {{ p.pitanje }}
              <svg class="shrink-0 text-indigo-700 transition-transform group-open:rotate-180" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <p class="px-5 pb-5 text-slate-700 sm:px-6">{{ p.odgovor }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- Za roditelje -->
    <section class="bg-indigo-900 py-10 text-white sm:py-14" aria-labelledby="naslov-roditelji">
      <div class="omotac flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-10">
        <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-10">
          <span class="text-5xl sm:text-6xl" aria-hidden="true">🏫</span>
          <div class="flex flex-col gap-2">
            <h2 id="naslov-roditelji" class="text-2xl font-extrabold sm:text-3xl">Za roditelje i učitelje</h2>
            <p class="max-w-[55rem] text-base text-indigo-100 sm:text-lg">
              Pitanja prate hrvatski kurikulum i gradivo koje se uči u školi. Pripremljena su uz pomoć AI alata, a svako
              pitanje prije objave pregleda čovjek. Stranica je besplatna, ne traži prijavu i ne prikuplja osobne podatke djece.
            </p>
          </div>
        </div>
        <PodrskaKartica v-if="imaPodrsku" />
      </div>
    </section>
  </div>
</template>
