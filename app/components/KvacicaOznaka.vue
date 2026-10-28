<template>
  <!-- Izgled kvačice; stvarni input je skriveni peer prije ove oznake (uključeno, djelomično, onemogućeno) -->
  <span
    class="flex size-6 shrink-0 items-center justify-center rounded-md border-2 border-slate-400 bg-white text-white peer-checked:border-indigo-700 peer-checked:bg-indigo-700 peer-indeterminate:border-indigo-700 peer-indeterminate:bg-indigo-700 peer-disabled:border-slate-300 peer-disabled:bg-slate-100 peer-checked:[&>.kvacica]:block peer-indeterminate:[&>.crtica]:block"
    aria-hidden="true"
  >
    <svg class="kvacica hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
    <span class="crtica hidden h-[3px] w-3 rounded-sm bg-white" />
  </span>
</template>
