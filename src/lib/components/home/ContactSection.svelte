<script lang="ts">
  const links = [
    { href: "mailto:ramiro.chen@outlook.com", label: "email", external: false },
    { href: "https://github.com/bcf30", label: "github", external: true },
  ];
</script>

<section id="contact" class="relative py-24 px-6">
  <div class="max-w-sm mx-auto text-center">
    <div class="flex justify-center gap-4 relative z-10">
      {#each links as link (link.label)}
        <a
          href={link.href}
          target={link.external ? "_blank" : undefined}
          rel={link.external ? "noopener noreferrer" : undefined}
          style="border-color: oklch(0.30 0.04 145 / 0.5); color: oklch(0.55 0.04 145)"
          class="px-4 py-2 border text-xs font-mono hover:opacity-80 transition-all shadow-[0_0_10px_oklch(0.30_0.04_145/0.15)]"
        >{link.label}</a>
      {/each}
    </div>
  </div>
</section>
