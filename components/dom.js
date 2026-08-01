export const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const categoryClass = (category) =>
  `cat-${String(category || "learning")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

export const iconSpeak = `
  <span class="ui-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 10v4h3l4 3V7L7 10H4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M15 9.5a3.5 3.5 0 0 1 0 5M17.5 7.5a6 6 0 0 1 0 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  </span>
`;

export const iconStar = (filled) => `
  <span class="ui-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="${filled ? "currentColor" : "none"}">
      <path d="m12 4.2 2.1 4.3 4.7.7-3.4 3.3.8 4.7L12 15.2 7.8 17.2l.8-4.7-3.4-3.3 4.7-.7L12 4.2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
    </svg>
  </span>
`;

export const iconChevron = `
  <span class="ui-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none">
      <path d="m7 10 5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </span>
`;

export const iconShare = `
  <span class="ui-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="18" cy="5" r="2.5" stroke="currentColor" stroke-width="1.8"/>
      <circle cx="6" cy="12" r="2.5" stroke="currentColor" stroke-width="1.8"/>
      <circle cx="18" cy="19" r="2.5" stroke="currentColor" stroke-width="1.8"/>
      <path d="M8.2 10.8 15.8 6.2M8.2 13.2l7.6 4.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  </span>
`;
