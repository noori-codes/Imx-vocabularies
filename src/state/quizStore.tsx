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
  buildQuizQueue,
  bumpRequeueCount,
  canRequeueWord,
  emptySessionStats,
  QUIZ_CARD_TIMER_SEC,
  QUIZ_SESSION_SIZE,
  sessionAccuracy,
  shuffleStable,
  wordsMatchTyped,
  type QuizSessionStats,
} from "../lib/quizLogic";
import {
  idiomToQuizItem,
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

export { QUIZ_SESSION_SIZE, QUIZ_CARD_TIMER_SEC, sessionAccuracy };
export type { QuizSessionStats };

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
  isSessionActive: boolean;
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
    /** Rebuild even if a session is mid-flight. Default true for explicit restarts. */
    restart?: boolean;
    /** Build against this scope immediately (avoids stale-state races). */
    scopeOverride?: string;
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
  const { vocabularyData, topicData, idiomData, favoriteWords, version } = useLibrary();

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
  const [quizSessionStats, setQuizSessionStats] = useState<QuizSessionStats>(emptySessionStats());
  const [requeueCounts, setRequeueCounts] = useState<Record<string, number>>({});

  const cardTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advancingRef = useRef(false);
  const queueRef = useRef(quizQueue);
  const indexRef = useRef(quizIndex);
  const statsRef = useRef(quizSessionStats);
  const requeueCountsRef = useRef(requeueCounts);
  const requeueEnabledRef = useRef(quizRequeueMissed);
  const modeRef = useRef(quizMode);

  queueRef.current = quizQueue;
  indexRef.current = quizIndex;
  statsRef.current = quizSessionStats;
  requeueCountsRef.current = requeueCounts;
  requeueEnabledRef.current = quizRequeueMissed;
  modeRef.current = quizMode;

  const isSessionActive =
    showSummary || (quizQueue.length > 0 && quizIndex < quizQueue.length);

  const clearCardTimer = useCallback(() => {
    if (cardTimerRef.current) {
      clearInterval(cardTimerRef.current);
      cardTimerRef.current = null;
    }
    setQuizCardTimerRemaining(0);
  }, []);

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
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

  const getQuizWordPool = useCallback(
    (scopeOverride?: string) => {
      const scope = scopeOverride ?? quizScope;
      let pool: Word[] = vocabularyData;

      if (scope === "due") {
        pool = [...vocabularyData, ...idiomData.map(idiomToQuizItem)];
      } else if (scope === "idioms") {
        pool = idiomData.map(idiomToQuizItem);
      } else if (String(scope).startsWith("idiom:")) {
        const phrase = scope.slice("idiom:".length);
        const match = idiomData.find((item) => item.idiom === phrase);
        pool = match ? [idiomToQuizItem(match)] : [];
      } else if (scope === "favorites") {
        pool = pool.filter((item) => favoriteWords.has(item.word));
      } else if (scope === "weak") {
        pool = getWeakWords(pool);
      } else if (String(scope).startsWith("topic:")) {
        const topicTitle = scope.slice("topic:".length);
        const topic = topicData.find((item) => item.title === topicTitle);
        if (topic) {
          const wanted = new Set((topic.vocabulary || []).map((word) => word.toLowerCase()));
          const wordItems = vocabularyData.filter((item) =>
            wanted.has(item.word.toLowerCase()),
          );
          const idiomItems = resolveTopicIdioms(topic, idiomData).map(idiomToQuizItem);
          pool = [...wordItems, ...idiomItems];
        } else {
          pool = [];
        }
      }

      const idiomScoped = scope === "idioms" || String(scope).startsWith("idiom:");
      if (!idiomScoped && quizCategoryFilter && quizCategoryFilter !== "All") {
        pool = pool.filter((item) => item.category === quizCategoryFilter);
      }

      return pool;
    },
    [favoriteWords, idiomData, quizCategoryFilter, quizScope, topicData, vocabularyData],
  );

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
    const distractors = shuffleStable(distractorPool).slice(0, 3);
    while (distractors.length < 3 && fallback.length) {
      const next = fallback.find(
        (item) =>
          !distractors.some((d) => d.word === item.word) && item.word !== correct.word,
      );
      if (!next) break;
      distractors.push(next);
    }
    return shuffleStable([correct, ...distractors.slice(0, 3)]);
  }, []);

  const hideSummary = useCallback(() => setShowSummary(false), []);

  const logSessionEnd = useCallback(
    (stats: QuizSessionStats) => {
      appendStudyEvent({
        type: "quiz_session",
        meta: {
          known: stats.known,
          again: stats.again,
          total: stats.total,
          answered: stats.answered,
          accuracy: sessionAccuracy(stats),
          mode: modeRef.current,
          minutes: Math.max(2, Math.round(stats.answered * 0.35)),
        },
      });
      onProgressRefresh?.();
    },
    [onProgressRefresh],
  );

  const finishSessionSummary = useCallback(() => {
    clearCardTimer();
    clearAdvanceTimer();
    setShowSummary(true);
    logSessionEnd(statsRef.current);
  }, [clearAdvanceTimer, clearCardTimer, logSessionEnd]);

  const prepareQuiz = useCallback(
    ({
      forceAll = false,
      preserveForce = false,
      limit = null,
      restart = true,
      scopeOverride,
    }: {
      forceAll?: boolean;
      preserveForce?: boolean;
      limit?: number | null;
      restart?: boolean;
      scopeOverride?: string;
    } = {}) => {
      const midSession =
        queueRef.current.length > 0 && indexRef.current < queueRef.current.length;

      // Keep an in-progress or just-finished session when quietly syncing (page revisit).
      if (!restart && (midSession || showSummary)) return;

      const scope = scopeOverride ?? quizScope;
      const effectiveForceAll = !preserveForce ? forceAll : forceAll || quizForceAll;
      if (!preserveForce) setQuizForceAll(forceAll);
      else if (forceAll) setQuizForceAll(true);

      if (limit != null) setQuizSessionLimit(limit);
      else if (!preserveForce) setQuizSessionLimit(null);

      setShowSummary(false);
      clearCardTimer();
      clearAdvanceTimer();
      advancingRef.current = false;

      const pool = getQuizWordPool(scope);
      const queue = buildQuizQueue({
        pool,
        scope,
        forceAll: effectiveForceAll,
        limit: limit ?? (preserveForce ? quizSessionLimit : null),
      });

      setQuizQueue(queue);
      queueRef.current = queue;
      setQuizSessionStats(emptySessionStats(queue.length));
      statsRef.current = emptySessionStats(queue.length);
      setRequeueCounts({});
      requeueCountsRef.current = {};
      setQuizIndex(0);
      indexRef.current = 0;
      setQuizRevealed(false);
      setQuizListeningHeard(false);
      setQuizTypeChecked(false);
    },
    [
      clearAdvanceTimer,
      clearCardTimer,
      getQuizWordPool,
      quizForceAll,
      quizScope,
      quizSessionLimit,
      showSummary,
    ],
  );

  useEffect(() => {
    const current = quizQueue[quizIndex];
    if (quizMode === "mcq" && current) {
      setQuizMcqChoices(pickMcqChoices(current, getQuizWordPool()));
    }
  }, [quizIndex, quizMode, quizQueue, pickMcqChoices, getQuizWordPool, version]);

  const advanceQuiz = useCallback(
    (knewIt: boolean) => {
      if (advancingRef.current) return;
      const current = queueRef.current[indexRef.current];
      if (!current) return;

      advancingRef.current = true;
      clearAdvanceTimer();
      clearCardTimer();
      recordStudyActivity();

      gradeWord(current.word, knewIt);
      appendStudyEvent({
        type: "quiz_grade",
        meta: { word: current.word, knewIt: Boolean(knewIt), mode: modeRef.current },
      });

      const prevStats = statsRef.current;
      const missed = [...prevStats.missed];
      if (!knewIt && !missed.includes(current.word)) missed.push(current.word);

      const nextStats: QuizSessionStats = {
        known: prevStats.known + (knewIt ? 1 : 0),
        again: prevStats.again + (knewIt ? 0 : 1),
        missed,
        total: prevStats.total,
        answered: prevStats.answered + 1,
      };
      setQuizSessionStats(nextStats);
      statsRef.current = nextStats;

      let nextQueue = queueRef.current;
      if (
        !knewIt &&
        canRequeueWord(
          current.word,
          requeueCountsRef.current,
          nextQueue.length,
          nextStats.total,
          requeueEnabledRef.current,
        )
      ) {
        nextQueue = [...nextQueue, current];
        const nextCounts = bumpRequeueCount(current.word, requeueCountsRef.current);
        setRequeueCounts(nextCounts);
        requeueCountsRef.current = nextCounts;
        setQuizQueue(nextQueue);
        queueRef.current = nextQueue;
      }

      const nextIndex = indexRef.current + 1;
      setQuizIndex(nextIndex);
      indexRef.current = nextIndex;
      setQuizRevealed(false);
      setQuizListeningHeard(false);
      setQuizTypeChecked(false);

      if (nextIndex >= nextQueue.length) {
        setShowSummary(true);
        logSessionEnd(nextStats);
      } else {
        onProgressRefresh?.();
      }

      // Unlock after React flushes the card change.
      requestAnimationFrame(() => {
        advancingRef.current = false;
      });
    },
    [clearAdvanceTimer, clearCardTimer, logSessionEnd, onProgressRefresh],
  );

  const checkTypedQuizAnswer = useCallback(
    (typed: string) => {
      const current = queueRef.current[indexRef.current];
      const typingMode = modeRef.current === "type" || modeRef.current === "cloze";
      if (!current || !typingMode || quizTypeChecked) return false;

      const correct = wordsMatchTyped(typed, current.word);
      setQuizTypeChecked(true);
      setQuizRevealed(true);

      clearAdvanceTimer();
      // Auto-advance: correct → known, wrong → again (no more stuck cards).
      advanceTimerRef.current = setTimeout(
        () => {
          advanceTimerRef.current = null;
          advanceQuiz(correct);
        },
        correct ? 550 : 1100,
      );
      return correct;
    },
    [advanceQuiz, clearAdvanceTimer, quizTypeChecked],
  );

  const reviewMissedQuiz = useCallback(() => {
    const missedWords = statsRef.current.missed;
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
    clearAdvanceTimer();
    advancingRef.current = false;
    setQuizQueue(queue);
    queueRef.current = queue;
    setQuizSessionStats(emptySessionStats(queue.length));
    setRequeueCounts({});
    setQuizIndex(0);
    indexRef.current = 0;
    setQuizRevealed(false);
    setQuizForceAll(true);
    setShowSummary(false);
    setQuizTypeChecked(false);
    setQuizListeningHeard(false);
  }, [clearAdvanceTimer, idiomData, vocabularyData]);

  const onMcqPick = useCallback(
    (_pickedWord: string, correct: boolean) => {
      if (advancingRef.current) return;
      clearAdvanceTimer();
      advanceTimerRef.current = setTimeout(
        () => {
          advanceTimerRef.current = null;
          advanceQuiz(correct);
        },
        correct ? 420 : 900,
      );
    },
    [advanceQuiz, clearAdvanceTimer],
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
      setQuizTypeChecked(false);
      clearAdvanceTimer();
      saveQuizSettings({
        scope: quizScope,
        mode,
        categoryFilter: quizCategoryFilter,
        timer: quizTimerEnabled,
        requeue: quizRequeueMissed,
      });
    },
    [clearAdvanceTimer, quizCategoryFilter, quizRequeueMissed, quizScope, quizTimerEnabled],
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
      if (!quizTimerEnabled || !queueRef.current[indexRef.current]) return;

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
    [clearCardTimer, quizTimerEnabled],
  );

  const startTopicQuiz = useCallback(
    (title: string, navigate: (page: string) => void) => {
      const scope = `topic:${title}`;
      setQuizScope(scope);
      setQuizSessionLimit(null);
      persistQuizSettings();
      navigate("quiz");
      prepareQuiz({ forceAll: true, restart: true, scopeOverride: scope });
    },
    [persistQuizSettings, prepareQuiz, setQuizScope],
  );

  const startTopicExam = useCallback(
    (title: string, navigate: (page: string) => void) => {
      const scope = `topic:${title}`;
      setQuizScope(scope);
      setQuizModeState("flashcard");
      setQuizSessionLimit(10);
      persistQuizSettings();
      navigate("quiz");
      prepareQuiz({ forceAll: true, limit: 10, restart: true, scopeOverride: scope });
    },
    [persistQuizSettings, prepareQuiz, setQuizScope],
  );

  const startIdiomQuiz = useCallback(
    (phrase: string, navigate: (page: string) => void) => {
      const scope = `idiom:${phrase}`;
      setQuizScope(scope);
      setQuizSessionLimit(null);
      persistQuizSettings();
      navigate("quiz");
      prepareQuiz({ forceAll: true, restart: true, scopeOverride: scope });
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
        restart: true,
        scopeOverride: "idioms",
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
      prepareQuiz({ forceAll: true, restart: true, scopeOverride: "weak" });
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
      isSessionActive,
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
      shuffle: shuffleStable,
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
      isSessionActive,
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
