<script lang="ts">
  // Fixed decorative layers. `variant` picks the homepage film grain or the portal's coarser noise.
  let { variant }: { variant: "film-grain" | "noise" } = $props();

  const FILM_GRAIN = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.8' numOctaves='1' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
  const NOISE = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.3' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
</script>

{#if variant === "film-grain"}
  <div class="fixed inset-0 pointer-events-none z-[999] opacity-[0.025]" style:background-image={FILM_GRAIN}></div>
{:else}
  <div class="fixed inset-0 pointer-events-none z-50 opacity-[0.06]" style:background-image={NOISE}></div>
{/if}
