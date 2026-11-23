import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import FilmGrainToggle from "./FilmGrainToggle.svelte";
import { filmGrain } from "#lib/film-grain.svelte.ts";

beforeEach(() => {
  filmGrain.enabled = true;
  localStorage.clear();
});

const toggle = () => screen.getByRole("switch", { name: "Filter" });

describe("FilmGrainToggle", () => {
  it("is an accessible switch that shows the current state", () => {
    render(FilmGrainToggle);
    expect(toggle().getAttribute("aria-checked")).toBe("true");
  });

  it("turns the grain off and on, remembering the choice", async () => {
    render(FilmGrainToggle);

    await fireEvent.click(toggle());
    expect(filmGrain.enabled).toBe(false);
    expect(toggle().getAttribute("aria-checked")).toBe("false");
    expect(localStorage.getItem("film-grain")).toBe("off");

    await fireEvent.click(toggle());
    expect(filmGrain.enabled).toBe(true);
    expect(toggle().getAttribute("aria-checked")).toBe("true");
    expect(localStorage.getItem("film-grain")).toBe("on");
  });

  it("sits beside the portal door by default, or in the corner when asked", () => {
    const { unmount } = render(FilmGrainToggle);
    expect(toggle().className).toContain("left-16");
    unmount();
    render(FilmGrainToggle, { props: { placement: "corner" } });
    expect(toggle().className).toContain("left-6");
    expect(toggle().className).toContain("bottom-6");
  });

  it("still toggles when the browser blocks storage", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(FilmGrainToggle);
    await fireEvent.click(toggle());
    expect(filmGrain.enabled).toBe(false);
  });
});
