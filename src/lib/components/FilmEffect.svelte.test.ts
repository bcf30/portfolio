import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";

const state = vi.hoisted(() => ({ page: { url: new URL("http://localhost/") } }));
vi.mock("$app/state", () => state);

import FilmEffect from "./FilmEffect.svelte";
import { filmGrain, setFilmGrainEnabled } from "#lib/film-grain.svelte.ts";

// A recording 2D context; jsdom has no real canvas
function fakeContext() {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    putImageData: vi.fn(),
    createPattern: vi.fn(() => ({})),
    createImageData: vi.fn((w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) })),
    globalAlpha: 1,
    fillStyle: "" as unknown,
  };
}

let mainContext: ReturnType<typeof fakeContext>;

/** Frames drawn so far on the visible canvas (each frame starts with one clearRect). */
const framesDrawn = () => mainContext.clearRect.mock.calls.length;

async function advance(ms: number) {
  vi.advanceTimersByTime(ms);
  await tick();
}

/** Pretends the visitor's OS asks for reduced motion (jsdom has no matchMedia). */
const prefersReducedMotion = (reduce: boolean) =>
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: reduce && query.includes("reduce") }));

beforeEach(() => {
  vi.useFakeTimers();
  state.page.url = new URL("http://localhost/");
  filmGrain.enabled = true;
  localStorage.clear();
  mainContext = fakeContext();
  // The on-screen canvas gets `mainContext`; the off-screen grain tiles each get their own
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (this: HTMLCanvasElement) {
    return (this.isConnected ? mainContext : fakeContext()) as never;
  });
});

afterEach(() => {
  vi.useRealTimers();
});

// FilmEffect's own interval. vi.getTimerCount() isn't usable: jsdom's localStorage schedules timeouts.
function watchIntervals() {
  return { setInterval: vi.spyOn(globalThis, "setInterval"), clearInterval: vi.spyOn(globalThis, "clearInterval") };
}

describe("FilmEffect layers", () => {
  it("covers the screen with a canvas and scanlines, without blocking clicks", () => {
    const { container } = render(FilmEffect);
    const overlay = container.querySelector("div")!;
    expect(overlay.className).toContain("fixed inset-0");
    expect(overlay.className).toContain("pointer-events-none");
    expect(overlay.querySelector("canvas")).not.toBeNull();
    expect(overlay.innerHTML).toContain("repeating-linear-gradient");
  });

  it.each(["/blog", "/blog/some-post", "/admin/blog"])("is hidden on %s", (path) => {
    state.page.url = new URL(`http://localhost${path}`);
    const { container } = render(FilmEffect);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("sizes the canvas to the window and follows resizes", async () => {
    const { container } = render(FilmEffect);
    const canvas = container.querySelector("canvas")!;
    expect([canvas.width, canvas.height]).toEqual([window.innerWidth, window.innerHeight]);

    vi.stubGlobal("innerWidth", 800);
    vi.stubGlobal("innerHeight", 600);
    await fireEvent(window, new Event("resize"));
    expect([canvas.width, canvas.height]).toEqual([800, 600]);
  });

  it("builds 8 grain tiles once, not on every frame", async () => {
    render(FilmEffect);
    expect(mainContext.createPattern).toHaveBeenCalledTimes(8);
    await advance(400);
    expect(mainContext.createPattern).toHaveBeenCalledTimes(8);
  });
});

describe("FilmEffect animation", () => {
  it("draws a frame straight away, then one every 40ms (25 fps)", async () => {
    render(FilmEffect);
    expect(framesDrawn()).toBe(1);
    await advance(39);
    expect(framesDrawn()).toBe(1);
    await advance(1);
    expect(framesDrawn()).toBe(2);
    await advance(1000);
    expect(framesDrawn()).toBe(27);
  });

  it("ignores scrolling", async () => {
    render(FilmEffect);
    await fireEvent.scroll(window);
    await fireEvent.scroll(document.body);
    expect(framesDrawn()).toBe(1);
  });

  it("shows nothing, and doesn't animate, if the browser can't draw on a canvas", () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
    const intervals = watchIntervals();
    render(FilmEffect);
    expect(intervals.setInterval).not.toHaveBeenCalled();
  });
});

describe("turning the grain off and on", () => {
  it("removes the overlay and stops the timer when turned off", async () => {
    const intervals = watchIntervals();
    const { container } = render(FilmEffect);
    expect(intervals.setInterval).toHaveBeenCalledTimes(1);
    const intervalId = intervals.setInterval.mock.results[0].value;

    setFilmGrainEnabled(false);
    await tick();

    expect(container.querySelector("canvas")).toBeNull();
    expect(intervals.clearInterval).toHaveBeenCalledWith(intervalId);
  });

  it("starts animating again when turned back on", async () => {
    render(FilmEffect);
    setFilmGrainEnabled(false);
    await tick();
    setFilmGrainEnabled(true);
    await tick();
    const before = framesDrawn();
    await advance(80);
    expect(framesDrawn()).toBe(before + 2);
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
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("starts off for visitors who prefer reduced motion", async () => {
    prefersReducedMotion(true);
    const { container } = render(FilmEffect);
    await tick();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("lets a saved 'on' win over the reduced-motion default", async () => {
    prefersReducedMotion(true);
    localStorage.setItem("film-grain", "on");
    const { container } = render(FilmEffect);
    await tick();
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("starts on for everyone else", async () => {
    prefersReducedMotion(false);
    const { container } = render(FilmEffect);
    await tick();
    expect(container.querySelector("canvas")).not.toBeNull();
  });
});
