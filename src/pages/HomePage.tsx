import { useMemo, useState } from "react";
import { ArrowRight, Flame, RefreshCw, Zap } from "lucide-react";
import {
  idiomToQuizItem,
  getDueWords,
  getStudyStreakInfo,
  getWeakWords,
  getProgressStats,
  getStudyGoals,
} from "../lib/storage";
import { MOTIVATION_QUOTES } from "../state/templates";
import { useLibrary } from "../state/libraryStore";
import { useAppShell } from "../state/appShell";
import { useQuiz } from "../state/quizStore";
import { WordDetailModal } from "../components/modals/WordModals";

export function HomePage() {
  const { vocabularyData, topicData, idiomData, favoriteWords } = useLibrary();
  const { navigate, openModal, progressTick } = useAppShell();
  const quiz = useQuiz();
  const [quote, setQuote] = useState(() => MOTIVATION_QUOTES[0]);

  const stats = useMemo(() => {
    void progressTick;
    const idiomQuizItems = idiomData.map(idiomToQuizItem);
    const dueWords = getDueWords(vocabularyData).length;
    const dueIdioms = getDueWords(idiomQuizItems).length;
    const streak = getStudyStreakInfo();
    return {
      due: dueWords + dueIdioms,
      streak,
      progress: getProgressStats(),
      goals: getStudyGoals(),
    };
  }, [vocabularyData, idiomData, progressTick]);

  const weak = getWeakWords(vocabularyData, { limit: 8 });

  const newQuote = () => {
    setQuote(MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)]);
  };

  const streakLine = stats.streak.studiedToday
    ? stats.streak.streak > 1
      ? `Studied today — keep the ${stats.streak.streak}-day run alive.`
      : "Studied today. Come back tomorrow to start a streak."
    : stats.streak.streak > 0
      ? `${stats.streak.streak}-day streak waiting — review a few due items.`
      : "Review a few due items to start your streak.";

  const dailyPct = Math.min(
    100,
    Math.round((stats.progress.reviewsToday / stats.goals.dailyReviews) * 100),
  );

  const stageTitle = stats.due > 0 ? "Items due now" : "You're caught up";
  const stageSub =
    stats.due > 0
      ? "Open Exam Studio and clear what's waiting — then keep building the library."
      : "Browse words, open a topic, or run a fresh practice session.";

  return (
    <section id="home" className="page page--active">
      <div className="home-bento">
        <article className="bento-stage animate-fade-up">
          <div className="bento-stage__due">
            <p className="bento-label">Today</p>
            <div className="bento-stage__number" id="homeDueWords">
              {stats.due}
            </div>
            <h2 className="bento-stage__title">{stageTitle}</h2>
            <p className="bento-stage__sub">{stageSub}</p>
          </div>
          <div className="bento-stage__actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => navigate("quiz", { replace: false })}
            >
              {stats.due > 0 ? "Review due" : "Start exam"}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => navigate("vocabulary", { replace: false })}
            >
              Browse words
            </button>
          </div>
        </article>

        <aside className="bento-streak animate-fade-up animate-delay-1" aria-label="Study streak">
          <div>
            <p className="bento-label">
              <Flame
                size={11}
                style={{ display: "inline", verticalAlign: "-1px", marginRight: 5 }}
              />
              Streak
            </p>
            <div className="bento-streak__value" id="homeStudyStreakValue">
              {stats.streak.streak}
            </div>
          </div>
          <p className="bento-streak__text" id="homeStudyStreak">
            {streakLine}
          </p>
        </aside>

        <div className="bento-metrics animate-fade-up animate-delay-2" aria-label="Library snapshot">
          <button
            type="button"
            className="bento-metric"
            onClick={() => navigate("vocabulary", { replace: false })}
          >
            <span className="bento-metric__label">Words</span>
            <strong className="bento-metric__value" id="homeTotalWords">
              {vocabularyData.length}
            </strong>
          </button>
          <button
            type="button"
            className="bento-metric"
            onClick={() => navigate("topics", { replace: false })}
          >
            <span className="bento-metric__label">Topics</span>
            <strong className="bento-metric__value" id="homeTotalTopics">
              {topicData.length}
            </strong>
          </button>
          <button
            type="button"
            className="bento-metric"
            onClick={() => navigate("idioms", { replace: false })}
          >
            <span className="bento-metric__label">Idioms</span>
            <strong className="bento-metric__value" id="homeTotalIdioms">
              {idiomData.length}
            </strong>
          </button>
          <button
            type="button"
            className="bento-metric"
            onClick={() => navigate("favorites", { replace: false })}
          >
            <span className="bento-metric__label">Saved</span>
            <strong className="bento-metric__value" id="homeFavoriteWords">
              {favoriteWords.size}
            </strong>
          </button>
        </div>

        <section
          id="homeWeekStrip"
          className="bento-week animate-fade-up animate-delay-2"
          aria-label="This week’s progress"
        >
          <div>
            <p className="bento-label">This week</p>
            <p className="bento-week__line">
              {stats.progress.reviewsWeek} reviews · {stats.progress.sessionsWeek} sessions
              {stats.progress.accuracyWeek != null
                ? ` · ${stats.progress.accuracyWeek}% accuracy`
                : ""}
            </p>
          </div>
          <div className="goal-bar goal-bar--compact">
            <div className="goal-bar__meta">
              <span>Today’s goal</span>
              <span>
                {stats.progress.reviewsToday}/{stats.goals.dailyReviews}
              </span>
            </div>
            <div className="goal-bar__track">
              <div className="goal-bar__fill" style={{ width: `${dailyPct}%` }} />
            </div>
          </div>
          <div className="bento-week__footer">
            <button
              type="button"
              className="ghost-btn"
              onClick={() => navigate("progress", { replace: false })}
            >
              View progress
            </button>
          </div>
        </section>

        <section
          id="homeWeakWords"
          className="bento-focus animate-fade-up animate-delay-3"
          aria-label="Weak words"
          hidden={!weak.length}
        >
          <div className="bento-focus__head">
            <div>
              <p className="bento-label">Needs review</p>
              <h3>Weak words</h3>
            </div>
            <button
              id="homeReviewWeakBtn"
              className="primary-btn"
              type="button"
              onClick={() => quiz.startWeakWordsQuiz((p) => navigate(p as "quiz", { replace: false }))}
            >
              <Zap size={15} aria-hidden="true" />
              Review
            </button>
          </div>
          <div id="homeWeakWordsList" className="bento-chips">
            {weak.map((item) => (
              <button
                key={item.word}
                type="button"
                className="bento-chip"
                onClick={() => openModal(item.word, <WordDetailModal item={item} />)}
              >
                <span className="bento-chip__word">{item.word}</span>
                <span className="bento-chip__meaning">{item.meaning}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="bento-line animate-fade-up animate-delay-3" aria-label="Daily line">
          <p className="bento-label">Daily line</p>
          <p id="motivationQuote" className="bento-line__quote">
            {quote}
          </p>
          <button id="newQuoteBtn" className="quote-btn" type="button" onClick={newQuote}>
            <RefreshCw size={14} aria-hidden="true" />
            New
          </button>
        </section>
      </div>
    </section>
  );
}
