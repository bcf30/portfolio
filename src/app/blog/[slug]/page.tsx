import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { sql } from "@vercel/postgres";
import { unstable_cache } from "next/cache";

// Ensure POSTGRES_URL is set for @vercel/postgres from DATABASE_URL if missing
if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
  process.env.POSTGRES_URL = process.env.DATABASE_URL;
}

// Fetch a single post by slug using unstable_cache
const getPost = async (slug: string) => {
  return unstable_cache(
    async () => {
      try {
        const result = await sql`SELECT * FROM posts WHERE slug = ${slug}`;
        if (result.rows.length === 0) return null;
        return result.rows[0];
      } catch (err) {
        console.error("Failed to fetch post from DB:", err);
        return null;
      }
    },
    ['post-details', slug],
    { tags: ['posts'] }
  )();
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} | Ramiro Chen`,
    description: post.excerpt || undefined,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[oklch(0.16_0.01_145)] py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/blog" style={{ borderColor: 'oklch(0.30 0.04 145 / 0.5)', color: 'oklch(0.75 0.03 145)' }} className="inline-block mb-6 px-3 py-1 border text-xs font-mono hover:opacity-80 transition-all">
          &larr; Back to Blog
        </Link>
        <article>
          <h1 className="font-[family-name:var(--font-cormorant)] text-4xl text-[oklch(0.80_0.02_145)] mb-4">{post.title}</h1>
          <p className="text-xs text-[oklch(0.35_0.04_145)] font-mono mb-6">
            {new Date(post.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            {post.updated_at && ` (updated: ${new Date(post.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })})`}
          </p>
          {post.cover_image && (
            <img src={post.cover_image} alt="" className="w-full h-auto object-contain mb-8 border border-[oklch(0.30_0.04_145/0.3)]" />
          )}
          <div className="prose prose-invert max-w-none text-[oklch(0.75_0.03_145)] font-[family-name:var(--font-crimson)]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  );
}
