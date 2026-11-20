import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";

const state = vi.hoisted(() => ({ page: { url: new URL("http://localhost/") } }));
vi.mock("$app/state", () => state);

import FilmEffect from "./FilmEffect.svelte";

/** A fingerprint of the specks currently drawn, to tell frames apart. */
const frameSignature = (root: HTMLElement) =>
  [...root.querySelectorAll("rect")].map((rect) => `${rect.getAttribute("x")}|${rect.getAttribute("opacity")}`).join(",");

async function scrollElementTo(element: HTMLElement, scrollTop: number) {
  Object.defineProperty(element, "scrollTop", { value: scrollTop, configurable: true });
  await fireEvent.scroll(element);
}

beforeEach(() => {
  state.page.url = new URL("http://localhost/");
  // Run the throttled update immediately instead of on the next frame
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  });
});

describe("FilmEffect", () => {
  it("draws between 30 and 45 specks on the homepage", () => {
    const { container } = render(FilmEffect);
    const count = container.querySelectorAll("rect").length;
    expect(count).toBeGreaterThanOrEqual(30);
    expect(count).toBeLessThanOrEqual(45);
  });

  it.each(["/blog", "/blog/some-post", "/admin/blog"])("is hidden on %s", (path) => {
    state.page.url = new URL(`http://localhost${path}`);
    const { container } = render(FilmEffect);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("draws the same frame on every render, so server and browser HTML match", () => {
    const first = frameSignature(render(FilmEffect).container);
    const second = frameSignature(render(FilmEffect).container);
    expect(second).toBe(first);
  });

  it("changes frame every 160px of scrolling and loops after 8 frames", async () => {
    const { container } = render(FilmEffect);
    const scroller = document.createElement("div");
    document.body.appendChild(scroller);

    const frame0 = frameSignature(container);
    await scrollElementTo(scroller, 159);
    expect(frameSignature(container)).toBe(frame0);

    await scrollElementTo(scroller, 160);
    const frame1 = frameSignature(container);
    expect(frame1).not.toBe(frame0);

    await scrollElementTo(scroller, 160 * 8);
    expect(frameSignature(container)).toBe(frame0);

    await scrollElementTo(scroller, 160 * 9);
    expect(frameSignature(container)).toBe(frame1);
    scroller.remove();
  });

  it("still draws a frame for negative scroll positions (Safari overscroll)", async () => {
    const { container } = render(FilmEffect);
    const scroller = document.createElement("div");
    document.body.appendChild(scroller);
    await scrollElementTo(scroller, -160);
    expect(container.querySelectorAll("rect").length).toBeGreaterThan(0);
    scroller.remove();
  });
});
