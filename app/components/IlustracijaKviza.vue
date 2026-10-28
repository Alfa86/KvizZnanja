<template>
  <!-- Ukrasna ilustracija s početne stranice: primjer pitanja s točnim odgovorom -->
  <div class="relative mx-auto h-[330px] w-[350px] max-w-full select-none sm:h-[460px] sm:w-[480px]" aria-hidden="true">
    <div class="absolute top-[15px] left-[25px] size-[300px] rounded-full bg-indigo-100 sm:top-[30px] sm:left-[40px] sm:size-[400px]" />
    <div class="absolute top-0 left-[330px] hidden size-[140px] rounded-full bg-amber-100 sm:block" />
    <div class="absolute top-[330px] left-0 hidden size-[120px] rounded-full bg-green-100 sm:block" />

    <div class="absolute top-[45px] left-[15px] flex w-[320px] flex-col gap-3 rounded-3xl bg-white p-6 shadow-[0_8px_24px_rgb(49_46_129/0.12)] sm:top-[95px] sm:left-[60px] sm:w-[360px]">
      <div class="flex items-center justify-between">
        <span class="rounded-full bg-blue-700 px-2.5 py-1 text-sm font-extrabold text-white">🔢 Matematika</span>
        <span class="text-sm font-bold text-slate-500">Pitanje 3 od 10</span>
      </div>
      <p class="text-2xl font-bold">Koliko je 7 × 8?</p>
      <div class="flex items-center gap-3 rounded-2xl border-2 border-slate-200 px-4 py-2.5 text-xl font-semibold">
        <span class="flex size-9 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-700">A</span>
        54
      </div>
      <div class="flex items-center gap-3 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2.5 text-xl font-semibold text-green-800">
        <span class="flex size-9 items-center justify-center rounded-full bg-green-700 text-lg font-bold text-white">B</span>
        <span class="flex-1">56</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
      </div>
    </div>

    <span class="naljepnica flex top-0 left-[285px] size-16 rotate-8 text-[32px] sm:top-[40px] sm:left-[370px] sm:size-[84px] sm:text-[42px]">🏆</span>
    <span class="naljepnica flex top-[10px] left-0 size-13 -rotate-10 text-[26px] sm:top-[60px] sm:left-[10px] sm:size-18 sm:text-[36px]">🧠</span>
    <span class="naljepnica top-[330px] left-[400px] hidden size-16 rotate-12 text-[32px] sm:flex">⭐</span>
    <span class="naljepnica top-[360px] left-[30px] hidden size-15 -rotate-8 text-[30px] sm:flex">✏️</span>

    <span class="absolute top-[285px] left-[160px] -rotate-3 rounded-full bg-green-700 px-4 py-2.5 font-extrabold text-white shadow-[0_8px_24px_rgb(49_46_129/0.12)] sm:top-[370px] sm:left-[230px] sm:px-[18px] sm:py-3">
      9 / 10 točno! 🎉
    </span>
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.naljepnica {
  @apply absolute items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgb(49_46_129/0.12)];
}
</style>
