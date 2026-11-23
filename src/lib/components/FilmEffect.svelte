<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { filmGrain, loadFilmGrainPreference } from "#lib/film-grain.svelte.ts";
  import { EMPTY_FRAME, FRAME_INTERVAL_MS, planFilmFrame, type FilmFrame } from "#lib/film-specks.ts";

  // Starts empty so the server-rendered HTML matches; specks appear once the browser takes over
  let frame = $state<FilmFrame>(EMPTY_FRAME);

  // Shown on the public pages (home and blog); the admin editor stays plain
  const onAdmin = $derived(page.url.pathname.startsWith("/admin"));
  const visible = $derived(filmGrain.enabled && !onAdmin);

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
  <!--
    z-5 puts the grain above page backgrounds (which have no z-index) and below content.
    Anything that should cover the grain needs z-10 or higher: home's <main> is z-30, its
    buttons z-40/50, and blog pages wrap their content in a z-10 layer with no background.
  -->
  <div class="pointer-events-none fixed inset-0 z-[5] overflow-hidden mix-blend-screen" aria-hidden="true">
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
