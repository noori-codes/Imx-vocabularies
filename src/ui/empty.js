/** Shared empty-state flourish used across library pages. */

export const EMPTY_FLOURISH = `
  <div class="empty-flourish" aria-hidden="true">
    <span></span><span></span><span></span>
  </div>
`;

export const emptyStateWithFiltersHint = (title, detail, options = {}) => {
  const {
    hasLibrary = true,
    filteredBySearch = false,
    showClear = filteredBySearch,
  } = options;
  const extra =
    hasLibrary && showClear
      ? `<p><button type="button" class="ghost-btn" data-clear-filters>Clear search &amp; filters</button></p>`
      : "";
  return `${EMPTY_FLOURISH}<h3>${title}</h3><p>${detail}</p>${extra}`;
};
