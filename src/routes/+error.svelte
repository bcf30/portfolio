<script lang="ts">
  import { page } from "$app/state";
</script>

<div class="min-h-screen flex flex-col items-center justify-center gap-4 bg-[oklch(0.16_0.01_145)] px-6 text-center">
  <h1 class="font-[family-name:var(--font-cormorant)] text-4xl text-[oklch(0.80_0.02_145)]">{page.status}</h1>
  <p class="text-sm text-[oklch(0.55_0.04_145)]">{page.error?.message}</p>
  <a href="/" style="border-color: oklch(0.50 0.04 145); color: oklch(0.75 0.03 145)" class="px-3 py-1.5 border text-xs font-mono hover:opacity-80 transition-all">
    &larr; home
  </a>
</div>
