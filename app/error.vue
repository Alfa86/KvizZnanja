<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const naslov = computed(() =>
  props.error.statusCode === 404 ? 'Ova stranica ne postoji' : 'Nešto je pošlo po zlu'
)

useSeoMeta({ title: () => `${naslov.value} | Kviz znanja`, robots: 'noindex' })
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
    <p class="text-6xl" aria-hidden="true">🧭</p>
    <h1 class="text-3xl font-extrabold">{{ naslov }}</h1>
    <p class="text-slate-700">Vratimo se na početak i odaberimo kviz.</p>
    <button class="gumb-glavni" @click="clearError({ redirect: '/' })">Na početnu</button>
  </div>
</template>
