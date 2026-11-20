const STORAGE_KEY = "film-grain";

// Shared between the toggle on the homepage and FilmEffect in the root layout.
// Only mutated in the browser (clicks and loadFilmGrainPreference), so the server
// always renders the default and no state leaks between requests.
export const filmGrain = $state({ enabled: true });

/** Restores the visitor's saved choice. Without one, starts off for reduced-motion users. */
export function loadFilmGrainPreference() {
  const saved = readSaved();
  if (saved !== null) {
    filmGrain.enabled = saved === "on";
    return;
  }
  filmGrain.enabled = !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function setFilmGrainEnabled(enabled: boolean) {
  filmGrain.enabled = enabled;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Storage blocked (e.g. some private modes): the choice lasts for this visit only
  }
}

function readSaved(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
