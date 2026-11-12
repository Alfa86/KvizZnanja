<script setup lang="ts">
import type { DatotekaLekcije, Tezina } from '~/types'

// Pregled sadržaja za administratora; postoji samo u razvojnom načinu (npm run dev)
if (!import.meta.dev) throw createError({ statusCode: 404, fatal: true })

const route = useRoute()
const { dohvatiPredmet } = useKurikulum()

const razred = Number(route.params.razred)
const predmet = dohvatiPredmet(razred, String(route.params.predmet))
const lekcija = predmet?.lekcije.find(l => l.id === route.params.lekcija)
if (!predmet || !lekcija) throw createError({ statusCode: 404, statusMessage: 'Lekcija nije pronađena', fatal: true })

const putanja = `/pitanja/${razred}/${predmet.id}/${lekcija.id}.json`
const datoteka = ref<DatotekaLekcije | null>(null)
const greskaUcitavanja = ref('')
const filtar = ref<Tezina | 'sve'>('sve')
const samoGreske = ref(false)
const prikaz = ref<'sva' | 'nepregledana' | 'ai' | 'oznacena'>('sva')
const { oznake, postavi, nalazi, izvozNapomena } = useRecenzija()
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

useHead({ title: `Pregled: ${lekcija.naziv}` })

// Bez predmemorije, kako bi se izmjene u datoteci vidjele odmah nakon „Osvježi“
async function ucitaj() {
  greskaUcitavanja.value = ''
  try {
    datoteka.value = await $fetch<DatotekaLekcije>(putanja, { query: { t: Date.now() } })
  }
  catch {
    datoteka.value = null
    greskaUcitavanja.value = `Datoteka ${putanja} ne postoji ili nije ispravan JSON.`
  }
}
onMounted(ucitaj)

const pitanja = computed(() => (datoteka.value?.pitanja ?? []).map(p => ({ ...p, greske: provjeriPitanje(p) })))
const greskeDatoteke = computed(() => {
  if (!datoteka.value) return []
  const greske: string[] = []
  if (datoteka.value.lekcijaId !== lekcija!.id) greske.push(`lekcijaId je "${datoteka.value.lekcijaId}", a treba biti "${lekcija!.id}"`)
  const idevi = pitanja.value.map(p => p.id)
  const duplikati = [...new Set(idevi.filter((id, i) => idevi.indexOf(id) !== i))]
  if (duplikati.length) greske.push(`Ponovljeni id: ${duplikati.join(', ')}`)
  return greske
})
const brojPoTezini = computed(() => prebrojiPoTezini(datoteka.value))
const prikazana = computed(() => pitanja.value.filter(p =>
  (filtar.value === 'sve' || p.tezina === filtar.value) && (!samoGreske.value || p.greske.length)
  && (prikaz.value === 'sva'
    || (prikaz.value === 'nepregledana' && !oznake.value[p.id])
    || (prikaz.value === 'ai' && nalazi(p.id).length)
    || (prikaz.value === 'oznacena' && oznake.value[p.id]?.stanje === 'oznaceno'))
))
const brojSGreskama = computed(() => pitanja.value.filter(p => p.greske.length).length)
const brojPregledanih = computed(() => pitanja.value.filter(p => oznake.value[p.id]).length)
const brojSNalazima = computed(() => pitanja.value.filter(p => nalazi(p.id).length).length)
</script>

