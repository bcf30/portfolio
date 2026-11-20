import { describe, it, expect } from "vitest";
import { renderMarkdown } from "./markdown.ts";

describe("renderMarkdown", () => {
  it("renders basic markdown", () => {
    const html = renderMarkdown("# Title\n\nSome **bold** and *italic* text.");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });

  it("supports GitHub-flavoured tables, strikethrough and task lists", () => {
    const html = renderMarkdown("| a | b |\n| - | - |\n| 1 | 2 |\n\n~~gone~~\n\n- [x] done");
    expect(html).toContain("<table>");
    expect(html).toContain("<td>1</td>");
    expect(html).toContain("<del>gone</del>");
    expect(html).toContain('type="checkbox"');
  });

  it("autolinks bare URLs", () => {
    expect(renderMarkdown("see https://example.com")).toContain('<a href="https://example.com">');
  });

  it("shows raw HTML as text instead of rendering it", () => {
    const html = renderMarkdown('<script>alert("x")</script>\n\nhi <b onclick="x()">there</b>');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b ");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;b onclick=");
  });

  it.each(["javascript:alert(1)", "JavaScript:alert(1)", " javascript:alert(1)", "data:text/html,hi", "vbscript:x"])(
    "removes unsafe link URL %s",
    (href) => {
      const html = renderMarkdown(`[click](${href})`);
      expect(html.toLowerCase()).not.toContain(href.trim().toLowerCase().split(":")[0] + ":");
      expect(html).toContain('href=""');
    },
  );

  it("removes unsafe image URLs", () => {
    expect(renderMarkdown("![x](javascript:alert(1))")).not.toContain("javascript:");
  });

  it.each([
    ["https://example.com", 'href="https://example.com"'],
    ["http://example.com", 'href="http://example.com"'],
    ["mailto:me@example.com", 'href="mailto:me@example.com"'],
    ["/blog/other-post", 'href="/blog/other-post"'],
    ["#section", 'href="#section"'],
    ["../relative", 'href="../relative"'],
  ])("keeps safe link URL %s", (href, expected) => {
    expect(renderMarkdown(`[link](${href})`)).toContain(expected);
  });

  it("keeps https images", () => {
    expect(renderMarkdown("![alt](https://blob.example/cover.png)")).toContain('<img src="https://blob.example/cover.png" alt="alt"');
  });
});
