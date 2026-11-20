import type { RequestHandler } from "./$types";
import { getPostBySlug, updatePost, deletePost } from "#lib/server/posts.ts";
import { requireAdmin } from "#lib/server/auth.ts";
import { parsePostInput } from "#lib/post.ts";

const notFound = () => Response.json({ error: "Post not found" }, { status: 404 });

// GET /api/posts/[slug] - fetch a single post by slug (public)
export const GET: RequestHandler = async ({ params }) => {
  try {
    const post = await getPostBySlug(params.slug);
    return post ? Response.json(post) : notFound();
  } catch (error) {
    console.error("GET /api/posts/[slug] error:", error);
    return Response.json({ error: "Failed to fetch post" }, { status: 500 });
  }
};

// PUT /api/posts/[slug] - update a post (admin protected)
export const PUT: RequestHandler = async ({ params, request }) => {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const input = parsePostInput(await request.json());
    if (!input) {
      return Response.json({ error: "Title and content are required" }, { status: 400 });
    }
    const post = await updatePost(params.slug, input);
    return post ? Response.json(post) : notFound();
  } catch (error) {
    console.error("PUT /api/posts/[slug] error:", error);
    return Response.json({ error: "Failed to update post" }, { status: 500 });
  }
};

// DELETE /api/posts/[slug] - delete a post (admin protected)
export const DELETE: RequestHandler = async ({ params, request }) => {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const deleted = await deletePost(params.slug);
    return deleted ? Response.json({ message: "Post deleted" }) : notFound();
  } catch (error) {
    console.error("DELETE /api/posts/[slug] error:", error);
    return Response.json({ error: "Failed to delete post" }, { status: 500 });
  }
};
