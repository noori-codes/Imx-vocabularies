import { Moon, Search, Sun } from "lucide-react";
import { useAppShell } from "../../state/appShell";

export function Topbar() {
  const { searchTerm, setSearchTerm, theme, toggleTheme, navigate } = useAppShell();
  const isLight = theme === "light";

  return (
    <header className="topbar">
      <button
        type="button"
        className="brand brand--mobile"
        onClick={() => navigate("home", { replace: false })}
      >
        <img src="IMX-logo.png" alt="" />
        <div className="brand-copy">
          <p className="brand-mark">IMX</p>
          <p className="brand-sub">English Hub</p>
        </div>
      </button>
      <div className="topbar-actions">
        <label className="search-box" htmlFor="globalSearchInput">
          <Search className="ui-icon" size={18} aria-hidden="true" />
          <input
            id="globalSearchInput"
            type="search"
            placeholder="Search words, topics, idioms…"
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
          {isLight ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
