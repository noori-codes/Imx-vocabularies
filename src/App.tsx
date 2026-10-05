import { useEffect, useRef, type ReactNode } from "react";
import { registerSW } from "virtual:pwa-register";
import { AppShellProvider, useAppShell } from "./state/appShell";
import { LibraryProvider, useLibrary } from "./state/libraryStore";
import { QuizProvider } from "./state/quizStore";
import { markBackupExported, shouldRemindBackup } from "./lib/storage";
import { AppBanner, OfflineBanner } from "./components/layout/Banners";
import { Topbar } from "./components/layout/Topbar";
import { Nav } from "./components/layout/Nav";
import { ModalHost } from "./components/layout/Modal";
import { Toast } from "./components/layout/Toast";
import { HomePage } from "./pages/HomePage";
import { WordsPage } from "./pages/WordsPage";
import { IdiomsPage } from "./pages/IdiomsPage";
import { TopicsPage } from "./pages/TopicsPage";
import { ExamPage } from "./pages/ExamPage";
import { ProgressPage } from "./pages/ProgressPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { DataPage } from "./pages/DataPage";
import { AboutPage } from "./pages/AboutPage";

function AppRoutes() {
  const { activePage } = useAppShell();
  const pages: Record<string, ReactNode> = {
    home: <HomePage />,
    vocabulary: <WordsPage />,
    idioms: <IdiomsPage />,
    topics: <TopicsPage />,
    quiz: <ExamPage />,
    progress: <ProgressPage />,
    favorites: <FavoritesPage />,
    data: <DataPage />,
    about: <AboutPage />,
  };
  return (
    <main className="page-content" role="main">
      {Object.entries(pages).map(([id, page]) => (
        <div key={id} hidden={activePage !== id} aria-hidden={activePage !== id}>
          {page}
        </div>
      ))}
    </main>
  );
}

function PageVisibilityFix() {
  const { activePage } = useAppShell();
  useEffect(() => {
    document.querySelectorAll(".page").forEach((el) => {
      el.classList.toggle("page--active", el.id === activePage);
    });
  }, [activePage]);
  return null;
}

