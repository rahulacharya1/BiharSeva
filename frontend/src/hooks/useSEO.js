import { useEffect } from "react";

const SITE_NAME = "BiharSeva";
const DEFAULT_DESCRIPTION =
  "Bihar's leading civic engagement platform for issue reporting, NSS volunteer management, and community action.";

/**
 * useSEO — Sets document title and meta tags for the current page.
 *
 * @param {object} options
 * @param {string} options.title - Page title (auto-appended with " | BiharSeva")
 * @param {string} [options.description] - Meta description for search engines
 * @param {string} [options.keywords] - Comma-separated keywords
 * @param {boolean} [options.noIndex] - If true, tells crawlers not to index this page
 */
export function useSEO({ title, description, keywords, noIndex = false }) {
  useEffect(() => {
    // ── Title ────────────────────────────────────────────────
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;

    // ── Meta description ────────────────────────────────────
    const desc = description || DEFAULT_DESCRIPTION;
    setMeta("description", desc);
    setMeta("og:title", fullTitle);
    setMeta("og:description", desc);
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", desc);

    // ── Keywords ────────────────────────────────────────────
    if (keywords) {
      setMeta("keywords", keywords);
    }

    // ── Robots ──────────────────────────────────────────────
    if (noIndex) {
      setMeta("robots", "noindex, nofollow");
    } else {
      removeMeta("robots");
    }

    // Cleanup: restore defaults on unmount
    return () => {
      document.title = SITE_NAME;
      setMeta("description", DEFAULT_DESCRIPTION);
      setMeta("og:title", SITE_NAME);
      setMeta("og:description", DEFAULT_DESCRIPTION);
      setMeta("twitter:title", SITE_NAME);
      setMeta("twitter:description", DEFAULT_DESCRIPTION);
      removeMeta("robots");
    };
  }, [title, description, keywords, noIndex]);
}

// ── Helpers ─────────────────────────────────────────────────

function setMeta(nameOrProperty, content) {
  // Try name-based first, then property-based (for og: tags)
  const isProperty = nameOrProperty.startsWith("og:") || nameOrProperty.startsWith("twitter:");
  const attr = isProperty ? "property" : "name";

  let el = document.querySelector(`meta[${attr}="${nameOrProperty}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, nameOrProperty);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeMeta(nameOrProperty) {
  const isProperty = nameOrProperty.startsWith("og:") || nameOrProperty.startsWith("twitter:");
  const attr = isProperty ? "property" : "name";
  const el = document.querySelector(`meta[${attr}="${nameOrProperty}"]`);
  if (el) {
    el.remove();
  }
}