<template>
  <div>
    <NuxtLink to="/pregled" class="mb-4 inline-flex min-h-12 items-center font-semibold text-indigo-800">
      ← Sve lekcije
    </NuxtLink>
    <h1 class="text-3xl font-extrabold">{{ lekcija.naziv }}</h1>
    <p class="mb-4 text-slate-700">{{ razred }}. razred · {{ predmet.naziv }} · <code class="text-sm">public{{ putanja }}</code></p>

    <p v-if="greskaUcitavanja" class="kartica text-red-700">{{ greskaUcitavanja }}</p>

    <template v-else-if="datoteka">
      <div class="kartica mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <span v-for="t in TEZINE" :key="t.id">{{ t.naziv }}: <strong>{{ brojPoTezini[t.id] }}</strong></span>
        <span :class="brojSGreskama ? 'font-bold text-red-700' : 'text-green-800'">
          {{ brojSGreskama ? `Pitanja s greškama: ${brojSGreskama}` : 'Bez grešaka' }}
        </span>
        <span>Pregledano: <strong>{{ brojPregledanih }} / {{ pitanja.length }}</strong></span>
        <span v-if="brojSNalazima" class="text-amber-900">AI nalazi: <strong>{{ brojSNalazima }}</strong></span>
        <button type="button" class="gumb-sporedni ml-auto" @click="ucitaj">Osvježi</button>
      </div>

      <ul v-if="greskeDatoteke.length" class="kartica mb-4 list-disc pl-10 text-red-700">
        <li v-for="g in greskeDatoteke" :key="g">{{ g }}</li>
      </ul>

      <div class="mb-4 flex flex-wrap items-center gap-2">
        <select v-model="filtar" class="min-h-12 rounded-xl border-2 border-slate-200 bg-white px-3" aria-label="Težina">
          <option value="sve">Sve težine</option>
          <option v-for="t in TEZINE" :key="t.id" :value="t.id">{{ t.naziv }}</option>
        </select>
        <label class="flex min-h-12 items-center gap-2 px-2">
          <input v-model="samoGreske" type="checkbox" class="size-5 accent-indigo-700"> Samo pitanja s greškama
        </label>
        <select v-model="prikaz" class="min-h-12 rounded-xl border-2 border-slate-200 bg-white px-3" aria-label="Pregled">
          <option value="sva">Sva pitanja</option>
          <option value="nepregledana">Nepregledana</option>
          <option value="ai">S nalazom AI recenzije</option>
          <option value="oznacena">Označena za ispravak</option>
        </select>
        <button type="button" class="gumb-tekstualni ml-auto" @click="kopirajNapomene">
          {{ kopirano ? 'Kopirano ✓' : 'Kopiraj moje napomene' }}
        </button>
      </div>

      <ol class="flex flex-col gap-4">
        <li
          v-for="p in prikazana"
          :key="p.id"
          class="kartica"
          :class="p.greske.length ? 'ring-2 ring-red-500' : ''"
        >
          <p class="mb-1 text-sm text-slate-600"><code>{{ p.id }}</code> · {{ p.tezina }}<template v-if="p.skriveno"> · skriveno</template></p>
          <p class="text-lg font-bold">{{ p.pitanje }}</p>
          <SlikaPitanja v-if="p.slika" :slika="p.slika" />
          <PrikazPodataka v-if="p.podaci" :podaci="p.podaci" />
          <KartaZadatak v-if="p.karta" :zadatak="p.karta" :raspored="null" nacin="rjesenje" class="mt-3" />
          <ol v-if="p.ponudeni" class="my-3 flex flex-col gap-1">
            <li
              v-for="(o, i) in p.ponudeni"
              :key="i"
              class="rounded-xl px-3 py-1"
              :class="i === p.tocan ? 'bg-green-100 font-semibold text-green-900' : 'bg-slate-50'"
            >
              {{ ['A', 'B', 'C', 'D'][i] }}) {{ o }}<template v-if="i === p.tocan"> ✓</template>
            </li>
          </ol>
          <p class="text-base"><strong>Objašnjenje:</strong> {{ p.objasnjenje }}</p>
          <p v-if="p.savjet" class="text-base text-amber-900"><strong>Savjet:</strong> {{ p.savjet }}</p>
          <p v-if="p.slika" class="text-sm text-slate-600"><strong>Opis slike:</strong> {{ p.slika.opis }}</p>
          <ul v-if="p.greske.length" class="mt-3 list-disc rounded-xl bg-red-50 py-2 pl-8 text-base text-red-800">
            <li v-for="g in p.greske" :key="g">{{ g }}</li>
          </ul>

          <ul v-if="nalazi(p.id).length" class="mt-3 flex flex-col gap-2">
            <li
              v-for="(n, i) in nalazi(p.id)"
              :key="i"
              class="rounded-xl px-3 py-2 text-base"
              :class="n.razina === 'greska' ? 'bg-red-50 text-red-900' : 'bg-amber-50 text-amber-900'"
            >
              <strong>AI {{ n.razina === 'greska' ? 'greška' : 'sumnja' }} ({{ n.kategorija }}):</strong> {{ n.opis }}
              <span class="block text-sm">Prijedlog: {{ n.prijedlog }}</span>
            </li>
          </ul>

          <div class="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
            <button
              type="button"
              class="min-h-11 rounded-xl border-2 px-3 font-semibold"
              :class="oznake[p.id]?.stanje === 'u-redu' ? 'border-green-700 bg-green-100 text-green-900' : 'border-slate-200 text-slate-700'"
              @click="postavi(p.id, oznake[p.id]?.stanje === 'u-redu' ? null : { stanje: 'u-redu' })"
            >
              ✓ U redu
            </button>
            <button
              type="button"
              class="min-h-11 rounded-xl border-2 px-3 font-semibold"
              :class="oznake[p.id]?.stanje === 'oznaceno' ? 'border-red-700 bg-red-100 text-red-900' : 'border-slate-200 text-slate-700'"
              @click="postavi(p.id, oznake[p.id]?.stanje === 'oznaceno' ? null : { stanje: 'oznaceno', napomena: '' })"
            >
              ⚑ Označi za ispravak
            </button>
            <input
              v-if="oznake[p.id]?.stanje === 'oznaceno'"
              :value="oznake[p.id]?.napomena"
              type="text"
              class="min-h-11 min-w-60 flex-1 rounded-xl border-2 border-slate-200 px-3"
              placeholder="Što treba ispraviti?"
              aria-label="Napomena za ispravak"
              @change="postavi(p.id, { stanje: 'oznaceno', napomena: ($event.target as HTMLInputElement).value })"
            >
          </div>
        </li>
      </ol>
    </template>

    <p v-else class="kartica" role="status">Učitavam…</p>
  </div>
</template>
