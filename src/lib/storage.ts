// @ts-nocheck — large ported module; public APIs below are explicitly typed where callers need them.
import { normalizeCategory, CATEGORIES } from "../data/categories";
import type {
  Idiom,
  QuizProgressEntry,
  QuizSettings,
  Topic,
  Word,
} from "../types/models";

const STORAGE = {
  favoritesWords: "imx-hub-word-favorites",
  favoritesTopics: "imx-hub-topic-favorites",
  favoritesIdioms: "imx-hub-idiom-favorites",
  completedTopics: "imx-hub-completed-topics",
  completedIdioms: "imx-hub-completed-idioms",
  theme: "imx-hub-theme",
  customVocab: "imx-hub-custom-vocab",
  customTopics: "imx-hub-custom-topics",
  customIdioms: "imx-hub-custom-idioms",
  deletedWords: "imx-hub-deleted-words",
  deletedTopics: "imx-hub-deleted-topics",
  deletedIdioms: "imx-hub-deleted-idioms",
  quizProgress: "imx-hub-quiz-progress",
  quizSettings: "imx-hub-quiz-settings",
  studyStreak: "imx-hub-study-streak",
  lastBackupAt: "imx-hub-last-backup-at",
  speakingPractice: "imx-hub-speaking-practice",
  studyHistory: "imx-hub-study-history",
  studyGoals: "imx-hub-study-goals",
  writingResponses: "imx-hub-writing-responses",
};

const HISTORY_MAX = 2000;

export { STORAGE, CATEGORIES, normalizeCategory };

export const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Could not read ${key}`, error);
    return fallback;
  }
};

export const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Could not write ${key}`, error);
    return false;
  }
};

export const readStringList = (key) => {
  const value = readJson(key, []);
  return Array.isArray(value) ? value.map(String) : [];
};

