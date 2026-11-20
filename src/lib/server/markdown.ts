import { Marked } from "marked";

// Same allow-list as react-markdown's default: relative URLs plus these schemes.
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const SAFE_SCHEME = /^(https?|mailto|ircs?|xmpp):/i;

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  return !HAS_SCHEME.test(trimmed) || SAFE_SCHEME.test(trimmed);
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Matches the old react-markdown behaviour: raw HTML in a post is shown as text,
// and links/images with schemes like javascript: are dropped.
const markdown = new Marked({
  gfm: true,
  renderer: {
    html: ({ text }) => escapeHtml(text),
  },
  walkTokens: (token) => {
    if ((token.type === "link" || token.type === "image") && !isSafeUrl(token.href)) {
      token.href = "";
    }
  },
});

export function renderMarkdown(source: string): string {
  return markdown.parse(source, { async: false });
}
