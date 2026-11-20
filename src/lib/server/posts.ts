import slugify from "slugify";
import { db } from "./db.ts";
import type { Post, PostInput, PostSummary } from "#lib/post.ts";

export async function listPosts(): Promise<Post[]> {
  const result = await db().sql<Post>`SELECT id, title, slug, content, excerpt, cover_image, created_at, updated_at FROM posts ORDER BY created_at DESC`;
  return result.rows;
}

export async function listPostSummaries(): Promise<PostSummary[]> {
  const result = await db().sql<PostSummary>`SELECT id, title, slug, excerpt, cover_image, created_at FROM posts ORDER BY created_at DESC`;
  return result.rows;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const result = await db().sql<Post>`SELECT * FROM posts WHERE slug = ${slug}`;
  return result.rows[0] ?? null;
}

export async function createPost(input: PostInput): Promise<Post> {
  const slug = await uniqueSlug(input.title);
  const result = await db().sql<Post>`INSERT INTO posts (title, slug, content, excerpt, cover_image) VALUES (${input.title}, ${slug}, ${input.content}, ${input.excerpt}, ${input.cover_image}) RETURNING *`;
  return result.rows[0];
}

export async function updatePost(slug: string, input: PostInput): Promise<Post | null> {
  const result = await db().sql<Post>`UPDATE posts SET title = ${input.title}, content = ${input.content}, excerpt = ${input.excerpt}, cover_image = ${input.cover_image}, updated_at = NOW() WHERE slug = ${slug} RETURNING *`;
  return result.rows[0] ?? null;
}

/** Returns false when no post had that slug. */
export async function deletePost(slug: string): Promise<boolean> {
  const result = await db().sql`DELETE FROM posts WHERE slug = ${slug} RETURNING *`;
  return (result.rowCount ?? 0) > 0;
}

// Appends -1, -2, ... until the slug is unused, so two posts with the same title both get URLs.
async function uniqueSlug(title: string): Promise<string> {
  const baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;
  while ((await db().sql`SELECT id FROM posts WHERE slug = ${slug}`).rowCount !== 0) {
    slug = `${baseSlug}-${counter++}`;
  }
  return slug;
}
