<script module lang="ts">
  export interface FrequencyState {
    progress: number;
    frequency: number;
    db: number;
  }
</script>

<script lang="ts">
  import { formatFrequency, freqToProgress, PADDING_ZONE, calculateFrequencyPath, calculateDotX } from "../../../Services/FrequencyResponse";

  let { mounted, freqState, onScrollTo }: { mounted: boolean; freqState: FrequencyState; onScrollTo: (progress: number) => void } = $props();

  const FREQUENCY_LABELS = [20, 100, 500, 1000, 3000, 10000, 20000];
  const dfPath = calculateFrequencyPath();
  const dotX = $derived(calculateDotX(freqState.db));

  // Click or drag anywhere on the bar to scroll to that position
  function handleMouseDown(e: MouseEvent & { currentTarget: HTMLDivElement }) {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const getPos = (y: number) => Math.max(0, Math.min(1, (y - rect.top) / rect.height));
    onScrollTo(getPos(e.clientY));
    const move = (ev: MouseEvent) => { ev.preventDefault(); onScrollTo(getPos(ev.clientY)); };
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  const labelTop = (freq: number) => `${(PADDING_ZONE + freqToProgress(freq) * (1 - PADDING_ZONE)) * 100}%`;
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed right-0 top-0 h-screen w-12 lg:w-16 z-50 cursor-pointer select-none transition-opacity duration-300" style:opacity={mounted ? 1 : 0} onmousedown={handleMouseDown}>
  <div class="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-[oklch(0.16_0.01_145)] to-transparent z-10"></div>
  <svg viewBox="0 0 100 100" class="h-full w-full" preserveAspectRatio="none">
    <defs><linearGradient id="dfGrad" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="oklch(0.25 0.08 280)" /><stop offset="40%" stop-color="oklch(0.40 0.08 55)" /><stop offset="70%" stop-color="oklch(0.45 0.10 145)" /><stop offset="100%" stop-color="oklch(0.35 0.12 180)" /></linearGradient></defs>
    <path d={dfPath} fill="none" stroke="url(#dfGrad)" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linecap="round" />
  </svg>
  {#each FREQUENCY_LABELS as freq (freq)}
    <div class="absolute left-1 text-[7px] font-mono text-[oklch(0.35_0.06_145)] whitespace-nowrap pointer-events-none" style:top={labelTop(freq)} style:transform="translateY(-50%)">{freq >= 1000 ? `${freq / 1000}k` : freq}</div>
  {/each}
  <div class="absolute left-1 text-[7px] font-mono text-[oklch(0.35_0.06_145)] whitespace-nowrap pointer-events-none" style="top: 0%; transform: translateY(0)">0</div>
  <div class="absolute text-[9px] font-mono text-[oklch(0.50_0.08_145)] whitespace-nowrap pointer-events-none text-right" style:right={`calc(100% - ${dotX}% + 10px)`} style:top={`${freqState.progress * 100}%`} style:transform="translateY(-50%)">{formatFrequency(freqState.frequency)}</div>
  <div class="absolute w-2.5 h-2.5 rounded-full bg-[oklch(0.70_0.10_145)] pointer-events-none" style:left={`calc(${dotX}% - 5px)`} style:top={`${freqState.progress * 100}%`} style:transform="translateY(-50%)" style:box-shadow="0 0 8px oklch(0.55 0.10 145 / 0.8)"></div>
</div>
