import { useAppShell } from "../../state/appShell";

export function Topbar() {
  const { searchTerm, setSearchTerm, theme, toggleTheme } = useAppShell();
  const isLight = theme === "light";

  return (
    <header className="topbar">
      <div className="brand">
        <img src="IMX-logo.png" alt="IMX logo" />
        <div className="brand-copy">
          <p className="brand-mark">IMX</p>
          <p className="brand-sub">English Study Journal</p>
        </div>
      </div>
      <div className="topbar-actions">
        <label className="search-box" htmlFor="globalSearchInput">
          <span className="ui-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16.5 16.5 20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <input
            id="globalSearchInput"
            type="search"
            placeholder="Search words, topics, or lesson idioms"
            autoComplete="off"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>
        <button
          id="themeToggle"
          className="theme-toggle"
          type="button"
          aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
          onClick={toggleTheme}
        >
          <span className="ui-icon theme-icon-dark" aria-hidden="true" hidden={!isLight}>
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M19 13.5A7.5 7.5 0 1 1 10.5 5 6 6 0 0 0 19 13.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="ui-icon theme-icon-light" aria-hidden="true" hidden={isLight}>
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </button>
      </div>
    </header>
  );
}
