<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { filmGrain, loadFilmGrainPreference } from "#lib/film-grain.svelte.ts";
  import { startGrainAnimation } from "#lib/vhs-film-grain.ts";

  let canvas: HTMLCanvasElement | undefined = $state();

  const onBlog = $derived(page.url.pathname.startsWith("/blog") || page.url.pathname.startsWith("/admin/blog"));
  const visible = $derived(filmGrain.enabled && !onBlog);

  onMount(loadFilmGrainPreference);

  // Animates only while shown; turning the grain off or leaving for the blog stops the timer
  $effect(() => {
    if (!visible || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // no canvas support: the page just shows without grain
    return startGrainAnimation(canvas, ctx);
  });
</script>

{#if visible}
  <div class="pointer-events-none fixed inset-0 z-[9999] overflow-hidden" aria-hidden="true">
    <canvas bind:this={canvas} class="absolute inset-0 w-full h-full"></canvas>
    <!-- Static VHS scanlines: a faint dark line every 3px -->
    <div class="absolute inset-0" style="background: repeating-linear-gradient(to bottom, transparent 0 2px, rgb(0 0 0 / 0.12) 2px 3px)"></div>
  </div>
{/if}