const normalizeTags = (value) => {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }
  return String(value || "")
    .split(/[,;]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const normalizeWord = (item = {}) => ({
  word: String(item.word || "").trim(),
  pronunciation: String(item.pronunciation || "").trim(),
  meaning: String(item.meaning || "").trim(),
  synonym: String(item.synonym || "").trim(),
  antonym: String(item.antonym || "").trim(),
  wordFamily: String(item.wordFamily || "").trim(),
  sentence: String(item.sentence || "").trim(),
  notes: String(item.notes || "").trim(),
  tags: normalizeTags(item.tags),
  category: normalizeCategory(item.category),
  custom: Boolean(item.custom),
});

const normalizeTopic = (item = {}) => ({
  title: String(item.title || "").trim(),
  date: String(item.date || new Date().toISOString().slice(0, 10)),
  summary: String(item.summary || "").trim(),
  notes: String(item.notes || "").trim(),
  vocabulary: Array.isArray(item.vocabulary)
    ? item.vocabulary.map((word) => String(word).trim()).filter(Boolean)
    : String(item.vocabulary || "")
        .split(",")
        .map((word) => word.trim())
        .filter(Boolean),
  idioms: Array.isArray(item.idioms)
    ? item.idioms.map((phrase) => String(phrase).trim()).filter(Boolean)
    : String(item.idioms || "")
        .split("\n")
        .map((phrase) => phrase.trim())
        .filter(Boolean),
  questions: Array.isArray(item.questions)
    ? item.questions.map((q) => String(q).trim()).filter(Boolean)
    : String(item.questions || "")
        .split("\n")
        .map((q) => q.trim())
        .filter(Boolean),
  favorite: Boolean(item.favorite),
  completed: Boolean(item.completed),
  custom: Boolean(item.custom),
});

const normalizeIdiom = (item = {}) => ({
  idiom: String(item.idiom || "").trim(),
  date: String(item.date || new Date().toISOString().slice(0, 10)),
  meaning: String(item.meaning || "").trim(),
  pronunciation: String(item.pronunciation || "").trim(),
  example: String(item.example || "").trim(),
  usage: String(item.usage || "").trim(),
  summary: String(item.summary || "").trim(),
  notes: String(item.notes || "").trim(),
  questions: Array.isArray(item.questions)
    ? item.questions.map((q) => String(q).trim()).filter(Boolean)
    : String(item.questions || "")
        .split("\n")
        .map((q) => q.trim())
        .filter(Boolean),
  favorite: Boolean(item.favorite),
  completed: Boolean(item.completed),
  custom: Boolean(item.custom),
});

/** Map an idiom record into a quiz-compatible vocabulary-shaped item. */
export const idiomToQuizItem = (idiom: Partial<Idiom> | Idiom = {}): Word => {
  const normalized = normalizeIdiom(idiom);
  return {
    word: normalized.idiom,
    pronunciation: normalized.pronunciation,
    meaning: normalized.meaning,
    synonym: "",
    antonym: "",
    wordFamily: "",
    sentence: normalized.example,
    notes: normalized.notes,
    tags: ["idiom"],
    category: "Speaking",
    custom: Boolean(normalized.custom),
    isIdiom: true,
  };
};

export const mergeVocabulary = (baseList: Word[] = []): Word[] => {
  const deleted = new Set(readStringList(STORAGE.deletedWords).map((w) => w.toLowerCase()));
  const custom = readJson(STORAGE.customVocab, []);
  const customMap = new Map();

  (Array.isArray(custom) ? custom : []).forEach((item) => {
    const normalized = normalizeWord({ ...item, custom: true });
    if (!normalized.word) return;
    customMap.set(normalized.word.toLowerCase(), normalized);
  });

  const merged = [];
  const seen = new Set();

  baseList.forEach((item) => {
    const key = String(item.word || "").toLowerCase();
    if (!key || deleted.has(key) || seen.has(key)) return;
    if (customMap.has(key)) {
      merged.push(customMap.get(key));
      customMap.delete(key);
    } else {
      merged.push(normalizeWord({ ...item, custom: false }));
    }
    seen.add(key);
  });

  customMap.forEach((item, key) => {
    if (deleted.has(key) || seen.has(key)) return;
    merged.push(item);
    seen.add(key);
  });

  return merged.sort((a, b) => a.word.localeCompare(b.word));
};

export const mergeTopics = (baseList: Topic[] = []): Topic[] => {
  const deleted = new Set(readStringList(STORAGE.deletedTopics).map((t) => t.toLowerCase()));
  const custom = readJson(STORAGE.customTopics, []);
  const customMap = new Map();

  (Array.isArray(custom) ? custom : []).forEach((item) => {
    const normalized = normalizeTopic({ ...item, custom: true });
    if (!normalized.title) return;
    customMap.set(normalized.title.toLowerCase(), normalized);
  });

  const merged = [];
  const seen = new Set();

  baseList.forEach((item) => {
    const key = String(item.title || "").toLowerCase();
    if (!key || deleted.has(key) || seen.has(key)) return;
    if (customMap.has(key)) {
      merged.push(customMap.get(key));
      customMap.delete(key);
    } else {
      merged.push(normalizeTopic({ ...item, custom: false }));
    }
    seen.add(key);
  });

  customMap.forEach((item, key) => {
    if (deleted.has(key) || seen.has(key)) return;
    merged.push(item);
    seen.add(key);
  });

  return merged.sort((a, b) => String(b.date).localeCompare(String(a.date)));
};

export const mergeIdioms = (baseList: Idiom[] = []): Idiom[] => {
  const deleted = new Set(readStringList(STORAGE.deletedIdioms).map((t) => t.toLowerCase()));
  const custom = readJson(STORAGE.customIdioms, []);
  const customMap = new Map();

  (Array.isArray(custom) ? custom : []).forEach((item) => {
    const normalized = normalizeIdiom({ ...item, custom: true });
    if (!normalized.idiom) return;
    customMap.set(normalized.idiom.toLowerCase(), normalized);
  });

  const merged = [];
  const seen = new Set();

  baseList.forEach((item) => {
    const key = String(item.idiom || "").toLowerCase();
    if (!key || deleted.has(key) || seen.has(key)) return;
    if (customMap.has(key)) {
      merged.push(customMap.get(key));
      customMap.delete(key);
    } else {
      merged.push(normalizeIdiom({ ...item, custom: false }));
    }
    seen.add(key);
  });

  customMap.forEach((item, key) => {
    if (deleted.has(key) || seen.has(key)) return;
    merged.push(item);
    seen.add(key);
  });

  return merged.sort((a, b) => String(b.date).localeCompare(String(a.date)));
};

export const upsertCustomWord = (wordData, { previousWord } = {}) => {
  const custom = Array.isArray(readJson(STORAGE.customVocab, []))
    ? readJson(STORAGE.customVocab, [])
    : [];
  const normalized = normalizeWord({ ...wordData, custom: true });
  if (!normalized.word) throw new Error("Word is required");
  if (!normalized.meaning) throw new Error("Meaning is required");
  if (!normalized.category) throw new Error("Category is required");

  const previousKey = (previousWord || normalized.word).toLowerCase();
  const next = custom.filter(
    (item) => String(item.word || "").toLowerCase() !== previousKey,
  );
  next.push(normalized);
  writeJson(STORAGE.customVocab, next);

  const deleted = readStringList(STORAGE.deletedWords).filter(
    (word) => word.toLowerCase() !== normalized.word.toLowerCase(),
  );
  writeJson(STORAGE.deletedWords, deleted);

  if (previousWord && previousWord.toLowerCase() !== normalized.word.toLowerCase()) {
    softDeleteWord(previousWord, { skipCustomCleanup: true });
  }

  return normalized;
};

export const softDeleteWord = (word, { skipCustomCleanup = false } = {}) => {
  const key = String(word || "").trim();
  if (!key) return;

  if (!skipCustomCleanup) {
    const custom = (readJson(STORAGE.customVocab, []) || []).filter(
      (item) => String(item.word || "").toLowerCase() !== key.toLowerCase(),
    );
    writeJson(STORAGE.customVocab, custom);
  }

  const deleted = new Set(readStringList(STORAGE.deletedWords));
  deleted.add(key);
  writeJson(STORAGE.deletedWords, [...deleted]);
};

export const upsertCustomTopic = (topicData, { previousTitle } = {}) => {
  const custom = Array.isArray(readJson(STORAGE.customTopics, []))
    ? readJson(STORAGE.customTopics, [])
    : [];
  const normalized = normalizeTopic({ ...topicData, custom: true });
  if (!normalized.title) throw new Error("Title is required");
  if (!Array.isArray(normalized.vocabulary) || normalized.vocabulary.length === 0) {
    throw new Error("At least one vocabulary word is required");
  }
  if (!Array.isArray(normalized.questions) || normalized.questions.length === 0) {
    throw new Error("At least one question is required");
  }

  const previousKey = (previousTitle || normalized.title).toLowerCase();
  const next = custom.filter(
    (item) => String(item.title || "").toLowerCase() !== previousKey,
  );
  next.push(normalized);
  writeJson(STORAGE.customTopics, next);

  const deleted = readStringList(STORAGE.deletedTopics).filter(
    (title) => title.toLowerCase() !== normalized.title.toLowerCase(),
  );
  writeJson(STORAGE.deletedTopics, deleted);

  if (previousTitle && previousTitle.toLowerCase() !== normalized.title.toLowerCase()) {
    softDeleteTopic(previousTitle, { skipCustomCleanup: true });
  }

  return normalized;
};

export const softDeleteTopic = (title, { skipCustomCleanup = false } = {}) => {
  const key = String(title || "").trim();
  if (!key) return;

  if (!skipCustomCleanup) {
    const custom = (readJson(STORAGE.customTopics, []) || []).filter(
      (item) => String(item.title || "").toLowerCase() !== key.toLowerCase(),
    );
    writeJson(STORAGE.customTopics, custom);
  }

  const deleted = new Set(readStringList(STORAGE.deletedTopics));
  deleted.add(key);
  writeJson(STORAGE.deletedTopics, [...deleted]);
};

export const upsertCustomIdiom = (idiomData, { previousIdiom } = {}) => {
  const custom = Array.isArray(readJson(STORAGE.customIdioms, []))
    ? readJson(STORAGE.customIdioms, [])
    : [];
  const normalized = normalizeIdiom({ ...idiomData, custom: true });
  if (!normalized.idiom) throw new Error("Idiom is required");
  if (!normalized.meaning) throw new Error("Meaning is required");
  if (!Array.isArray(normalized.questions) || normalized.questions.length === 0) {
    throw new Error("At least one question is required");
  }

  const previousKey = (previousIdiom || normalized.idiom).toLowerCase();
  const next = custom.filter(
    (item) => String(item.idiom || "").toLowerCase() !== previousKey,
  );
  next.push(normalized);
  writeJson(STORAGE.customIdioms, next);

  const deleted = readStringList(STORAGE.deletedIdioms).filter(
    (idiom) => idiom.toLowerCase() !== normalized.idiom.toLowerCase(),
  );
  writeJson(STORAGE.deletedIdioms, deleted);

  if (previousIdiom && previousIdiom.toLowerCase() !== normalized.idiom.toLowerCase()) {
    softDeleteIdiom(previousIdiom, { skipCustomCleanup: true });
  }

  return normalized;
};

export const softDeleteIdiom = (idiom, { skipCustomCleanup = false } = {}) => {
  const key = String(idiom || "").trim();
  if (!key) return;

  if (!skipCustomCleanup) {
    const custom = (readJson(STORAGE.customIdioms, []) || []).filter(
      (item) => String(item.idiom || "").toLowerCase() !== key.toLowerCase(),
    );
    writeJson(STORAGE.customIdioms, custom);
  }

  const deleted = new Set(readStringList(STORAGE.deletedIdioms));
  deleted.add(key);
  writeJson(STORAGE.deletedIdioms, [...deleted]);
};

export const getQuizProgress = () => {
  const progress = readJson(STORAGE.quizProgress, {});
  return progress && typeof progress === "object" ? progress : {};
};

export const saveQuizProgress = (progress) => writeJson(STORAGE.quizProgress, progress);

const defaultQuizSettings = () => ({
  scope: "due",
  mode: "flashcard",
  timer: false,
  requeue: true,
  categoryFilter: "All",
});

export const readQuizSettings = () => {
  const raw = readJson(STORAGE.quizSettings, null);
  if (!raw || typeof raw !== "object") return defaultQuizSettings();
  return { ...defaultQuizSettings(), ...raw };
};

export const saveQuizSettings = (settings) =>
  writeJson(STORAGE.quizSettings, { ...defaultQuizSettings(), ...settings });

export const getWeakWords = (vocabulary: Word[] = [], { limit = 0 }: { limit?: number } = {}): Word[] => {
  const progress = getQuizProgress();
  const weak = vocabulary
    .filter((item) => progress[item.word]?.lastResult === "again")
    .sort(
      (a, b) =>
        Number(progress[b.word]?.updatedAt || 0) -
        Number(progress[a.word]?.updatedAt || 0),
    );
  return limit > 0 ? weak.slice(0, limit) : weak;
};

export const getTopicsForWord = (word: string, topics: Topic[] = []): Topic[] => {
  const key = String(word || "").toLowerCase();
  if (!key) return [];
  return topics.filter((topic) =>
    (topic.vocabulary || []).some((item) => String(item).toLowerCase() === key),
  );
};

export const getMissingTopicWords = (topic: Topic | null | undefined, vocabulary: Word[] = []): string[] => {
  const known = new Set(vocabulary.map((item) => item.word.toLowerCase()));
  return (topic?.vocabulary || []).filter(
    (word) => word && !known.has(String(word).toLowerCase()),
  );
};

export const getMissingTopicIdioms = (topic: Topic | null | undefined, idioms: Idiom[] = []): string[] => {
  const known = new Set(idioms.map((item) => String(item.idiom || "").toLowerCase()));
  return (topic?.idioms || []).filter(
    (phrase) => phrase && !known.has(String(phrase).toLowerCase()),
  );
};

export const resolveTopicIdioms = (topic: Topic | null | undefined, idioms: Idiom[] = []): Idiom[] => {
  const map = new Map(
    idioms.map((item) => [String(item.idiom || "").toLowerCase(), item]),
  );
  return (topic?.idioms || [])
    .map((phrase) => map.get(String(phrase).toLowerCase()) || null)
    .filter((item): item is Idiom => Boolean(item));
};

export const getLastBackupAt = () => {
  const value = localStorage.getItem(STORAGE.lastBackupAt);
  return value || "";
};

export const markBackupExported = () => {
  const stamp = new Date().toISOString();
  localStorage.setItem(STORAGE.lastBackupAt, stamp);
  return stamp;
};

export const shouldRemindBackup = ({ days = 7 } = {}) => {
  const customVocab = readJson(STORAGE.customVocab, []);
  const customTopics = readJson(STORAGE.customTopics, []);
  const customIdioms = readJson(STORAGE.customIdioms, []);
  const hasCustom =
    (Array.isArray(customVocab) && customVocab.length > 0) ||
    (Array.isArray(customTopics) && customTopics.length > 0) ||
    (Array.isArray(customIdioms) && customIdioms.length > 0);
  if (!hasCustom) return false;

  const last = getLastBackupAt();
  if (!last) return true;
  const ageMs = Date.now() - new Date(last).getTime();
  if (Number.isNaN(ageMs)) return true;
  return ageMs >= days * 24 * 60 * 60 * 1000;
};

export const getSpeakingPractice = () => {
  const data = readJson(STORAGE.speakingPractice, {});
  return data && typeof data === "object" ? data : {};
};

export const recordSpeakingPractice = (topicTitle) => {
  const title = String(topicTitle || "").trim();
  if (!title) return null;
  const all = getSpeakingPractice();
  const current = all[title] || { count: 0, lastPracticed: "" };
  const next = {
    count: (Number(current.count) || 0) + 1,
    lastPracticed: new Date().toISOString(),
  };
  all[title] = next;
  writeJson(STORAGE.speakingPractice, all);
  return next;
};

export const getSpeakingPracticeFor = (topicTitle) => {
  const all = getSpeakingPractice();
  return all[String(topicTitle || "")] || null;
};

export const getStudyStreakInfo = () => {
  const data = readJson(STORAGE.studyStreak, { lastDate: "", streak: 0 });
  const today = new Date().toISOString().slice(0, 10);
  const studiedToday = data.lastDate === today;
  return {
    streak: Number(data.streak) || 0,
    studiedToday,
    lastDate: String(data.lastDate || ""),
  };
};

export const recordStudyActivity = () => {
  const today = new Date().toISOString().slice(0, 10);
  const data = readJson(STORAGE.studyStreak, { lastDate: "", streak: 0 });
  if (data.lastDate === today) return getStudyStreakInfo();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  let streak = 1;
  if (data.lastDate === yesterdayKey) streak = (Number(data.streak) || 0) + 1;
  else if (data.lastDate === today) streak = Number(data.streak) || 0;

  writeJson(STORAGE.studyStreak, { lastDate: today, streak });
  return getStudyStreakInfo();
};

const DAY_MS = 24 * 60 * 60 * 1000;

export type DueWordEntry = {
  item: Word;
  entry: QuizProgressEntry | { interval: number; ease: number; repetitions: number; nextReview: number };
  dueAt: number;
};

export const getDueWords = (vocabulary: Word[], now = Date.now()): DueWordEntry[] => {
  const progress = getQuizProgress();
  return vocabulary
    .map((item) => {
      const entry = progress[item.word] || {
        interval: 0,
        ease: 2.5,
        repetitions: 0,
        nextReview: 0,
      };
      return { item, entry, dueAt: Number(entry.nextReview) || 0 };
    })
    .filter(({ dueAt }) => dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt);
};

/** Lightweight SM-2 style update */
export const gradeWord = (word: string, knewIt: boolean) => {
  const progress = getQuizProgress() as Record<string, Record<string, unknown>>;
  const current = (progress[word] || {
    interval: 0,
    ease: 2.5,
    repetitions: 0,
    nextReview: 0,
  }) as {
    interval: number;
    ease: number;
    repetitions: number;
    nextReview: number;
  };

  let { interval, ease, repetitions } = current;

  if (knewIt) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * ease);
    repetitions += 1;
    ease = Math.min(3.0, ease + 0.1);
  } else {
    repetitions = 0;
    interval = 0;
    ease = Math.max(1.3, ease - 0.2);
  }

  const nextReview =
    interval === 0 ? Date.now() + 10 * 60 * 1000 : Date.now() + interval * DAY_MS;

  progress[word] = {
    interval,
    ease: Number(ease.toFixed(2)),
    repetitions,
    nextReview,
    lastResult: knewIt ? "know" : "again",
    updatedAt: Date.now(),
  };

  saveQuizProgress(progress);
  return progress[word];
};

