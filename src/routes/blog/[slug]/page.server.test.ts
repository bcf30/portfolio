import { describe, it, expect, vi } from "vitest";

vi.mock("#lib/server/posts.ts", () => ({ getPostBySlug: vi.fn() }));

import { load } from "./+page.server.ts";
import { getPostBySlug } from "#lib/server/posts.ts";

const event = (slug: string) => ({ params: { slug } }) as never;

const POST = {
  id: 1,
  title: "In Defense of DLSS 5",
  slug: "in-defense-of-dlss-5",
  content: "Some **bold** claims <script>x()</script>",
  excerpt: "DLSS 5 vs DLSS 5 discourse online.",
  cover_image: null,
  created_at: new Date("2026-03-18T12:00:00Z"),
  updated_at: new Date("2026-03-18T12:00:00Z"),
};

describe("blog post page load", () => {
  it("returns the post with its markdown rendered to safe HTML", async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(POST);
    const data = (await load(event(POST.slug))) as { post: unknown; contentHtml: string };
    expect(getPostBySlug).toHaveBeenCalledWith(POST.slug);
    expect(data.post).toEqual(POST);
    expect(data.contentHtml).toContain("<strong>bold</strong>");
    expect(data.contentHtml).not.toContain("<script>");
  });

  it("sets the page title and description from the post", async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(POST);
    expect(await load(event(POST.slug))).toMatchObject({
      meta: { title: "In Defense of DLSS 5 | Ramiro Chen", description: "DLSS 5 vs DLSS 5 discourse online." },
    });
  });

  it("leaves the description unset when the post has no excerpt", async () => {
    vi.mocked(getPostBySlug).mockResolvedValue({ ...POST, excerpt: null });
    expect(await load(event(POST.slug))).toMatchObject({ meta: { description: undefined } });
  });

  it("responds 404 for an unknown slug", async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(null);
    await expect(load(event("nope"))).rejects.toMatchObject({ status: 404 });
  });

  it("responds 404 when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getPostBySlug).mockRejectedValue(new Error("db down"));
    await expect(load(event(POST.slug))).rejects.toMatchObject({ status: 404 });
  });
});
