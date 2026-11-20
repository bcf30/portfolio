import { describe, it, expect, vi } from "vitest";

vi.mock("#lib/server/posts.ts", () => ({ listPostSummaries: vi.fn() }));

import { load } from "./+page.server.ts";
import { listPostSummaries } from "#lib/server/posts.ts";

describe("blog list page load", () => {
  it("returns the post summaries", async () => {
    const posts = [{ slug: "a", title: "A" }];
    vi.mocked(listPostSummaries).mockResolvedValue(posts as never);
    expect(await load({} as never)).toEqual({ posts });
  });

  it("returns no posts instead of an error page when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(listPostSummaries).mockRejectedValue(new Error("db down"));
    expect(await load({} as never)).toEqual({ posts: [] });
  });
});
