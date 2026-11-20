<script lang="ts">
  import { projects } from "../../../Models/ProjectViewModel";

  let { hoveredProject }: { hoveredProject: string | null } = $props();

  const projectsWithImages = projects.filter((p) => p.img);
</script>

<!-- One fixed preview per project; hovering a project card fades its preview in -->
{#each projectsWithImages as p (p.name)}
  {@const active = hoveredProject === p.name}
  <div
    class="fixed pointer-events-none z-35 transition-[opacity,scale,filter] duration-[350ms] ease-out"
    style:top={p.imgPos.top}
    style:bottom={p.imgPos.bottom}
    style:left={p.imgPos.left}
    style:right={p.imgPos.right}
    style:width={p.imgSize?.width || "auto"}
    style:height={p.imgSize?.height || "auto"}
    style:max-width={p.imgSize?.maxWidth || "none"}
    style:max-height={p.imgSize?.maxHeight || "none"}
    style:opacity={active ? 0.6 : 0}
    style:scale={active ? 1 : 0.95}
    style:filter={active ? "blur(0px)" : "blur(6px)"}
  >
    <img
      src={p.img}
      alt={`Preview of ${p.name} project`}
      class="w-full h-full object-contain rounded-sm shadow-[0_0_40px_oklch(0.45_0.10_145/0.5)]"
      loading="lazy"
    />
  </div>
{/each}