/** When searching from home/about/data, jump to the page with the most matches. */
function SearchJump() {
  const { searchTerm, activePage, navigate } = useAppShell();
  const { vocabularyData, topicData, idiomData } = useLibrary();

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return;
    if (activePage !== "home" && activePage !== "about" && activePage !== "data") return;

    const vocabMatches = vocabularyData.filter((item) => {
      const hay = [
        item.word,
        item.meaning,
        item.synonym,
        item.antonym,
        item.sentence,
        item.notes,
        ...(item.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    }).length;

    const topicMatches = topicData.filter((topic) => {
      const hay = [
        topic.title,
        topic.summary,
        topic.notes,
        ...(topic.vocabulary || []),
        ...(topic.idioms || []),
        ...(topic.questions || []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    }).length;

    const idiomMatches = idiomData.filter((idiom) => {
      const hay = [
        idiom.idiom,
        idiom.meaning,
        idiom.example,
        idiom.usage,
        idiom.summary,
        idiom.notes,
        ...(idiom.questions || []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    }).length;

    const best = Math.max(vocabMatches, topicMatches, idiomMatches);
    if (best <= 0) return;
    const page =
      best === vocabMatches ? "vocabulary" : best === topicMatches ? "topics" : "idioms";
    navigate(page, { replace: true });
  }, [searchTerm, activePage, vocabularyData, topicData, idiomData, navigate]);

  return null;
}

function BootstrapEffects() {
  const { setBanner, navigate } = useAppShell();
  const { vocabularyData, loadError, dataLoaded, exportBackup } = useLibrary();
  const swInit = useRef(false);

  useEffect(() => {
    if (new URL(window.location.href).searchParams.has("v")) {
      const clean = new URL(window.location.href);
      clean.searchParams.delete("v");
      window.history.replaceState({}, "", `${clean.pathname}${clean.search}${clean.hash}`);
    }
  }, []);

  useEffect(() => {
    if (!dataLoaded) return;
    if (loadError) {
      setBanner({
        kind: "message",
        variant: "error",
        message:
          "Could not load the vocabulary library. Check the browser console, then hard-refresh.",
      });
      return;
    }
    if (vocabularyData.length === 0) {
      setBanner({
        kind: "message",
        variant: "info",
        message:
          "Your deletion list hides the full built-in library. Restore it anytime from Data.",
      });
    }
  }, [dataLoaded, loadError, vocabularyData.length, setBanner]);

  useEffect(() => {
    if (!shouldRemindBackup({ days: 7 })) return;
    setBanner({
      kind: "custom",
      variant: "info",
      node: (
        <>
          <span>
            Backup reminder: download a JSON export so your custom words, topics, and idioms stay
            safe.
          </span>
          <button
            type="button"
            className="ghost-btn app-banner__action"
            onClick={() => {
              exportBackup();
              markBackupExported();
              navigate("data", { replace: false });
            }}
          >
            Export now
          </button>
          <button
            type="button"
            className="icon-btn app-banner__dismiss"
            aria-label="Dismiss"
            onClick={() => setBanner({ kind: "hidden" })}
          >
            ×
          </button>
        </>
      ),
    });
  }, [exportBackup, navigate, setBanner]);

  useEffect(() => {
    if (swInit.current) return;
    swInit.current = true;
    try {
      let refreshing = false;
      navigator.serviceWorker?.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          setBanner({
            kind: "custom",
            variant: "warn",
            node: (
              <>
                <span>New version ready — reload to see today’s lessons and UI updates.</span>
                <button
                  type="button"
                  className="primary-btn app-banner__action"
                  onClick={() => updateSW(true)}
                >
                  Reload now
                </button>
              </>
            ),
          });
        },
        onRegisteredSW(swUrl, registration) {
          if (!registration) return;
          const checkForUpdates = async () => {
            if (registration.installing || !navigator.onLine) return;
            try {
              const bustUrl = `${swUrl}${swUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;
              const response = await fetch(bustUrl, {
                cache: "no-store",
                headers: { "cache-control": "no-cache", pragma: "no-cache" },
              });
              if (response?.status === 200) await registration.update();
              if (registration.waiting) {
                setBanner({
                  kind: "custom",
                  variant: "warn",
                  node: (
                    <>
                      <span>New version ready — reload to see today’s lessons and UI updates.</span>
                      <button
                        type="button"
                        className="primary-btn app-banner__action"
                        onClick={() => updateSW(true)}
                      >
                        Reload now
                      </button>
                    </>
                  ),
                });
              }
            } catch {
              /* ignore */
            }
          };
          setTimeout(checkForUpdates, 800);
          document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") checkForUpdates();
          });
          window.addEventListener("focus", checkForUpdates);
          setInterval(checkForUpdates, 2 * 60 * 1000);
        },
      });
    } catch (error) {
      console.warn("Service worker registration failed", error);
    }
  }, [setBanner]);

  return null;
}

function AppInner() {
  const { bumpProgress } = useAppShell();
  return (
    <QuizProvider onProgressRefresh={bumpProgress}>
      <BootstrapEffects />
      <PageVisibilityFix />
      <SearchJump />
      <AppBanner />
      <OfflineBanner />
      <div className="page-shell">
        <div className="site-chrome" id="siteChrome">
          <Topbar />
          <Nav />
        </div>
        <AppRoutes />
        <footer className="footer">
          <p>Keep learning. Keep growing.</p>
          <span>One word at a time.</span>
        </footer>
      </div>
      <ModalHost />
      <Toast />
    </QuizProvider>
  );
}

export default function App() {
  return (
    <AppShellProvider>
      <LibraryProvider>
        <AppInner />
      </LibraryProvider>
    </AppShellProvider>
  );
}