const defaultStudyGoals = () => ({
  dailyReviews: 15,
  weeklyMinutes: 60,
});

export const getStudyHistory = () => {
  const data = readJson(STORAGE.studyHistory, []);
  return Array.isArray(data) ? data : [];
};

export const appendStudyEvent = (event = {}) => {
  const type = String(event.type || "activity").trim() || "activity";
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    at: event.at || new Date().toISOString(),
    date: (event.at || new Date().toISOString()).slice(0, 10),
    meta: event.meta && typeof event.meta === "object" ? event.meta : {},
  };
  const history = getStudyHistory();
  history.push(entry);
  writeJson(STORAGE.studyHistory, history.slice(-HISTORY_MAX));
  return entry;
};

export const getStudyGoals = () => {
  const raw = readJson(STORAGE.studyGoals, null);
  if (!raw || typeof raw !== "object") return defaultStudyGoals();
  return {
    dailyReviews: Math.max(1, Number(raw.dailyReviews) || 15),
    weeklyMinutes: Math.max(5, Number(raw.weeklyMinutes) || 60),
  };
};

export const saveStudyGoals = (goals = {}) => {
  const next = {
    ...getStudyGoals(),
    ...goals,
  };
  next.dailyReviews = Math.max(1, Number(next.dailyReviews) || 15);
  next.weeklyMinutes = Math.max(5, Number(next.weeklyMinutes) || 60);
  writeJson(STORAGE.studyGoals, next);
  return next;
};

