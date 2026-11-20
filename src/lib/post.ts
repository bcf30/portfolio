// Shape of a row in the `posts` table. Shared by server code and the admin page.
export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  created_at: Date;
  updated_at: Date;
}

export type PostSummary = Omit<Post, "content" | "updated_at">;

export interface PostInput {
  title: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
}

/** Validates a create/update request body. Returns null when title or content is missing. */
export function parsePostInput(body: unknown): PostInput | null {
  const { title, content, excerpt, cover_image } = (body ?? {}) as Record<string, unknown>;
  if (typeof title !== "string" || !title || typeof content !== "string" || !content) return null;
  return {
    title,
    content,
    // Empty strings are stored as NULL, as before
    excerpt: typeof excerpt === "string" && excerpt ? excerpt : null,
    cover_image: typeof cover_image === "string" && cover_image ? cover_image : null,
  };
}
