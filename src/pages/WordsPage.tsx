import { useMemo, useState } from "react";
import { LayoutGrid, List, Plus } from "lucide-react";
import { categoryClass } from "../lib/dom";
import { CATEGORIES, useLibrary } from "../state/libraryStore";
import { useAppShell } from "../state/appShell";
import { VocabCard } from "../components/vocabulary/VocabCard";
import { EmptyState } from "../ui/empty";
import { WordFormModal } from "../components/modals/WordModals";

export function WordsPage() {
  const library = useLibrary();
  const { vocabularyData, dataLoaded, favoriteWords } = library;
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
  const [view, setView] = useState<"grid" | "list">("grid");

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: vocabularyData.length };
    for (const cat of CATEGORIES) counts[cat] = 0;
    for (const item of vocabularyData) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [vocabularyData]);

  const list = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return vocabularyData
      .filter((item) => {
        const matchesCategory = vocabCategory === "All" || item.category === vocabCategory;
        const matchesFavorite = !vocabFavoritesOnly || favoriteWords.has(item.word);
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
    favoriteWords,
  ]);

  const categoryOptions = ["All", ...CATEGORIES] as const;

  return (
    <section id="vocabulary" className="page page--active">
      <div className="page-header">
        <div>
          <p className="eyebrow">Vocabulary</p>
          <h2>Word library</h2>
        </div>
        <div className="page-controls">
          <div className="view-toggle" role="group" aria-label="View mode">
            <button
              type="button"
              className={`view-toggle__btn${view === "grid" ? " is-active" : ""}`}
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
            >
              <LayoutGrid size={18} strokeWidth={2.35} aria-hidden="true" />
              Grid
            </button>
            <button
              type="button"
              className={`view-toggle__btn${view === "list" ? " is-active" : ""}`}
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <List size={18} strokeWidth={2.35} aria-hidden="true" />
              List
            </button>
          </div>
          <button
            id="addWordBtn"
            className="primary-btn"
            type="button"
            onClick={() => openModal("Add word", <WordFormModal />)}
          >
            <Plus size={18} strokeWidth={2.35} aria-hidden="true" />
            Add word
          </button>
        </div>
      </div>

      <div className="words-layout">
        <aside className="words-rail" aria-label="Filters">
          <p className="words-rail__label">Category</p>
          <div id="vocabCategoryButtons" className="words-rail__cats">
            {categoryOptions.map((category) => (
              <button
                key={category}
                type="button"
                className={`words-rail__cat ${vocabCategory === category ? "is-active" : ""} ${category !== "All" ? categoryClass(category) : ""}`}
                onClick={() => setVocabCategory(category)}
              >
                <span>{category}</span>
                <span className="words-rail__count">{categoryCounts[category] ?? 0}</span>
              </button>
            ))}
          </div>

          <div className="words-rail__tools">
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
        </aside>

        {/* Mobile horizontal filters */}
        <section className="filters words-filters-mobile" aria-label="Categories">
          <div className="filter-buttons">
            {categoryOptions.map((category) => (
              <button
                key={`m-${category}`}
                type="button"
                className={`filter-btn ${vocabCategory === category ? "is-active" : ""} ${category !== "All" ? categoryClass(category) : ""}`}
                onClick={() => setVocabCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="words-mobile-tools">
            <button
              className={`pill-toggle${vocabFavoritesOnly ? " active" : ""}`}
              type="button"
              onClick={() => setVocabFavoritesOnly(!vocabFavoritesOnly)}
            >
              Favorites
            </button>
            <label className="select-wrap">
              <span>Sort</span>
              <select
                value={vocabSort}
                onChange={(e) => setVocabSort(e.target.value as "az" | "za")}
              >
                <option value="az">A → Z</option>
                <option value="za">Z → A</option>
              </select>
            </label>
          </div>
        </section>

        <div className="words-main">
          <div className="results__meta">
            <p id="vocabResultsText">Showing {list.length} vocabulary words</p>
          </div>
          <div
            id="vocabGrid"
            className={view === "list" ? "vocab-list" : "card-grid"}
          >
            {!list.length ? (
              <EmptyState
                title={
                  !dataLoaded
                    ? "Loading vocabulary…"
                    : vocabularyData.length
                      ? "No vocabulary found"
                      : "Vocabulary not loaded"
                }
                detail={
                  !dataLoaded
                    ? "Pulling in your word library."
                    : vocabularyData.length
                      ? "Try a different search term or category, or add a new word."
                      : "Hard-refresh, or restore the built-in library from Data."
                }
                hasLibrary={vocabularyData.length > 0}
                showClear={
                  Boolean(searchTerm.trim()) || vocabCategory !== "All" || vocabFavoritesOnly
                }
                onClearFilters={clearViewFilters}
              />
            ) : (
              list.map((item) => (
                <VocabCard key={item.word} item={item} layout={view} />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