export const getWritingResponses = () => {
  const data = readJson(STORAGE.writingResponses, {});
  return data && typeof data === "object" ? data : {};
};

export const getWritingResponsesForTopic = (topicTitle) => {
  const all = getWritingResponses();
  const entry = all[String(topicTitle || "")];
  return entry && typeof entry === "object" ? entry : {};
};

export const saveWritingResponse = (topicTitle, questionIndex, payload = {}) => {
  const title = String(topicTitle || "").trim();
  if (!title) return null;
  const all = getWritingResponses();
  const topic = { ...(all[title] || {}) };
  topic[String(questionIndex)] = {
    text: String(payload.text || "").trim(),
    grade: payload.grade || "",
    updatedAt: new Date().toISOString(),
  };
  all[title] = topic;
  writeJson(STORAGE.writingResponses, all);
  return topic[String(questionIndex)];
};

/** Parse CSV text into vocab word objects. Header row optional. */
export const parseVocabularyCsv = (text) => {
  const raw = String(text || "").replace(/^\uFEFF/, "").trim();
  if (!raw) return { words: [], errors: ["File is empty"] };

  const rows = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    const next = raw[i + 1];
    if (ch === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i += 1;
      rows.push(current);
      current = "";
      continue;
    }
    if (ch === "," && !inQuotes) {
      // handled below via split of completed rows — store cells differently
    }
    current += ch;
  }
  if (current.length) rows.push(current);

  const splitRow = (line) => {
    const cells = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      const next = line[i + 1];
      if (ch === '"' && quoted && next === '"') {
        cell += '"';
        i += 1;
        continue;
      }
      if (ch === '"') {
        quoted = !quoted;
        continue;
      }
      if (ch === "," && !quoted) {
        cells.push(cell.trim());
        cell = "";
        continue;
      }
      cell += ch;
    }
    cells.push(cell.trim());
    return cells;
  };

  const parsedRows = rows.map(splitRow).filter((r) => r.some((c) => c));
  if (!parsedRows.length) return { words: [], errors: ["No rows found"] };

  const header = parsedRows[0].map((h) => h.toLowerCase());
  const hasHeader = header.some((h) =>
    ["word", "meaning", "category", "sentence", "pronunciation", "tags", "notes"].includes(h),
  );
  const dataRows = hasHeader ? parsedRows.slice(1) : parsedRows;
  const indexOf = (name, fallback) => {
    const idx = header.indexOf(name);
    return idx >= 0 ? idx : fallback;
  };

  const col = {
    word: hasHeader ? indexOf("word", 0) : 0,
    meaning: hasHeader ? indexOf("meaning", 1) : 1,
    category: hasHeader ? indexOf("category", 2) : 2,
    sentence: hasHeader ? indexOf("sentence", 3) : 3,
    pronunciation: hasHeader ? indexOf("pronunciation", -1) : -1,
    synonym: hasHeader ? indexOf("synonym", -1) : -1,
    antonym: hasHeader ? indexOf("antonym", -1) : -1,
    tags: hasHeader ? indexOf("tags", -1) : -1,
    notes: hasHeader ? indexOf("notes", -1) : -1,
  };

  const words = [];
  const errors = [];
  dataRows.forEach((cells, idx) => {
    const word = cells[col.word] || "";
    const meaning = cells[col.meaning] || "";
    if (!word || !meaning) {
      errors.push(`Row ${idx + (hasHeader ? 2 : 1)}: need word and meaning`);
      return;
    }
    words.push(
      normalizeWord({
        word,
        meaning,
        category: col.category >= 0 ? cells[col.category] : "Learning",
        sentence: col.sentence >= 0 ? cells[col.sentence] : "",
        pronunciation: col.pronunciation >= 0 ? cells[col.pronunciation] : "",
        synonym: col.synonym >= 0 ? cells[col.synonym] : "",
        antonym: col.antonym >= 0 ? cells[col.antonym] : "",
        tags: col.tags >= 0 ? cells[col.tags] : "",
        notes: col.notes >= 0 ? cells[col.notes] : "",
        custom: true,
      }),
    );
  });

  return { words, errors };
};

