// Post dates are shown in Toronto time regardless of where the server or reader is,
// so the server-rendered and hydrated text always match.
const TIME_ZONE = "America/Toronto";

/** "long" gives "November 20, 2026"; "short" gives "2026-11-20". */
export function formatPostDate(value: Date | string, style: "long" | "short" = "long"): string {
  const options: Intl.DateTimeFormatOptions =
    style === "long" ? { year: "numeric", month: "long", day: "numeric", timeZone: TIME_ZONE } : { timeZone: TIME_ZONE };
  return new Date(value).toLocaleDateString("en-CA", options);
}
