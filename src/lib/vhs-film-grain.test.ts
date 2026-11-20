import { describe, it, expect, vi } from "vitest";
import {
  FRAME_INTERVAL_MS,
  GRAIN_TILE_COUNT,
  GRAIN_TILE_SIZE,
  seededRandom,
  fillGrainTile,
  planFrame,
  drawFrame,
  type FramePlan,
} from "./vhs-film-grain.ts";

const WIDTH = 1440;
const HEIGHT = 900;

/** Plans many consecutive frames, one every 40ms, from a fixed seed. */
function planFrames(count: number, startMs = 0) {
  const random = seededRandom(42);
  return Array.from({ length: count }, (_, i) => planFrame(WIDTH, HEIGHT, startMs + i * FRAME_INTERVAL_MS, random));
}

const EMPTY_PLAN: FramePlan = {
  grainTile: 0,
  grainOffsetX: 10,
  grainOffsetY: 20,
  staticTile: 1,
  staticLines: [],
  trackingBand: null,
  specks: [],
  scratchX: null,
};

describe("frame rate", () => {
  it("is 25 fps", () => {
    expect(1000 / FRAME_INTERVAL_MS).toBe(25);
  });
});

describe("fillGrainTile", () => {
  const pixels = new Uint8ClampedArray(GRAIN_TILE_SIZE * GRAIN_TILE_SIZE * 4);
  fillGrainTile(pixels, seededRandom());
  const alphas = pixels.filter((_, i) => i % 4 === 3);

  it("makes white grain, with its strength in the alpha channel", () => {
    expect(pixels.filter((_, i) => i % 4 !== 3).every((value) => value === 255)).toBe(true);
  });

  it("leaves about half the pixels clear, like grain on dark footage", () => {
    const clear = alphas.filter((a) => a === 0).length / alphas.length;
    expect(clear).toBeGreaterThan(0.4);
    expect(clear).toBeLessThan(0.6);
  });

  it("makes mostly faint grain with a few bright grains", () => {
    const mean = alphas.reduce((sum, a) => sum + a, 0) / alphas.length;
    expect(mean).toBeGreaterThan(5);
    expect(mean).toBeLessThan(40);
    expect(Math.max(...alphas)).toBeGreaterThan(150);
  });
});

describe("planFrame grain", () => {
  it("picks a tile and offset inside the tile set on every frame", () => {
    for (const plan of planFrames(200)) {
      expect(plan.grainTile).toBeGreaterThanOrEqual(0);
      expect(plan.grainTile).toBeLessThan(GRAIN_TILE_COUNT);
      expect(plan.grainOffsetX).toBeLessThan(GRAIN_TILE_SIZE);
      expect(plan.grainOffsetY).toBeLessThan(GRAIN_TILE_SIZE);
    }
  });

  it("almost never repeats the same grain on consecutive frames", () => {
    const frames = planFrames(500);
    const repeats = frames.filter((plan, i) => {
      const previous = frames[i - 1];
      return previous && plan.grainTile === previous.grainTile && plan.grainOffsetX === previous.grainOffsetX && plan.grainOffsetY === previous.grainOffsetY;
    });
    expect(repeats).toHaveLength(0);
  });

  it("shifts the grain both across and down, over the whole tile", () => {
    const frames = planFrames(500);
    for (const axis of ["grainOffsetX", "grainOffsetY"] as const) {
      const offsets = frames.map((plan) => plan[axis]);
      expect(new Set(offsets).size).toBeGreaterThan(100);
      expect(Math.min(...offsets)).toBeLessThan(GRAIN_TILE_SIZE * 0.1);
      expect(Math.max(...offsets)).toBeGreaterThan(GRAIN_TILE_SIZE * 0.9);
    }
  });

  it("uses every grain tile", () => {
    expect(new Set(planFrames(200).map((plan) => plan.grainTile)).size).toBe(GRAIN_TILE_COUNT);
  });

  it("is reproducible from a seed", () => {
    expect(planFrame(WIDTH, HEIGHT, 0, seededRandom(7))).toEqual(planFrame(WIDTH, HEIGHT, 0, seededRandom(7)));
  });
});

describe("planFrame VHS static lines", () => {
  const frames = planFrames(1000, 6000); // after the tracking band, so only static lines count

  it("averages about one thin line per frame, with many frames clean", () => {
    const counts = frames.map((plan) => plan.staticLines.length);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    expect(mean).toBeGreaterThan(0.5);
    expect(mean).toBeLessThan(1.2);
    expect(counts.filter((c) => c === 0).length).toBeGreaterThan(300);
    expect(Math.max(...counts)).toBeLessThanOrEqual(3);
  });

  it("keeps every line on screen, 1-2px tall and faint", () => {
    for (const line of frames.flatMap((plan) => plan.staticLines)) {
      expect(line.y).toBeGreaterThanOrEqual(0);
      expect(line.y).toBeLessThan(HEIGHT);
      expect(line.x).toBeGreaterThanOrEqual(0);
      expect(line.x + line.width).toBeLessThanOrEqual(WIDTH + 0.001);
      expect([1, 2]).toContain(line.height);
      expect(line.alpha).toBeLessThanOrEqual(0.32);
    }
  });
});

