<script lang="ts">
  import { untrack } from "svelte";
  import type { Post } from "#lib/post.ts";
  import { formatPostDate } from "#lib/format-date.ts";

  const EMPTY_FORM = { title: "", content: "", excerpt: "", coverImage: "" };

  let password = $state("");
  let authenticated = $state(false);
  let adminPassword = $state(""); // kept in memory only, sent as a header on admin API calls
  let posts = $state<Post[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let editingSlug = $state<string | null>(null);
  let form = $state({ ...EMPTY_FORM });
  let coverFile = $state<File | null>(null);
  let uploading = $state(false);
  let fileInput: HTMLInputElement | undefined = $state();

  const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

  function resetForm() {
    editingSlug = null;
    form = { ...EMPTY_FORM };
    coverFile = null;
    if (fileInput) fileInput.value = "";
  }

  // Runs a request with the shared loading/error handling; returns false if it threw
  async function withLoading(action: () => Promise<void>): Promise<boolean> {
    loading = true;
    error = null;
    try {
      await action();
      return true;
    } catch (err) {
      error = errorMessage(err);
      return false;
    } finally {
      loading = false;
    }
  }

  async function fetchPosts() {
    await withLoading(async () => {
      const res = await fetch("/api/posts");
      if (!res.ok) throw new Error("Failed to fetch posts");
      posts = await res.json();
    });
  }

  // Fetch posts once logged in. untrack: only `authenticated` should re-trigger this.
  $effect(() => {
    if (authenticated) untrack(fetchPosts);
  });

  function handleLogin(e: SubmitEvent) {
    e.preventDefault();
    // Any non-empty password is accepted here; the server verifies it on each admin request
    if (password.trim()) {
      adminPassword = password;
      authenticated = true;
    }
  }

  function handleLogout() {
    authenticated = false;
    adminPassword = "";
    password = "";
    resetForm();
  }

  async function handleImageUpload() {
    if (!coverFile) return;
    uploading = true;
    try {
      const formData = new FormData();
      formData.append("file", coverFile);
      const res = await fetch("/api/upload", { method: "POST", headers: { "x-admin-password": adminPassword }, body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      form.coverImage = url;
      coverFile = null;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      uploading = false;
    }
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const saved = await withLoading(async () => {
      const body = { ...form, cover_image: form.coverImage || null };
      const res = await fetch(editingSlug ? `/api/posts/${editingSlug}` : "/api/posts", {
        method: editingSlug ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save post");
    });
    if (!saved) return;
    resetForm();
    await fetchPosts();
  }

  function handleEdit(post: Post) {
    editingSlug = post.slug;
    // A cover image keeps its URL; the file input stays empty unless the user picks a new one
    form = { title: post.title || "", content: post.content || "", excerpt: post.excerpt || "", coverImage: post.cover_image || "" };
  }

  async function handleDelete(slug: string) {
    if (!confirm("Are you sure you want to delete this post?")) return;
    const deleted = await withLoading(async () => {
      const res = await fetch(`/api/posts/${slug}`, { method: "DELETE", headers: { "x-admin-password": adminPassword } });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete post");
    });
    if (!deleted) return;
    await fetchPosts();
    if (editingSlug === slug) {
      editingSlug = null;
      form = { ...EMPTY_FORM };
    }
  }

  const HOME_LINK_STYLE = "border-color: oklch(0.50 0.04 145); color: oklch(0.75 0.03 145)";
  const INPUT_CLASS = "w-full p-2 bg-[oklch(0.16_0.01_145)] border border-[oklch(0.30_0.04_145/0.5)] text-[oklch(0.75_0.03_145)] font-mono text-sm";
  const LABEL_CLASS = "block text-xs font-mono text-[oklch(0.45_0.04_145)] mb-1";
  const SECONDARY_BUTTON_CLASS = "border border-[oklch(0.30_0.04_145/0.5)] text-[oklch(0.55_0.04_145)] text-xs font-mono hover:opacity-80 transition-all";
  const PRIMARY_BUTTON_CLASS = "px-4 py-2 border border-[oklch(0.45_0.10_145)] bg-[oklch(0.45_0.10_145)] text-[oklch(0.95_0.02_145)] text-xs font-mono hover:opacity-80 transition-all";
</script>

{#if !authenticated}
  <div class="min-h-screen flex items-center justify-center bg-[oklch(0.16_0.01_145)] relative">
    <header class="absolute top-0 left-0 z-40 p-3 flex gap-2">
      <a href="/" style={HOME_LINK_STYLE} class="px-3 py-1.5 border text-xs font-mono hover:opacity-80 transition-all bg-[oklch(0.16_0.01_145)]">&larr; home</a>
    </header>
    <form onsubmit={handleLogin} class="max-w-sm w-full p-6 border border-[oklch(0.30_0.04_145/0.5)] bg-[oklch(0.14_0.01_145/0.8)]">
      <h1 class="font-[family-name:var(--font-cormorant)] text-2xl text-[oklch(0.80_0.02_145)] mb-4">Admin Login</h1>
      <input type="password" bind:value={password} placeholder="Enter admin password" class={`${INPUT_CLASS} mb-4`} required />
      <button type="submit" class={`w-full ${PRIMARY_BUTTON_CLASS}`}>Login</button>
    </form>
  </div>
{:else}
  <div class="min-h-screen bg-[oklch(0.16_0.01_145)] py-12 px-6 relative">
    <header class="absolute top-0 left-0 z-40 p-3 flex gap-2">
      <a href="/" style={HOME_LINK_STYLE} class="px-3 py-1.5 border text-xs font-mono hover:opacity-80 transition-all bg-[oklch(0.16_0.01_145)]">&larr; home</a>
    </header>
    <div class="max-w-4xl mx-auto mt-12">
      <div class="flex justify-between items-center mb-8">
        <h1 class="font-[family-name:var(--font-cormorant)] text-3xl text-[oklch(0.80_0.02_145)]">Blog Admin</h1>
        <button onclick={handleLogout} class={`px-3 py-1 ${SECONDARY_BUTTON_CLASS}`}>Logout</button>
      </div>

      {#if error}
        <p class="text-[oklch(0.60_0.04_145)] mb-4">{error}</p>
      {/if}

      <!-- Create/Edit Form -->
      <div class="mb-12 p-6 border border-[oklch(0.30_0.04_145/0.5)] bg-[oklch(0.14_0.01_145/0.6)]">
        <h2 class="font-[family-name:var(--font-cormorant)] text-xl text-[oklch(0.80_0.02_145)] mb-4">
          {editingSlug ? "Edit Post" : "Create New Post"}
        </h2>
        <form onsubmit={handleSubmit} class="space-y-4">
          <div>
            <label for="post-title" class={LABEL_CLASS}>Title</label>
            <input id="post-title" type="text" bind:value={form.title} required class={INPUT_CLASS} />
          </div>
          <div>
            <label for="post-content" class={LABEL_CLASS}>Content (Markdown)</label>
            <textarea id="post-content" bind:value={form.content} required rows={12} class={INPUT_CLASS}></textarea>
          </div>
          <div>
            <label for="post-excerpt" class={LABEL_CLASS}>Excerpt (optional)</label>
            <textarea id="post-excerpt" bind:value={form.excerpt} rows={2} class={INPUT_CLASS}></textarea>
          </div>
          <div>
            <label for="post-cover" class={LABEL_CLASS}>Cover Image</label>
            <div class="flex gap-2 items-center">
              <input
                id="post-cover"
                type="file"
                bind:this={fileInput}
                onchange={(e) => (coverFile = e.currentTarget.files?.[0] || null)}
                accept="image/*"
                class="block file:mr-4 file:py-1 file:px-3 file:border-0 file:text-xs file:font-mono file:text-[oklch(0.45_0.04_145)] file:bg-[oklch(0.16_0.01_145)] file:border file:border-[oklch(0.30_0.04_145/0.5)] hover:file:opacity-80 cursor-pointer text-[oklch(0.55_0.04_145)] text-xs"
              />
              <button type="button" onclick={handleImageUpload} disabled={!coverFile || uploading} class={`px-3 py-1 disabled:opacity-50 ${SECONDARY_BUTTON_CLASS}`}>
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
            {#if form.coverImage}
              <div class="mt-2">
                <img src={form.coverImage} alt="Cover preview" class="max-w-xs max-h-40 object-cover border border-[oklch(0.30_0.04_145/0.3)]" />
                <p class="text-[10px] text-[oklch(0.35_0.04_145)] mt-1 font-mono">{form.coverImage}</p>
              </div>
            {/if}
          </div>
          <div class="flex gap-2">
            <button type="submit" disabled={loading || !form.title.trim() || !form.content.trim()} class={`disabled:opacity-50 ${PRIMARY_BUTTON_CLASS}`}>
              {loading ? "Saving..." : editingSlug ? "Update Post" : "Create Post"}
            </button>
            {#if editingSlug}
              <button type="button" onclick={resetForm} class={`px-4 py-2 ${SECONDARY_BUTTON_CLASS}`}>Cancel</button>
            {/if}
          </div>
        </form>
      </div>

      <!-- Posts List -->
      <div>
        <h2 class="font-[family-name:var(--font-cormorant)] text-2xl text-[oklch(0.80_0.02_145)] mb-4">Existing Posts</h2>
        {#if loading && posts.length === 0}
          <p class="text-[oklch(0.55_0.04_145)]">Loading...</p>
        {:else if posts.length === 0}
          <p class="text-[oklch(0.55_0.04_145)]">No posts yet.</p>
        {:else}
          <ul class="space-y-4">
            {#each posts as post (post.slug)}
              <li class="p-4 border border-[oklch(0.30_0.04_145/0.5)] bg-[oklch(0.14_0.01_145/0.6)]">
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-[family-name:var(--font-cormorant)] text-lg text-[oklch(0.80_0.02_145)]">{post.title}</h3>
                    <p class="text-xs text-[oklch(0.35_0.04_145)] font-mono mt-1">
                      {formatPostDate(post.created_at, "short")} {post.updated_at ? `(updated: ${formatPostDate(post.updated_at, "short")})` : ""}
                    </p>
                    {#if post.excerpt}
                      <p class="text-sm text-[oklch(0.55_0.04_145)] mt-2">{post.excerpt}</p>
                    {/if}
                  </div>
                  <div class="flex gap-2">
                    <button onclick={() => handleEdit(post)} class={`px-2 py-1 ${SECONDARY_BUTTON_CLASS}`}>Edit</button>
                    <button onclick={() => handleDelete(post.slug)} class={`px-2 py-1 ${SECONDARY_BUTTON_CLASS}`}>Delete</button>
                  </div>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  </div>
{/if}
