import { useEffect, useId, useState } from "react";
import { categoryClass, iconChevron, iconShare, iconSpeak, iconStar } from "../../lib/dom";
import {
  getMissingTopicIdioms,
  getMissingTopicWords,
  getSpeakingPracticeFor,
} from "../../lib/storage";
import { formatDate } from "../../lib/helpers";
import { formatTopicShare, shareContent } from "../../lib/share";
import { speakWord } from "../../lib/speech";
import { useLibrary } from "../../state/libraryStore";
import { useAppShell } from "../../state/appShell";
import { useQuiz } from "../../state/quizStore";
import { TopicFormModal } from "../modals/TopicIdiomModals";
import { SpeakingPracticeModal, WritingPracticeModal } from "../modals/PracticeModals";
import { WordDetailModal, WordFormModal } from "../modals/WordModals";
import type { Topic } from "../../types/models";

export function TopicCard({
  topic,
  index,
  forceOpen,
}: {
  topic: Topic;
  index: number;
  forceOpen?: boolean;
}) {
  const {
    vocabularyData,
    idiomData,
    favoriteTopics,
    toggleTopicFavorite,
    toggleTopicCompleted,
    isTopicCompleted,
    deleteTopic,
  } = useLibrary();
  const { openModal, navigate } = useAppShell();
  const quiz = useQuiz();
  const detailsId = useId();
  const [open, setOpen] = useState(false);
  const isFavorite = favoriteTopics.has(topic.title);
  const isCompleted = isTopicCompleted(topic);
  const missing = getMissingTopicWords(topic, vocabularyData);
  const missingIdioms = getMissingTopicIdioms(topic, idiomData);
  const topicIdiomCount = (topic.idioms || []).length;
  const speaking = getSpeakingPracticeFor(topic.title);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  return (
    <article
      className={`topic-card${isCompleted ? " is-completed" : ""}${open ? " is-open" : ""}`}
      data-title={topic.title}
    >
      <div
        className="topic-card__header"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest(".topic-favorite-btn, .share-topic-btn")) return;
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
            {formatDate(topic.date)}
            {isCompleted ? " · Completed" : ""}
            {speaking?.count ? ` · Spoken ${speaking.count}×` : ""}
          </p>
          <h3>{topic.title}</h3>
          <div className="topic-badges">
            {isCompleted ? <span className="status-pill">Completed</span> : null}
            <span className="status-pill">{topic.vocabulary.length} words</span>
            {topicIdiomCount ? (
              <span className="status-pill status-pill--idiom">
                {topicIdiomCount} idiom{topicIdiomCount === 1 ? "" : "s"}
              </span>
            ) : null}
            {missing.length ? (
              <span className="status-pill status-pill--warn">
                {missing.length} missing word{missing.length === 1 ? "" : "s"}
              </span>
            ) : null}
            {missingIdioms.length ? (
              <span className="status-pill status-pill--warn">
                {missingIdiomCountLabel(missingIdioms.length)}
              </span>
            ) : null}
          </div>
        </div>
        <div className="topic-card__actions">
          <button
            type="button"
            className="icon-btn share-topic-btn"
            aria-label={`Share topic ${topic.title}`}
            onClick={(e) => {
              e.stopPropagation();
              void shareContent({
                title: `IMX · ${topic.title}`,
                text: formatTopicShare(topic),
              });
            }}
            dangerouslySetInnerHTML={{ __html: iconShare }}
          />
          <button
            type="button"
            className={`topic-favorite-btn${isFavorite ? " is-favorite" : ""}`}
            aria-label={`Toggle favorite topic ${topic.title}`}
            aria-pressed={isFavorite}
            onClick={(e) => {
              e.stopPropagation();
              toggleTopicFavorite(topic.title);
            }}
            dangerouslySetInnerHTML={{ __html: iconStar(isFavorite) }}
          />
          <span className="topic-toggle-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: iconChevron }} />
        </div>
      </div>
      <div className="topic-details" id={detailsId}>
        <div className="topic-detail-block">
          <h4>Summary</h4>
          <p>{topic.summary}</p>
        </div>
        <div className="topic-detail-block">
          <h4>Vocabulary</h4>
          <div className="mini-vocab-grid">
            {topic.vocabulary.map((word) => {
              const wordData = vocabularyData.find(
                (item) => item.word.toLowerCase() === word.toLowerCase(),
              );
              if (!wordData) {
                return (
                  <div key={word} className="mini-vocab-card is-missing">
                    <div className="mini-vocab-head">
                      <h5>{word}</h5>
                      <span className="status-pill status-pill--warn">Missing</span>
                    </div>
                    <p className="mini-vocab-meta">
                      <strong>Meaning:</strong> Not added yet
                    </p>
                    <button
                      type="button"
                      className="ghost-btn add-missing-btn"
                      onClick={() =>
                        openModal(
                          "Add word",
                          <WordFormModal
                            item={{
                              word,
                              pronunciation: "",
                              meaning: "",
                              category: "Learning",
                            }}
                          />,
                        )
                      }
                    >
                      Add word
                    </button>
                  </div>
                );
              }
              return (
                <div key={word} className="mini-vocab-card">
                  <div className="mini-vocab-head">
                    <h5>
                      <button
                        type="button"
                        className="word-title-btn open-word-btn"
                        onClick={() =>
                          openModal(wordData.word, <WordDetailModal item={wordData} />)
                        }
                      >
                        {wordData.word}
                      </button>
                    </h5>
                    <button
                      type="button"
                      className="icon-btn mini-speak"
                      aria-label={`Pronounce ${wordData.word}`}
                      onClick={() => speakWord(wordData.word)}
                      dangerouslySetInnerHTML={{ __html: iconSpeak }}
                    />
                  </div>
                  <p className="mini-vocab-pron">/{wordData.pronunciation || "ˈwɜːrd"}/</p>
                  <p className="mini-vocab-meta">
                    <strong>Meaning:</strong> {wordData.meaning}
                  </p>
                  <p className="mini-vocab-meta">
                    <strong>Example:</strong> {wordData.sentence}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        {topicIdiomCount ? (
          <div className="topic-detail-block topic-idioms-block">
            <div className="topic-section-head">
              <p className="topic-section-eyebrow">Phrases</p>
              <h4>Idioms for this lesson</h4>
              <p className="topic-section-note">
                Practice these while you discuss — meaning first, then try the example aloud.
              </p>
            </div>
            <ol className="topic-idiom-list">
              {(topic.idioms || []).map((phrase, idiomIndex) => {
                const idiom = idiomData.find(
                  (item) => item.idiom.toLowerCase() === phrase.toLowerCase(),
                );
                const indexLabel = String(idiomIndex + 1).padStart(2, "0");
                if (!idiom) {
                  return (
                    <li key={phrase} className="topic-idiom is-missing">
                      <span className="topic-idiom__index" aria-hidden="true">
                        {indexLabel}
                      </span>
                      <div className="topic-idiom__body">
                        <div className="topic-idiom__head">
                          <h5>{phrase}</h5>
                          <span className="status-pill status-pill--warn">Missing</span>
                        </div>
                        <p className="topic-idiom__meaning">Not added to the idiom library yet.</p>
                      </div>
                    </li>
                  );
                }
                return (
                  <li key={phrase} className="topic-idiom">
                    <span className="topic-idiom__index" aria-hidden="true">
                      {indexLabel}
                    </span>
                    <div className="topic-idiom__body">
                      <div className="topic-idiom__head">
                        <h5>{idiom.idiom}</h5>
                        <button
                          type="button"
                          className="icon-btn mini-speak"
                          aria-label={`Pronounce ${idiom.idiom}`}
                          onClick={() => speakWord(idiom.idiom)}
                          dangerouslySetInnerHTML={{ __html: iconSpeak }}
                        />
                      </div>
                      {idiom.pronunciation ? (
                        <p className="topic-idiom__pron">/{idiom.pronunciation}/</p>
                      ) : null}
                      <p className="topic-idiom__meaning">{idiom.meaning}</p>
                      {idiom.example ? (
                        <blockquote className="topic-idiom__example">{idiom.example}</blockquote>
                      ) : null}
                      {idiom.usage ? (
                        <p className="topic-idiom__usage">
                          <span>When to use</span>
                          {idiom.usage}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}
        {topic.notes ? (
          <div className="topic-detail-block">
            <h4>Personal Notes</h4>
            <p>{topic.notes}</p>
          </div>
        ) : null}
        {topic.questions.length ? (
          <div className="topic-detail-block">
            <h4>Discussion Questions</h4>
            <ul>
              {topic.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="card-footer-actions">
          <button
            type="button"
            className="primary-btn practice-topic-btn"
            onClick={() => quiz.startTopicQuiz(topic.title, (p) => navigate(p as "quiz", { replace: false }))}
          >
            Practice lesson
          </button>
          <button
            type="button"
            className="ghost-btn exam-topic-btn"
            onClick={() => quiz.startTopicExam(topic.title, (p) => navigate(p as "quiz", { replace: false }))}
          >
            Exam session (10)
          </button>
          <button
            type="button"
            className="ghost-btn speaking-topic-btn"
            onClick={() => openModal("Speaking practice", <SpeakingPracticeModal entry={topic} />)}
          >
            Speaking practice
          </button>
          <button
            type="button"
            className="ghost-btn writing-topic-btn"
            onClick={() => openModal("Writing prompts", <WritingPracticeModal topic={topic} />)}
          >
            Writing prompts
          </button>
          <button
            type="button"
            className="ghost-btn complete-topic-btn"
            onClick={() => toggleTopicCompleted(topic.title)}
          >
            {isCompleted ? "Mark incomplete" : "Mark completed"}
          </button>
          <button
            type="button"
            className="ghost-btn edit-topic-btn"
            onClick={() => openModal("Edit topic", <TopicFormModal item={topic} />)}
          >
            Edit
          </button>
          <button
            type="button"
            className="danger-btn delete-topic-btn"
            onClick={() => {
              if (confirm(`Delete “${topic.title}”?`)) deleteTopic(topic.title);
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function idiomCountLabel(n: number) {
  return `${n} missing idiom${n === 1 ? "" : "s"}`;
}

function missingIdiomCountLabel(n: number) {
  return idiomCountLabel(n);
}
