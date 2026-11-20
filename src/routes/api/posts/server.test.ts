import { describe, it, expect, vi, beforeEach } from "vitest";
import { requestEvent } from "../../../test/request-event.ts";

vi.mock("$app/env/private", () => ({ ADMIN_PASSWORD_HASH: "secret", ADMIN_PASSWORD: undefined }));
vi.mock("#lib/server/posts.ts", () => ({ listPosts: vi.fn(), createPost: vi.fn() }));

import { GET, POST } from "./+server.ts";
import { listPosts, createPost } from "#lib/server/posts.ts";

const POSTS = [{ slug: "a" }, { slug: "b" }, { slug: "c" }];

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/posts", () => {
  it("returns every post", async () => {
    vi.mocked(listPosts).mockResolvedValue(POSTS as never);
    const response = await GET(requestEvent({ path: "/api/posts" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(POSTS);
  });

  it("applies ?limit", async () => {
    vi.mocked(listPosts).mockResolvedValue(POSTS as never);
    const response = await GET(requestEvent({ path: "/api/posts?limit=2" }));
    expect(await response.json()).toEqual(POSTS.slice(0, 2));
  });

  it("returns 500 when the database fails", async () => {
    vi.mocked(listPosts).mockRejectedValue(new Error("db down"));
    const response = await GET(requestEvent({ path: "/api/posts" }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Failed to fetch posts" });
  });
});

describe("POST /api/posts", () => {
  const VALID = { title: "Hello", content: "Body", excerpt: "", cover_image: null };

  it.each([
    ["no password", undefined],
    ["a wrong password", "wrong"],
  ])("returns 401 with %s and never touches the database", async (_label, password) => {
    const response = await POST(requestEvent({ path: "/api/posts", method: "POST", password, json: VALID }));
    expect(response.status).toBe(401);
    expect(createPost).not.toHaveBeenCalled();
  });

  it("returns 400 when the title or content is missing", async () => {
    const response = await POST(requestEvent({ path: "/api/posts", method: "POST", password: "secret", json: { title: "Hello" } }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Title and content are required" });
    expect(createPost).not.toHaveBeenCalled();
  });

  it("creates the post and returns 201", async () => {
    vi.mocked(createPost).mockResolvedValue({ slug: "hello" } as never);
    const response = await POST(requestEvent({ path: "/api/posts", method: "POST", password: "secret", json: VALID }));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ slug: "hello" });
    expect(createPost).toHaveBeenCalledWith({ title: "Hello", content: "Body", excerpt: null, cover_image: null });
  });

  it("returns 500 for a body that isn't JSON", async () => {
    const response = await POST(requestEvent({ path: "/api/posts", method: "POST", password: "secret", body: "not json" }));
    expect(response.status).toBe(500);
  });

  it("returns 500 when the database fails", async () => {
    vi.mocked(createPost).mockRejectedValue(new Error("db down"));
    const response = await POST(requestEvent({ path: "/api/posts", method: "POST", password: "secret", json: VALID }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Failed to create post" });
  });
});
