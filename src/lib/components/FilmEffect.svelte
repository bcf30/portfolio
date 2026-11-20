<script module lang="ts">
  // Deterministic random generator so server and browser build the same frames
  const random = (() => {
    let seed = 12345;
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  })();

  const FRAMES_COUNT = 8; // 8 distinct presets
  const FRAME_INTERVAL_MS = 100; // 10 fps

  // A baseline of 45 specks provides "smart random" jitter
  const baselineSpecks = Array.from({ length: 45 }).map(() => {
    let x = random();
    let y = random();
    // Very slight (15%) pull towards the center (0.5), to match a "1.5/10" center-weight requested
    x = x + (0.5 - x) * 0.15;
    y = y + (0.5 - y) * 0.15;
    return { x: x * 100, y: y * 100, r: 0.3 + random() * 1.2, opacity: 0.15 + random() * 0.25 };
  });

  // Each frame slightly jitters the baseline specks
  const framesData = Array.from({ length: FRAMES_COUNT }).map(() => {
    // Dynamic speck count per frame (between 30 and 45)
    const specksCount = 30 + Math.floor(random() * 16);
    return {
      specks: baselineSpecks.slice(0, specksCount).map((base) => {
        const dx = (random() - 0.5) * 8; // -4% to +4% movement
        const dy = (random() - 0.5) * 8;
        const dro = (random() - 0.5) * 0.4; // slight radius change
        const dop = (random() - 0.5) * 0.15; // slight opacity flicker
        return {
          x: base.x + dx,
          y: base.y + dy,
          r: Math.max(0.1, base.r + dro),
          opacity: Math.max(0.05, Math.min(1, base.opacity + dop)),
        };
      }),
    };
  });
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { filmGrain, loadFilmGrainPreference } from "#lib/film-grain.svelte.ts";

  let frameIndex = $state(0);

  const onBlog = $derived(page.url.pathname.startsWith("/blog") || page.url.pathname.startsWith("/admin/blog"));
  const visible = $derived(filmGrain.enabled && !onBlog);
  const activeFrame = $derived(framesData[frameIndex]);

  onMount(loadFilmGrainPreference);

  // Step through the frames on a timer, independent of scrolling; stops while hidden
  $effect(() => {
    if (!visible) return;
    const interval = setInterval(() => (frameIndex = (frameIndex + 1) % FRAMES_COUNT), FRAME_INTERVAL_MS);
    return () => clearInterval(interval);
  });
</script>

{#if visible}
  <div class="pointer-events-none fixed inset-0 z-[9999] overflow-hidden mix-blend-screen">
    <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {#each activeFrame.specks as speck, index (index)}
        <rect
          x={`calc(${speck.x}% - ${speck.r}px)`}
          y={`calc(${speck.y}% - ${speck.r}px)`}
          width={speck.r * 2}
          height={speck.r * 2}
          fill="white"
          opacity={speck.opacity}
        />
      {/each}
    </svg>
  </div>
{/if}
