import { describe, it, expect, vi, beforeEach } from "vitest";
import { requestEvent } from "../../../../test/request-event.ts";

vi.mock("$app/env/private", () => ({ ADMIN_PASSWORD_HASH: "secret", ADMIN_PASSWORD: undefined }));
vi.mock("#lib/server/posts.ts", () => ({ getPostBySlug: vi.fn(), updatePost: vi.fn(), deletePost: vi.fn() }));

import { GET, PUT, DELETE } from "./+server.ts";
import { getPostBySlug, updatePost, deletePost } from "#lib/server/posts.ts";

const PATH = "/api/posts/hello";
const PARAMS = { slug: "hello" };
const VALID = { title: "Hello", content: "Body" };

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/posts/[slug]", () => {
  it("returns the post", async () => {
    vi.mocked(getPostBySlug).mockResolvedValue({ slug: "hello" } as never);
    const response = await GET(requestEvent({ path: PATH, params: PARAMS }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ slug: "hello" });
    expect(getPostBySlug).toHaveBeenCalledWith("hello");
  });

  it("returns 404 for an unknown slug", async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(null);
    const response = await GET(requestEvent({ path: PATH, params: PARAMS }));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Post not found" });
  });

  it("returns 500 when the database fails", async () => {
    vi.mocked(getPostBySlug).mockRejectedValue(new Error("db down"));
    expect((await GET(requestEvent({ path: PATH, params: PARAMS }))).status).toBe(500);
  });
});

describe("PUT /api/posts/[slug]", () => {
  const put = (password: string | undefined, json: unknown) =>
    PUT(requestEvent({ path: PATH, method: "PUT", params: PARAMS, password, json }));

  it("returns 401 without the right password", async () => {
    expect((await put(undefined, VALID)).status).toBe(401);
    expect((await put("wrong", VALID)).status).toBe(401);
    expect(updatePost).not.toHaveBeenCalled();
  });

  it("returns 400 when the content is missing", async () => {
    expect((await put("secret", { title: "Hello" })).status).toBe(400);
    expect(updatePost).not.toHaveBeenCalled();
  });

  it("updates the post", async () => {
    vi.mocked(updatePost).mockResolvedValue({ slug: "hello", title: "Hello" } as never);
    const response = await put("secret", { ...VALID, excerpt: "short", cover_image: "" });
    expect(response.status).toBe(200);
    expect(updatePost).toHaveBeenCalledWith("hello", { title: "Hello", content: "Body", excerpt: "short", cover_image: null });
  });

  it("returns 404 for an unknown slug", async () => {
    vi.mocked(updatePost).mockResolvedValue(null);
    expect((await put("secret", VALID)).status).toBe(404);
  });

  it("returns 500 when the database fails", async () => {
    vi.mocked(updatePost).mockRejectedValue(new Error("db down"));
    const response = await put("secret", VALID);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Failed to update post" });
  });
});

describe("DELETE /api/posts/[slug]", () => {
  const del = (password?: string) => DELETE(requestEvent({ path: PATH, method: "DELETE", params: PARAMS, password }));

  it("returns 401 without the right password", async () => {
    expect((await del()).status).toBe(401);
    expect((await del("wrong")).status).toBe(401);
    expect(deletePost).not.toHaveBeenCalled();
  });

  it("deletes the post", async () => {
    vi.mocked(deletePost).mockResolvedValue(true);
    const response = await del("secret");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "Post deleted" });
    expect(deletePost).toHaveBeenCalledWith("hello");
  });

  it("returns 404 for an unknown slug", async () => {
    vi.mocked(deletePost).mockResolvedValue(false);
    expect((await del("secret")).status).toBe(404);
  });

  it("returns 500 when the database fails", async () => {
    vi.mocked(deletePost).mockRejectedValue(new Error("db down"));
    expect((await del("secret")).status).toBe(500);
  });
});
