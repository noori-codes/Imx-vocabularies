import { useMemo } from "react";
import { categoryClass } from "../lib/dom";
import { CATEGORIES, useLibrary } from "../state/libraryStore";
import { useAppShell } from "../state/appShell";
import { VocabCard } from "../components/vocabulary/VocabCard";
import { EmptyState } from "../ui/empty";
import { WordFormModal } from "../components/modals/WordModals";

export function WordsPage() {
  const { vocabularyData } = useLibrary();
  const {
    searchTerm,
    vocabCategory,
    setVocabCategory,
    vocabSort,
    setVocabSort,
    vocabFavoritesOnly,
    setVocabFavoritesOnly,
    clearViewFilters,
    openModal,
  } = useAppShell();

  const library = useLibrary();
  const list = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return vocabularyData
      .filter((item) => {
        const matchesCategory = vocabCategory === "All" || item.category === vocabCategory;
        const matchesFavorite =
          !vocabFavoritesOnly || library.favoriteWords.has(item.word);
        if (!matchesCategory || !matchesFavorite) return false;
        if (!term) return true;
        const haystack = [
          item.word,
          item.meaning,
          item.synonym,
          item.antonym,
          item.wordFamily,
          item.sentence,
          item.notes,
          item.category,
          ...(Array.isArray(item.tags) ? item.tags : []),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) =>
        vocabSort === "za" ? b.word.localeCompare(a.word) : a.word.localeCompare(b.word),
      );
  }, [
    vocabularyData,
    searchTerm,
    vocabCategory,
    vocabFavoritesOnly,
    vocabSort,
    library.favoriteWords,
  ]);

  return (
    <section id="vocabulary" className="page page--active">
      <div className="page-header">
        <div>
          <p className="eyebrow">Vocabulary</p>
          <h2>Word library</h2>
        </div>
        <div className="page-controls">
          <button
            id="addWordBtn"
            className="primary-btn"
            type="button"
            onClick={() => openModal("Add word", <WordFormModal />)}
          >
            Add word
          </button>
          <button
            id="vocabFavoriteToggle"
            className={`pill-toggle${vocabFavoritesOnly ? " active" : ""}`}
            type="button"
            onClick={() => setVocabFavoritesOnly(!vocabFavoritesOnly)}
          >
            Favorites only
          </button>
          <label className="select-wrap">
            <span>Sort</span>
            <select
              id="vocabSortSelect"
              value={vocabSort}
              onChange={(e) => setVocabSort(e.target.value as "az" | "za")}
            >
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
            </select>
          </label>
        </div>
      </div>

      <section className="filters">
        <div id="vocabCategoryButtons" className="filter-buttons">
          {["All", ...CATEGORIES].map((category) => (
            <button
              key={category}
              type="button"
              className={`filter-btn ${vocabCategory === category ? "is-active" : ""} ${category !== "All" ? categoryClass(category) : ""}`}
              onClick={() => setVocabCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <div className="results__meta">
        <p id="vocabResultsText">Showing {list.length} vocabulary words</p>
      </div>
      <div id="vocabGrid" className="card-grid">
        {!list.length ? (
          <EmptyState
            title={vocabularyData.length ? "No vocabulary found" : "Vocabulary not loaded"}
            detail={
              vocabularyData.length
                ? "Try a different search term or category, or add a new word."
                : "Run npm run dev and open the local URL, then hard-refresh."
            }
            hasLibrary={vocabularyData.length > 0}
            showClear={
              Boolean(searchTerm.trim()) || vocabCategory !== "All" || vocabFavoritesOnly
            }
            onClearFilters={clearViewFilters}
          />
        ) : (
          list.map((item) => <VocabCard key={item.word} item={item} />)
        )}
      </div>
    </section>
  );
}
