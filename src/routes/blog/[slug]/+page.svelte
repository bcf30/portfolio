<script lang="ts">
  import type { PageProps } from "./$types";
  import { formatPostDate } from "#lib/format-date.ts";

  let { data }: PageProps = $props();
  const post = $derived(data.post);
</script>

<div class="min-h-screen py-24 px-6 relative z-10">
  <div class="max-w-3xl mx-auto">
    <a href="/blog" style="border-color: oklch(0.30 0.04 145 / 0.5); color: oklch(0.75 0.03 145)" class="inline-block mb-6 px-3 py-1 border text-xs font-mono hover:opacity-80 transition-all">
      &larr; Back to Blog
    </a>
    <article class="border border-[oklch(0.30_0.04_145/0.5)] bg-[oklch(0.14_0.01_145/0.6)] p-6">
      <h1 class="font-[family-name:var(--font-cormorant)] text-4xl text-[oklch(0.80_0.02_145)] mb-4">{post.title}</h1>
      <p class="text-xs text-[oklch(0.35_0.04_145)] font-mono mb-6">
        {formatPostDate(post.created_at)}{#if post.updated_at}{` (updated: ${formatPostDate(post.updated_at)})`}{/if}
      </p>
      {#if post.cover_image}
        <img src={post.cover_image} alt="" class="w-full h-auto object-contain mb-8 border border-[oklch(0.30_0.04_145/0.3)]" />
      {/if}
      <div class="prose prose-invert max-w-none text-[oklch(0.75_0.03_145)] font-[family-name:var(--font-crimson)]">
        <!-- Rendered server-side from markdown with raw HTML escaped and unsafe URLs removed -->
        {@html data.contentHtml}
      </div>
    </article>
  </div>
</div>