describe("planFrame tracking band", () => {
  const bandAt = (timeMs: number) => planFrame(WIDTH, HEIGHT, timeMs, seededRandom()).trackingBand;

  it("starts just above the top of the screen", () => {
    const band = bandAt(0)!;
    expect(band.y + band.height).toBeCloseTo(0, 5);
  });

  it("rolls downwards over 5 seconds", () => {
    const positions = [500, 1500, 2500, 3500, 4500].map((t) => bandAt(t)!.y);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(bandAt(4999)!.y).toBeGreaterThan(HEIGHT - 5);
  });

  it("is gone for the rest of the 14 second cycle, then comes back", () => {
    expect(bandAt(5000)).toBeNull();
    expect(bandAt(13_999)).toBeNull();
    expect(bandAt(14_000)).not.toBeNull();
  });

  it("is about 7% of the screen tall and carries a few streaks", () => {
    const band = bandAt(2000)!;
    expect(band.height).toBeCloseTo(HEIGHT * 0.07, 5);
    expect(band.lines.length).toBeGreaterThanOrEqual(3);
    expect(band.lines.length).toBeLessThanOrEqual(6);
    for (const line of band.lines) {
      expect(line.y).toBeGreaterThanOrEqual(Math.floor(band.y));
      expect(line.y).toBeLessThanOrEqual(band.y + band.height);
    }
  });
});

describe("planFrame film artifacts", () => {
  const frames = planFrames(2000);

  it("shows dust on roughly 30% of frames, never more than 2 specks", () => {
    const withDust = frames.filter((plan) => plan.specks.length > 0).length / frames.length;
    expect(withDust).toBeGreaterThan(0.2);
    expect(withDust).toBeLessThan(0.4);
    expect(Math.max(...frames.map((plan) => plan.specks.length))).toBeLessThanOrEqual(2);
  });

  it("keeps specks small and on screen", () => {
    for (const speck of frames.flatMap((plan) => plan.specks)) {
      expect(speck.x).toBeGreaterThanOrEqual(WIDTH * 0.075);
      expect(speck.x).toBeLessThanOrEqual(WIDTH * 0.925);
      expect(speck.radius).toBeLessThanOrEqual(1.6);
    }
  });

  it("flickers a vertical scratch on only a few percent of frames", () => {
    const withScratch = frames.filter((plan) => plan.scratchX !== null);
    expect(withScratch.length / frames.length).toBeLessThan(0.08);
    expect(withScratch.length).toBeGreaterThan(0);
    for (const plan of withScratch) expect(plan.scratchX).toBeLessThan(WIDTH);
  });
});

describe("drawFrame", () => {
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
      globalAlpha: 1,
      fillStyle: "" as unknown,
    };
  }
  const tiles = Array.from({ length: GRAIN_TILE_COUNT }, (_, i) => ({ tile: i }) as unknown as CanvasPattern);
  const draw = (plan: FramePlan) => {
    const ctx = fakeContext();
    drawFrame(ctx as unknown as CanvasRenderingContext2D, plan, tiles, WIDTH, HEIGHT);
    return ctx;
  };

  it("clears the previous frame, then covers the whole screen with the chosen grain tile", () => {
    const ctx = draw({ ...EMPTY_PLAN, grainTile: 3 });
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, WIDTH, HEIGHT);
    expect(ctx.clearRect.mock.invocationCallOrder[0]).toBeLessThan(ctx.fillRect.mock.invocationCallOrder[0]);
    // Shifted by the offset so the tile lands in a new position each frame
    expect(ctx.translate).toHaveBeenCalledWith(-10, -20);
    expect(ctx.fillRect).toHaveBeenCalledWith(10, 20, WIDTH, HEIGHT);
    expect(ctx.fillRect).toHaveBeenCalledTimes(1);
  });

  it("draws each static line as noise plus a white wash", () => {
    const line = { x: 100, y: 300, width: 600, height: 2, alpha: 0.2 };
    const ctx = draw({ ...EMPTY_PLAN, staticLines: [line] });
    const lineFills = ctx.fillRect.mock.calls.filter(([, , w, h]) => w === 600 && h === 2);
    expect(lineFills).toHaveLength(2);
  });

  it("draws the tracking band in thin slices across the full width", () => {
    const ctx = draw({ ...EMPTY_PLAN, trackingBand: { y: 400, height: 60, lines: [] } });
    const slices = ctx.fillRect.mock.calls.filter(([, , w, h]) => w === WIDTH && h === 2);
    expect(slices).toHaveLength(30);
  });

  it("draws dust specks as circles and the scratch as a 1px full-height line", () => {
    const ctx = draw({ ...EMPTY_PLAN, specks: [{ x: 50, y: 60, radius: 1, alpha: 0.3 }], scratchX: 700 });
    expect(ctx.arc).toHaveBeenCalledWith(50, 60, 1, 0, Math.PI * 2);
    expect(ctx.fillRect).toHaveBeenCalledWith(700, 0, 1, HEIGHT);
  });

  it("leaves the canvas at full opacity for the next draw", () => {
    expect(draw({ ...EMPTY_PLAN, specks: [{ x: 1, y: 1, radius: 1, alpha: 0.3 }] }).globalAlpha).toBe(1);
  });

  it("only clears when there are no tiles (canvas patterns unsupported)", () => {
    const ctx = fakeContext();
    drawFrame(ctx as unknown as CanvasRenderingContext2D, EMPTY_PLAN, [], WIDTH, HEIGHT);
    expect(ctx.clearRect).toHaveBeenCalled();
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });
});
