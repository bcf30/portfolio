import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";

const state = vi.hoisted(() => ({
  page: {
    url: new URL("http://localhost/blog/hello"),
    route: { id: "/blog/[slug]" },
    data: {} as { meta?: { title: string; description?: string } },
  },
}));
const env = vi.hoisted(() => ({ dev: false, browser: true }));

vi.mock("$app/state", () => state);
vi.mock("$app/env", () => env);
// Run the navigation callback straight away, as if the first navigation just finished
vi.mock("$app/navigation", () => ({ afterNavigate: (callback: () => void) => callback() }));
vi.mock("@vercel/analytics", () => ({ inject: vi.fn(), pageview: vi.fn() }));

import Layout from "./+layout.svelte";
import { inject, pageview } from "@vercel/analytics";

const children = createRawSnippet(() => ({ render: () => "<p>page content</p>" }));

beforeEach(() => {
  state.page.data = {};
  env.dev = false;
});

describe("root layout", () => {
  it("renders the page inside it", () => {
    render(Layout, { props: { children } });
    expect(screen.getByText("page content")).toBeTruthy();
  });

  it("starts Vercel Analytics in production mode with automatic tracking off", () => {
    render(Layout, { props: { children } });
    expect(inject).toHaveBeenCalledWith({ mode: "production", framework: "sveltekit", disableAutoTrack: true });
  });

  it("uses development mode in dev", () => {
    env.dev = true;
    render(Layout, { props: { children } });
    expect(inject).toHaveBeenCalledWith(expect.objectContaining({ mode: "development" }));
  });

  it("reports each page view with its route pattern, so posts group together", () => {
    render(Layout, { props: { children } });
    expect(pageview).toHaveBeenCalledWith({ route: "/blog/[slug]", path: "/blog/hello" });
  });

  it("uses the default title and description", () => {
    render(Layout, { props: { children } });
    expect(document.title).toBe("Ramiro Chen | Portfolio");
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "Ramiro Chen's portfolio. Inspired by several filmmakers I look fondly to",
    );
  });

  it("lets a page override the title and description", () => {
    state.page.data = { meta: { title: "My Post | Ramiro Chen", description: "About my post" } };
    render(Layout, { props: { children } });
    expect(document.title).toBe("My Post | Ramiro Chen");
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute("content")).toBe("About my post");
  });
});
