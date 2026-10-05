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
import { buildClozePrompt } from "../lib/cloze";
import {
  idiomToQuizItem,
  getDueWords,
  getWeakWords,
  resolveTopicIdioms,
  gradeWord,
  readQuizSettings,
  saveQuizSettings,
  recordStudyActivity,
  appendStudyEvent,
} from "../lib/storage";
import type { QuizMode, QuizScope, Word } from "../types/models";
import { useLibrary } from "./libraryStore";

export const QUIZ_SESSION_SIZE = 15;
export const QUIZ_CARD_TIMER_SEC = 20;

export type QuizSessionStats = {
  known: number;
  again: number;
  missed: string[];
  total: number;
};

type QuizContextValue = {
  quizScope: QuizScope | string;
  quizMode: QuizMode;
  quizCategoryFilter: string;
  quizTimerEnabled: boolean;
  quizRequeueMissed: boolean;
  quizQueue: Word[];
  quizIndex: number;
  quizRevealed: boolean;
  quizForceAll: boolean;
  quizSessionLimit: number | null;
  quizTypeChecked: boolean;
  quizListeningHeard: boolean;
  quizCardTimerRemaining: number;
  quizSessionStats: QuizSessionStats;
  quizMcqChoices: Word[];
  showSummary: boolean;
  setQuizScope: (scope: string) => void;
  setQuizMode: (mode: QuizMode) => void;
  setQuizCategoryFilter: (cat: string) => void;
  setQuizTimerEnabled: (v: boolean) => void;
  setQuizRequeueMissed: (v: boolean) => void;
  persistQuizSettings: () => void;
  getQuizWordPool: () => Word[];
  describeQuizScope: () => string;
  describeQuizMode: () => string;
  currentQuizItem: () => Word | null;
  prepareQuiz: (opts?: {
    forceAll?: boolean;
    preserveForce?: boolean;
    limit?: number | null;
  }) => void;
  setQuizRevealed: (v: boolean) => void;
  setQuizListeningHeard: (v: boolean) => void;
  setQuizTypeChecked: (v: boolean) => void;
  advanceQuiz: (knewIt: boolean) => void;
  checkTypedQuizAnswer: (typed: string) => boolean;
  reviewMissedQuiz: () => void;
  pickMcqChoices: (correct: Word, pool: Word[]) => Word[];
  startTopicQuiz: (title: string, navigate: (page: string) => void) => void;
  startTopicExam: (title: string, navigate: (page: string) => void) => void;
  startIdiomQuiz: (phrase: string, navigate: (page: string) => void) => void;
  startIdiomExam: (navigate: (page: string) => void) => void;
  startWeakWordsQuiz: (navigate: (page: string) => void) => void;
  onMcqPick: (pickedWord: string, correct: boolean) => void;
  clearCardTimer: () => void;
  startCardTimer: (onTimeout: () => void) => void;
  shuffle: <T>(items: T[]) => T[];
  wordsMatchTyped: (typed: string, word: string) => boolean;
  buildClozeFor: (item: Word) => ReturnType<typeof buildClozePrompt>;
  finishSessionSummary: () => void;
  hideSummary: () => void;
};

const QuizContext = createContext<QuizContextValue | null>(null);

