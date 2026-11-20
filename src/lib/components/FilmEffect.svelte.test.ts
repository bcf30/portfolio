import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";

const state = vi.hoisted(() => ({ page: { url: new URL("http://localhost/") } }));
vi.mock("$app/state", () => state);

import FilmEffect from "./FilmEffect.svelte";
import { filmGrain, setFilmGrainEnabled } from "#lib/film-grain.svelte.ts";

/** A fingerprint of the specks currently drawn, to tell frames apart. */
const frameSignature = (root: HTMLElement) =>
  [...root.querySelectorAll("rect:not([data-static-line])")].map((rect) => `${rect.getAttribute("x")}|${rect.getAttribute("opacity")}`).join(",");

async function advance(ms: number) {
  vi.advanceTimersByTime(ms);
  await tick();
}

/** Pretends the visitor's OS asks for reduced motion (jsdom has no matchMedia). */
const prefersReducedMotion = (reduce: boolean) =>
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: reduce && query.includes("reduce") }));

// FilmEffect's own interval. vi.getTimerCount() isn't usable: jsdom's localStorage schedules timeouts.
function watchIntervals() {
  return { setInterval: vi.spyOn(globalThis, "setInterval"), clearInterval: vi.spyOn(globalThis, "clearInterval") };
}

beforeEach(() => {
  vi.useFakeTimers();
  state.page.url = new URL("http://localhost/");
  filmGrain.enabled = true;
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("FilmEffect drawing", () => {
  it("draws 30-45 white specks over the page without blocking clicks", () => {
    const { container } = render(FilmEffect);
    const overlay = container.querySelector("div")!;
    expect(overlay.className).toContain("fixed inset-0");
    expect(overlay.className).toContain("pointer-events-none");
    const count = container.querySelectorAll("rect").length;
    expect(count).toBeGreaterThanOrEqual(30);
    expect(count).toBeLessThanOrEqual(46); // 45 specks plus the occasional static line
  });

  it.each(["/blog", "/blog/some-post", "/admin/blog"])("is hidden on %s", (path) => {
    state.page.url = new URL(`http://localhost${path}`);
    const { container } = render(FilmEffect);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("draws a faint static line on the frames that have one", async () => {
    // Every Math.random() call returns 0.001: below the line's 1.5% chance, so this frame has one
    vi.spyOn(Math, "random").mockReturnValue(0.001);
    const { container } = render(FilmEffect);
    const line = container.querySelector("rect[data-static-line]");
    expect(line).not.toBeNull();
    expect(line!.getAttribute("height")).toBe("1");
    expect(Number(line!.getAttribute("opacity"))).toBeLessThanOrEqual(0.12);
  });
});

describe("FilmEffect animation", () => {
  it("draws a new random frame every 40ms (25 fps) without any scrolling", async () => {
    const { container } = render(FilmEffect);
    const frame0 = frameSignature(container);

    await advance(39);
    expect(frameSignature(container)).toBe(frame0);

    await advance(1);
    expect(frameSignature(container)).not.toBe(frame0);
  });

  it("never repeats a frame over 10 seconds, so there's no loop", async () => {
    const { container } = render(FilmEffect);
    const seen = new Set([frameSignature(container)]);
    for (let i = 0; i < 250; i++) {
      await advance(40);
      seen.add(frameSignature(container));
    }
    expect(seen.size).toBe(251);
  });

  it("ignores scrolling", async () => {
    const { container } = render(FilmEffect);
    const frame0 = frameSignature(container);
    await fireEvent.scroll(window);
    await fireEvent.scroll(document.body);
    expect(frameSignature(container)).toBe(frame0);
  });
});

describe("turning the filter off and on", () => {
  it("removes the specks and stops the timer when turned off", async () => {
    const intervals = watchIntervals();
    const { container } = render(FilmEffect);
    expect(intervals.setInterval).toHaveBeenCalledTimes(1);
    const intervalId = intervals.setInterval.mock.results[0].value;

    setFilmGrainEnabled(false);
    await tick();

    expect(container.querySelector("svg")).toBeNull();
    expect(intervals.clearInterval).toHaveBeenCalledWith(intervalId);
  });

  it("brings them back and resumes animating when turned on again", async () => {
    const { container } = render(FilmEffect);
    setFilmGrainEnabled(false);
    await tick();
    setFilmGrainEnabled(true);
    await tick();
    const frame = frameSignature(container);
    expect(frame).not.toBe("");
    await advance(40);
    expect(frameSignature(container)).not.toBe(frame);
  });

  it("doesn't run a timer on the blog, where it's hidden anyway", () => {
    state.page.url = new URL("http://localhost/blog");
    const intervals = watchIntervals();
    render(FilmEffect);
    expect(intervals.setInterval).not.toHaveBeenCalled();
  });
});

describe("remembered preference", () => {
  it("starts off when the visitor turned it off on a previous visit", async () => {
    localStorage.setItem("film-grain", "off");
    const { container } = render(FilmEffect);
    await tick();
    expect(container.querySelector("svg")).toBeNull();
  });

  it("starts off for visitors who prefer reduced motion", async () => {
    prefersReducedMotion(true);
    const { container } = render(FilmEffect);
    await tick();
    expect(container.querySelector("svg")).toBeNull();
  });

  it("lets a saved 'on' win over the reduced-motion default", async () => {
    prefersReducedMotion(true);
    localStorage.setItem("film-grain", "on");
    const { container } = render(FilmEffect);
    await tick();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("starts on for everyone else", async () => {
    prefersReducedMotion(false);
    const { container } = render(FilmEffect);
    await tick();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
