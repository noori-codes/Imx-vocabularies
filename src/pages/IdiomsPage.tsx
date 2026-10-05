import { useMemo } from "react";
import { useLibrary } from "../state/libraryStore";
import { useAppShell } from "../state/appShell";
import { IdiomCard } from "../components/idioms/IdiomCard";
import { EmptyState } from "../ui/empty";
import { IdiomFormModal } from "../components/modals/TopicIdiomModals";
import { IDIOM_TEMPLATE } from "../state/templates";

export function IdiomsPage() {
  const { idiomData, isIdiomCompleted, favoriteIdioms } = useLibrary();
  const {
    searchTerm,
    idiomFavoritesOnly,
    setIdiomFavoritesOnly,
    clearViewFilters,
    openModal,
  } = useAppShell();

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return idiomData.filter((idiom) => {
      const matchesFavorite = !idiomFavoritesOnly || favoriteIdioms.has(idiom.idiom);
      if (!matchesFavorite) return false;
      if (!term) return true;
      const haystack = [
        idiom.idiom,
        idiom.meaning,
        idiom.example,
        idiom.usage,
        idiom.summary,
        idiom.notes,
        idiom.date,
        (idiom.questions || []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [idiomData, searchTerm, idiomFavoritesOnly, favoriteIdioms]);

  const completedCount = idiomData.filter((i) => isIdiomCompleted(i)).length;

  return (
    <section id="idioms" className="page page--active">
      <div className="page-header">
        <div>
          <p className="eyebrow">Phrases</p>
          <h2>Idioms</h2>
        </div>
        <div className="page-controls">
          <button
            id="addIdiomBtn"
            className="primary-btn"
            type="button"
            onClick={() => openModal("Add idiom", <IdiomFormModal />)}
          >
            Add idiom
          </button>
          <button
            id="idiomTemplateBtn"
            className="ghost-btn"
            type="button"
            onClick={() =>
              openModal(
                "New idiom from template",
                <IdiomFormModal
                  item={{ ...IDIOM_TEMPLATE, date: new Date().toISOString().slice(0, 10) }}
                  fromTemplate
                />,
              )
            }
          >
            From template
          </button>
          <button
            id="idiomFavoriteToggle"
            className={`pill-toggle${idiomFavoritesOnly ? " active" : ""}`}
            type="button"
            onClick={() => setIdiomFavoritesOnly(!idiomFavoritesOnly)}
          >
            Favorite idioms
          </button>
        </div>
      </div>

      <div className="results__meta">
        <p id="idiomResultsText">
          Showing {filtered.length} idioms · {completedCount} completed
        </p>
      </div>
      <div id="idiomGrid" className="accordion-grid">
        {!filtered.length ? (
          <EmptyState
            title={idiomData.length ? "No idioms match your filters" : "Idioms not loaded"}
            detail={
              idiomData.length
                ? "Try broadening the search term or add a new idiom."
                : "Run npm run dev and open the local URL, then hard-refresh."
            }
            hasLibrary={idiomData.length > 0}
            showClear={Boolean(searchTerm.trim()) || idiomFavoritesOnly}
            onClearFilters={clearViewFilters}
          />
        ) : (
          filtered.map((idiom) => <IdiomCard key={idiom.idiom} idiom={idiom} />)
        )}
      </div>
    </section>
  );
}
