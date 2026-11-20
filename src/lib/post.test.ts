import { describe, it, expect } from "vitest";
import { parsePostInput } from "./post.ts";

describe("parsePostInput", () => {
  it("accepts a title and content and keeps the optional fields", () => {
    expect(parsePostInput({ title: "T", content: "C", excerpt: "E", cover_image: "https://x/y.png" })).toEqual({
      title: "T",
      content: "C",
      excerpt: "E",
      cover_image: "https://x/y.png",
    });
  });

  it("stores empty or missing optional fields as null", () => {
    expect(parsePostInput({ title: "T", content: "C", excerpt: "", cover_image: "" })).toEqual({
      title: "T",
      content: "C",
      excerpt: null,
      cover_image: null,
    });
    expect(parsePostInput({ title: "T", content: "C" })).toMatchObject({ excerpt: null, cover_image: null });
  });

  it.each([
    ["missing title", { content: "C" }],
    ["empty title", { title: "", content: "C" }],
    ["missing content", { title: "T" }],
    ["empty content", { title: "T", content: "" }],
    ["non-string title", { title: 42, content: "C" }],
    ["null body", null],
    ["string body", "hello"],
  ])("rejects %s", (_label, body) => {
    expect(parsePostInput(body)).toBeNull();
  });

  it("ignores extra fields such as the admin form's coverImage", () => {
    const parsed = parsePostInput({ title: "T", content: "C", coverImage: "x", slug: "evil" });
    expect(parsed).toEqual({ title: "T", content: "C", excerpt: null, cover_image: null });
  });
});
