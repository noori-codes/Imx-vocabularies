export function AboutPage() {
  return (
    <section id="about" className="page page--active">
      <div className="about-card">
        <p className="eyebrow">About</p>
        <h2>A quiet place for English practice</h2>
        <p>
          IMX English Hub keeps daily lessons together: one discussion topic, vocabulary, idioms,
          quizzes, favorites, and backups. Add or edit content in the browser — custom work stays on
          this device until you export it.
        </p>
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
