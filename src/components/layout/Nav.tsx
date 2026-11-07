import { useEffect, useRef, useState } from "react";
import {
  Home,
  BookOpen,
  MessageSquareQuote,
  Layers,
  Sparkles,
  ChartNoAxesCombined,
  Star,
  Database,
  Info,
  Ellipsis,
} from "lucide-react";
import { useAppShell, type AppPage } from "../../state/appShell";

export const NAV_ITEMS: {
  page: AppPage;
  label: string;
  icon: typeof Home;
  aside?: boolean;
}[] = [
  { page: "home", label: "Home", icon: Home },
  { page: "vocabulary", label: "Words", icon: BookOpen },
  { page: "idioms", label: "Idioms", icon: MessageSquareQuote },
  { page: "topics", label: "Topics", icon: Layers },
  { page: "quiz", label: "Exam", icon: Sparkles },
  { page: "progress", label: "Progress", icon: ChartNoAxesCombined },
  { page: "favorites", label: "Saved", icon: Star, aside: true },
  { page: "data", label: "Data", icon: Database, aside: true },
  { page: "about", label: "About", icon: Info, aside: true },
];

function useNavNav() {
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

  return {
    activePage,
    navigate,
    moreOpen,
    setMoreOpen,
    moreRef,
    go,
    primary: NAV_ITEMS.filter((item) => !item.aside),
    aside: NAV_ITEMS.filter((item) => item.aside),
  };
}

/** Desktop left rail — hidden below 900px via CSS */
export function NavRail() {
  const { activePage, navigate, go, primary, aside } = useNavNav();

  return (
    <aside className="nav-rail" aria-label="Primary navigation">
      <button
        type="button"
        className="nav-rail__brand"
        onClick={() => navigate("home", { replace: false })}
      >
        <img src="IMX-logo.png" alt="" />
        <div className="nav-rail__brand-copy">
          <span className="nav-rail__mark">IMX</span>
          <span className="nav-rail__sub">Study lab</span>
        </div>
      </button>

      <nav className="nav-rail__nav">
        <p className="nav-rail__section">Learn</p>
        {primary.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.page;
          return (
            <button
              key={item.page}
              type="button"
              className={`rail-item${active ? " active" : ""}`}
              data-page={item.page}
              onClick={() => go(item.page)}
              aria-current={active ? "page" : undefined}
            >
              <span className="rail-item__icon" aria-hidden="true">
                <Icon size={20} strokeWidth={2.35} />
              </span>
              <span className="rail-item__label">{item.label}</span>
            </button>
          );
        })}

        <p className="nav-rail__section">Library</p>
        {aside.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.page;
          return (
            <button
              key={item.page}
              type="button"
              className={`rail-item${active ? " active" : ""}`}
              data-page={item.page}
              onClick={() => go(item.page)}
              aria-current={active ? "page" : undefined}
            >
              <span className="rail-item__icon" aria-hidden="true">
                <Icon size={20} strokeWidth={2.35} />
              </span>
              <span className="rail-item__label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <p className="nav-rail__footer">Midnight Studio</p>
    </aside>
  );
}

/** Mobile / tablet floating dock — hidden at ≥900px via CSS */
export function Nav() {
  const { activePage, moreOpen, setMoreOpen, moreRef, go, primary, aside } = useNavNav();

  return (
    <nav className="page-nav" aria-label="Main navigation">
      <div className="page-nav__track">
        {primary.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              type="button"
              className={`dock-item${activePage === item.page ? " active" : ""}`}
              data-page={item.page}
              onClick={() => go(item.page)}
              aria-current={activePage === item.page ? "page" : undefined}
            >
              <Icon aria-hidden="true" />
              <span className="dock-item__label">{item.label}</span>
            </button>
          );
        })}

        <div className="nav-more" ref={moreRef}>
          <button
            id="navMoreBtn"
            className={`dock-item nav-more__btn${aside.some((i) => i.page === activePage) ? " active" : ""}`}
            type="button"
            aria-expanded={moreOpen}
            aria-controls="navMoreMenu"
            onClick={(e) => {
              e.stopPropagation();
              setMoreOpen((o) => !o);
            }}
          >
            <Ellipsis aria-hidden="true" />
            <span className="dock-item__label">More</span>
          </button>
          <div id="navMoreMenu" className="nav-more__menu" hidden={!moreOpen}>
            {aside.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={`more-${item.page}`}
                  type="button"
                  className={`dock-item${activePage === item.page ? " active" : ""}`}
                  data-page={item.page}
                  onClick={() => go(item.page)}
                >
                  <Icon aria-hidden="true" />
                  <span className="dock-item__label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