export const importVocabularyWords = (words: Partial<Word>[] = []): number => {
  let imported = 0;
  words.forEach((item) => {
    try {
      upsertCustomWord(item);
      imported += 1;
    } catch (error) {
      console.warn("CSV word skipped", item?.word, error);
    }
  });
  return imported;
};

export const getActivityByDate = (days = 84) => {
  const history = getStudyHistory();
  const map = new Map();
  const today = new Date();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    map.set(d.toISOString().slice(0, 10), 0);
  }
  history.forEach((event) => {
    const key = event.date || String(event.at || "").slice(0, 10);
    if (!map.has(key)) return;
    const weight =
      event.type === "quiz_grade"
        ? 1
        : event.type === "quiz_session"
          ? Number(event.meta?.total) || 3
          : event.type === "speaking"
            ? 2
            : event.type === "writing"
              ? 2
              : 1;
    map.set(key, (map.get(key) || 0) + weight);
  });
  return [...map.entries()].map(([date, count]) => ({ date, count }));
};

export const getProgressStats = () => {
  const history = getStudyHistory();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekStart = weekAgo.toISOString().slice(0, 10);

  let reviewsToday = 0;
  let reviewsWeek = 0;
  let knownWeek = 0;
  let againWeek = 0;
  let sessionsWeek = 0;
  let speakingWeek = 0;
  let writingWeek = 0;
  let minutesWeek = 0;

  history.forEach((event) => {
    const date = event.date || String(event.at || "").slice(0, 10);
    if (event.type === "quiz_grade") {
      if (date === today) reviewsToday += 1;
      if (date >= weekStart) {
        reviewsWeek += 1;
        if (event.meta?.knewIt) knownWeek += 1;
        else againWeek += 1;
      }
    }
    if (event.type === "quiz_session" && date >= weekStart) {
      sessionsWeek += 1;
      minutesWeek += Number(event.meta?.minutes) || 5;
    }
    if (event.type === "speaking" && date >= weekStart) {
      speakingWeek += 1;
      minutesWeek += Number(event.meta?.minutes) || 3;
    }
    if (event.type === "writing" && date >= weekStart) {
      writingWeek += 1;
      minutesWeek += Number(event.meta?.minutes) || 4;
    }
  });

  const graded = knownWeek + againWeek;
  return {
    reviewsToday,
    reviewsWeek,
    sessionsWeek,
    speakingWeek,
    writingWeek,
    minutesWeek,
    accuracyWeek: graded ? Math.round((knownWeek / graded) * 100) : null,
    knownWeek,
    againWeek,
  };
};

