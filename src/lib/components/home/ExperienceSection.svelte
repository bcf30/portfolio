<script lang="ts">
  import BriefcaseIcon from "../icons/BriefcaseIcon.svelte";

  interface Experience {
    position: string;
    company: string;
    period: string;
    description: string;
    tech: string;
  }

  // Ordered newest first
  const experiences: Experience[] = [
    {
      position: "Geospatial AI Engineer, Co-op",
      company: "TerreSky",
      period: "September 2026 — December 2026",
      description: "Developing software enabling AI in reality capture for asset management.",
      tech: "Python, JS, GCP, VLMs",
    },
    {
      position: "Junior Software Developer, Co-op",
      company: "taq Automotive Intelligence",
      period: "January 2026 — April 2026",
      description: "Developing software solutions for automotive lenders and dealers.",
      tech: ".NET, C#, SQL, JS",
    },
  ];

  // Cards stack vertically, centered, with alternating tilt to echo the projects section
  const rotations = [2, -2];
  const CARD_CLIP = "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)";
</script>

<section id="experience" class="relative py-24 px-6">
  <div class="max-w-4xl mx-auto">
    <div class="relative flex flex-col items-center gap-10" style="min-height: 250px">
      {#each experiences as exp, i (`${exp.company}-${exp.period}`)}
        <div
          class="w-80 md:w-96 p-5 bg-[oklch(0.16_0.01_180/0.7)] backdrop-blur-[1px] shadow-[0_0_25px_oklch(0.30_0.06_180/0.25)] hover:shadow-[0_0_35px_oklch(0.40_0.08_180/0.35)] hover:scale-[1.05] transition-all duration-200 cursor-default border border-[oklch(0.30_0.04_180/0.3)]"
          style:clip-path={CARD_CLIP}
          style:transform={`rotate(${rotations[i % rotations.length]}deg)`}
        >
          <div class="flex items-baseline mb-1">
            <!-- Sized so the longest title (32 monospace chars) stays on one line at both card widths -->
            <h3 class="font-[family-name:var(--font-cormorant)] text-[13px] md:text-base text-[oklch(0.80_0.02_180)]">{exp.position}</h3>
            <BriefcaseIcon class="w-4 h-4 shrink-0 text-[oklch(0.40_0.04_180)] ml-auto" />
          </div>
          <p class="text-sm text-[oklch(0.50_0.04_180)] font-semibold">{exp.company}</p>
          <p class="text-xs text-[oklch(0.35_0.04_180)] mt-1 font-mono">{exp.period}</p>
          <p class="text-sm text-[oklch(0.50_0.04_180)] mt-4">{exp.description}</p>
          <p class="text-xs text-[oklch(0.35_0.04_180)] mt-2 font-mono">{exp.tech}</p>
        </div>
      {/each}
    </div>
  </div>
</section>
