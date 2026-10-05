import { useMemo, useState } from "react";
import { idiomToQuizItem, getDueWords, getStudyStreakInfo, getWeakWords, getProgressStats, getStudyGoals } from "../lib/storage";
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

  const weak = getWeakWords(vocabularyData, { limit: 6 });

  const newQuote = () => {
    setQuote(MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)]);
  };

  const streakLine = stats.streak.studiedToday
    ? stats.streak.streak > 1
      ? `You studied today — ${stats.streak.streak}-day streak. Keep it going.`
      : "You studied today. Nice work — come back tomorrow for a streak."
    : stats.streak.streak > 0
      ? `${stats.streak.streak}-day streak waiting — review a few due words today.`
      : "Review a few due words, then add one new idea from your latest presentation.";

  const dailyPct = Math.min(
    100,
    Math.round((stats.progress.reviewsToday / stats.goals.dailyReviews) * 100),
  );

  return (
    <section id="home" className="page page--active">
      <div className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow animate-fade-up">Personal study journal</p>
          <h2 className="brand-hero animate-fade-up animate-delay-1">IMX</h2>
          <p className="hero-subtitle animate-fade-up animate-delay-2">
            Daily lessons with vocabulary, idioms, and discussion — kept in one quiet place to
            review and grow.
          </p>
          <div className="hero-actions animate-fade-up animate-delay-3">
            <button type="button" className="primary-btn" onClick={() => navigate("quiz", { replace: false })}>
              Start exam
            </button>
            <button type="button" className="ghost-btn" onClick={() => navigate("progress", { replace: false })}>
              View progress
            </button>
          </div>
        </div>
        <aside className="hero-aside animate-fade-up animate-delay-2" aria-label="Study note">
          <p className="hero-aside__label">Today</p>
          <p className="hero-aside__text" id="homeStudyStreak">
            {streakLine}
          </p>
        </aside>
      </div>

      <section className="motivation-card" aria-label="Daily motivation">
        <div className="motivation-card__header">
          <p className="motivation-eyebrow">Daily line</p>
          <button id="newQuoteBtn" className="quote-btn" type="button" onClick={newQuote}>
            New line
          </button>
        </div>
        <p id="motivationQuote" className="motivation-quote">
          {quote}
        </p>
      </section>

      <div className="home-study-strip" aria-label="Library snapshot">
        <button type="button" className="study-stat" onClick={() => navigate("vocabulary", { replace: false })}>
          <span className="progress-label">Vocabulary</span>
          <strong id="homeTotalWords">{vocabularyData.length}</strong>
        </button>
        <button type="button" className="study-stat" onClick={() => navigate("topics", { replace: false })}>
          <span className="progress-label">Topics</span>
          <strong id="homeTotalTopics">{topicData.length}</strong>
        </button>
        <button type="button" className="study-stat" onClick={() => navigate("idioms", { replace: false })}>
          <span className="progress-label">Idioms</span>
          <strong id="homeTotalIdioms">{idiomData.length}</strong>
        </button>
        <button type="button" className="study-stat" onClick={() => navigate("favorites", { replace: false })}>
          <span className="progress-label">Favorites</span>
          <strong id="homeFavoriteWords">{favoriteWords.size}</strong>
        </button>
        <button type="button" className="study-stat" onClick={() => navigate("quiz", { replace: false })}>
          <span className="progress-label">Due</span>
          <strong id="homeDueWords">{stats.due}</strong>
        </button>
      </div>

      <section id="homeWeekStrip" className="week-strip home-panel" aria-label="This week’s progress">
        <div className="week-strip__copy">
          <p className="eyebrow">This week</p>
          <p className="week-strip__line">
            {stats.progress.reviewsWeek} reviews · {stats.progress.sessionsWeek} sessions · streak{" "}
            {stats.streak.streak}
            {stats.progress.accuracyWeek != null ? ` · ${stats.progress.accuracyWeek}% accuracy` : ""}
          </p>
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
        </div>
        <button type="button" className="ghost-btn" onClick={() => navigate("progress", { replace: false })}>
          View progress
        </button>
      </section>

      <section
        id="homeWeakWords"
        className="home-panel"
        aria-label="Weak words"
        hidden={!weak.length}
      >
        <div className="home-panel__header">
          <div>
            <p className="eyebrow">Needs review</p>
            <h3>Weak words</h3>
          </div>
          <button
            id="homeReviewWeakBtn"
            className="primary-btn"
            type="button"
            onClick={() => quiz.startWeakWordsQuiz((p) => navigate(p as "quiz", { replace: false }))}
          >
            Review weak words
          </button>
        </div>
        <ul id="homeWeakWordsList" className="home-weak-list">
          {weak.map((item) => (
            <li key={item.word}>
              <button
                type="button"
                className="link-btn"
                onClick={() => openModal(item.word, <WordDetailModal item={item} />)}
              >
                {item.word}
              </button>
              <span>{item.meaning}</span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
