// "VHS static over grainy film": every frame shows fresh film grain across the whole screen,
// plus a few VHS artifacts (snowy static lines, an occasional rolling tracking band) and the
// odd film artifact (a dust speck, a vertical scratch). planFrame decides what a frame contains;
// drawFrame paints it. Both take their inputs explicitly so they can be tested without a browser.

export const FRAME_INTERVAL_MS = 40; // 25 fps
export const GRAIN_TILE_SIZE = 256;
export const GRAIN_TILE_COUNT = 8;

const GRAIN_ALPHA = 0.16;
const TRACKING_CYCLE_MS = 14_000; // a tracking band rolls down the screen once every 14s...
const TRACKING_ROLL_MS = 5_000; // ...taking 5s to cross it
const TRACKING_BAND_MIN_HEIGHT = 24;
const TRACKING_PEAK_ALPHA = 0.14;
const TRACKING_SLICE_HEIGHT = 2;

export type Random = () => number;

export interface StaticLine {
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
}

export interface Speck {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

export interface TrackingBand {
  y: number;
  height: number;
  lines: StaticLine[];
}

export interface FramePlan {
  grainTile: number;
  grainOffsetX: number;
  grainOffsetY: number;
  staticTile: number;
  staticLines: StaticLine[];
  trackingBand: TrackingBand | null;
  specks: Speck[];
  scratchX: number | null;
}

/** Same linear congruential generator the original effect used; for tests and reproducible output. */
export function seededRandom(seed = 12345): Random {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/** Fills RGBA pixels with white grain whose alpha is the grain's strength. */
export function fillGrainTile(pixels: Uint8ClampedArray, random: Random): void {
  for (let i = 0; i < pixels.length; i += 4) {
    // Averaging three samples gives a bell-shaped spread: mostly faint grain, few bright grains
    const density = (random() + random() + random()) / 3;
    const strength = Math.max(0, density - 0.5) * 2;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = 255;
    pixels[i + 3] = Math.round(strength ** 1.5 * 255);
  }
}

export function planFrame(width: number, height: number, timeMs: number, random: Random): FramePlan {
  return {
    grainTile: Math.floor(random() * GRAIN_TILE_COUNT),
    grainOffsetX: Math.floor(random() * GRAIN_TILE_SIZE),
    grainOffsetY: Math.floor(random() * GRAIN_TILE_SIZE),
    staticTile: Math.floor(random() * GRAIN_TILE_COUNT),
    staticLines: planStaticLines(width, height, random),
    trackingBand: planTrackingBand(width, height, timeMs, random),
    specks: planSpecks(width, height, random),
    // A faint vertical scratch flickers in on about 1 frame in 25
    scratchX: random() < 0.04 ? Math.floor(random() * width) : null,
  };
}

// Usually 0-1 thin snowy lines per frame, occasionally 2-3
function planStaticLines(width: number, height: number, random: Random): StaticLine[] {
  const roll = random();
  const count = roll < 0.45 ? 0 : roll < 0.8 ? 1 : roll < 0.95 ? 2 : 3;
  return Array.from({ length: count }, () => planLine(width, random() * height, random, 0.12, 0.2, 2));
}

function planLine(width: number, y: number, random: Random, minAlpha: number, alphaRange: number, maxHeight: number): StaticLine {
  const fullWidth = random() < 0.6;
  const lineWidth = fullWidth ? width : width * (0.2 + random() * 0.6);
  return {
    x: fullWidth ? 0 : random() * (width - lineWidth),
    y: Math.floor(y),
    width: lineWidth,
    height: 1 + Math.floor(random() * maxHeight),
    alpha: minAlpha + random() * alphaRange,
  };
}

// Rolls from just above the top to just below the bottom, then is absent until the next cycle
function planTrackingBand(width: number, height: number, timeMs: number, random: Random): TrackingBand | null {
  const phase = timeMs % TRACKING_CYCLE_MS;
  if (phase >= TRACKING_ROLL_MS) return null;
  const bandHeight = Math.max(TRACKING_BAND_MIN_HEIGHT, height * 0.07);
  const y = -bandHeight + (phase / TRACKING_ROLL_MS) * (height + bandHeight);
  const lineCount = 3 + Math.floor(random() * 4);
  const lines = Array.from({ length: lineCount }, () => planLine(width, y + random() * bandHeight, random, 0.05, 0.08, 1));
  return { y, height: bandHeight, lines };
}

// Dust on the film: nothing on most frames, 1-2 specks on about 30% of them
function planSpecks(width: number, height: number, random: Random): Speck[] {
  if (random() >= 0.3) return [];
  const count = 1 + Math.floor(random() * 2);
  // Slight (15%) pull towards the centre, kept from the original speck effect
  const towardCentre = (value: number) => value + (0.5 - value) * 0.15;
  return Array.from({ length: count }, () => ({
    x: towardCentre(random()) * width,
    y: towardCentre(random()) * height,
    radius: 0.5 + random() * 1.1,
    alpha: 0.25 + random() * 0.3,
  }));
}

/** Paints one planned frame. `tiles` are repeating patterns built from fillGrainTile output. */
export function drawFrame(ctx: CanvasRenderingContext2D, plan: FramePlan, tiles: CanvasPattern[], width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
  if (tiles.length === 0) return;
  ctx.globalAlpha = GRAIN_ALPHA;
  fillWithTile(ctx, tiles[plan.grainTile % tiles.length], plan.grainOffsetX, plan.grainOffsetY, 0, 0, width, height);
  const staticTile = tiles[plan.staticTile % tiles.length];
  for (const line of plan.staticLines) drawStaticLine(ctx, staticTile, line, plan);
  if (plan.trackingBand) drawTrackingBand(ctx, staticTile, plan.trackingBand, width, plan);
  drawFilmArtifacts(ctx, plan, height);
  ctx.globalAlpha = 1;
}

// Shifting the pattern by a random offset each frame makes 8 tiles look like endless fresh grain
function fillWithTile(ctx: CanvasRenderingContext2D, tile: CanvasPattern, offsetX: number, offsetY: number, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.translate(-offsetX, -offsetY);
  ctx.fillStyle = tile;
  ctx.fillRect(x + offsetX, y + offsetY, w, h);
  ctx.restore();
}

// Snowy noise plus a faint white wash, so the line reads as a bright streak of static
function drawStaticLine(ctx: CanvasRenderingContext2D, tile: CanvasPattern, line: StaticLine, plan: FramePlan) {
  ctx.globalAlpha = Math.min(1, line.alpha * 4);
  fillWithTile(ctx, tile, plan.grainOffsetY, plan.grainOffsetX, line.x, line.y, line.width, line.height);
  ctx.globalAlpha = line.alpha * 0.35;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(line.x, line.y, line.width, line.height);
}

// Drawn in thin slices whose strength peaks mid-band, so the band has soft edges instead of a hard box
function drawTrackingBand(ctx: CanvasRenderingContext2D, tile: CanvasPattern, band: TrackingBand, width: number, plan: FramePlan) {
  for (let offset = 0; offset < band.height; offset += TRACKING_SLICE_HEIGHT) {
    const strength = Math.sin((Math.PI * (offset + TRACKING_SLICE_HEIGHT / 2)) / band.height);
    ctx.globalAlpha = TRACKING_PEAK_ALPHA * strength;
    fillWithTile(ctx, tile, plan.grainOffsetX, plan.grainOffsetY, 0, band.y + offset, width, TRACKING_SLICE_HEIGHT);
  }
  for (const line of band.lines) drawStaticLine(ctx, tile, line, plan);
}

function drawFilmArtifacts(ctx: CanvasRenderingContext2D, plan: FramePlan, height: number) {
  ctx.fillStyle = "#ffffff";
  for (const speck of plan.specks) {
    ctx.globalAlpha = speck.alpha;
    ctx.beginPath();
    ctx.arc(speck.x, speck.y, speck.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  if (plan.scratchX !== null) {
    ctx.globalAlpha = 0.07;
    ctx.fillRect(plan.scratchX, 0, 1, height);
  }
}

/** Builds the repeating grain tiles. Returns an empty list if the browser can't draw to a canvas. */
export function createGrainTiles(ctx: CanvasRenderingContext2D, random: Random): CanvasPattern[] {
  const tiles: CanvasPattern[] = [];
  for (let i = 0; i < GRAIN_TILE_COUNT; i++) {
    const tileCanvas = document.createElement("canvas");
    tileCanvas.width = tileCanvas.height = GRAIN_TILE_SIZE;
    const tileCtx = tileCanvas.getContext("2d");
    if (!tileCtx) return [];
    const image = tileCtx.createImageData(GRAIN_TILE_SIZE, GRAIN_TILE_SIZE);
    fillGrainTile(image.data, random);
    tileCtx.putImageData(image, 0, 0);
    const pattern = ctx.createPattern(tileCanvas, "repeat");
    if (pattern) tiles.push(pattern);
  }
  return tiles;
}

/**
 * Sizes the canvas to the window (1 canvas pixel per CSS pixel, so each grain is about
 * one CSS pixel) and redraws at 25 fps. Returns a function that stops everything.
 */
export function startGrainAnimation(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, random: Random = Math.random): () => void {
  const tiles = createGrainTiles(ctx, random);
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  const startedAt = performance.now();
  const draw = () => drawFrame(ctx, planFrame(canvas.width, canvas.height, performance.now() - startedAt, random), tiles, canvas.width, canvas.height);
  resize();
  draw();
  const interval = setInterval(draw, FRAME_INTERVAL_MS);
  window.addEventListener("resize", resize);
  return () => {
    clearInterval(interval);
    window.removeEventListener("resize", resize);
  };
}
