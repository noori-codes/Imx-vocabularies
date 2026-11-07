export function EmptyState({
  title,
  detail,
  hasLibrary = true,
  showClear = false,
  onClearFilters,
}: {
  title: string;
  detail: string;
  hasLibrary?: boolean;
  showClear?: boolean;
  onClearFilters?: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-flourish" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{detail}</p>
      {hasLibrary && showClear ? (
        <p>
          <button type="button" className="ghost-btn" onClick={onClearFilters}>
            Clear search &amp; filters
          </button>
        </p>
      ) : null}
    </div>
  );
}
