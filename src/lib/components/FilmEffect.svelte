<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { filmGrain, loadFilmGrainPreference } from "#lib/film-grain.svelte.ts";
  import { EMPTY_FRAME, FRAME_INTERVAL_MS, planFilmFrame, type FilmFrame } from "#lib/film-specks.ts";

  // Starts empty so the server-rendered HTML matches; specks appear once the browser takes over
  let frame = $state<FilmFrame>(EMPTY_FRAME);

  const onBlog = $derived(page.url.pathname.startsWith("/blog") || page.url.pathname.startsWith("/admin/blog"));
  const visible = $derived(filmGrain.enabled && !onBlog);

  onMount(loadFilmGrainPreference);

  // A fresh random frame every 40ms, independent of scrolling; stops while hidden
  $effect(() => {
    if (!visible) return;
    const draw = () => (frame = planFilmFrame(Math.random));
    draw();
    const interval = setInterval(draw, FRAME_INTERVAL_MS);
    return () => clearInterval(interval);
  });
</script>

{#if visible}
  <div class="pointer-events-none fixed inset-0 z-[9999] overflow-hidden mix-blend-screen" aria-hidden="true">
    <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {#each frame.specks as speck, index (index)}
        <rect
          x={`calc(${speck.x}% - ${speck.size / 2}px)`}
          y={`calc(${speck.y}% - ${speck.size / 2}px)`}
          width={speck.size}
          height={speck.size}
          fill="white"
          opacity={speck.opacity}
        />
      {/each}
      {#if frame.staticLine}
        <rect
          data-static-line
          x={`${frame.staticLine.x}%`}
          y={`${frame.staticLine.y}%`}
          width={`${frame.staticLine.width}%`}
          height="1"
          fill="white"
          opacity={frame.staticLine.opacity}
        />
      {/if}
    </svg>
  </div>
{/if}
