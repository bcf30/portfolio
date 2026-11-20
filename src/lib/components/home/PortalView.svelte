<script lang="ts">
  import { formatTime } from "../../../Services/FrequencyResponse";
  import Overlays from "./Overlays.svelte";

  let { timer, onExit }: { timer: number; onExit: () => void } = $props();

  // Send the visitor home when the countdown runs out
  $effect(() => {
    if (timer === 0) onExit();
  });
</script>

<div class="min-h-screen bg-[oklch(0.08_0.01_55)] flex flex-col relative overflow-hidden">
  <Overlays variant="noise" />
  <div
    class="fixed right-0 bottom-0 w-1/2 h-2/3 opacity-20"
    style="background-image: url(/images/turnpike.avif); background-size: cover; background-position: bottom right; mask-image: linear-gradient(to left, black 30%, transparent 100%)"
  ></div>
  <header class="absolute top-0 left-0 z-50 p-3">
    <button onclick={onExit} style="border-color: oklch(0.50 0.04 145); color: oklch(0.75 0.03 145)" class="px-3 py-1.5 border text-xs font-mono hover:opacity-80 transition-all cursor-pointer bg-[oklch(0.16_0.01_145)]">
      &larr; home
    </button>
  </header>
  <div class="flex-1 flex items-center justify-center p-8 relative z-10">
    <div class="max-w-xl text-center portal-enter">
      <div class="my-8">
        <p class="font-mono text-xs text-[oklch(0.40_0.04_145)] mb-2">time remaining</p>
        <div class="font-[family-name:var(--font-cormorant)] text-5xl text-[oklch(0.65_0.08_340)]">{formatTime(timer)}</div>
      </div>
      <p class="font-[family-name:var(--font-crimson)] text-base text-[oklch(0.55_0.04_145)] italic">
        Being Ramiro Chen<br />
        <span class="text-[oklch(0.45_0.06_145)]">... Maybe not as good as being John Malkovich would be.</span>
      </p>
    </div>
  </div>
</div>
