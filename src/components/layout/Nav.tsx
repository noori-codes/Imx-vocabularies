import { useEffect, useRef, useState } from "react";
import { useAppShell, type AppPage } from "../../state/appShell";

const NAV_ITEMS: { page: AppPage; label: string; aside?: boolean }[] = [
  { page: "home", label: "Home" },
  { page: "vocabulary", label: "Words" },
  { page: "idioms", label: "Idioms" },
  { page: "topics", label: "Topics" },
  { page: "quiz", label: "Exam" },
  { page: "progress", label: "Progress" },
  { page: "favorites", label: "Favorites", aside: true },
  { page: "data", label: "Data", aside: true },
  { page: "about", label: "About", aside: true },
];

export function Nav() {
  const { activePage, navigate } = useAppShell();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!moreOpen) return;
      if (moreRef.current?.contains(event.target as Node)) return;
      setMoreOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [moreOpen]);

  const go = (page: AppPage) => {
    navigate(page, { replace: false });
    setMoreOpen(false);
  };

  return (
    <nav className="page-nav" aria-label="Main navigation">
      <div className="page-nav__track">
        {NAV_ITEMS.filter((item) => !item.aside).map((item) => (
          <button
            key={item.page}
            type="button"
            className={`nav-link${activePage === item.page ? " active" : ""}`}
            data-page={item.page}
            onClick={() => go(item.page)}
          >
            {item.label}
          </button>
        ))}
        {NAV_ITEMS.filter((item) => item.aside).map((item) => (
          <button
            key={`aside-${item.page}`}
            type="button"
            className={`nav-link nav-link--aside${activePage === item.page ? " active" : ""}`}
            data-page={item.page}
            onClick={() => go(item.page)}
          >
            {item.label}
          </button>
        ))}
        <div className="nav-more" ref={moreRef}>
          <button
            id="navMoreBtn"
            className="nav-link nav-more__btn"
            type="button"
            aria-expanded={moreOpen}
            aria-controls="navMoreMenu"
            onClick={(e) => {
              e.stopPropagation();
              setMoreOpen((o) => !o);
            }}
          >
            More
          </button>
          <div id="navMoreMenu" className="nav-more__menu" hidden={!moreOpen}>
            {NAV_ITEMS.filter((item) => item.aside).map((item) => (
              <button
                key={`more-${item.page}`}
                type="button"
                className={`nav-link${activePage === item.page ? " active" : ""}`}
                data-page={item.page}
                onClick={() => go(item.page)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
