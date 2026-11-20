<script lang="ts">
  import { environmentImageIds } from "../../../Models/ProjectViewModel";
  import { revealOnView } from "../../actions/reveal-on-view";

  // Pentagon/star formation
  const offsets = [
    { x: "80px", y: "0" }, // top (uncle-boonmee)
    { x: "20px", y: "150px" }, // bottom left (7850650c - smaller)
    { x: "160px", y: "160px" }, // bottom right (synecdoche - more down, above esports)
    { x: "150px", y: "70px" }, // top right (esports)
    { x: "0px", y: "70px" }, // top left (Youth.Hard.Times - bigger)
  ];
  // Custom z-index to ensure synecdoche (index 2) is above esports (index 3)
  const zIndices = [0, 1, 4, 3, 2];
  const STAGGER_SECONDS = 0.15;
</script>

<section class="relative py-24 px-6">
  <div class="max-w-4xl mx-auto">
    <div class="flex flex-col md:flex-row items-start justify-center gap-24">
      <div class="relative w-64 md:w-72" style="min-height: 240px">
        {#each environmentImageIds as img, i (img.src)}
          <div
            class={`absolute overflow-hidden rounded-sm shadow-[0_0_15px_oklch(0.35_0.06_145/0.25)] reveal-image ${img.sizeClass}`}
            style:left={offsets[i].x}
            style:top={offsets[i].y}
            style:z-index={10 + zIndices[i]}
            style:transition-delay={`${i * STAGGER_SECONDS}s`}
            use:revealOnView
          >
            <img src={img.src} alt="" class="w-full h-full object-cover grayscale-[25%] hover:grayscale-0 transition-all duration-400" />
          </div>
        {/each}
      </div>
      <div class="relative overflow-hidden text-left reveal-on-view" use:revealOnView>
        <p class="font-[family-name:var(--font-crimson)] text-base text-[oklch(0.60_0.04_145)] italic mb-4">
          My interests!
        </p>
        <ul class="font-[family-name:var(--font-crimson)] text-base text-[oklch(0.60_0.04_145)] list-none pl-0">
          <li>- film (<a href="https://letterboxd.com/bigimdbfan30/" target="_blank" rel="noopener noreferrer" class="underline hover:opacity-80"><u>my letterboxd!</u></a>)</li>
          <li>- audio</li>
          <li>- ML</li>
          <li>- data compression</li>
          <li>- image processing</li>
          <li>- environment</li>
          <li>- the sciences</li>
          <li>- triathlon</li>
          <li>- (and more)</li>
        </ul>
      </div>
    </div>
  </div>
</section>
