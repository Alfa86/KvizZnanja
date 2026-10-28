<script setup lang="ts">
// Pregled sadržaja za administratora; postoji samo u razvojnom načinu (npm run dev)
if (!import.meta.dev) throw createError({ statusCode: 404, fatal: true })

const { razredi } = useKurikulum()

useHead({ title: 'Pregled sadržaja' })
</script>

<template>
  <div>
    <h1 class="mb-2 text-3xl font-extrabold">Pregled sadržaja</h1>
    <p class="mb-6 text-slate-700">Odaberi lekciju za pregled svih pitanja, crteža i točnih odgovora.</p>

    <template v-for="razred in razredi" :key="razred.broj">
      <section v-for="predmet in razred.predmeti" :key="predmet.id" class="kartica mb-4">
        <h2 class="mb-2 text-xl font-bold">{{ razred.broj }}. razred · {{ predmet.naziv }}</h2>
        <ul class="flex flex-col gap-1">
          <li v-for="lekcija in predmet.lekcije" :key="lekcija.id">
            <NuxtLink
              :to="`/pregled/${razred.broj}/${predmet.id}/${lekcija.id}`"
              class="inline-flex min-h-10 items-center font-semibold text-indigo-800 underline underline-offset-4"
            >
              {{ lekcija.naziv }}
            </NuxtLink>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
