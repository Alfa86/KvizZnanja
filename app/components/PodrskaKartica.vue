<script setup lang="ts">
import { renderSVG } from 'uqr'

const url = useRuntimeConfig().public.keksPayUrl

// QR kod se crta iz iste poveznice, pa uvijek vodi na isto mjesto kao i gumb
const qr = renderSVG(url, { border: 1, blackColor: '#0F172A', whiteColor: '#FFFFFF' })
</script>

<template>
  <div id="podrska" class="flex w-full flex-col gap-3.5 rounded-3xl bg-white p-6 text-slate-900 sm:max-w-[27.5rem] sm:shrink-0">
    <h3 class="text-2xl font-bold"><span aria-hidden="true">💛</span> Podržite Kviz znanja</h3>
    <p class="text-slate-700">Kviz znanja je besplatan i bez reklama. Ako vam pomaže, možete podržati njegov razvoj.</p>
    <div class="flex items-center gap-4">
      <!-- QR kod je za skeniranje s računala; na mobitelu gumb sam otvara aplikaciju -->
      <div class="hidden size-30 shrink-0 rounded-xl p-1 ring-1 ring-slate-200 sm:block [&>svg]:size-full" role="img" aria-label="QR kod za donaciju putem aplikacije KEKS Pay" v-html="qr" />
      <div class="flex w-full flex-col gap-2 sm:w-auto">
        <a :href="url" target="_blank" rel="noopener" class="gumb-glavni">Podrži putem KEKS Pay</a>
        <p class="text-sm text-slate-600">
          <span class="sm:hidden">Otvara aplikaciju KEKS Pay na mobitelu.</span>
          <span class="hidden sm:inline">Ili skenirajte QR kod u aplikaciji KEKS Pay.</span>
        </p>
      </div>
    </div>
  </div>
</template>
