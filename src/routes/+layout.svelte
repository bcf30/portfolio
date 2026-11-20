<script lang="ts">
  import "../app.css";
  import type { Snippet } from "svelte";
  import { page } from "$app/state";
  import { dev, browser } from "$app/env";
  import { afterNavigate } from "$app/navigation";
  import { inject, pageview } from "@vercel/analytics";
  import FilmEffect from "#lib/components/FilmEffect.svelte";

  let { children }: { children: Snippet } = $props();

  const DEFAULT_TITLE = "Ramiro Chen | Portfolio";
  const DEFAULT_DESCRIPTION = "Ramiro Chen's portfolio. Inspired by several filmmakers I look fondly to";
  const KEYWORDS = [
    "portfolio", "cinema", "Apichatpong Weerasethakul", "Charlie Kaufman", "Wang Bing", "slow cinema",
    "audiophile", "IEM", "frequency response", "film studies", "Counter-Strike",
  ];

  // Pages can override the title/description by returning `meta` from their load function
  const title = $derived(page.data.meta?.title ?? DEFAULT_TITLE);
  const description = $derived(page.data.meta?.description ?? DEFAULT_DESCRIPTION);

  // @vercel/analytics/sveltekit still imports $app/stores (removed in SvelteKit 3),
  // so use the framework-agnostic script and report each route ourselves.
  if (browser) {
    inject({ mode: dev ? "development" : "production", framework: "sveltekit", disableAutoTrack: true });
  }
  afterNavigate(() => pageview({ route: page.route.id, path: page.url.pathname }));
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="keywords" content={KEYWORDS.join(",")} />
  <meta name="author" content="Ramiro Chen" />
  <meta property="og:title" content={DEFAULT_TITLE} />
  <meta property="og:description" content={DEFAULT_DESCRIPTION} />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Ramiro Chen" />
  <meta name="twitter:description" content="Ramiro Chen's portfolio" />
</svelte:head>

<FilmEffect />
{@render children()}
