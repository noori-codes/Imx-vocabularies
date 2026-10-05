import { useMemo } from "react";
import { useLibrary } from "../state/libraryStore";
import { useAppShell } from "../state/appShell";
import { TopicCard } from "../components/topic/TopicCard";
import { EmptyState } from "../ui/empty";
import { TopicFormModal } from "../components/modals/TopicIdiomModals";
import { LESSON_TEMPLATE } from "../state/templates";

export function TopicsPage() {
  const { topicData, isTopicCompleted, favoriteTopics } = useLibrary();
  const {
    searchTerm,
    topicFavoritesOnly,
    setTopicFavoritesOnly,
    clearViewFilters,
    openModal,
    focusTopicTitle,
  } = useAppShell();

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return topicData.filter((topic) => {
      const matchesFavorite =
        !topicFavoritesOnly || favoriteTopics.has(topic.title);
      if (!matchesFavorite) return false;
      if (!term) return true;
      const haystack = [
        topic.title,
        topic.summary,
        topic.notes,
        topic.date,
        (topic.vocabulary || []).join(" "),
        (topic.idioms || []).join(" "),
        (topic.questions || []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [topicData, searchTerm, topicFavoritesOnly, favoriteTopics]);

  const completedCount = topicData.filter((t) => isTopicCompleted(t)).length;

  return (
    <section id="topics" className="page page--active">
      <div className="page-header">
        <div>
          <p className="eyebrow">Daily lessons</p>
          <h2>Topics</h2>
        </div>
        <div className="page-controls">
          <button
            id="addTopicBtn"
            className="primary-btn"
            type="button"
            onClick={() => openModal("Add topic", <TopicFormModal />)}
          >
            Add topic
          </button>
          <button
            id="topicTemplateBtn"
            className="ghost-btn"
            type="button"
            onClick={() =>
              openModal(
                "New lesson from template",
                <TopicFormModal
                  item={{ ...LESSON_TEMPLATE, date: new Date().toISOString().slice(0, 10) }}
                  fromTemplate
                />,
              )
            }
          >
            From template
          </button>
          <button
            id="topicFavoriteToggle"
            className={`pill-toggle${topicFavoritesOnly ? " active" : ""}`}
            type="button"
            onClick={() => setTopicFavoritesOnly(!topicFavoritesOnly)}
          >
            Favorite topics
          </button>
        </div>
      </div>

      <div className="results__meta">
        <p id="topicResultsText">
          Showing {filtered.length} daily lessons · {completedCount} completed
        </p>
      </div>
      <div id="topicGrid" className="accordion-grid">
        {!filtered.length ? (
          <EmptyState
            title={topicData.length ? "No topics match your filters" : "Topics not loaded"}
            detail={
              topicData.length
                ? "Try broadening the search term or add a new topic."
                : "Run npm run dev and open the local URL, then hard-refresh."
            }
            hasLibrary={topicData.length > 0}
            showClear={Boolean(searchTerm.trim()) || topicFavoritesOnly}
            onClearFilters={clearViewFilters}
          />
        ) : (
          filtered.map((topic, index) => (
            <TopicCard
              key={topic.title}
              topic={topic}
              index={index}
              forceOpen={focusTopicTitle === topic.title}
            />
          ))
        )}
      </div>
    </section>
  );
}