const shuffle = <T,>(items: T[]) => {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

const normalizeTypedWord = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\s'-]/gi, "");

const wordsMatchTyped = (typed: string, word: string) =>
  normalizeTypedWord(typed) === normalizeTypedWord(word);

const describeQuizMode = (mode: QuizMode) => {
  const modes: Record<QuizMode, string> = {
    flashcard: "Word → meaning",
    reverse: "Meaning → word",
    type: "Type the word",
    mcq: "Pick the word",
    cloze: "Fill the blank",
    listening: "Listen → meaning",
  };
  return modes[mode] || modes.flashcard;
};

export function QuizProvider({
  children,
  onProgressRefresh,
}: {
  children: ReactNode;
  onProgressRefresh?: () => void;
}) {
  const {
    vocabularyData,
    topicData,
    idiomData,
    favoriteWords,
    version,
  } = useLibrary();

  const saved = readQuizSettings();
  const [quizScope, setQuizScopeState] = useState<string>(saved.scope || "due");
  const [quizMode, setQuizModeState] = useState<QuizMode>((saved.mode as QuizMode) || "flashcard");
  const [quizCategoryFilter, setQuizCategoryFilterState] = useState(
    saved.categoryFilter || "All",
  );
  const [quizTimerEnabled, setQuizTimerEnabledState] = useState(Boolean(saved.timer));
  const [quizRequeueMissed, setQuizRequeueMissedState] = useState(saved.requeue !== false);

  const [quizQueue, setQuizQueue] = useState<Word[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [quizForceAll, setQuizForceAll] = useState(false);
  const [quizSessionLimit, setQuizSessionLimit] = useState<number | null>(null);
  const [quizTypeChecked, setQuizTypeChecked] = useState(false);
  const [quizListeningHeard, setQuizListeningHeard] = useState(false);
  const [quizMcqChoices, setQuizMcqChoices] = useState<Word[]>([]);
  const [quizCardTimerRemaining, setQuizCardTimerRemaining] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [quizSessionStats, setQuizSessionStats] = useState<QuizSessionStats>({
    known: 0,
    again: 0,
    missed: [],
    total: 0,
  });

  const cardTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCardTimer = useCallback(() => {
    if (cardTimerRef.current) {
      clearInterval(cardTimerRef.current);
      cardTimerRef.current = null;
    }
    setQuizCardTimerRemaining(0);
  }, []);

  const persistQuizSettings = useCallback(() => {
    saveQuizSettings({
      scope: quizScope,
      mode: quizMode,
      categoryFilter: quizCategoryFilter,
      timer: quizTimerEnabled,
      requeue: quizRequeueMissed,
    });
  }, [quizCategoryFilter, quizMode, quizRequeueMissed, quizScope, quizTimerEnabled]);

  const getQuizWordPool = useCallback(() => {
    let pool: Word[] = vocabularyData;

    if (quizScope === "due") {
      pool = [...vocabularyData, ...idiomData.map(idiomToQuizItem)];
    } else if (quizScope === "idioms") {
      pool = idiomData.map(idiomToQuizItem);
    } else if (String(quizScope).startsWith("idiom:")) {
      const phrase = quizScope.slice("idiom:".length);
      const match = idiomData.find((item) => item.idiom === phrase);
      pool = match ? [idiomToQuizItem(match)] : [];
    } else if (quizScope === "favorites") {
      pool = pool.filter((item) => favoriteWords.has(item.word));
    } else if (quizScope === "weak") {
      pool = getWeakWords(pool);
    } else if (String(quizScope).startsWith("topic:")) {
      const topicTitle = quizScope.slice("topic:".length);
      const topic = topicData.find((item) => item.title === topicTitle);
      if (topic) {
        const wanted = new Set(
          (topic.vocabulary || []).map((word) => word.toLowerCase()),
        );
        const wordItems = vocabularyData.filter((item) =>
          wanted.has(item.word.toLowerCase()),
        );
        const idiomItems = resolveTopicIdioms(topic, idiomData).map(idiomToQuizItem);
        pool = [...wordItems, ...idiomItems];
      }
    }

    const idiomScoped =
      quizScope === "idioms" || String(quizScope).startsWith("idiom:");
    if (!idiomScoped && quizCategoryFilter && quizCategoryFilter !== "All") {
      pool = pool.filter((item) => item.category === quizCategoryFilter);
    }

    return pool;
  }, [
    favoriteWords,
    idiomData,
    quizCategoryFilter,
    quizScope,
    topicData,
    vocabularyData,
  ]);

  const describeQuizScope = useCallback(() => {
    if (quizScope === "all") return "All vocabulary";
    if (quizScope === "due") return "Due words";
    if (quizScope === "idioms") return "All idioms";
    if (quizScope === "favorites") return "Favorite words";
    if (quizScope === "weak") return "Weak words";
    if (String(quizScope).startsWith("topic:")) {
      const title = quizScope.slice("topic:".length);
      return quizSessionLimit === 10 ? `Topic exam: ${title}` : `Topic: ${title}`;
    }
    if (String(quizScope).startsWith("idiom:")) {
      const phrase = quizScope.slice("idiom:".length);
      return quizSessionLimit ? `Idiom exam: ${phrase}` : `Idiom: ${phrase}`;
    }
    return "Exam practice";
  }, [quizScope, quizSessionLimit]);

  const currentQuizItem = useCallback(
    () => quizQueue[quizIndex] || null,
    [quizIndex, quizQueue],
  );

  const pickMcqChoices = useCallback((correct: Word, pool: Word[]) => {
    const sameCategory = pool.filter(
      (item) =>
        item.word.toLowerCase() !== correct.word.toLowerCase() &&
        item.category === correct.category,
    );
    const fallback = pool.filter(
      (item) => item.word.toLowerCase() !== correct.word.toLowerCase(),
    );
    const distractorPool = sameCategory.length >= 3 ? sameCategory : fallback;
    const distractors = shuffle(distractorPool).slice(0, 3);
    while (distractors.length < 3 && fallback.length) {
      const next = fallback.find(
        (item) =>
          !distractors.some((d) => d.word === item.word) &&
          item.word !== correct.word,
      );
      if (!next) break;
      distractors.push(next);
    }
    return shuffle([correct, ...distractors.slice(0, 3)]);
  }, []);

  const hideSummary = useCallback(() => setShowSummary(false), []);

  const finishSessionSummary = useCallback(() => {
    clearCardTimer();
    setShowSummary(true);
    const { known, again, total } = quizSessionStats;
    appendStudyEvent({
      type: "quiz_session",
      meta: {
        known,
        again,
        total,
        mode: quizMode,
        minutes: Math.max(3, Math.round(total * 0.4)),
      },
    });
    onProgressRefresh?.();
  }, [clearCardTimer, onProgressRefresh, quizMode, quizSessionStats]);

  const prepareQuiz = useCallback(
    ({
      forceAll = false,
      preserveForce = false,
      limit = null,
    }: {
      forceAll?: boolean;
      preserveForce?: boolean;
      limit?: number | null;
    } = {}) => {
      const effectiveForceAll = !preserveForce ? forceAll : forceAll || quizForceAll;
      if (!preserveForce) setQuizForceAll(forceAll);
      else if (forceAll) setQuizForceAll(true);

      if (limit != null) setQuizSessionLimit(limit);
      else if (!preserveForce) setQuizSessionLimit(null);

      setShowSummary(false);
      clearCardTimer();
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }

      const pool = getQuizWordPool();
      const useAllInScope =
        effectiveForceAll ||
        quizScope === "all" ||
        quizScope === "idioms" ||
        quizScope === "favorites" ||
        quizScope === "weak" ||
        String(quizScope).startsWith("topic:") ||
        String(quizScope).startsWith("idiom:");

      const due = useAllInScope
        ? pool.map((item) => ({ item }))
        : getDueWords(pool);

      let queue = shuffle(due.map(({ item }) => item));
      const sessionCap = (limit ?? quizSessionLimit) || QUIZ_SESSION_SIZE;

      if (!useAllInScope) {
        queue = queue.slice(0, sessionCap);
      } else if (
        useAllInScope &&
        !String(quizScope).startsWith("topic:") &&
        !String(quizScope).startsWith("idiom:")
      ) {
        queue = queue.slice(0, sessionCap);
      } else if (limit != null || quizSessionLimit) {
        queue = queue.slice(0, sessionCap);
      }

      setQuizQueue(queue);
      setQuizSessionStats({ known: 0, again: 0, missed: [], total: queue.length });
      setQuizIndex(0);
      setQuizRevealed(false);
      setQuizListeningHeard(false);
      setQuizTypeChecked(false);
      setShowSummary(false);
    },
    [clearCardTimer, getQuizWordPool, quizForceAll, quizScope, quizSessionLimit],
  );

  // Refresh MCQ when card changes
  useEffect(() => {
    const current = quizQueue[quizIndex];
    if (quizMode === "mcq" && current) {
      setQuizMcqChoices(pickMcqChoices(current, getQuizWordPool()));
    }
  }, [quizIndex, quizMode, quizQueue, pickMcqChoices, getQuizWordPool, version]);

  const advanceQuiz = useCallback(
    (knewIt: boolean) => {
      const current = quizQueue[quizIndex];
      if (!current) return;

      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
      clearCardTimer();
      recordStudyActivity();

      setQuizSessionStats((prev) => {
        const missed = [...prev.missed];
        if (!knewIt && !missed.includes(current.word)) missed.push(current.word);
        return {
          known: prev.known + (knewIt ? 1 : 0),
          again: prev.again + (knewIt ? 0 : 1),
          missed,
          total: prev.total,
        };
      });

      gradeWord(current.word, knewIt);
      appendStudyEvent({
        type: "quiz_grade",
        meta: { word: current.word, knewIt: Boolean(knewIt), mode: quizMode },
      });

      let nextQueue = quizQueue;
      if (!knewIt && quizRequeueMissed) {
        nextQueue = [...quizQueue, current];
        setQuizQueue(nextQueue);
      }

      const nextIndex = quizIndex + 1;
      setQuizIndex(nextIndex);
      setQuizRevealed(false);
      setQuizListeningHeard(false);
      setQuizTypeChecked(false);

      if (nextIndex >= nextQueue.length) {
        setShowSummary(true);
        appendStudyEvent({
          type: "quiz_session",
          meta: {
            known: quizSessionStats.known + (knewIt ? 1 : 0),
            again: quizSessionStats.again + (knewIt ? 0 : 1),
            total: quizSessionStats.total,
            mode: quizMode,
            minutes: Math.max(3, Math.round(quizSessionStats.total * 0.4)),
          },
        });
        onProgressRefresh?.();
        return;
      }
      onProgressRefresh?.();
    },
    [
      clearCardTimer,
      onProgressRefresh,
      quizIndex,
      quizMode,
      quizQueue,
      quizRequeueMissed,
    ],
  );

  const checkTypedQuizAnswer = useCallback(
    (typed: string) => {
      const current = quizQueue[quizIndex];
      const typingMode = quizMode === "type" || quizMode === "cloze";
      if (!current || !typingMode || quizTypeChecked) return false;

      const correct = wordsMatchTyped(typed, current.word);
      setQuizTypeChecked(true);
      setQuizRevealed(true);

      if (correct) {
        if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = setTimeout(() => {
          advanceTimerRef.current = null;
          advanceQuiz(true);
        }, 650);
      }
      return correct;
    },
    [advanceQuiz, quizIndex, quizMode, quizQueue, quizTypeChecked],
  );

  const reviewMissedQuiz = useCallback(() => {
    const missedWords = quizSessionStats.missed;
    if (!missedWords.length) return;
    const lookup = new Map<string, Word>([
      ...vocabularyData.map((item): [string, Word] => [item.word.toLowerCase(), item]),
      ...idiomData.map((item): [string, Word] => [
        item.idiom.toLowerCase(),
        idiomToQuizItem(item),
      ]),
    ]);
    const queue = missedWords
      .map((word) => lookup.get(word.toLowerCase()))
      .filter(Boolean) as Word[];
    setQuizQueue(queue);
    setQuizSessionStats({ known: 0, again: 0, missed: [], total: queue.length });
    setQuizIndex(0);
    setQuizRevealed(false);
    setQuizForceAll(true);
    setShowSummary(false);
  }, [idiomData, quizSessionStats.missed, vocabularyData]);

  const onMcqPick = useCallback(
    (_pickedWord: string, correct: boolean) => {
      setTimeout(() => advanceQuiz(correct), correct ? 420 : 900);
    },
    [advanceQuiz],
  );

  const setQuizScope = useCallback(
    (scope: string) => {
      setQuizScopeState(scope);
      saveQuizSettings({
        scope,
        mode: quizMode,
        categoryFilter: quizCategoryFilter,
        timer: quizTimerEnabled,
        requeue: quizRequeueMissed,
      });
    },
    [quizCategoryFilter, quizMode, quizRequeueMissed, quizTimerEnabled],
  );

  const setQuizMode = useCallback(
    (mode: QuizMode) => {
      setQuizModeState(mode);
      setQuizRevealed(false);
      saveQuizSettings({
        scope: quizScope,
        mode,
        categoryFilter: quizCategoryFilter,
        timer: quizTimerEnabled,
        requeue: quizRequeueMissed,
      });
    },
    [quizCategoryFilter, quizRequeueMissed, quizScope, quizTimerEnabled],
  );

  const setQuizCategoryFilter = useCallback(
    (cat: string) => {
      setQuizCategoryFilterState(cat);
      saveQuizSettings({
        scope: quizScope,
        mode: quizMode,
        categoryFilter: cat,
        timer: quizTimerEnabled,
        requeue: quizRequeueMissed,
      });
    },
    [quizMode, quizRequeueMissed, quizScope, quizTimerEnabled],
  );

  const setQuizTimerEnabled = useCallback(
    (v: boolean) => {
      setQuizTimerEnabledState(v);
      saveQuizSettings({
        scope: quizScope,
        mode: quizMode,
        categoryFilter: quizCategoryFilter,
        timer: v,
        requeue: quizRequeueMissed,
      });
    },
    [quizCategoryFilter, quizMode, quizRequeueMissed, quizScope],
  );

  const setQuizRequeueMissed = useCallback(
    (v: boolean) => {
      setQuizRequeueMissedState(v);
      saveQuizSettings({
        scope: quizScope,
        mode: quizMode,
        categoryFilter: quizCategoryFilter,
        timer: quizTimerEnabled,
        requeue: v,
      });
    },
    [quizCategoryFilter, quizMode, quizScope, quizTimerEnabled],
  );

  const startCardTimer = useCallback(
    (onTimeout: () => void) => {
      clearCardTimer();
      if (!quizTimerEnabled || !quizQueue[quizIndex]) return;

      setQuizCardTimerRemaining(QUIZ_CARD_TIMER_SEC);
      cardTimerRef.current = setInterval(() => {
        setQuizCardTimerRemaining((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearCardTimer();
            onTimeout();
            return 0;
          }
          return next;
        });
      }, 1000);
    },
    [clearCardTimer, quizIndex, quizQueue, quizTimerEnabled],
  );

  const startTopicQuiz = useCallback(
    (title: string, navigate: (page: string) => void) => {
      setQuizScope(`topic:${title}`);
      setQuizSessionLimit(null);
      persistQuizSettings();
      navigate("quiz");
      prepareQuiz({ forceAll: true });
    },
    [persistQuizSettings, prepareQuiz, setQuizScope],
  );

  const startTopicExam = useCallback(
    (title: string, navigate: (page: string) => void) => {
      setQuizScope(`topic:${title}`);
      setQuizModeState("flashcard");
      setQuizSessionLimit(10);
      persistQuizSettings();
      navigate("quiz");
      prepareQuiz({ forceAll: true, limit: 10 });
    },
    [persistQuizSettings, prepareQuiz, setQuizScope],
  );

  const startIdiomQuiz = useCallback(
    (phrase: string, navigate: (page: string) => void) => {
      setQuizScope(`idiom:${phrase}`);
      setQuizSessionLimit(null);
      persistQuizSettings();
      navigate("quiz");
      prepareQuiz({ forceAll: true });
    },
    [persistQuizSettings, prepareQuiz, setQuizScope],
  );

  const startIdiomExam = useCallback(
    (navigate: (page: string) => void) => {
      setQuizScope("idioms");
      setQuizModeState("flashcard");
      persistQuizSettings();
      navigate("quiz");
      prepareQuiz({
        forceAll: true,
        limit: Math.min(10, Math.max(1, idiomData.length)),
      });
    },
    [idiomData.length, persistQuizSettings, prepareQuiz, setQuizScope],
  );

  const startWeakWordsQuiz = useCallback(
    (navigate: (page: string) => void) => {
      setQuizScope("weak");
      setQuizSessionLimit(null);
      persistQuizSettings();
      navigate("quiz");
      prepareQuiz({ forceAll: true });
    },
    [persistQuizSettings, prepareQuiz, setQuizScope],
  );

  const value = useMemo(
    (): QuizContextValue => ({
      quizScope,
      quizMode,
      quizCategoryFilter,
      quizTimerEnabled,
      quizRequeueMissed,
      quizQueue,
      quizIndex,
      quizRevealed,
      quizForceAll,
      quizSessionLimit,
      quizTypeChecked,
      quizListeningHeard,
      quizCardTimerRemaining,
      quizSessionStats,
      quizMcqChoices,
      showSummary,
      setQuizScope,
      setQuizMode,
      setQuizCategoryFilter,
      setQuizTimerEnabled,
      setQuizRequeueMissed,
      persistQuizSettings,
      getQuizWordPool,
      describeQuizScope,
      describeQuizMode: () => describeQuizMode(quizMode),
      currentQuizItem,
      prepareQuiz,
      setQuizRevealed,
      setQuizListeningHeard,
      setQuizTypeChecked,
      advanceQuiz,
      checkTypedQuizAnswer,
      reviewMissedQuiz,
      pickMcqChoices,
      startTopicQuiz,
      startTopicExam,
      startIdiomQuiz,
      startIdiomExam,
      startWeakWordsQuiz,
      onMcqPick,
      clearCardTimer,
      startCardTimer,
      shuffle,
      wordsMatchTyped,
      buildClozeFor: buildClozePrompt,
      finishSessionSummary,
      hideSummary,
    }),
    [
      quizScope,
      quizMode,
      quizCategoryFilter,
      quizTimerEnabled,
      quizRequeueMissed,
      quizQueue,
      quizIndex,
      quizRevealed,
      quizForceAll,
      quizSessionLimit,
      quizTypeChecked,
      quizListeningHeard,
      quizCardTimerRemaining,
      quizSessionStats,
      quizMcqChoices,
      showSummary,
      setQuizScope,
      setQuizMode,
      setQuizCategoryFilter,
      setQuizTimerEnabled,
      setQuizRequeueMissed,
      persistQuizSettings,
      getQuizWordPool,
      describeQuizScope,
      currentQuizItem,
      prepareQuiz,
      advanceQuiz,
      checkTypedQuizAnswer,
      reviewMissedQuiz,
      pickMcqChoices,
      startTopicQuiz,
      startTopicExam,
      startIdiomQuiz,
      startIdiomExam,
      startWeakWordsQuiz,
      onMcqPick,
      clearCardTimer,
      startCardTimer,
      finishSessionSummary,
      hideSummary,
    ],
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used within QuizProvider");
  return ctx;
}
