<script lang="ts">
  import { onMount } from "svelte";
  import { getDbAtFreq, LOG_20, LOG_RANGE, PADDING_ZONE } from "../Services/FrequencyResponse";
  import FrequencyScrollbar, { type FrequencyState } from "#lib/components/home/FrequencyScrollbar.svelte";
  import NavigationHeader from "#lib/components/home/NavigationHeader.svelte";
  import Overlays from "#lib/components/home/Overlays.svelte";
  import AtmosphericEffects from "#lib/components/home/AtmosphericEffects.svelte";
  import HeroSection from "#lib/components/home/HeroSection.svelte";
  import ProjectsSection from "#lib/components/home/ProjectsSection.svelte";
  import ExperienceSection from "#lib/components/home/ExperienceSection.svelte";
  import BioSection from "#lib/components/home/BioSection.svelte";
  import InterestGallery from "#lib/components/home/InterestGallery.svelte";
  import BlogPreview from "#lib/components/home/BlogPreview.svelte";
  import ContactSection from "#lib/components/home/ContactSection.svelte";
  import SiteFooter from "#lib/components/home/SiteFooter.svelte";
  import ProjectHoverImages from "#lib/components/home/ProjectHoverImages.svelte";
  import PortalButton from "#lib/components/home/PortalButton.svelte";
  import PortalView from "#lib/components/home/PortalView.svelte";
  import FilmGrainToggle from "#lib/components/home/FilmGrainToggle.svelte";

  const DEFAULT_TIMER_SECONDS = 900;
  const INITIAL_FREQ_STATE: FrequencyState = { progress: 0, frequency: 0, db: -4 };

  let container: HTMLDivElement | undefined = $state();
  let portal = $state(false);
  let timer = $state(DEFAULT_TIMER_SECONDS);
  let freqState = $state<FrequencyState>(INITIAL_FREQ_STATE);
  let hoveredProject = $state<string | null>(null);
  let mounted = $state(false);

  // Scroll progress maps to 0-20Hz linearly over the first PADDING_ZONE, then 20Hz-20kHz logarithmically
  function frequencyStateAt(progress: number): FrequencyState {
    if (progress < PADDING_ZONE) {
      const frequency = (progress / PADDING_ZONE) * 20;
      return { progress, frequency, db: getDbAtFreq(Math.max(frequency, 20)) };
    }
    const adjustedProgress = (progress - PADDING_ZONE) / (1 - PADDING_ZONE);
    const frequency = Math.pow(10, LOG_20 + adjustedProgress * LOG_RANGE);
    return { progress, frequency, db: getDbAtFreq(frequency) };
  }

  function handleScroll() {
    if (!container) return;
    const scrollable = container.scrollHeight - container.clientHeight;
    freqState = frequencyStateAt(scrollable > 0 ? container.scrollTop / scrollable : 0);
  }

  function scrollToProgress(progress: number) {
    if (!container) return;
    container.scrollTo({ top: progress * (container.scrollHeight - container.clientHeight), behavior: "auto" });
  }

  function exitPortal() {
    portal = false;
    timer = DEFAULT_TIMER_SECONDS;
  }

  onMount(() => {
    mounted = true;
    // Honour /#section links on first load; the page scrolls inside `container`, so the browser can't
    const element = window.location.hash ? document.getElementById(window.location.hash.substring(1)) : null;
    if (!element) return;
    const timeout = setTimeout(() => container?.scrollTo({ top: element.offsetTop, behavior: "auto" }), 100);
    return () => clearTimeout(timeout);
  });

  // Portal countdown, one second per tick
  $effect(() => {
    if (!portal || timer <= 0) return;
    const interval = setInterval(() => (timer -= 1), 1000);
    return () => clearInterval(interval);
  });

  // Coming back from the portal starts the page from the top again
  $effect(() => {
    if (portal || !container) return;
    container.scrollTo({ top: 0, behavior: "auto" });
    freqState = INITIAL_FREQ_STATE;
  });
</script>

<div
  bind:this={container}
  class={portal ? "hidden" : "relative h-screen overflow-y-auto overflow-x-hidden bg-[oklch(0.16_0.01_145)]"}
  style="scrollbar-width: none; -ms-overflow-style: none"
  onscroll={handleScroll}
>
  <Overlays variant="film-grain" />
  <FrequencyScrollbar {mounted} {freqState} onScrollTo={scrollToProgress} />
  <NavigationHeader {container} />
  <AtmosphericEffects />
  <!-- Fades the first screen into the page colour. Kept outside <main> (z-30) so it stays
       below the film grain (z-5); inside <main> it would hide the grain at the hero's bottom. -->
  <div class="absolute inset-x-0 top-0 h-screen pointer-events-none" style="background: linear-gradient(to bottom, transparent, oklch(0.16 0.01 145))"></div>

  <main class="relative z-30 pr-16 lg:pr-20">
    <HeroSection />
    <ProjectsSection onHoverProject={(name) => (hoveredProject = name)} />
    <ExperienceSection />
    <BioSection />
    <InterestGallery />
    <BlogPreview />
    <ContactSection />
    <SiteFooter />
  </main>

  <ProjectHoverImages {hoveredProject} />
  <PortalButton onclick={() => (portal = true)} />
  <FilmGrainToggle />
</div>
{#if portal}
  <PortalView {timer} onExit={exitPortal} />
{/if}
