import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";
import HomePage from "./+page.svelte";

/** The div the homepage scrolls inside (the window itself never scrolls). */
function scrollContainer(): HTMLDivElement {
  const element = document.querySelector<HTMLDivElement>("div.overflow-y-auto, div.hidden");
  if (!element) throw new Error("scroll container not found");
  return element;
}

/** jsdom has no layout, so give the container fixed scroll dimensions. */
function setScrollGeometry(element: HTMLElement, { scrollTop = 0, scrollHeight = 2000, clientHeight = 1000 } = {}) {
  Object.defineProperty(element, "scrollTop", { value: scrollTop, configurable: true });
  Object.defineProperty(element, "scrollHeight", { value: scrollHeight, configurable: true });
  Object.defineProperty(element, "clientHeight", { value: clientHeight, configurable: true });
}

afterEach(() => {
  history.replaceState(null, "", "/");
});

describe("homepage content", () => {
  it("shows both jobs, newest first, with no 'Present' left over", () => {
    render(HomePage);
    const companies = screen.getAllByText(/^(TerreSky|taq Automotive Intelligence)$/).map((el) => el.textContent);
    expect(companies).toEqual(["TerreSky", "taq Automotive Intelligence"]);
    expect(screen.getByText("Geospatial AI Engineer, Co-op")).toBeTruthy();
    expect(screen.getByText("September 2026 — December 2026")).toBeTruthy();
    expect(screen.getByText("January 2026 — April 2026")).toBeTruthy();
    expect(screen.getByText("Python, JS, GCP, VLMs")).toBeTruthy();
    expect(screen.queryByText(/Present/)).toBeNull();
  });

  it("links every project card to its repo in a new tab", () => {
    render(HomePage);
    const link = screen.getByRole("link", { name: /McDonaldsPy/ });
    expect(link.getAttribute("href")).toBe("https://github.com/bcf30/mcdonaldspy");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("hides the GitHub icon only for the E-Bike Battery card", () => {
    render(HomePage);
    expect(screen.getByRole("link", { name: /E-Bike Battery/ }).querySelector("svg")).toBeNull();
    expect(screen.getByRole("link", { name: /McDonaldsPy/ }).querySelector("svg")).not.toBeNull();
  });
});

describe("project hover previews", () => {
  it("fades a project's screenshot in on hover and out on leave", async () => {
    render(HomePage);
    const preview = screen.getByAltText("Preview of McDonaldsPy project").parentElement!;
    const other = screen.getByAltText("Preview of trans-writes project").parentElement!;
    expect(preview.style.opacity).toBe("0");

    await fireEvent.mouseEnter(screen.getByRole("link", { name: /McDonaldsPy/ }));
    expect(preview.style.opacity).toBe("0.6");
    expect(other.style.opacity).toBe("0");

    await fireEvent.mouseLeave(screen.getByRole("link", { name: /McDonaldsPy/ }));
    expect(preview.style.opacity).toBe("0");
  });
});

describe("frequency scrollbar", () => {
  it("starts at 0Hz and follows the scroll position", async () => {
    render(HomePage);
    expect(screen.getByText("0Hz")).toBeTruthy();

    const container = scrollContainer();
    setScrollGeometry(container, { scrollTop: 1000 }); // scrolled to the bottom
    await fireEvent.scroll(container);
    expect(screen.getByText("20.0kHz")).toBeTruthy();

    setScrollGeometry(container, { scrollTop: 25 }); // 2.5%, inside the 0-20Hz padding zone
    await fireEvent.scroll(container);
    expect(screen.getByText("10Hz")).toBeTruthy();
  });

  // Bar spans y=100..900 on screen; the page has 1000px of scrollable distance
  function setUpBar(root: HTMLElement) {
    const container = scrollContainer();
    setScrollGeometry(container);
    const scrollTo = vi.spyOn(container, "scrollTo");
    const bar = root.querySelector<HTMLDivElement>(".select-none")!;
    vi.spyOn(bar, "getBoundingClientRect").mockReturnValue({ top: 100, height: 800 } as DOMRect);
    return { bar, scrollTo };
  }

  it("scrolls to the matching spot when the bar is clicked", async () => {
    const { bar, scrollTo } = setUpBar(render(HomePage).container);
    await fireEvent.mouseDown(bar, { clientY: 300 }); // a quarter of the way down
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 250, behavior: "auto" });
  });

  it("follows a drag, clamps at the ends, and stops on mouseup", async () => {
    const { bar, scrollTo } = setUpBar(render(HomePage).container);
    await fireEvent.mouseDown(bar, { clientY: 100 });
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: "auto" });

    await fireEvent.mouseMove(window, { clientY: 700 }); // three quarters
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 750, behavior: "auto" });

    await fireEvent.mouseMove(window, { clientY: 5000 }); // below the bar
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 1000, behavior: "auto" });

    await fireEvent.mouseMove(window, { clientY: -50 }); // above the bar
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: "auto" });

    await fireEvent.mouseUp(window);
    const callsAfterRelease = scrollTo.mock.calls.length;
    await fireEvent.mouseMove(window, { clientY: 500 });
    expect(scrollTo).toHaveBeenCalledTimes(callsAfterRelease);
  });
});

