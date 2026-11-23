import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import BlogLayout from "./+layout.svelte";
import { filmGrain } from "#lib/film-grain.svelte.ts";

const children = createRawSnippet(() => ({ render: () => "<p>blog content</p>" }));

beforeEach(() => {
  filmGrain.enabled = true;
  localStorage.clear();
});

describe("blog layout", () => {
  it("renders the blog page with the filter switch in the bottom-left corner", () => {
    render(BlogLayout, { props: { children } });
    expect(screen.getByText("blog content")).toBeTruthy();
    const toggle = screen.getByRole("switch", { name: "Filter" });
    expect(toggle.className).toContain("bottom-6");
    expect(toggle.className).toContain("left-6");
  });

  it("controls the same setting as the homepage switch", async () => {
    render(BlogLayout, { props: { children } });
    await fireEvent.click(screen.getByRole("switch", { name: "Filter" }));
    expect(filmGrain.enabled).toBe(false);
    expect(localStorage.getItem("film-grain")).toBe("off");
  });
});
