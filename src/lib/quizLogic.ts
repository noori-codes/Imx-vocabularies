import type { Word } from "../types/models";
import { getDueWords, getQuizProgress } from "./storage";

export const QUIZ_SESSION_SIZE = 15;
export const QUIZ_CARD_TIMER_SEC = 20;
/** Cap how many times a missed card can be re-queued in one session. */
export const QUIZ_MAX_REQUEUES_PER_WORD = 1;
/** Hard cap so requeues can't explode a session. */
export const QUIZ_MAX_QUEUE_GROWTH = 1.6;

export type QuizSessionStats = {
  known: number;
  again: number;
  missed: string[];
  /** Initial unique cards when the session started. */
  total: number;
  /** Graded answers this session (includes requeue grades). */
  answered: number;
};

export const emptySessionStats = (total = 0): QuizSessionStats => ({
  known: 0,
  again: 0,
  missed: [],
  total,
  answered: 0,
});

export const sessionAccuracy = (stats: QuizSessionStats): number | null => {
  if (!stats.answered) return null;
  return Math.round((stats.known / stats.answered) * 100);
};

const normalizeTypedWord = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s'-]/gi, "")
    .replace(/\s+/g, " ");

/** Levenshtein distance — used for soft typo tolerance on longer answers. */
export const editDistance = (a: string, b: string): number => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i += 1) grid[i][0] = i;
  for (let j = 0; j < cols; j += 1) grid[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      grid[i][j] = Math.min(
        grid[i - 1][j] + 1,
        grid[i][j - 1] + 1,
        grid[i - 1][j - 1] + cost,
      );
    }
  }
  return grid[a.length][b.length];
};

/**
 * Strict equality first; for answers longer than 6 chars, allow 1 typo.
 * Multi-word idioms stay exact after normalization.
 */
export const wordsMatchTyped = (typed: string, word: string): boolean => {
  const a = normalizeTypedWord(typed);
  const b = normalizeTypedWord(word);
  if (!a || !b) return false;
  if (a === b) return true;
  if (b.includes(" ")) return false;
  if (b.length < 7) return false;
  return editDistance(a, b) <= 1;
};

export const normalizeTypedAnswer = normalizeTypedWord;

type BuildQueueOpts = {
  pool: Word[];
  scope: string;
  forceAll: boolean;
  limit: number | null;
  sessionDefault?: number;
};

/**
 * Build a study queue:
 * - Due scope: only SRS-due items, overdue first, then never-seen
 * - Force/all scopes: shuffle with a soft session cap
 * - Topic/idiom scoped exams keep their explicit limit
 */
export const buildQuizQueue = ({
  pool,
  scope,
  forceAll,
  limit,
  sessionDefault = QUIZ_SESSION_SIZE,
}: BuildQueueOpts): Word[] => {
  const useAllInScope =
    forceAll ||
    scope === "all" ||
    scope === "idioms" ||
    scope === "favorites" ||
    scope === "weak" ||
    String(scope).startsWith("topic:") ||
    String(scope).startsWith("idiom:");

  let items: Word[];

  if (useAllInScope) {
    items = shuffleStable(prioritizePool(pool));
  } else {
    const due = getDueWords(pool);
    items = due.map(({ item }) => item);
  }

  const sessionCap = limit ?? sessionDefault;
  const shouldCap =
    !useAllInScope ||
    (!String(scope).startsWith("topic:") && !String(scope).startsWith("idiom:")) ||
    limit != null;

  if (shouldCap) {
    items = items.slice(0, sessionCap);
  }

  return items;
};

/** Prefer never-reviewed and recently-missed words when forcing a full pool. */
export const prioritizePool = (pool: Word[]): Word[] => {
  const progress = getQuizProgress() as Record<
    string,
    { nextReview?: number; lastResult?: string; updatedAt?: number; repetitions?: number }
  >;
  const now = Date.now();

  return [...pool].sort((a, b) => {
    const pa = progress[a.word];
    const pb = progress[b.word];
    const score = (entry: typeof pa) => {
      if (!entry || !entry.repetitions) return 0; // new
      if (entry.lastResult === "again") return 1;
      const dueAt = Number(entry.nextReview) || 0;
      if (dueAt && dueAt <= now) return 2;
      return 3;
    };
    const diff = score(pa) - score(pb);
    if (diff !== 0) return diff;
    return (Number(pb?.updatedAt) || 0) - (Number(pa?.updatedAt) || 0);
  });
};

export const shuffleStable = <T,>(items: T[]): T[] => {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

/**
 * Decide whether a missed card may re-enter the queue.
 * Tracks per-word requeue counts for the current session.
 */
export const canRequeueWord = (
  word: string,
  requeueCounts: Record<string, number>,
  queueLength: number,
  sessionTotal: number,
  enabled: boolean,
): boolean => {
  if (!enabled) return false;
  const key = word.toLowerCase();
  const count = requeueCounts[key] || 0;
  if (count >= QUIZ_MAX_REQUEUES_PER_WORD) return false;
  const maxLen = Math.max(sessionTotal, Math.ceil(sessionTotal * QUIZ_MAX_QUEUE_GROWTH));
  if (queueLength >= maxLen) return false;
  return true;
};

export const bumpRequeueCount = (
  word: string,
  requeueCounts: Record<string, number>,
): Record<string, number> => {
  const key = word.toLowerCase();
  return { ...requeueCounts, [key]: (requeueCounts[key] || 0) + 1 };
};
