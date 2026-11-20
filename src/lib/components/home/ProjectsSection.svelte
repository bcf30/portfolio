<script lang="ts">
  import { projects } from "../../../Models/ProjectViewModel";
  import GithubIcon from "../icons/GithubIcon.svelte";

  let { onHoverProject }: { onHoverProject: (name: string | null) => void } = $props();

  // Hand-placed cascade of cards, one entry per project
  const rotations = [-3, 2, -1.5, 2, -3, 2, -2];
  const offsets = [
    { x: "calc(50% - 140px)", y: "0" },
    { x: "calc(50% - 80px)", y: "80px" },
    { x: "calc(50% - 120px)", y: "160px" },
    { x: "calc(50% - 60px)", y: "240px" },
    { x: "calc(50% - 100px)", y: "320px" },
    { x: "calc(50% - 65px)", y: "400px" },
    { x: "calc(50% - 105px)", y: "480px" },
  ];

  const CARD_CLIP = "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)";

  function headerAlignment(textAlign: string | undefined, hideGithubIcon: boolean | undefined): string {
    if (!hideGithubIcon) return "justify-between";
    return textAlign === "right" ? "justify-end" : "justify-start";
  }
</script>

<section id="projects" class="relative py-24 px-6">
  <div class="max-w-4xl mx-auto">
    <div class="relative flex justify-center" style="min-height: 640px">
      {#each projects as p, i (p.name)}
        <a
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          class="group absolute w-64 md:w-72 block"
          style:left={offsets[i].x}
          style:top={offsets[i].y}
          style:z-index={10 - i}
          style:transform={`rotate(${rotations[i]}deg)`}
          onmouseenter={() => onHoverProject(p.name)}
          onmouseleave={() => onHoverProject(null)}
        >
          <div class={`p-4 bg-[oklch(0.16_0.01_145/0.7)] backdrop-blur-[1px] shadow-[0_0_25px_oklch(0.30_0.06_145/0.25)] group-hover:shadow-[0_0_35px_oklch(0.40_0.08_145/0.35)] group-hover:scale-[1.05] transition-all duration-200 cursor-pointer border border-[oklch(0.30_0.04_145/0.3)] ${p.textAlign === "right" ? "text-right" : ""}`} style:clip-path={CARD_CLIP}>
            <div class={`flex items-baseline mb-1 ${headerAlignment(p.textAlign, p.hideGithubIcon)}`}>
              {#if p.textAlign === "right"}
                {#if !p.hideGithubIcon}<GithubIcon class="w-3.5 h-3.5 text-[oklch(0.40_0.04_145)] group-hover:text-[oklch(0.55_0.08_145)] transition-colors" />{/if}
                <h3 class="font-[family-name:var(--font-cormorant)] text-lg text-[oklch(0.80_0.02_145)] group-hover:text-[oklch(0.90_0.04_145)] transition-colors">{p.name}</h3>
              {:else}
                <h3 class="font-[family-name:var(--font-cormorant)] text-lg text-[oklch(0.80_0.02_145)] group-hover:text-[oklch(0.90_0.04_145)] transition-colors">{p.name}</h3>
                {#if !p.hideGithubIcon}<GithubIcon class="w-3.5 h-3.5 text-[oklch(0.40_0.04_145)] group-hover:text-[oklch(0.55_0.08_145)] transition-colors" />{/if}
              {/if}
            </div>
            <p class="text-xs text-[oklch(0.50_0.04_145)]">{p.desc}</p>
            <p class="text-[10px] text-[oklch(0.35_0.04_145)] mt-1 font-mono">{p.tech}</p>
          </div>
        </a>
      {/each}
    </div>
  </div>
</section>
