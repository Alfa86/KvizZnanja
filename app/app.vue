<script setup lang="ts">
const route = useRoute()
const izbornikOtvoren = ref(false)

const poveznice = [
  { naziv: 'Kako radi?', to: '/#kako-radi' },
  { naziv: 'Zašto vježbati?', to: '/#zasto' },
  { naziv: 'Razredi', to: '/#razredi' }
]

// Početna stranica ima sekcije preko cijele širine; ostale stranice koriste uski stupac
const punaSirina = computed(() => route.meta.punaSirina === true)
const imaPodrsku = Boolean(useRuntimeConfig().public.keksPayUrl)

watch(() => route.fullPath, () => { izbornikOtvoren.value = false })
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <header class="relative z-10 bg-white shadow-sm">
      <div class="omotac flex items-center justify-between py-2 sm:py-3">
        <NuxtLink to="/" class="flex min-h-12 items-center gap-2 text-xl font-extrabold text-indigo-800 sm:text-2xl">
          <span aria-hidden="true">🎓</span> Kviz znanja
        </NuxtLink>

        <nav aria-label="Glavna navigacija" class="hidden sm:block">
          <ul class="flex gap-2">
            <li v-for="p in poveznice" :key="p.to">
              <NuxtLink :to="p.to" class="flex min-h-12 items-center rounded-xl px-3 font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-800">
                {{ p.naziv }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <button
          type="button"
          class="flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-800 sm:hidden"
          :aria-expanded="izbornikOtvoren"
          aria-controls="mobilni-izbornik"
          @click="izbornikOtvoren = !izbornikOtvoren"
        >
          <span class="sr-only">{{ izbornikOtvoren ? 'Zatvori izbornik' : 'Otvori izbornik' }}</span>
          <svg v-if="!izbornikOtvoren" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          <svg v-else aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>

      <nav v-show="izbornikOtvoren" id="mobilni-izbornik" aria-label="Glavna navigacija" class="border-t border-slate-200 sm:hidden">
        <ul class="omotac flex flex-col py-2">
          <li v-for="p in poveznice" :key="p.to">
            <NuxtLink :to="p.to" class="flex min-h-12 items-center rounded-xl px-3 font-bold text-slate-700 hover:bg-indigo-50" @click="izbornikOtvoren = false">
              {{ p.naziv }}
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </header>

    <main class="w-full flex-1" :class="punaSirina ? '' : 'mx-auto max-w-3xl px-4 py-6 sm:py-8'">
      <NuxtPage />
    </main>

    <footer class="bg-white">
      <div class="omotac flex flex-col items-center gap-1 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div class="flex flex-col items-center gap-1 sm:items-start">
          <p class="font-extrabold text-indigo-800">
            <span aria-hidden="true">🎓</span> Kviz znanja
          </p>
          <NuxtLink v-if="imaPodrsku" to="/#podrska" class="inline-flex min-h-12 items-center rounded-xl px-2 text-base font-bold text-indigo-800 underline underline-offset-4 hover:bg-indigo-50 sm:-ml-2">
            <span aria-hidden="true">💛</span>&nbsp;Podrži stranicu
          </NuxtLink>
        </div>
        <div class="text-sm text-slate-600">
          <p>Napravljeno s <span aria-label="ljubavlju" role="img">❤️</span> za znatiželjne učenike · 2026.</p>
          <p>Pitanja su pripremljena uz pomoć AI alata i pregledana prije objave.</p>
        </div>
      </div>
    </footer>
  </div>
</template>
