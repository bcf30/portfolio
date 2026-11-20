import { describe, it, expect } from "vitest";
import { formatPostDate } from "./format-date.ts";

describe("formatPostDate", () => {
  it("formats the long style used on the blog pages", () => {
    expect(formatPostDate("2026-04-07T16:00:00Z")).toBe("April 7, 2026");
  });

  it("formats the short style used on the admin page", () => {
    expect(formatPostDate("2026-04-07T16:00:00Z", "short")).toBe("2026-04-07");
  });

  it("uses Toronto time, so 02:00 UTC is still the previous day", () => {
    expect(formatPostDate("2026-04-07T02:00:00Z")).toBe("April 6, 2026");
    expect(formatPostDate(new Date("2026-04-07T02:00:00Z"), "short")).toBe("2026-04-06");
  });
});
