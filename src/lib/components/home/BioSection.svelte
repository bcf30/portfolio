<script lang="ts">
  import { revealOnView } from "../../actions/reveal-on-view";
</script>

<section id="bio" class="relative py-24 px-6">
  <div class="max-w-3xl mx-auto">
    <div class="relative z-10 overflow-hidden reveal-on-view" use:revealOnView>
      <div class="flex items-center gap-6">
        <p class="font-[family-name:var(--font-crimson)] text-base md:text-lg leading-relaxed text-[oklch(0.75_0.03_145)]">I'm Ramiro. I have a lot of interests. This portfolio site shows just some of them. Well, at least, the most notable ones I can think of.</p>
        <img
          src="/images/buffalo.avif"
          alt=""
          class="w-32 md:w-44 rounded-sm opacity-50 grayscale-[20%] shadow-[0_0_20px_oklch(0.35_0.06_145/0.3)] shrink-0"
        />
      </div>
    </div>
  </div>
</section>
