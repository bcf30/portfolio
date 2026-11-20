import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getPostBySlug } from "#lib/server/posts.ts";
import { renderMarkdown } from "#lib/server/markdown.ts";

export const load: PageServerLoad = async ({ params }) => {
  const post = await getPostBySlug(params.slug).catch((err) => {
    console.error("Failed to fetch post from DB:", err);
    return null;
  });
  if (!post) error(404, "Not found");

  return {
    post,
    // Rendered here so the markdown library never ships to the browser
    contentHtml: renderMarkdown(post.content),
    meta: { title: `${post.title} | Ramiro Chen`, description: post.excerpt ?? undefined },
  };
};
