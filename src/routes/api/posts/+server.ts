import type { RequestHandler } from "./$types";
import { listPosts, createPost } from "#lib/server/posts.ts";
import { requireAdmin } from "#lib/server/auth.ts";
import { parsePostInput } from "#lib/post.ts";

// GET /api/posts - list all posts (public)
export const GET: RequestHandler = async ({ url }) => {
  try {
    let posts = await listPosts();
    const limit = url.searchParams.get("limit");
    if (limit) posts = posts.slice(0, parseInt(limit));
    return Response.json(posts);
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return Response.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
};

// POST /api/posts - create a new post (admin protected)
export const POST: RequestHandler = async ({ request }) => {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const input = parsePostInput(await request.json());
    if (!input) {
      return Response.json({ error: "Title and content are required" }, { status: 400 });
    }
    return Response.json(await createPost(input), { status: 201 });
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return Response.json({ error: "Failed to create post" }, { status: 500 });
  }
};
