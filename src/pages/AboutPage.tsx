export function AboutPage() {
  return (
    <section id="about" className="page page--active">
      <div className="about-hero">
        <p className="eyebrow">About</p>
        <h2 className="about-hero__title">A quiet place for English practice</h2>
        <p className="about-hero__lead">
          IMX keeps vocabulary, idioms, discussion topics, quizzes, favorites, and backups in one
          focused workspace — so daily practice stays simple.
        </p>
      </div>

      <div className="about-card about-card--wide">
        <ul className="about-list">
          <li>Eight focused vocabulary categories</li>
          <li>Daily topic packs with ~10 words and ~5 idioms</li>
          <li>In-app add/edit for words, topics, and idiom phrases</li>
          <li>Spaced-repetition quiz, cloze, listening, and lesson practice</li>
          <li>Speaking drills and writing prompts for discussion questions</li>
          <li>Progress calendar, streaks, and study goals</li>
          <li>CSV vocab import plus JSON export/import backups</li>
          <li>Installable offline app (PWA)</li>
          <li>
            Base content still lives in <code>src/data/*.ts</code>
          </li>
          <li>
            App version: <code id="appVersionLabel">{__APP_VERSION__}</code>
          </li>
        </ul>
      </div>
    </section>
  );
}