describe("navigation header", () => {
  it("smooth-scrolls the container to a section instead of jumping", async () => {
    render(HomePage);
    const container = scrollContainer();
    const scrollTo = vi.spyOn(container, "scrollTo");
    Object.defineProperty(document.getElementById("bio")!, "offsetTop", { value: 1234 });

    const link = screen.getByRole("link", { name: "bio" });
    const notPrevented = await fireEvent.click(link);

    expect(notPrevented).toBe(false); // default hash jump was cancelled
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 1234, behavior: "smooth" });
  });

  it("scrolls back to the top for 'home'", async () => {
    render(HomePage);
    const scrollTo = vi.spyOn(scrollContainer(), "scrollTo");
    await fireEvent.click(screen.getByRole("link", { name: "home" }));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: "smooth" });
  });
});

describe("portal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  async function openPortal() {
    render(HomePage);
    await fireEvent.click(screen.getByRole("button", { name: "Open portal" }));
  }

  async function advanceSeconds(seconds: number) {
    for (let i = 0; i < seconds; i++) {
      vi.advanceTimersByTime(1000);
      await tick();
    }
  }

  it("hides the homepage and shows a 15:00 countdown", async () => {
    await openPortal();
    expect(screen.getByText("time remaining")).toBeTruthy();
    expect(screen.getByText("15:00")).toBeTruthy();
    expect(scrollContainer().classList.contains("hidden")).toBe(true);
  });

  it("counts down once per second", async () => {
    await openPortal();
    await advanceSeconds(1);
    expect(screen.getByText("14:59")).toBeTruthy();
    await advanceSeconds(60);
    expect(screen.getByText("13:59")).toBeTruthy();
  });

  it("returns home with the timer reset when '← home' is clicked", async () => {
    await openPortal();
    await advanceSeconds(5);
    await fireEvent.click(screen.getByRole("button", { name: /home/ }));

    expect(screen.queryByText("time remaining")).toBeNull();
    expect(scrollContainer().classList.contains("hidden")).toBe(false);

    await fireEvent.click(screen.getByRole("button", { name: "Open portal" }));
    expect(screen.getByText("15:00")).toBeTruthy();
  });

  it("sends the visitor home when the countdown reaches 0:00", async () => {
    await openPortal();
    await advanceSeconds(900);
    await tick();
    expect(screen.queryByText("time remaining")).toBeNull();
    expect(scrollContainer().classList.contains("hidden")).toBe(false);
  });

  it("starts the page from the top again on return", async () => {
    await openPortal();
    const scrollTo = vi.spyOn(scrollContainer(), "scrollTo");
    await fireEvent.click(screen.getByRole("button", { name: /home/ }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
    expect(screen.getByText("0Hz")).toBeTruthy();
  });
});

describe("loading /#section directly", () => {
  it("scrolls the container to that section after load", async () => {
    vi.useFakeTimers();
    history.replaceState(null, "", "/#contact");
    render(HomePage);
    const container = scrollContainer();
    const scrollTo = vi.spyOn(container, "scrollTo");
    Object.defineProperty(document.getElementById("contact")!, "offsetTop", { value: 4321 });

    vi.advanceTimersByTime(100);

    expect(scrollTo).toHaveBeenLastCalledWith({ top: 4321, behavior: "auto" });
    vi.useRealTimers();
  });
});
