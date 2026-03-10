import Link from "next/link";

import { sql } from "@vercel/postgres";
import { unstable_cache } from "next/cache";

// Fetch all posts using unstable_cache for Next.js 15+
const getPosts = unstable_cache(
  async () => {
    try {
      const result = await sql`SELECT id, title, slug, excerpt, cover_image, created_at FROM posts ORDER BY created_at DESC`;
      return result.rows;
    } catch (err) {
      console.error("Failed to fetch posts from DB:", err);
      return [];
    }
  },
  ['all-posts'],
  { tags: ['posts'] }
);

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-[oklch(0.16_0.01_145)] py-24 px-6 relative">
      <header className="absolute top-0 left-0 z-40 p-3 flex gap-2">
        <Link href="/" style={{ borderColor: 'oklch(0.50 0.04 145)', color: 'oklch(0.75 0.03 145)' }} className="px-3 py-1.5 border text-xs font-mono hover:opacity-80 transition-all bg-[oklch(0.16_0.01_145)]">
          &larr; home
        </Link>
      </header>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="font-[family-name:var(--font-cormorant)] text-4xl text-[oklch(0.80_0.02_145)] mb-12 text-center">Blog</h1>
        {posts.length === 0 ? (
          <p className="text-center text-[oklch(0.55_0.04_145)]">No posts yet.</p>
        ) : (
          <div className="space-y-8">
            {posts.map((post: any) => (
              <article key={post.slug} className="border border-[oklch(0.30_0.04_145/0.5)] bg-[oklch(0.14_0.01_145/0.6)] p-6">
                {post.cover_image && (
                  <img 
                    src={post.cover_image} 
                    alt={`Cover image for ${post.title}`}
                    className="w-full h-48 object-cover mb-4 border border-[oklch(0.30_0.04_145/0.3)]" 
                    loading="lazy"
                  />
                )}
                <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[oklch(0.80_0.02_145)] mb-2">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-xs text-[oklch(0.35_0.04_145)] font-mono mb-3">
                  {new Date(post.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                {post.excerpt && <p className="text-[oklch(0.55_0.04_145)] mb-4">{post.excerpt}</p>}
                <Link href={`/blog/${post.slug}`} style={{ borderColor: 'oklch(0.30 0.04 145 / 0.5)', color: 'oklch(0.75 0.03 145)' }} className="inline-block px-3 py-1 border text-xs font-mono hover:opacity-80 transition-all">
                  Read more
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
