import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";

const state = vi.hoisted(() => ({ page: { url: new URL("http://localhost/") } }));
vi.mock("$app/state", () => state);

import FilmEffect from "./FilmEffect.svelte";
import { filmGrain, setFilmGrainEnabled } from "#lib/film-grain.svelte.ts";

/** A fingerprint of the specks currently drawn, to tell frames apart. */
const frameSignature = (root: HTMLElement) =>
  [...root.querySelectorAll("rect")].map((rect) => `${rect.getAttribute("x")}|${rect.getAttribute("opacity")}`).join(",");

async function advanceFrames(count: number) {
  for (let i = 0; i < count; i++) {
    vi.advanceTimersByTime(100);
    await tick();
  }
}

/** Pretends the visitor's OS asks for reduced motion (jsdom has no matchMedia). */
const prefersReducedMotion = (reduce: boolean) =>
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: reduce && query.includes("reduce") }));

beforeEach(() => {
  vi.useFakeTimers();
  state.page.url = new URL("http://localhost/");
  filmGrain.enabled = true;
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

// Spies on FilmEffect's own interval. vi.getTimerCount() can't be used here because
// jsdom's localStorage schedules a setTimeout to fire `storage` events.
function watchIntervals() {
  return { setInterval: vi.spyOn(globalThis, "setInterval"), clearInterval: vi.spyOn(globalThis, "clearInterval") };
}

describe("FilmEffect drawing", () => {
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

  it("draws the same first frame on every render, so server and browser HTML match", () => {
    const first = frameSignature(render(FilmEffect).container);
    const second = frameSignature(render(FilmEffect).container);
    expect(second).toBe(first);
  });
});

describe("FilmEffect animation", () => {
  it("moves to a new frame every 100ms (10 fps) without any scrolling", async () => {
    const { container } = render(FilmEffect);
    const frame0 = frameSignature(container);

    vi.advanceTimersByTime(99);
    await tick();
    expect(frameSignature(container)).toBe(frame0);

    vi.advanceTimersByTime(1);
    await tick();
    expect(frameSignature(container)).not.toBe(frame0);
  });

  it("shows 8 different frames, then loops", async () => {
    const { container } = render(FilmEffect);
    const frames = [frameSignature(container)];
    for (let i = 1; i < 8; i++) {
      await advanceFrames(1);
      frames.push(frameSignature(container));
    }
    expect(new Set(frames).size).toBe(8);

    await advanceFrames(1);
    expect(frameSignature(container)).toBe(frames[0]);
  });

  it("ignores scrolling", async () => {
    const { container } = render(FilmEffect);
    const frame0 = frameSignature(container);
    Object.defineProperty(document.documentElement, "scrollTop", { value: 5000, configurable: true });
    await fireEvent.scroll(window);
    await fireEvent.scroll(document.body);
    expect(frameSignature(container)).toBe(frame0);
  });
});

describe("turning the grain off and on", () => {
  it("removes the specks and stops the timer when turned off", async () => {
    const intervals = watchIntervals();
    const { container } = render(FilmEffect);
    expect(intervals.setInterval).toHaveBeenCalledTimes(1);
    const intervalId = intervals.setInterval.mock.results[0].value;

    setFilmGrainEnabled(false);
    await tick();

    expect(container.querySelector("svg")).toBeNull();
    expect(intervals.clearInterval).toHaveBeenCalledWith(intervalId);
    expect(intervals.setInterval).toHaveBeenCalledTimes(1);
  });

  it("brings them back and resumes animating when turned on again", async () => {
    const { container } = render(FilmEffect);
    setFilmGrainEnabled(false);
    await tick();
    setFilmGrainEnabled(true);
    await tick();
    const frame = frameSignature(container);
    expect(frame).not.toBe("");
    await advanceFrames(1);
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
