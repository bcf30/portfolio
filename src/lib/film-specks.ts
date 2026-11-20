// Film grain specks: every frame is a fresh random set, so the flicker never loops.
// On top of the plain specks there's a rare bigger dust speck and, once every few
// seconds, a faint 1px line of static. Pure functions so they can be tested directly.

export const FRAME_INTERVAL_MS = 40; // 25 fps

const MIN_SPECKS = 30;
const MAX_SPECKS = 45;
const DUST_CHANCE = 0.03; // per speck: about 1 dust speck per frame
const STATIC_LINE_CHANCE = 0.015; // per frame: roughly one faint line every 2-3 seconds

export type Random = () => number;

/** Position in % of the screen, size in px. */
export interface Speck {
  x: number;
  y: number;
  size: number;
  opacity: number;
}

/** Position and width in % of the screen; always 1px tall. */
export interface StaticLine {
  x: number;
  y: number;
  width: number;
  opacity: number;
}

export interface FilmFrame {
  specks: Speck[];
  staticLine: StaticLine | null;
}

export const EMPTY_FRAME: FilmFrame = { specks: [], staticLine: null };

export function planFilmFrame(random: Random): FilmFrame {
  const count = MIN_SPECKS + Math.floor(random() * (MAX_SPECKS - MIN_SPECKS + 1));
  return {
    specks: Array.from({ length: count }, () => planSpeck(random)),
    staticLine: random() < STATIC_LINE_CHANCE ? planStaticLine(random) : null,
  };
}

// Very slight (15%) pull towards the centre, kept from the original effect
const towardCentre = (value: number) => value + (0.5 - value) * 0.15;

function planSpeck(random: Random): Speck {
  const x = towardCentre(random()) * 100;
  const y = towardCentre(random()) * 100;
  if (random() < DUST_CHANCE) {
    return { x, y, size: 2.4 + random() * 1.2, opacity: 0.2 + random() * 0.15 };
  }
  // Same size and brightness range as the original specks
  return { x, y, size: 0.6 + random() * 2.4, opacity: 0.15 + random() * 0.25 };
}

function planStaticLine(random: Random): StaticLine {
  const width = 20 + random() * 50;
  return { x: random() * (100 - width), y: random() * 100, width, opacity: 0.05 + random() * 0.07 };
}
