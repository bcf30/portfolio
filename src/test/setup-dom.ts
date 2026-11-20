// jsdom has no layout engine, so these browser APIs are missing.
// Assigned directly (not vi.stubGlobal) so `unstubGlobals` doesn't remove them between tests;
// tests that care about them stub their own versions.

class StubIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
globalThis.IntersectionObserver ??= StubIntersectionObserver as unknown as typeof IntersectionObserver;

Element.prototype.scrollTo ??= function scrollTo() {};

// jsdom logs "Not implemented" for canvas; behave like a browser without canvas support instead
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
