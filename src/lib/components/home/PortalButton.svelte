<script lang="ts">
  let { onclick }: { onclick: () => void } = $props();
</script>

<button {onclick} aria-label="Open portal" class="fixed bottom-6 left-6 z-50 group transition-transform hover:scale-105 active:scale-95">
  <div class="w-7 h-10 border border-[oklch(0.35_0.04_55)] bg-[oklch(0.18_0.02_55)] rounded-t relative overflow-hidden group-hover:border-[oklch(0.50_0.08_340)] transition-colors shadow-[0_0_15px_oklch(0.25_0.04_55/0.4)]">
    <div class="absolute right-0.5 top-1/2 w-0.5 h-0.5 rounded-full bg-[oklch(0.45_0.04_55)]"></div>
  </div>
</button>
