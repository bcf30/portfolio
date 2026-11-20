/**
 * Adds the `is-visible` class the first time the element scrolls into view,
 * 100px inside the viewport edge. CSS handles the actual transition.
 */
export function revealOnView(node: HTMLElement) {
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      node.classList.add("is-visible");
      observer.disconnect();
    },
    { rootMargin: "-100px" },
  );
  observer.observe(node);
  return { destroy: () => observer.disconnect() };
}
