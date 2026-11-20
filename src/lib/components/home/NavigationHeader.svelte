<script lang="ts">
  let { container }: { container: HTMLDivElement | undefined } = $props();

  const navItems = [
    { href: "/", label: "home", primary: false },
    { href: "/#projects", label: "projects + experience", primary: false },
    { href: "/#bio", label: "bio", primary: false },
    { href: "/#blog", label: "blog", primary: false },
    { href: "/#contact", label: "contact", primary: true },
  ];

  const PRIMARY_STYLE = "background-color: oklch(0.45 0.10 145); border-color: oklch(0.45 0.10 145); color: oklch(0.95 0.02 145)";
  const DEFAULT_STYLE = "border-color: oklch(0.50 0.04 145); color: oklch(0.75 0.03 145)";

  // The page scrolls inside `container`, not the window, so same-page anchors
  // have to scroll it manually instead of relying on the browser's hash jump.
  function scrollToTarget(e: MouseEvent, target: string) {
    const url = new URL(target, window.location.origin);
    if (url.pathname !== window.location.pathname || !container) return;
    e.preventDefault();
    const element = url.hash ? document.getElementById(url.hash.substring(1)) : null;
    if (url.hash && !element) return;
    container.scrollTo({ top: element ? element.offsetTop : 0, behavior: "smooth" });
  }
</script>

<header class="fixed top-0 left-0 right-16 lg:right-20 z-40 p-3 flex gap-2 flex-wrap bg-gradient-to-b from-[oklch(0.16_0.01_145)] via-[oklch(0.14_0.01_145/0.6)] to-transparent">
  {#each navItems as item (item.href)}
    <a href={item.href} onclick={(e) => scrollToTarget(e, item.href)} style={item.primary ? PRIMARY_STYLE : DEFAULT_STYLE} class="px-3 py-1.5 border text-xs font-mono hover:opacity-80 transition-all">{item.label}</a>
  {/each}
</header>
