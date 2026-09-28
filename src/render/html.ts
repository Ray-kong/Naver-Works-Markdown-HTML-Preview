import DOMPurify from "dompurify";
import { isSafeUrl } from "./sanitize";

const HTML_PREVIEW_CSP = [
  "default-src 'none'",
  "base-uri 'none'",
  "connect-src 'none'",
  "font-src data:",
  "form-action 'none'",
  "frame-src 'none'",
  "img-src data: blob:",
  "media-src data: blob:",
  "object-src 'none'",
  "script-src 'none'",
  "style-src 'unsafe-inline'"
].join("; ");

export const createSafeHtmlDocument = (source: string): string => {
  const sanitized = DOMPurify.sanitize(source, {
    WHOLE_DOCUMENT: true,
    FORBID_TAGS: ["base", "embed", "frame", "frameset", "iframe", "object", "portal", "script"],
    FORBID_ATTR: ["action", "formaction", "ping", "srcdoc", "srcset"]
  });
  const parsed = new DOMParser().parseFromString(sanitized, "text/html");

  for (const element of parsed.querySelectorAll<HTMLElement>("[src]")) {
    const src = element.getAttribute("src")?.trim() ?? "";
    if (!/^data:(?:image|font|audio|video)\//i.test(src) && !src.startsWith("blob:")) {
      element.removeAttribute("src");
    }
  }
  for (const link of parsed.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    const href = link.getAttribute("href");
    if (!href || !isSafeUrl(href)) {
      link.removeAttribute("href");
      continue;
    }
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  }
  for (const meta of parsed.querySelectorAll("meta[http-equiv]")) meta.remove();

  const csp = parsed.createElement("meta");
  csp.httpEquiv = "Content-Security-Policy";
  csp.content = HTML_PREVIEW_CSP;
  parsed.head.prepend(csp);
  return `<!doctype html>\n${parsed.documentElement.outerHTML}`;
};
