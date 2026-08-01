import { normalizeCategory, CATEGORIES } from "../data/categories.js";

const STORAGE = {
  favoritesWords: "imx-hub-word-favorites",
  favoritesTopics: "imx-hub-topic-favorites",
  completedTopics: "imx-hub-completed-topics",
  theme: "imx-hub-theme",
  customVocab: "imx-hub-custom-vocab",
  customTopics: "imx-hub-custom-topics",
  deletedWords: "imx-hub-deleted-words",
  deletedTopics: "imx-hub-deleted-topics",
  quizProgress: "imx-hub-quiz-progress",
  quizSettings: "imx-hub-quiz-settings",
  studyStreak: "imx-hub-study-streak",
  lastBackupAt: "imx-hub-last-backup-at",
  speakingPractice: "imx-hub-speaking-practice",
};

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

const normalizeWord = (item = {}) => ({
  word: String(item.word || "").trim(),
  pronunciation: String(item.pronunciation || "").trim(),
  meaning: String(item.meaning || "").trim(),
  synonym: String(item.synonym || "").trim(),
  antonym: String(item.antonym || "").trim(),
  wordFamily: String(item.wordFamily || "").trim(),
  sentence: String(item.sentence || "").trim(),
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

export const mergeVocabulary = (baseList = []) => {
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

export const mergeTopics = (baseList = []) => {
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

export const upsertCustomWord = (wordData, { previousWord } = {}) => {
  const custom = Array.isArray(readJson(STORAGE.customVocab, []))
    ? readJson(STORAGE.customVocab, [])
    : [];
  const normalized = normalizeWord({ ...wordData, custom: true });
  if (!normalized.word) throw new Error("Word is required");

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

export const getWeakWords = (vocabulary = [], { limit = 0 } = {}) => {
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

export const getTopicsForWord = (word, topics = []) => {
  const key = String(word || "").toLowerCase();
  if (!key) return [];
  return topics.filter((topic) =>
    (topic.vocabulary || []).some((item) => String(item).toLowerCase() === key),
  );
};

export const getMissingTopicWords = (topic, vocabulary = []) => {
  const known = new Set(vocabulary.map((item) => item.word.toLowerCase()));
  return (topic?.vocabulary || []).filter(
    (word) => word && !known.has(String(word).toLowerCase()),
  );
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
  const hasCustom =
    (Array.isArray(customVocab) && customVocab.length > 0) ||
    (Array.isArray(customTopics) && customTopics.length > 0);
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

export const getDueWords = (vocabulary, now = Date.now()) => {
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
export const gradeWord = (word, knewIt) => {
  const progress = getQuizProgress();
  const current = progress[word] || {
    interval: 0,
    ease: 2.5,
    repetitions: 0,
    nextReview: 0,
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

export const buildExportPayload = ({ favoriteWords, favoriteTopics, completedTopics }) => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  favorites: {
    words: [...favoriteWords],
    topics: [...favoriteTopics],
  },
  completedTopics: [...completedTopics],
  customVocabulary: readJson(STORAGE.customVocab, []),
  customTopics: readJson(STORAGE.customTopics, []),
  deletedWords: readStringList(STORAGE.deletedWords),
  deletedTopics: readStringList(STORAGE.deletedTopics),
  quizProgress: getQuizProgress(),
});

export const applyImportPayload = (payload, { mode = "merge" } = {}) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid backup file");
  }

  if (mode === "replace") {
    writeJson(STORAGE.customVocab, []);
    writeJson(STORAGE.customTopics, []);
    writeJson(STORAGE.deletedWords, []);
    writeJson(STORAGE.deletedTopics, []);
    writeJson(STORAGE.quizProgress, {});
    writeJson(STORAGE.favoritesWords, []);
    writeJson(STORAGE.favoritesTopics, []);
    writeJson(STORAGE.completedTopics, []);
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

  if (Array.isArray(payload.completedTopics)) {
    const current = new Set(
      mode === "replace" ? [] : readStringList(STORAGE.completedTopics),
    );
    payload.completedTopics.forEach((title) => current.add(String(title)));
    writeJson(STORAGE.completedTopics, [...current]);
  }
};
