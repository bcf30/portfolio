<script lang="ts">
  import type { PageProps } from "./$types";
  import { formatPostDate } from "#lib/format-date.ts";

  let { data }: PageProps = $props();
</script>

<div class="min-h-screen py-24 px-6 relative z-10">
  <header class="absolute top-0 left-0 z-40 p-3 flex gap-2">
    <a href="/" style="border-color: oklch(0.50 0.04 145); color: oklch(0.75 0.03 145)" class="px-3 py-1.5 border text-xs font-mono hover:opacity-80 transition-all bg-[oklch(0.16_0.01_145)]">
      &larr; home
    </a>
  </header>
  <div class="max-w-4xl mx-auto">
    <h1 class="font-[family-name:var(--font-cormorant)] text-4xl text-[oklch(0.80_0.02_145)] mb-12 text-center">Blog</h1>
    {#if data.posts.length === 0}
      <p class="text-center text-[oklch(0.55_0.04_145)]">No posts yet.</p>
    {:else}
      <div class="space-y-8">
        {#each data.posts as post (post.slug)}
          <article class="border border-[oklch(0.30_0.04_145/0.5)] bg-[oklch(0.14_0.01_145/0.6)] p-6">
            {#if post.cover_image}
              <img
                src={post.cover_image}
                alt={`Cover image for ${post.title}`}
                class="w-full h-auto object-contain mb-4 border border-[oklch(0.30_0.04_145/0.3)]"
                loading="lazy"
              />
            {/if}
            <h2 class="font-[family-name:var(--font-cormorant)] text-2xl text-[oklch(0.80_0.02_145)] mb-2">
              <a href={`/blog/${post.slug}`} class="hover:underline">{post.title}</a>
            </h2>
            <p class="text-xs text-[oklch(0.35_0.04_145)] font-mono mb-3">{formatPostDate(post.created_at)}</p>
            {#if post.excerpt}
              <p class="text-[oklch(0.55_0.04_145)] mb-4">{post.excerpt}</p>
            {/if}
            <a href={`/blog/${post.slug}`} style="border-color: oklch(0.30 0.04 145 / 0.5); color: oklch(0.75 0.03 145)" class="inline-block px-3 py-1 border text-xs font-mono hover:opacity-80 transition-all">
              Read more
            </a>
          </article>
        {/each}
      </div>
    {/if}
  </div>
</div>
