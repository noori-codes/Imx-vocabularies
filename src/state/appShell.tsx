import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { STORAGE } from "../lib/storage";

export type AppPage =
  | "home"
  | "vocabulary"
  | "idioms"
  | "topics"
  | "quiz"
  | "progress"
  | "favorites"
  | "data"
  | "about";

type BannerState =
  | { kind: "hidden" }
  | { kind: "custom"; variant: string; node: ReactNode }
  | { kind: "message"; variant: string; message: string };

type ModalState = { title: string; content: ReactNode } | null;

type ToastState = { message: string; isError: boolean } | null;

type AppShellContextValue = {
  activePage: AppPage;
  navigate: (page: AppPage, opts?: { replace?: boolean }) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  vocabCategory: string;
  setVocabCategory: (v: string) => void;
  vocabSort: "az" | "za";
  setVocabSort: (v: "az" | "za") => void;
  vocabFavoritesOnly: boolean;
  setVocabFavoritesOnly: (v: boolean) => void;
  topicFavoritesOnly: boolean;
  setTopicFavoritesOnly: (v: boolean) => void;
  idiomFavoritesOnly: boolean;
  setIdiomFavoritesOnly: (v: boolean) => void;
  focusTopicTitle: string | null;
  setFocusTopicTitle: (title: string | null) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  toast: ToastState;
  showToast: (message: string, isError?: boolean) => void;
  modal: ModalState;
  openModal: (title: string, content: ReactNode) => void;
  closeModal: () => void;
  banner: BannerState;
  setBanner: (banner: BannerState) => void;
  progressTick: number;
  bumpProgress: () => void;
  clearViewFilters: () => void;
};

const VALID_PAGES: AppPage[] = [
  "home",
  "vocabulary",
  "idioms",
  "topics",
  "quiz",
  "progress",
  "favorites",
  "data",
  "about",
];

const AppShellContext = createContext<AppShellContextValue | null>(null);

function parsePageFromUrl(): AppPage {
  const page = new URL(window.location.href).searchParams.get("page");
  if (page && VALID_PAGES.includes(page as AppPage)) return page as AppPage;
  return "home";
}

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [activePage, setActivePage] = useState<AppPage>(() => parsePageFromUrl());
  const [searchTerm, setSearchTerm] = useState("");
  const [vocabCategory, setVocabCategory] = useState("All");
  const [vocabSort, setVocabSort] = useState<"az" | "za">("az");
  const [vocabFavoritesOnly, setVocabFavoritesOnly] = useState(false);
  const [topicFavoritesOnly, setTopicFavoritesOnly] = useState(false);
  const [idiomFavoritesOnly, setIdiomFavoritesOnly] = useState(false);
  const [focusTopicTitle, setFocusTopicTitle] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem(STORAGE.theme);
    return saved === "light" ? "light" : "dark";
  });
  const [toast, setToast] = useState<ToastState>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [banner, setBanner] = useState<BannerState>({ kind: "hidden" });
  const [progressTick, setProgressTick] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyTheme = useCallback((next: "light" | "dark") => {
    document.body.classList.toggle("light", next === "light");
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute("content", next === "light" ? "#f6f3f1" : "#12100e");
    }
    setTheme(next);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [applyTheme, theme]);

  const navigate = useCallback((page: AppPage, opts: { replace?: boolean } = {}) => {
    const { replace = true } = opts;
    setActivePage(page);
    const url = new URL(window.location.href);
    url.searchParams.set("page", page);
    if (replace) window.history.replaceState({ page }, "", url);
    else window.history.pushState({ page }, "", url);
  }, []);

  useEffect(() => {
    const onPop = () => setActivePage(parsePageFromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      document.body.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "light" ? "dark" : "light";
    applyTheme(next);
    localStorage.setItem(STORAGE.theme, next);
  }, [applyTheme, theme]);

  const showToast = useCallback((message: string, isError = false) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, isError });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const openModal = useCallback((title: string, content: ReactNode) => {
    setModal({ title, content });
  }, []);

  const closeModal = useCallback(() => setModal(null), []);

  const bumpProgress = useCallback(() => setProgressTick((t) => t + 1), []);

  const clearViewFilters = useCallback(() => {
    setSearchTerm("");
    setVocabFavoritesOnly(false);
    setTopicFavoritesOnly(false);
    setIdiomFavoritesOnly(false);
    setVocabCategory("All");
  }, []);

  const value = useMemo(
    (): AppShellContextValue => ({
      activePage,
      navigate,
      searchTerm,
      setSearchTerm,
      vocabCategory,
      setVocabCategory,
      vocabSort,
      setVocabSort,
      vocabFavoritesOnly,
      setVocabFavoritesOnly,
      topicFavoritesOnly,
      setTopicFavoritesOnly,
      idiomFavoritesOnly,
      setIdiomFavoritesOnly,
      focusTopicTitle,
      setFocusTopicTitle,
      theme,
      toggleTheme,
      toast,
      showToast,
      modal,
      openModal,
      closeModal,
      banner,
      setBanner,
      progressTick,
      bumpProgress,
      clearViewFilters,
    }),
    [
      activePage,
      navigate,
      searchTerm,
      vocabCategory,
      vocabSort,
      vocabFavoritesOnly,
      topicFavoritesOnly,
      idiomFavoritesOnly,
      focusTopicTitle,
      theme,
      toggleTheme,
      toast,
      showToast,
      modal,
      openModal,
      closeModal,
      banner,
      progressTick,
      bumpProgress,
      clearViewFilters,
    ],
  );

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell() {
  const ctx = useContext(AppShellContext);
  if (!ctx) throw new Error("useAppShell must be used within AppShellProvider");
  return ctx;
}