export const buildExportPayload = ({
  favoriteWords,
  favoriteTopics,
  favoriteIdioms = [],
  completedTopics,
  completedIdioms = [],
}: {
  favoriteWords: Iterable<string>;
  favoriteTopics: Iterable<string>;
  favoriteIdioms?: Iterable<string>;
  completedTopics: Iterable<string>;
  completedIdioms?: Iterable<string>;
}) => ({
  version: 2,
  exportedAt: new Date().toISOString(),
  favorites: {
    words: [...favoriteWords],
    topics: [...favoriteTopics],
    idioms: [...favoriteIdioms],
  },
  completedTopics: [...completedTopics],
  completedIdioms: [...completedIdioms],
  customVocabulary: readJson(STORAGE.customVocab, []),
  customTopics: readJson(STORAGE.customTopics, []),
  customIdioms: readJson(STORAGE.customIdioms, []),
  deletedWords: readStringList(STORAGE.deletedWords),
  deletedTopics: readStringList(STORAGE.deletedTopics),
  deletedIdioms: readStringList(STORAGE.deletedIdioms),
  quizProgress: getQuizProgress(),
  studyHistory: getStudyHistory(),
  studyGoals: getStudyGoals(),
  writingResponses: getWritingResponses(),
  speakingPractice: getSpeakingPractice(),
  studyStreak: readJson(STORAGE.studyStreak, { lastDate: "", streak: 0 }),
});

