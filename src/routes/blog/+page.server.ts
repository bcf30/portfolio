import type { PageServerLoad } from "./$types";
import { listPostSummaries } from "#lib/server/posts.ts";

export const load: PageServerLoad = async () => {
  try {
    return { posts: await listPostSummaries() };
  } catch (err) {
    // Show "No posts yet." rather than an error page if the database is unreachable
    console.error("Failed to fetch posts from DB:", err);
    return { posts: [] };
  }
};
