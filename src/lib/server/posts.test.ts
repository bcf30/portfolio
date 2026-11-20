import { describe, it, expect, vi } from "vitest";

// Replaces the Postgres pool with a spy on its `sql` tagged template
const sql = vi.hoisted(() => vi.fn());
vi.mock("./db.ts", () => ({ db: () => ({ sql }) }));

import { listPosts, listPostSummaries, getPostBySlug, createPost, updatePost, deletePost } from "./posts.ts";

/** The SQL text of the nth query, with each interpolated value shown as `$`. */
const queryText = (n: number) => (sql.mock.calls[n][0] as TemplateStringsArray).join("$");
/** The values interpolated into the nth query, which the driver sends as parameters. */
const queryValues = (n: number) => sql.mock.calls[n].slice(1);

const ROW = { id: 1, title: "Hello World", slug: "hello-world", content: "body", excerpt: null, cover_image: null };
const INPUT = { title: "Hello World", content: "body", excerpt: null, cover_image: null };

describe("reading posts", () => {
  it("lists full posts newest first", async () => {
    sql.mockResolvedValueOnce({ rows: [ROW] });
    expect(await listPosts()).toEqual([ROW]);
    expect(queryText(0)).toMatch(/SELECT .*content.* FROM posts ORDER BY created_at DESC/);
  });

  it("lists summaries without the post body", async () => {
    sql.mockResolvedValueOnce({ rows: [] });
    await listPostSummaries();
    expect(queryText(0)).not.toContain("content");
    expect(queryText(0)).toContain("ORDER BY created_at DESC");
  });

  it("gets one post by slug, passing the slug as a parameter", async () => {
    sql.mockResolvedValueOnce({ rows: [ROW] });
    expect(await getPostBySlug("hello-world")).toEqual(ROW);
    expect(queryText(0)).toBe("SELECT * FROM posts WHERE slug = $");
    expect(queryValues(0)).toEqual(["hello-world"]);
  });

  it("returns null for an unknown slug", async () => {
    sql.mockResolvedValueOnce({ rows: [] });
    expect(await getPostBySlug("nope")).toBeNull();
  });
});

describe("createPost", () => {
  it("slugifies the title and inserts the post", async () => {
    sql.mockResolvedValueOnce({ rowCount: 0 }).mockResolvedValueOnce({ rows: [ROW] });
    expect(await createPost(INPUT)).toEqual(ROW);
    expect(queryValues(0)).toEqual(["hello-world"]);
    expect(queryText(1)).toMatch(/^INSERT INTO posts/);
    expect(queryValues(1)).toEqual(["Hello World", "hello-world", "body", null, null]);
  });

  it("appends -1, -2, ... until the slug is unused", async () => {
    sql
      .mockResolvedValueOnce({ rowCount: 1 }) // hello-world taken
      .mockResolvedValueOnce({ rowCount: 1 }) // hello-world-1 taken
      .mockResolvedValueOnce({ rowCount: 0 }) // hello-world-2 free
      .mockResolvedValueOnce({ rows: [ROW] });
    await createPost(INPUT);
    expect([queryValues(0), queryValues(1), queryValues(2)]).toEqual([["hello-world"], ["hello-world-1"], ["hello-world-2"]]);
    expect(queryValues(3)[1]).toBe("hello-world-2");
  });

  it("strips punctuation and accents from the slug", async () => {
    sql.mockResolvedValueOnce({ rowCount: 0 }).mockResolvedValueOnce({ rows: [ROW] });
    await createPost({ ...INPUT, title: "Canada Suffers from Brain Drain. Ça va?" });
    expect(queryValues(0)).toEqual(["canada-suffers-from-brain-drain-ca-va"]);
  });

  it("passes the optional fields through", async () => {
    sql.mockResolvedValueOnce({ rowCount: 0 }).mockResolvedValueOnce({ rows: [ROW] });
    await createPost({ ...INPUT, excerpt: "short", cover_image: "https://blob/x.png" });
    expect(queryValues(1).slice(3)).toEqual(["short", "https://blob/x.png"]);
  });
});

describe("updatePost", () => {
  it("updates by slug and bumps updated_at", async () => {
    sql.mockResolvedValueOnce({ rows: [ROW] });
    expect(await updatePost("hello-world", INPUT)).toEqual(ROW);
    expect(queryText(0)).toMatch(/^UPDATE posts SET .*updated_at = NOW\(\) WHERE slug = \$ RETURNING \*$/);
    expect(queryValues(0)).toEqual(["Hello World", "body", null, null, "hello-world"]);
  });

  it("returns null when no post has that slug", async () => {
    sql.mockResolvedValueOnce({ rows: [] });
    expect(await updatePost("nope", INPUT)).toBeNull();
  });
});

describe("deletePost", () => {
  it("returns true when a row was deleted", async () => {
    sql.mockResolvedValueOnce({ rowCount: 1 });
    expect(await deletePost("hello-world")).toBe(true);
    expect(queryValues(0)).toEqual(["hello-world"]);
  });

  it("returns false when nothing matched", async () => {
    sql.mockResolvedValueOnce({ rowCount: 0 });
    expect(await deletePost("nope")).toBe(false);
  });
});
