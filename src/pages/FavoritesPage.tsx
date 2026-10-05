import { formatDate } from "../lib/helpers";
import { useLibrary } from "../state/libraryStore";
import { useAppShell } from "../state/appShell";
import { VocabCard } from "../components/vocabulary/VocabCard";
import { IdiomCard } from "../components/idioms/IdiomCard";
import { EmptyState } from "../ui/empty";

export function FavoritesPage() {
  const { vocabularyData, topicData, idiomData, favoriteWords, favoriteTopics, favoriteIdioms } =
    useLibrary();
  const { navigate } = useAppShell();

  const favoriteWordsList = vocabularyData.filter((item) => favoriteWords.has(item.word));
  const favoriteTopicsList = topicData.filter((t) => favoriteTopics.has(t.title));
  const favoriteIdiomsList = idiomData.filter((i) => favoriteIdioms.has(i.idiom));

  return (
    <section id="favorites" className="page page--active">
      <div className="page-header">
        <div>
          <p className="eyebrow">Saved</p>
          <h2>Study highlights</h2>
        </div>
      </div>

      <div className="favorites-section">
        <div className="favorites-block">
          <p className="favorites-heading">Favorite vocabulary</p>
          <div id="favoriteVocabGrid" className="card-grid">
            {!favoriteWordsList.length ? (
              <EmptyState
                title="No favorite vocabulary yet"
                detail="Mark words as favorites to save them here."
                showClear={false}
              />
            ) : (
              favoriteWordsList.map((item) => <VocabCard key={item.word} item={item} compact />)
            )}
          </div>
        </div>

        <div className="favorites-block">
          <p className="favorites-heading">Favorite topics</p>
          <div id="favoriteTopicGrid" className="card-grid">
            {!favoriteTopicsList.length ? (
              <EmptyState
                title="No favorite topics yet"
                detail="Star a topic to keep it here for quick revisit."
                showClear={false}
              />
            ) : (
              favoriteTopicsList.map((topic) => (
                <article key={topic.title} className="topic-card is-open">
                  <div className="topic-card__header">
                    <div className="topic-headline">
                      <p className="topic-eyebrow">{formatDate(topic.date)}</p>
                      <h3>
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => navigate("topics", { replace: false })}
                        >
                          {topic.title}
                        </button>
                      </h3>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="favorites-block">
          <p className="favorites-heading">Favorite idioms</p>
          <div id="favoriteIdiomGrid" className="accordion-grid">
            {!favoriteIdiomsList.length ? (
              <EmptyState
                title="No favorite idioms yet"
                detail="Mark idioms as favorites to save them here."
                showClear={false}
              />
            ) : (
              favoriteIdiomsList.map((idiom) => (
                <IdiomCard key={idiom.idiom} idiom={idiom} />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
