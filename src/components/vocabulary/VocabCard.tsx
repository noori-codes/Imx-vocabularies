import { useState } from "react";
import { MoreHorizontal, Share2, Star, Volume2 } from "lucide-react";
import { categoryClass } from "../../lib/dom";
import { getTopicsForWord } from "../../lib/storage";
import { speakWord } from "../../lib/speech";
import { formatWordShare, shareContent } from "../../lib/share";
import { useLibrary } from "../../state/libraryStore";
import { useAppShell } from "../../state/appShell";
import { WordDetailModal, WordFormModal } from "../modals/WordModals";
import type { Word } from "../../types/models";

export function VocabCard({
  item,
  compact = false,
  layout = "grid",
}: {
  item: Word;
  compact?: boolean;
  layout?: "grid" | "list";
}) {
  const { topicData, favoriteWords, toggleWordFavorite, deleteWord } = useLibrary();
  const { openModal, setFocusTopicTitle, navigate } = useAppShell();
  const [menuOpen, setMenuOpen] = useState(false);
  const catClass = categoryClass(item.category);
  const isFavorite = favoriteWords.has(item.word);
  const related = getTopicsForWord(item.word, topicData);
  const hasExtra = !compact && Boolean(item.synonym || item.antonym || item.wordFamily);
  const isList = layout === "list" || compact;

  if (isList) {
    return (
      <article className={`vocab-row ${catClass}`}>
        <button
          type="button"
          className="vocab-row__word"
          onClick={() => openModal(item.word, <WordDetailModal item={item} />)}
        >
          {item.word}
        </button>
        <p className="vocab-row__meaning">{item.meaning}</p>
        <span className={`category-pill category-pill--filled ${catClass}`}>{item.category}</span>
        <div className="vocab-row__actions">
          <button
            type="button"
            className="icon-btn speak-btn"
            aria-label={`Pronounce ${item.word}`}
            onClick={() => speakWord(item.word)}
          >
            <Volume2 size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`favorite-btn${isFavorite ? " is-favorite" : ""}`}
            aria-label={`Toggle favorite ${item.word}`}
            aria-pressed={isFavorite}
            onClick={() => toggleWordFavorite(item.word)}
          >
            <Star size={14} fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
          </button>
          {!compact ? (
            <div className="vocab-more">
              <button
                type="button"
                className="icon-btn"
                aria-label="More actions"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
              >
                <MoreHorizontal size={15} aria-hidden="true" />
              </button>
              {menuOpen ? (
                <div className="vocab-more__menu">
                  <button
                    type="button"
                    onClick={() => {
                      void shareContent({
                        title: `IMX · ${item.word}`,
                        text: formatWordShare(item),
                      });
                      setMenuOpen(false);
                    }}
                  >
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      openModal("Edit word", <WordFormModal item={item} />);
                      setMenuOpen(false);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="is-danger"
                    onClick={() => {
                      if (confirm(`Delete “${item.word}”?`)) deleteWord(item.word);
                      setMenuOpen(false);
                    }}
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article className={`vocab-card ${catClass}`}>
      <div className="card-top">
        <div className="card-title">
          <span className={`category-pill category-pill--filled ${catClass}`}>{item.category}</span>
          <h3>
            <button
              type="button"
              className="word-title-btn"
              onClick={() => openModal(item.word, <WordDetailModal item={item} />)}
            >
              {item.word}
            </button>
          </h3>
          {item.pronunciation ? <p className="pronunciation">/{item.pronunciation}/</p> : null}
        </div>
        <div className="card-actions">
          <button
            type="button"
            className="icon-btn speak-btn"
            aria-label={`Pronounce ${item.word}`}
            onClick={() => speakWord(item.word)}
          >
            <Volume2 size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn share-btn"
            aria-label={`Share ${item.word}`}
            onClick={() =>
              void shareContent({ title: `IMX · ${item.word}`, text: formatWordShare(item) })
            }
          >
            <Share2 size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`favorite-btn${isFavorite ? " is-favorite" : ""}`}
            aria-label={`Toggle favorite ${item.word}`}
            aria-pressed={isFavorite}
            onClick={() => toggleWordFavorite(item.word)}
          >
            <Star size={15} fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="card-body">
        <p className="vocab-meaning">{item.meaning}</p>
        {item.sentence ? <blockquote className="vocab-quote">“{item.sentence}”</blockquote> : null}

        {hasExtra ? (
          <div className="vocab-chip-row">
            {item.synonym ? <span className="vocab-chip">≈ {item.synonym}</span> : null}
            {item.antonym ? <span className="vocab-chip">≠ {item.antonym}</span> : null}
            {item.wordFamily ? <span className="vocab-chip">{item.wordFamily}</span> : null}
          </div>
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
    </article>
  );
}
