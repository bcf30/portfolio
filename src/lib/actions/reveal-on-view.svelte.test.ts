import { describe, it, expect, vi, beforeEach } from "vitest";
import { revealOnView } from "./reveal-on-view.ts";

// Records what the action registers so the test can play the observer's role
let observerCallback: IntersectionObserverCallback;
let observerOptions: IntersectionObserverInit | undefined;
const observe = vi.fn();
const disconnect = vi.fn();

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        observerCallback = callback;
        observerOptions = options;
      }
      observe = observe;
      disconnect = disconnect;
    },
  );
});

const fireIntersection = (isIntersecting: boolean) =>
  observerCallback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);

describe("revealOnView", () => {
  it("watches the element with a 100px margin", () => {
    const node = document.createElement("div");
    revealOnView(node);
    expect(observe).toHaveBeenCalledWith(node);
    expect(observerOptions).toEqual({ rootMargin: "-100px" });
  });

  it("does nothing while the element is off screen", () => {
    const node = document.createElement("div");
    revealOnView(node);
    fireIntersection(false);
    expect(node.classList.contains("is-visible")).toBe(false);
    expect(disconnect).not.toHaveBeenCalled();
  });

  it("marks the element visible once and stops watching", () => {
    const node = document.createElement("div");
    revealOnView(node);
    fireIntersection(true);
    expect(node.classList.contains("is-visible")).toBe(true);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("stops watching when the element is removed", () => {
    const node = document.createElement("div");
    revealOnView(node).destroy();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
