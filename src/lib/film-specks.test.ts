import { describe, it, expect } from "vitest";
import { FRAME_INTERVAL_MS, planFilmFrame, type Random } from "./film-specks.ts";

/**
 * Mulberry32, a seeded generator with a 2^32 period, so runs are reproducible. (The original
 * effect's generator repeats after 233,280 numbers; 2,500 frames use about 500,000.)
 */
function seededRandom(seed = 12345): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = seededRandom(42);
const frames = Array.from({ length: 2500 }, () => planFilmFrame(random)); // 100 seconds at 25 fps
const specks = frames.flatMap((frame) => frame.specks);
const signature = (frame: (typeof frames)[number]) => frame.specks.map((s) => `${s.x.toFixed(3)},${s.y.toFixed(3)}`).join(";");

describe("frame rate", () => {
  it("is 25 fps", () => {
    expect(1000 / FRAME_INTERVAL_MS).toBe(25);
  });
});

describe("specks", () => {
  it("draws between 30 and 45 per frame, like the original", () => {
    for (const frame of frames) {
      expect(frame.specks.length).toBeGreaterThanOrEqual(30);
      expect(frame.specks.length).toBeLessThanOrEqual(45);
    }
  });

  it("stays on screen, pulled slightly towards the centre", () => {
    for (const speck of specks) {
      expect(speck.x).toBeGreaterThanOrEqual(7.5);
      expect(speck.x).toBeLessThanOrEqual(92.5);
      expect(speck.y).toBeGreaterThanOrEqual(7.5);
      expect(speck.y).toBeLessThanOrEqual(92.5);
    }
  });

  it("stays small and faint: at most 3.6px and 40% opacity", () => {
    for (const speck of specks) {
      expect(speck.size).toBeGreaterThanOrEqual(0.6);
      expect(speck.size).toBeLessThanOrEqual(3.6);
      expect(speck.opacity).toBeGreaterThanOrEqual(0.15);
      expect(speck.opacity).toBeLessThanOrEqual(0.4);
    }
  });

  it("is mostly ordinary grain, with only about 3% bigger dust specks", () => {
    const dust = specks.filter((speck) => speck.size > 3).length / specks.length;
    expect(dust).toBeGreaterThan(0.01);
    expect(dust).toBeLessThan(0.06);
  });
});

describe("randomness", () => {
  it("never shows the same frame twice", () => {
    expect(new Set(frames.map(signature)).size).toBe(frames.length);
  });

  it("moves every speck between frames instead of jittering fixed points", () => {
    // The old effect nudged 45 fixed specks by up to 4%; here consecutive frames share nothing
    for (let i = 1; i < 100; i++) {
      const previous = frames[i - 1].specks;
      const close = frames[i].specks.filter((speck, j) => previous[j] && Math.abs(speck.x - previous[j].x) < 4 && Math.abs(speck.y - previous[j].y) < 4);
      expect(close.length).toBeLessThan(frames[i].specks.length / 4);
    }
  });

  it("spreads specks over the whole screen over time", () => {
    const columns = new Set(specks.map((speck) => Math.floor(speck.x / 10)));
    const rows = new Set(specks.map((speck) => Math.floor(speck.y / 10)));
    expect(columns.size).toBe(10);
    expect(rows.size).toBe(10);
  });
});

describe("static line", () => {
  const lines = frames.flatMap((frame) => (frame.staticLine ? [frame.staticLine] : []));

  it("appears on only about 1.5% of frames (one every 2-3 seconds)", () => {
    expect(lines.length / frames.length).toBeGreaterThan(0.005);
    expect(lines.length / frames.length).toBeLessThan(0.03);
  });

  it("is faint, partial-width and on screen", () => {
    for (const line of lines) {
      expect(line.opacity).toBeLessThanOrEqual(0.12);
      expect(line.width).toBeGreaterThanOrEqual(20);
      expect(line.width).toBeLessThanOrEqual(70);
      expect(line.x).toBeGreaterThanOrEqual(0);
      expect(line.x + line.width).toBeLessThanOrEqual(100);
      expect(line.y).toBeLessThanOrEqual(100);
    }
  });

  it("never shows up two frames in a row", () => {
    // With a 1.5% chance per frame this is rare enough to treat as a regression if it happens often
    const backToBack = frames.filter((frame, i) => frame.staticLine && frames[i - 1]?.staticLine).length;
    expect(backToBack).toBeLessThanOrEqual(2);
  });
});
