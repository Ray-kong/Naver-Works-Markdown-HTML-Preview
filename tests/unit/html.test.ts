import { describe, expect, it } from "vitest";
import { createSafeHtmlDocument } from "../../src/render/html";

describe("HTML attachment preview safety", () => {
  it("preserves static report content and inline styling", () => {
    const html = createSafeHtmlDocument(`<!doctype html><html><head><style>h1{color:red}</style></head>
      <body><h1>Report</h1><img src="data:image/png;base64,AA=="></body></html>`);

    expect(html).toContain("<h1>Report</h1>");
    expect(html).toContain("h1{color:red}");
    expect(html).toContain("data:image/png;base64,AA==");
  });

  it("blocks active content, navigation controls, and remote subresources", () => {
    const html = createSafeHtmlDocument(`<!doctype html><html><head>
      <meta http-equiv="refresh" content="0;url=https://attacker.invalid">
      <base href="https://attacker.invalid/"><link rel="stylesheet" href="https://attacker.invalid/x.css">
      </head><body onload="alert(1)"><script>alert(1)</script>
      <iframe src="https://attacker.invalid"></iframe><form action="https://attacker.invalid"><input></form>
      <img src="https://attacker.invalid/pixel"><a href="javascript:alert(1)">bad</a>
      <a href="https://example.com/report">safe</a></body></html>`);

    expect(html).not.toMatch(/<script|<iframe|onload=|action=|attacker\.invalid|javascript:/i);
    expect(html).toContain("default-src 'none'");
    expect(html).toContain('href="https://example.com/report"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
