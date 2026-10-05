import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { vocabularyData as seedVocabulary } from "../data/vocabulary";
import { topicData as seedTopics } from "../data/topics";
import { idiomData as seedIdioms } from "../data/idioms";
import {
  STORAGE,
  CATEGORIES,
  readStringList,
  writeJson,
  mergeVocabulary,
  mergeTopics,
  mergeIdioms,
  upsertCustomWord,
  softDeleteWord,
  upsertCustomTopic,
  softDeleteTopic,
  upsertCustomIdiom,
  softDeleteIdiom,
  buildExportPayload,
  applyImportPayload,
  importVocabularyWords,
  markBackupExported,
  parseVocabularyCsv,
} from "../lib/storage";
import type { Idiom, Topic, Word } from "../types/models";

type LibraryContextValue = {
  vocabularyData: Word[];
  topicData: Topic[];
  idiomData: Idiom[];
  favoriteWords: Set<string>;
  favoriteTopics: Set<string>;
  favoriteIdioms: Set<string>;
  completedTopics: Set<string>;
  completedIdioms: Set<string>;
  dataLoaded: boolean;
  loadError: boolean;
  rebuildLibrary: () => void;
  refreshAll: () => void;
  saveFavorites: () => void;
  saveCompletedTopics: () => void;
  saveCompletedIdioms: () => void;
  toggleWordFavorite: (word: string) => void;
  toggleTopicFavorite: (title: string) => void;
  toggleIdiomFavorite: (phrase: string) => void;
  toggleTopicCompleted: (title: string) => void;
  toggleIdiomCompleted: (phrase: string) => void;
  isTopicCompleted: (topic: Topic) => boolean;
  isIdiomCompleted: (idiom: Idiom) => boolean;
  upsertWord: (payload: Record<string, FormDataEntryValue>, previousWord?: string | null) => Word;
  deleteWord: (word: string) => void;
  upsertTopic: (payload: Record<string, FormDataEntryValue>, previousTitle?: string | null) => Topic;
  deleteTopic: (title: string) => void;
  upsertIdiom: (payload: Record<string, FormDataEntryValue>, previousIdiom?: string | null) => Idiom;
  deleteIdiom: (phrase: string) => void;
  exportBackup: () => void;
  importBackup: (file: File, mode: "merge" | "replace") => Promise<void>;
  importCsv: (file: File) => Promise<{ imported: number; errors: number }>;
  restoreBuiltInLibrary: () => void;
  reloadSetsFromStorage: () => void;
  version: number;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [baseVocabulary] = useState(() =>
    Array.isArray(seedVocabulary) ? seedVocabulary : [],
  );
  const [baseTopics] = useState(() => (Array.isArray(seedTopics) ? seedTopics : []));
  const [baseIdioms] = useState(() => (Array.isArray(seedIdioms) ? seedIdioms : []));

  const [vocabularyData, setVocabularyData] = useState<Word[]>([]);
  const [topicData, setTopicData] = useState<Topic[]>([]);
  const [idiomData, setIdiomData] = useState<Idiom[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [version, setVersion] = useState(0);

  const [favoriteWords, setFavoriteWords] = useState(
    () => new Set(readStringList(STORAGE.favoritesWords)),
  );
  const [favoriteTopics, setFavoriteTopics] = useState(
    () => new Set(readStringList(STORAGE.favoritesTopics)),
  );
  const [favoriteIdioms, setFavoriteIdioms] = useState(
    () => new Set(readStringList(STORAGE.favoritesIdioms)),
  );
  const [completedTopics, setCompletedTopics] = useState(
    () => new Set(readStringList(STORAGE.completedTopics)),
  );
  const [completedIdioms, setCompletedIdioms] = useState(
    () => new Set(readStringList(STORAGE.completedIdioms)),
  );

  const rebuildLibrary = useCallback(() => {
    setVocabularyData(mergeVocabulary(baseVocabulary));
    setTopicData(mergeTopics(baseTopics));
    setIdiomData(mergeIdioms(baseIdioms));
    setVersion((v) => v + 1);
  }, [baseVocabulary, baseTopics, baseIdioms]);

  const saveFavorites = useCallback(() => {
    writeJson(STORAGE.favoritesWords, [...favoriteWords]);
    writeJson(STORAGE.favoritesTopics, [...favoriteTopics]);
    writeJson(STORAGE.favoritesIdioms, [...favoriteIdioms]);
  }, [favoriteWords, favoriteTopics, favoriteIdioms]);

  const saveCompletedTopics = useCallback(() => {
    writeJson(STORAGE.completedTopics, [...completedTopics]);
  }, [completedTopics]);

  const saveCompletedIdioms = useCallback(() => {
    writeJson(STORAGE.completedIdioms, [...completedIdioms]);
  }, [completedIdioms]);

  const reloadSetsFromStorage = useCallback(() => {
    setFavoriteWords(new Set(readStringList(STORAGE.favoritesWords)));
    setFavoriteTopics(new Set(readStringList(STORAGE.favoritesTopics)));
    setFavoriteIdioms(new Set(readStringList(STORAGE.favoritesIdioms)));
    setCompletedTopics(new Set(readStringList(STORAGE.completedTopics)));
    setCompletedIdioms(new Set(readStringList(STORAGE.completedIdioms)));
  }, []);

  const refreshAll = useCallback(() => {
    rebuildLibrary();
  }, [rebuildLibrary]);

  useEffect(() => {
    try {
      if (!baseVocabulary.length || !baseTopics.length) {
        throw new Error("Built-in library files loaded empty");
      }
      setVocabularyData(mergeVocabulary(baseVocabulary));
      setTopicData(mergeTopics(baseTopics));
      setIdiomData(mergeIdioms(baseIdioms));
      setDataLoaded(true);
      setLoadError(false);
      setVersion((v) => v + 1);
    } catch {
      setVocabularyData([]);
      setTopicData([]);
      setIdiomData([]);
      setDataLoaded(true);
      setLoadError(true);
    }
  }, [baseVocabulary, baseTopics, baseIdioms]);

  const toggleWordFavorite = useCallback(
    (word: string) => {
      setFavoriteWords((prev) => {
        const next = new Set(prev);
        if (next.has(word)) next.delete(word);
        else next.add(word);
        writeJson(STORAGE.favoritesWords, [...next]);
        return next;
      });
    },
    [],
  );

  const toggleTopicFavorite = useCallback((title: string) => {
    setFavoriteTopics((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      writeJson(STORAGE.favoritesTopics, [...next]);
      return next;
    });
  }, []);

  const toggleIdiomFavorite = useCallback((phrase: string) => {
    setFavoriteIdioms((prev) => {
      const next = new Set(prev);
      if (next.has(phrase)) next.delete(phrase);
      else next.add(phrase);
      writeJson(STORAGE.favoritesIdioms, [...next]);
      return next;
    });
  }, []);

  const toggleTopicCompleted = useCallback(
    (title: string) => {
      setCompletedTopics((prev) => {
        const next = new Set(prev);
        if (next.has(title)) next.delete(title);
        else next.add(title);
        writeJson(STORAGE.completedTopics, [...next]);
        return next;
      });
    },
    [],
  );

  const toggleIdiomCompleted = useCallback(
    (phrase: string) => {
      setCompletedIdioms((prev) => {
        const next = new Set(prev);
        if (next.has(phrase)) next.delete(phrase);
        else next.add(phrase);
        writeJson(STORAGE.completedIdioms, [...next]);
        return next;
      });
    },
    [],
  );

  const isTopicCompleted = useCallback(
    (topic: Topic) => completedTopics.has(topic.title),
    [completedTopics],
  );

  const isIdiomCompleted = useCallback(
    (idiom: Idiom) => completedIdioms.has(idiom.idiom),
    [completedIdioms],
  );

  const upsertWord = useCallback(
    (payload: Record<string, FormDataEntryValue>, previousWord?: string | null) => {
      const saved = upsertCustomWord(payload, { previousWord: previousWord ?? undefined });
      if (previousWord && previousWord !== saved.word && favoriteWords.has(previousWord)) {
        setFavoriteWords((prev) => {
          const next = new Set(prev);
          next.delete(previousWord);
          next.add(saved.word);
          writeJson(STORAGE.favoritesWords, [...next]);
          return next;
        });
      }
      rebuildLibrary();
      return saved;
    },
    [favoriteWords, rebuildLibrary],
  );

  const deleteWord = useCallback(
    (word: string) => {
      softDeleteWord(word);
      setFavoriteWords((prev) => {
        const next = new Set(prev);
        next.delete(word);
        writeJson(STORAGE.favoritesWords, [...next]);
        return next;
      });
      rebuildLibrary();
    },
    [rebuildLibrary],
  );

  const upsertTopic = useCallback(
    (payload: Record<string, FormDataEntryValue>, previousTitle?: string | null) => {
      const saved = upsertCustomTopic(payload, { previousTitle: previousTitle ?? undefined });
      if (previousTitle && previousTitle !== saved.title && favoriteTopics.has(previousTitle)) {
        setFavoriteTopics((prev) => {
          const next = new Set(prev);
          next.delete(previousTitle);
          next.add(saved.title);
          writeJson(STORAGE.favoritesTopics, [...next]);
          return next;
        });
      }
      rebuildLibrary();
      return saved;
    },
    [favoriteTopics, rebuildLibrary],
  );

  const deleteTopic = useCallback(
    (title: string) => {
      softDeleteTopic(title);
      setFavoriteTopics((prev) => {
        const next = new Set(prev);
        next.delete(title);
        writeJson(STORAGE.favoritesTopics, [...next]);
        return next;
      });
      setCompletedTopics((prev) => {
        const next = new Set(prev);
        next.delete(title);
        writeJson(STORAGE.completedTopics, [...next]);
        return next;
      });
      rebuildLibrary();
    },
    [rebuildLibrary],
  );

  const upsertIdiom = useCallback(
    (payload: Record<string, FormDataEntryValue>, previousIdiom?: string | null) => {
      const saved = upsertCustomIdiom(payload, { previousIdiom: previousIdiom ?? undefined });
      if (previousIdiom && previousIdiom !== saved.idiom && favoriteIdioms.has(previousIdiom)) {
        setFavoriteIdioms((prev) => {
          const next = new Set(prev);
          next.delete(previousIdiom);
          next.add(saved.idiom);
          writeJson(STORAGE.favoritesIdioms, [...next]);
          return next;
        });
      }
      if (previousIdiom && previousIdiom !== saved.idiom && completedIdioms.has(previousIdiom)) {
        setCompletedIdioms((prev) => {
          const next = new Set(prev);
          next.delete(previousIdiom);
          next.add(saved.idiom);
          writeJson(STORAGE.completedIdioms, [...next]);
          return next;
        });
      }
      rebuildLibrary();
      return saved;
    },
    [completedIdioms, favoriteIdioms, rebuildLibrary],
  );

  const deleteIdiom = useCallback(
    (phrase: string) => {
      softDeleteIdiom(phrase);
      setFavoriteIdioms((prev) => {
        const next = new Set(prev);
        next.delete(phrase);
        writeJson(STORAGE.favoritesIdioms, [...next]);
        return next;
      });
      setCompletedIdioms((prev) => {
        const next = new Set(prev);
        next.delete(phrase);
        writeJson(STORAGE.completedIdioms, [...next]);
        return next;
      });
      rebuildLibrary();
    },
    [rebuildLibrary],
  );

  const exportBackup = useCallback(() => {
    const payload = buildExportPayload({
      favoriteWords,
      favoriteTopics,
      favoriteIdioms,
      completedTopics,
      completedIdioms,
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `imx-english-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    markBackupExported();
  }, [completedIdioms, completedTopics, favoriteIdioms, favoriteTopics, favoriteWords]);

  const importBackup = useCallback(
    async (file: File, mode: "merge" | "replace") => {
      const text = await file.text();
      const payload = JSON.parse(text);
      applyImportPayload(payload, { mode });
      reloadSetsFromStorage();
      rebuildLibrary();
    },
    [rebuildLibrary, reloadSetsFromStorage],
  );

  const importCsv = useCallback(
    async (file: File) => {
      const text = await file.text();
      const { words, errors } = parseVocabularyCsv(text);
      const imported = importVocabularyWords(words);
      rebuildLibrary();
      return { imported, errors: errors.length };
    },
    [rebuildLibrary],
  );

  const restoreBuiltInLibrary = useCallback(() => {
    writeJson(STORAGE.deletedWords, []);
    writeJson(STORAGE.deletedTopics, []);
    writeJson(STORAGE.deletedIdioms, []);
    rebuildLibrary();
  }, [rebuildLibrary]);

  const value = useMemo(
    (): LibraryContextValue => ({
      vocabularyData,
      topicData,
      idiomData,
      favoriteWords,
      favoriteTopics,
      favoriteIdioms,
      completedTopics,
      completedIdioms,
      dataLoaded,
      loadError,
      rebuildLibrary,
      refreshAll,
      saveFavorites,
      saveCompletedTopics,
      saveCompletedIdioms,
      toggleWordFavorite,
      toggleTopicFavorite,
      toggleIdiomFavorite,
      toggleTopicCompleted,
      toggleIdiomCompleted,
      isTopicCompleted,
      isIdiomCompleted,
      upsertWord,
      deleteWord,
      upsertTopic,
      deleteTopic,
      upsertIdiom,
      deleteIdiom,
      exportBackup,
      importBackup,
      importCsv,
      restoreBuiltInLibrary,
      reloadSetsFromStorage,
      version,
    }),
    [
      vocabularyData,
      topicData,
      idiomData,
      favoriteWords,
      favoriteTopics,
      favoriteIdioms,
      completedTopics,
      completedIdioms,
      dataLoaded,
      loadError,
      rebuildLibrary,
      refreshAll,
      saveFavorites,
      saveCompletedTopics,
      saveCompletedIdioms,
      toggleWordFavorite,
      toggleTopicFavorite,
      toggleIdiomFavorite,
      toggleTopicCompleted,
      toggleIdiomCompleted,
      isTopicCompleted,
      isIdiomCompleted,
      upsertWord,
      deleteWord,
      upsertTopic,
      deleteTopic,
      upsertIdiom,
      deleteIdiom,
      exportBackup,
      importBackup,
      importCsv,
      restoreBuiltInLibrary,
      reloadSetsFromStorage,
      version,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}

export { CATEGORIES };
