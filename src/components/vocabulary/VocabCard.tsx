import { useState } from "react";
import { categoryClass, iconShare, iconSpeak, iconStar } from "../../lib/dom";
import { getTopicsForWord } from "../../lib/storage";
import { speakWord } from "../../lib/speech";
import { formatWordShare, shareContent } from "../../lib/share";
import { useLibrary } from "../../state/libraryStore";
import { useAppShell } from "../../state/appShell";
import { WordDetailModal, WordFormModal } from "../modals/WordModals";
import type { Word } from "../../types/models";

export function VocabCard({ item, compact = false }: { item: Word; compact?: boolean }) {
  const { topicData, favoriteWords, toggleWordFavorite, deleteWord } = useLibrary();
  const { openModal, setFocusTopicTitle, navigate } = useAppShell();
  const [moreOpen, setMoreOpen] = useState(false);
  const catClass = categoryClass(item.category);
  const isFavorite = favoriteWords.has(item.word);
  const related = getTopicsForWord(item.word, topicData);
  const hasExtra = !compact && Boolean(item.synonym || item.antonym || item.wordFamily);

  return (
    <article className={`vocab-card ${catClass}`}>
      <div className="card-top">
        <div className="card-title">
          <h3>
            <button
              type="button"
              className="word-title-btn"
              onClick={() => openModal(item.word, <WordDetailModal item={item} />)}
            >
              {item.word}
            </button>
          </h3>
          <div className={`category-pill ${catClass}`}>{item.category}</div>
        </div>
        <div className="card-actions">
          <button
            type="button"
            className="icon-btn speak-btn"
            aria-label={`Pronounce ${item.word}`}
            onClick={() => speakWord(item.word)}
            dangerouslySetInnerHTML={{ __html: iconSpeak }}
          />
          <button
            type="button"
            className="icon-btn share-btn"
            aria-label={`Share ${item.word}`}
            onClick={() =>
              void shareContent({ title: `IMX · ${item.word}`, text: formatWordShare(item) })
            }
            dangerouslySetInnerHTML={{ __html: iconShare }}
          />
          <button
            type="button"
            className={`favorite-btn${isFavorite ? " is-favorite" : ""}`}
            aria-label={`Toggle favorite ${item.word}`}
            aria-pressed={isFavorite}
            onClick={() => toggleWordFavorite(item.word)}
            dangerouslySetInnerHTML={{ __html: iconStar(isFavorite) }}
          />
        </div>
      </div>
      <div className="card-body">
        {item.pronunciation ? <p className="pronunciation">/{item.pronunciation}/</p> : null}
        <span className="meta-line">Meaning</span>
        <span className="meta-value">{item.meaning}</span>
        {!compact ? (
          <>
            <span className="meta-line">Example</span>
            <span className="meta-value">“{item.sentence || "—"}”</span>
            {hasExtra ? (
              <>
                <div className="vocab-details" hidden={!moreOpen}>
                  <span className="meta-line">Synonym</span>
                  <span className="meta-value">{item.synonym || "—"}</span>
                  <span className="meta-line">Antonym</span>
                  <span className="meta-value">{item.antonym || "—"}</span>
                  <span className="meta-line">Word Family</span>
                  <span className="meta-value">{item.wordFamily || "—"}</span>
                </div>
                <button
                  type="button"
                  className="ghost-btn vocab-more-btn"
                  aria-expanded={moreOpen}
                  onClick={() => setMoreOpen((o) => !o)}
                >
                  {moreOpen ? "Less details" : "More details"}
                </button>
              </>
            ) : null}
          </>
        ) : null}
        {related.length ? (
          <p className="appears-in">
            <span className="meta-line">Appears in</span>{" "}
            {related.slice(0, 3).map((topic, i) => (
              <span key={topic.title}>
                {i > 0 ? ", " : ""}
                <button
                  type="button"
                  className="link-btn topic-link-btn"
                  onClick={() => {
                    setFocusTopicTitle(topic.title);
                    navigate("topics", { replace: false });
                  }}
                >
                  {topic.title}
                </button>
              </span>
            ))}
            {related.length > 3 ? ` +${related.length - 3}` : ""}
          </p>
        ) : null}
      </div>
      {!compact ? (
        <div className="card-footer-actions">
          <button
            type="button"
            className="ghost-btn edit-btn"
            onClick={() => openModal("Edit word", <WordFormModal item={item} />)}
          >
            Edit
          </button>
          <button
            type="button"
            className="danger-btn delete-btn"
            onClick={() => {
              if (confirm(`Delete “${item.word}”?`)) deleteWord(item.word);
            }}
          >
            Delete
          </button>
        </div>
      ) : null}
    </article>
  );
}
