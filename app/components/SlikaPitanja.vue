<script setup lang="ts">
import type { Slika } from '~/types'
import { jeDatoteka } from '~/utils/crtez'

defineProps<{ slika: Slika }>()
</script>

<template>
  <figure class="my-4 rounded-2xl bg-white p-2">
    <img v-if="jeDatoteka(slika)" :src="slika.datoteka" :alt="slika.opis" class="mx-auto block max-h-80">
    <GeometrijskiCrtez v-else :crtez="slika" />
  </figure>
</template>
