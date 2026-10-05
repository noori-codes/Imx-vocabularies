import { useEffect, useId, useState } from "react";
import { iconChevron, iconShare, iconStar } from "../../lib/dom";
import { getSpeakingPracticeFor } from "../../lib/storage";
import { formatDate } from "../../lib/helpers";
import { formatIdiomShare, shareContent } from "../../lib/share";
import { useLibrary } from "../../state/libraryStore";
import { useAppShell } from "../../state/appShell";
import { useQuiz } from "../../state/quizStore";
import { IdiomFormModal } from "../modals/TopicIdiomModals";
import { SpeakingPracticeModal } from "../modals/PracticeModals";
import type { Idiom } from "../../types/models";

export function IdiomCard({ idiom, forceOpen }: { idiom: Idiom; forceOpen?: boolean }) {
  const {
    favoriteIdioms,
    toggleIdiomFavorite,
    toggleIdiomCompleted,
    isIdiomCompleted,
    deleteIdiom,
  } = useLibrary();
  const { openModal, navigate } = useAppShell();
  const quiz = useQuiz();
  const detailsId = useId();
  const [open, setOpen] = useState(false);
  const isFavorite = favoriteIdioms.has(idiom.idiom);
  const isCompleted = isIdiomCompleted(idiom);
  const speaking = getSpeakingPracticeFor(idiom.idiom);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  return (
    <article
      className={`topic-card${isCompleted ? " is-completed" : ""}${open ? " is-open" : ""}`}
      data-idiom={idiom.idiom}
    >
      <div
        className="topic-card__header"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest(".topic-favorite-btn, .share-idiom-btn")) return;
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        <div className="topic-headline">
          <p className="topic-eyebrow">
            {formatDate(idiom.date)}
            {isCompleted ? " · Completed" : ""}
            {speaking?.count ? ` · Spoken ${speaking.count}×` : ""}
          </p>
          <h3>{idiom.idiom}</h3>
          <div className="topic-badges">
            {isCompleted ? <span className="status-pill">Completed</span> : null}
            <span className="status-pill">Idiom</span>
          </div>
        </div>
        <div className="topic-card__actions">
          <button
            type="button"
            className="icon-btn share-idiom-btn"
            aria-label={`Share idiom ${idiom.idiom}`}
            onClick={(e) => {
              e.stopPropagation();
              void shareContent({
                title: `IMX · ${idiom.idiom}`,
                text: formatIdiomShare(idiom),
              });
            }}
            dangerouslySetInnerHTML={{ __html: iconShare }}
          />
          <button
            type="button"
            className={`topic-favorite-btn${isFavorite ? " is-favorite" : ""}`}
            aria-label={`Toggle favorite idiom ${idiom.idiom}`}
            aria-pressed={isFavorite}
            onClick={(e) => {
              e.stopPropagation();
              toggleIdiomFavorite(idiom.idiom);
            }}
            dangerouslySetInnerHTML={{ __html: iconStar(isFavorite) }}
          />
          <span className="topic-toggle-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: iconChevron }} />
        </div>
      </div>
      <div className="topic-details" id={detailsId}>
        <div className="topic-detail-block">
          <h4>Meaning</h4>
          <p>{idiom.meaning}</p>
          {idiom.pronunciation ? (
            <p className="mini-vocab-pron">/{idiom.pronunciation}/</p>
          ) : null}
        </div>
        {idiom.example ? (
          <div className="topic-detail-block">
            <h4>Example</h4>
            <p>{idiom.example}</p>
          </div>
        ) : null}
        {idiom.usage ? (
          <div className="topic-detail-block">
            <h4>When to use it</h4>
            <p>{idiom.usage}</p>
          </div>
        ) : null}
        {idiom.summary ? (
          <div className="topic-detail-block">
            <h4>Summary</h4>
            <p>{idiom.summary}</p>
          </div>
        ) : null}
        {idiom.notes ? (
          <div className="topic-detail-block">
            <h4>Personal Notes</h4>
            <p>{idiom.notes}</p>
          </div>
        ) : null}
        {idiom.questions.length ? (
          <div className="topic-detail-block">
            <h4>Discussion Questions</h4>
            <ul>
              {idiom.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="card-footer-actions">
          <button
            type="button"
            className="primary-btn practice-idiom-btn"
            onClick={() =>
              quiz.startIdiomQuiz(idiom.idiom, (p) => navigate(p as "quiz", { replace: false }))
            }
          >
            Practice idiom
          </button>
          <button
            type="button"
            className="ghost-btn exam-idiom-btn"
            onClick={() => quiz.startIdiomExam((p) => navigate(p as "quiz", { replace: false }))}
          >
            Exam session
          </button>
          <button
            type="button"
            className="ghost-btn speaking-idiom-btn"
            onClick={() => openModal("Speaking practice", <SpeakingPracticeModal entry={idiom} />)}
          >
            Speaking practice
          </button>
          <button
            type="button"
            className="ghost-btn complete-idiom-btn"
            onClick={() => toggleIdiomCompleted(idiom.idiom)}
          >
            {isCompleted ? "Mark incomplete" : "Mark completed"}
          </button>
          <button
            type="button"
            className="ghost-btn edit-idiom-btn"
            onClick={() => openModal("Edit idiom", <IdiomFormModal item={idiom} />)}
          >
            Edit
          </button>
          <button
            type="button"
            className="danger-btn delete-idiom-btn"
            onClick={() => {
              if (confirm(`Delete “${idiom.idiom}”?`)) deleteIdiom(idiom.idiom);
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
