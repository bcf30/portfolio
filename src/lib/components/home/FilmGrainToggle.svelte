<script lang="ts">
  import { filmGrain, setFilmGrainEnabled } from "#lib/film-grain.svelte.ts";

  const TRACK_ON = "border-[oklch(0.45_0.10_145)] bg-[oklch(0.25_0.05_145)]";
  const TRACK_OFF = "border-[oklch(0.35_0.04_55)] bg-[oklch(0.18_0.02_55)]";
  const KNOB_ON = "left-[14px] bg-[oklch(0.70_0.10_145)]";
  const KNOB_OFF = "left-[2px] bg-[oklch(0.45_0.04_55)]";
</script>

<!-- Sits just right of the portal door (PortalButton), bottom-aligned with it -->
<button
  type="button"
  role="switch"
  aria-checked={filmGrain.enabled}
  aria-label="Filter"
  title="Filter: film grain"
  onclick={() => setFilmGrainEnabled(!filmGrain.enabled)}
  class="fixed bottom-6 left-16 z-50 flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
>
  <span class={`relative block w-7 h-4 rounded-full border transition-colors ${filmGrain.enabled ? TRACK_ON : TRACK_OFF}`}>
    <span class={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-[left,background-color] ${filmGrain.enabled ? KNOB_ON : KNOB_OFF}`}></span>
  </span>
  <span class="text-[9px] font-mono text-[oklch(0.45_0.04_145)]">filter</span>
</button>