export const applyImportPayload = (payload, { mode = "merge" } = {}) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid backup file");
  }

  if (mode === "replace") {
    writeJson(STORAGE.customVocab, []);
    writeJson(STORAGE.customTopics, []);
    writeJson(STORAGE.customIdioms, []);
    writeJson(STORAGE.deletedWords, []);
    writeJson(STORAGE.deletedTopics, []);
    writeJson(STORAGE.deletedIdioms, []);
    writeJson(STORAGE.quizProgress, {});
    writeJson(STORAGE.favoritesWords, []);
    writeJson(STORAGE.favoritesTopics, []);
    writeJson(STORAGE.favoritesIdioms, []);
    writeJson(STORAGE.completedTopics, []);
    writeJson(STORAGE.completedIdioms, []);
    writeJson(STORAGE.studyHistory, []);
    writeJson(STORAGE.studyGoals, defaultStudyGoals());
    writeJson(STORAGE.writingResponses, {});
    writeJson(STORAGE.speakingPractice, {});
  }

  if (Array.isArray(payload.customVocabulary)) {
    const existing = mode === "replace" ? [] : readJson(STORAGE.customVocab, []);
    const map = new Map(
      existing.map((item) => [String(item.word || "").toLowerCase(), item]),
    );
    payload.customVocabulary.forEach((item) => {
      const normalized = normalizeWord({ ...item, custom: true });
      if (normalized.word) map.set(normalized.word.toLowerCase(), normalized);
    });
    writeJson(STORAGE.customVocab, [...map.values()]);
  }

  if (Array.isArray(payload.customTopics)) {
    const existing = mode === "replace" ? [] : readJson(STORAGE.customTopics, []);
    const map = new Map(
      existing.map((item) => [String(item.title || "").toLowerCase(), item]),
    );
    payload.customTopics.forEach((item) => {
      const normalized = normalizeTopic({ ...item, custom: true });
      if (normalized.title) map.set(normalized.title.toLowerCase(), normalized);
    });
    writeJson(STORAGE.customTopics, [...map.values()]);
  }

  if (Array.isArray(payload.customIdioms)) {
    const existing = mode === "replace" ? [] : readJson(STORAGE.customIdioms, []);
    const map = new Map(
      existing.map((item) => [String(item.idiom || "").toLowerCase(), item]),
    );
    payload.customIdioms.forEach((item) => {
      const normalized = normalizeIdiom({ ...item, custom: true });
      if (normalized.idiom) map.set(normalized.idiom.toLowerCase(), normalized);
    });
    writeJson(STORAGE.customIdioms, [...map.values()]);
  }

  if (Array.isArray(payload.deletedWords)) {
    const deleted = new Set([
      ...(mode === "replace" ? [] : readStringList(STORAGE.deletedWords)),
      ...payload.deletedWords.map(String),
    ]);
    writeJson(STORAGE.deletedWords, [...deleted]);
  }

  if (Array.isArray(payload.deletedTopics)) {
    const deleted = new Set([
      ...(mode === "replace" ? [] : readStringList(STORAGE.deletedTopics)),
      ...payload.deletedTopics.map(String),
    ]);
    writeJson(STORAGE.deletedTopics, [...deleted]);
  }

  if (Array.isArray(payload.deletedIdioms)) {
    const deleted = new Set([
      ...(mode === "replace" ? [] : readStringList(STORAGE.deletedIdioms)),
      ...payload.deletedIdioms.map(String),
    ]);
    writeJson(STORAGE.deletedIdioms, [...deleted]);
  }

  if (payload.quizProgress && typeof payload.quizProgress === "object") {
    const current = mode === "replace" ? {} : getQuizProgress();
    writeJson(STORAGE.quizProgress, { ...current, ...payload.quizProgress });
  }

  const favorites = payload.favorites || {};
  if (Array.isArray(favorites.words)) {
    const current = new Set(mode === "replace" ? [] : readStringList(STORAGE.favoritesWords));
    favorites.words.forEach((word) => current.add(String(word)));
    writeJson(STORAGE.favoritesWords, [...current]);
  }
  if (Array.isArray(favorites.topics)) {
    const current = new Set(mode === "replace" ? [] : readStringList(STORAGE.favoritesTopics));
    favorites.topics.forEach((title) => current.add(String(title)));
    writeJson(STORAGE.favoritesTopics, [...current]);
  }
  if (Array.isArray(favorites.idioms)) {
    const current = new Set(mode === "replace" ? [] : readStringList(STORAGE.favoritesIdioms));
    favorites.idioms.forEach((idiom) => current.add(String(idiom)));
    writeJson(STORAGE.favoritesIdioms, [...current]);
  }

  if (Array.isArray(payload.completedTopics)) {
    const current = new Set(
      mode === "replace" ? [] : readStringList(STORAGE.completedTopics),
    );
    payload.completedTopics.forEach((title) => current.add(String(title)));
    writeJson(STORAGE.completedTopics, [...current]);
  }

  if (Array.isArray(payload.completedIdioms)) {
    const current = new Set(
      mode === "replace" ? [] : readStringList(STORAGE.completedIdioms),
    );
    payload.completedIdioms.forEach((idiom) => current.add(String(idiom)));
    writeJson(STORAGE.completedIdioms, [...current]);
  }

  if (Array.isArray(payload.studyHistory)) {
    if (mode === "replace") {
      writeJson(STORAGE.studyHistory, payload.studyHistory.slice(-HISTORY_MAX));
    } else {
      const merged = [...getStudyHistory(), ...payload.studyHistory];
      writeJson(STORAGE.studyHistory, merged.slice(-HISTORY_MAX));
    }
  }

  if (payload.studyGoals && typeof payload.studyGoals === "object") {
    const current = mode === "replace" ? defaultStudyGoals() : getStudyGoals();
    writeJson(STORAGE.studyGoals, { ...current, ...payload.studyGoals });
  }

  if (payload.writingResponses && typeof payload.writingResponses === "object") {
    const current = mode === "replace" ? {} : getWritingResponses();
    writeJson(STORAGE.writingResponses, { ...current, ...payload.writingResponses });
  }

  if (payload.speakingPractice && typeof payload.speakingPractice === "object") {
    const current = mode === "replace" ? {} : getSpeakingPractice();
    writeJson(STORAGE.speakingPractice, { ...current, ...payload.speakingPractice });
  }

  if (payload.studyStreak && typeof payload.studyStreak === "object" && mode === "replace") {
    writeJson(STORAGE.studyStreak, payload.studyStreak);
  }
};
