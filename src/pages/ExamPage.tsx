import { useEffect, useRef, useState } from "react";
import { categoryClass } from "../lib/dom";
import { speakWord, unlockAudio } from "../lib/speech";
import { CATEGORIES, useLibrary } from "../state/libraryStore";
import { useQuiz } from "../state/quizStore";
import { useAppShell } from "../state/appShell";
import type { Word } from "../types/models";

export function ExamPage() {
  const { topicData, idiomData, version } = useLibrary();
  const shell = useAppShell();
  const quiz = useQuiz();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [typeInput, setTypeInput] = useState("");
  const [typeFeedback, setTypeFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [mcqPicked, setMcqPicked] = useState<Record<string, "correct" | "wrong">>({});
  const printRef = useRef<HTMLDivElement>(null);

  const current = quiz.currentQuizItem();
  const mode = quiz.quizMode;
  const pool = quiz.getQuizWordPool();

  useEffect(() => {
    quiz.prepareQuiz({ preserveForce: true });
  }, [shell.activePage]);

  useEffect(() => {
    if (shell.activePage !== "quiz") return;
    const unlockOnce = () => {
      unlockAudio();
      document.removeEventListener("pointerdown", unlockOnce);
    };
    document.addEventListener("pointerdown", unlockOnce, { once: true });
  }, [shell.activePage]);

  useEffect(() => {
    setTypeInput("");
    setTypeFeedback(null);
    setMcqPicked({});
  }, [quiz.quizIndex, mode]);

  useEffect(() => {
    if (!current || quiz.showSummary) return;
    quiz.startCardTimer(() => {
      if (mode === "mcq" || quiz.quizTypeChecked) return;
      if (!quiz.quizRevealed) quiz.setQuizRevealed(true);
    });
    return () => quiz.clearCardTimer();
  }, [current?.word, mode, quiz.quizRevealed, quiz.quizTypeChecked, quiz.showSummary]);

  useEffect(() => {
    const quizPage = document.getElementById("quiz");
    const inSession = Boolean(current) && !quiz.showSummary;
    quizPage?.classList.toggle("is-focus", shell.activePage === "quiz" && inSession);
    if (inSession) setSettingsOpen(false);
  }, [current, quiz.showSummary, shell.activePage]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (shell.modal) return;
      if (shell.activePage !== "quiz") return;
      if (isTypingTarget(event.target)) return;

      if ((event.key === "l" || event.key === "L") && mode === "listening") {
        event.preventDefault();
        if (!current) return;
        quiz.setQuizListeningHeard(true);
        speakWord(current.word);
        return;
      }

      if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        if (!current) return;
        if (mode === "mcq") return;
        if ((mode === "type" || mode === "cloze") && !quiz.quizTypeChecked) return;
        if (!quiz.quizRevealed) quiz.setQuizRevealed(true);
        return;
      }

      if (event.key === "1") {
        event.preventDefault();
        if (quiz.quizRevealed && current) quiz.advanceQuiz(true);
      }
      if (event.key === "2") {
        event.preventDefault();
        if (quiz.quizRevealed && current) quiz.advanceQuiz(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shell.modal, shell.activePage, mode, current, quiz]);

  const cloze = current && mode === "cloze" ? quiz.buildClozeFor(current) : null;

  const scopeOptions = [
    ["due", "Due words"],
    ["all", "All vocabulary"],
    ["idioms", "All idioms"],
    ["favorites", "Favorites only"],
    ["weak", "Weak words (recent again)"],
    ...topicData.map((t) => [`topic:${t.title}`, t.title] as const),
    ...idiomData.map((i) => [`idiom:${i.idiom}`, `Idiom: ${i.idiom}`] as const),
  ];

  const emptyMessage = () => {
    if (quiz.quizForceAll) return "Session complete";
    if (String(quiz.quizScope).startsWith("topic:")) return "No words found for this topic";
    if (quiz.quizScope === "favorites") return "No favorite words in this filter";
    if (quiz.quizScope === "weak") return "No weak words right now — great job";
    return "You're caught up";
  };

  const showEmpty =
    !current && !quiz.showSummary && quiz.quizSessionStats.known + quiz.quizSessionStats.again === 0;

  const showCard = Boolean(current) && !quiz.showSummary;

  const progressPct =
    quiz.quizQueue.length && current
      ? Math.round(((quiz.quizIndex + 1) / quiz.quizQueue.length) * 100)
      : 0;

  const checkType = () => {
    if (!current) return;
    const correct = quiz.checkTypedQuizAnswer(typeInput);
    setTypeFeedback({
      text: correct
        ? "Correct!"
        : `Not quite — the word was “${current.word}”.`,
      ok: correct,
    });
  };

  const buildPrintSheet = () => {
    const sheet = printRef.current;
    if (!sheet) return;
    const items = quiz.shuffle(pool).slice(0, 30);
    const wordsHtml = items
      .map(
        (item, index) =>
          `<tr><td>${index + 1}.</td><td class="print-blank"></td><td>${escapeHtml(item.category)}</td></tr>`,
      )
      .join("");
    const answersHtml = items
      .map(
        (item, index) =>
          `<tr><td>${index + 1}.</td><td><strong>${escapeHtml(item.word)}</strong></td><td>${escapeHtml(item.meaning)}</td></tr>`,
      )
      .join("");
    sheet.innerHTML = `
    <div class="quiz-print-page">
      <h1>IMX Exam Sheet — Words</h1>
      <p>${escapeHtml(quiz.describeQuizScope())} · ${new Date().toLocaleDateString()}</p>
      <table><thead><tr><th>#</th><th>Your word</th><th>Category</th></tr></thead><tbody>${wordsHtml}</tbody></table>
    </div>
    <div class="quiz-print-page quiz-print-page--answers">
      <h1>Answer key</h1>
      <table><thead><tr><th>#</th><th>Word</th><th>Meaning</th></tr></thead><tbody>${answersHtml}</tbody></table>
    </div>
  `;
    sheet.hidden = false;
    window.print();
    sheet.hidden = true;
  };

  return (
    <section id="quiz" className="page page--active">
      <div className="page-header">
        <div>
          <p className="eyebrow">Practice</p>
          <h2>Exam practice</h2>
        </div>
        <div className="page-controls quiz-page-controls">
          <div className="quiz-focus-bar">
            <button
              id="quizSettingsToggle"
              className="ghost-btn quiz-settings-toggle"
              type="button"
              aria-expanded={settingsOpen}
              aria-controls="quizToolbarPanel"
              onClick={() => setSettingsOpen((o) => !o)}
            >
              Settings
            </button>
            <button
              id="quizRestartBtn"
              className="ghost-btn"
              type="button"
              onClick={() => quiz.prepareQuiz({ forceAll: true })}
            >
              Restart
            </button>
          </div>
          <div id="quizToolbarPanel" className="quiz-toolbar-panel" hidden={!settingsOpen}>
            <div className="quiz-toolbar">
              <label className="select-wrap">
                <span>Mode</span>
                <select
                  id="quizModeSelect"
                  value={mode}
                  onChange={(e) => quiz.setQuizMode(e.target.value as typeof mode)}
                >
                  <option value="flashcard">Word → meaning</option>
                  <option value="reverse">Meaning → word</option>
                  <option value="type">Type the word</option>
                  <option value="mcq">Pick the word</option>
                  <option value="cloze">Fill the blank</option>
                  <option value="listening">Listen → meaning</option>
                </select>
              </label>
              <label className="select-wrap">
                <span>Scope</span>
                <select
                  id="quizScopeSelect"
                  value={quiz.quizScope}
                  onChange={(e) => {
                    const scope = e.target.value;
                    quiz.setQuizScope(scope);
                    const force =
                      scope === "all" ||
                      scope === "idioms" ||
                      scope === "favorites" ||
                      scope === "weak" ||
                      scope.startsWith("topic:") ||
                      scope.startsWith("idiom:");
                    quiz.prepareQuiz({ forceAll: force });
                  }}
                >
                  {scopeOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="select-wrap">
                <span>Category</span>
                <select
                  id="quizCategorySelect"
                  value={quiz.quizCategoryFilter}
                  onChange={(e) => {
                    quiz.setQuizCategoryFilter(e.target.value);
                    quiz.prepareQuiz({ preserveForce: true, forceAll: quiz.quizForceAll });
                  }}
                >
                  <option value="All">All categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <div className="quiz-toolbar__extras">
                <label className="checkbox-wrap">
                  <input
                    id="quizTimerToggle"
                    type="checkbox"
                    checked={quiz.quizTimerEnabled}
                    onChange={(e) => quiz.setQuizTimerEnabled(e.target.checked)}
                  />
                  <span>20s timer</span>
                </label>
                <label className="checkbox-wrap">
                  <input
                    id="quizRequeueToggle"
                    type="checkbox"
                    checked={quiz.quizRequeueMissed}
                    onChange={(e) => quiz.setQuizRequeueMissed(e.target.checked)}
                  />
                  <span>Re-queue missed</span>
                </label>
                <button id="quizPrintBtn" className="ghost-btn" type="button" onClick={buildPrintSheet}>
                  Print sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="quiz-body">
        <QuizStatus
          current={current}
          quiz={quiz}
          showSummary={quiz.showSummary}
          showEmpty={showEmpty}
          progressPct={progressPct}
        />

        <div id="quizCard" className="quiz-card" hidden={!showCard}>
          {current ? (
            <QuizCardContent
              current={current}
              quiz={quiz}
              mode={mode}
              cloze={cloze}
              typeInput={typeInput}
              setTypeInput={setTypeInput}
              typeFeedback={typeFeedback}
              checkType={checkType}
              mcqPicked={mcqPicked}
              setMcqPicked={setMcqPicked}
            />
          ) : null}
        </div>

        <div id="quizSummary" className="quiz-summary" hidden={!quiz.showSummary}>
          <h3>Session complete</h3>
          <p id="quizSummaryStats" className="quiz-summary__stats">
            {quiz.quizSessionStats.known} known · {quiz.quizSessionStats.again} again ·{" "}
            {quiz.quizSessionStats.total} cards · {quiz.describeQuizMode()}
          </p>
          {quiz.quizSessionStats.missed.length ? (
            <div id="quizSummaryMissedWrap" className="quiz-summary__missed">
              <p className="quiz-summary__label">Review these words:</p>
              <ul id="quizSummaryMissed">
                {quiz.quizSessionStats.missed.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="quiz-summary__actions">
            {quiz.quizSessionStats.missed.length ? (
              <button
                id="quizReviewMissedBtn"
                className="primary-btn"
                type="button"
                onClick={() => quiz.reviewMissedQuiz()}
              >
                Review missed
              </button>
            ) : null}
            <button
              id="quizNewSessionBtn"
              className="ghost-btn"
              type="button"
              onClick={() => quiz.prepareQuiz({ forceAll: quiz.quizForceAll })}
            >
              New session
            </button>
          </div>
        </div>

        <div id="quizEmpty" className="quiz-empty" hidden={!showEmpty}>
          <h3>You&apos;re caught up</h3>
          <p>
            No words are due right now. Come back later or hit Restart to practice everything.
          </p>
          <button
            id="quizEmptyRestartBtn"
            className="primary-btn"
            type="button"
            onClick={() => quiz.prepareQuiz({ forceAll: true })}
          >
            Practice all words
          </button>
        </div>

        <div id="quizPrintSheet" className="quiz-print-sheet" hidden ref={printRef} aria-hidden="true" />
      </div>
    </section>
  );
}

function QuizStatus({
  current,
  quiz,
  showSummary,
  showEmpty,
  progressPct,
}: {
  current: Word | null;
  quiz: ReturnType<typeof useQuiz>;
  showSummary: boolean;
  showEmpty: boolean;
  progressPct: number;
}) {
  const timerVisible = quiz.quizTimerEnabled && current && !showSummary;
  return (
    <div className="quiz-status-block">
      <div className="quiz-meta">
        <p id="quizStatusText">
          {showSummary
            ? "Session complete"
            : showEmpty
              ? emptyStatus(quiz)
              : current
                ? `${quiz.describeQuizScope()} · ${quiz.describeQuizMode()} · ${quiz.quizQueue.length - quiz.quizIndex} left`
                : "Loading exam…"}
        </p>
        <p id="quizProgressText">
          {current && !showSummary
            ? `Card ${quiz.quizIndex + 1} of ${quiz.quizQueue.length}`
            : quiz.describeQuizScope()}
        </p>
      </div>
      <div
        id="quizProgressBar"
        className="quiz-progress-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPct}
        hidden={!current || showSummary}
      >
        <div id="quizProgressFill" className="quiz-progress-bar__fill" style={{ width: `${progressPct}%` }} />
      </div>
      <p
        id="quizTimerText"
        className={`quiz-timer${quiz.quizCardTimerRemaining <= 5 ? " is-urgent" : ""}`}
        hidden={!timerVisible}
      >
        {quiz.quizCardTimerRemaining}s
      </p>
      <ShortcutsHint quiz={quiz} hidden={showSummary || showEmpty} />
    </div>
  );
}

function emptyStatus(quiz: ReturnType<typeof useQuiz>) {
  if (quiz.quizForceAll) return "Session complete";
  if (String(quiz.quizScope).startsWith("topic:")) return "No words found for this topic";
  if (quiz.quizScope === "favorites") return "No favorite words in this filter";
  if (quiz.quizScope === "weak") return "No weak words right now — great job";
  return "You're caught up";
}

function ShortcutsHint({ quiz, hidden }: { quiz: ReturnType<typeof useQuiz>; hidden: boolean }) {
  const mode = quiz.quizMode;
  let hint = "";
  if (mode === "mcq") hint = "";
  else if (mode === "listening") {
    hint = quiz.quizRevealed
      ? "Shortcuts: <kbd>1</kbd> know · <kbd>2</kbd> again"
      : "Shortcuts: <kbd>L</kbd> listen · <kbd>Space</kbd> reveal";
  } else if (mode === "type" || mode === "cloze") {
    hint = quiz.quizTypeChecked
      ? "Shortcuts: <kbd>1</kbd> know · <kbd>2</kbd> again"
      : "Shortcuts: <kbd>Enter</kbd> check answer";
  } else {
    hint = "Shortcuts: <kbd>Space</kbd> reveal · <kbd>1</kbd> know · <kbd>2</kbd> again";
  }
  if (!hint || hidden) return <p className="quiz-shortcuts" id="quizShortcutsHint" hidden />;
  return (
    <p
      className="quiz-shortcuts"
      id="quizShortcutsHint"
      dangerouslySetInnerHTML={{ __html: hint }}
    />
  );
}

function QuizCardContent({
  current,
  quiz,
  mode,
  cloze,
  typeInput,
  setTypeInput,
  typeFeedback,
  checkType,
  mcqPicked,
  setMcqPicked,
}: {
  current: Word;
  quiz: ReturnType<typeof useQuiz>;
  mode: ReturnType<typeof useQuiz>["quizMode"];
  cloze: ReturnType<typeof useQuiz>["buildClozeFor"] extends (i: Word) => infer R
    ? R | null
    : null;
  typeInput: string;
  setTypeInput: (v: string) => void;
  typeFeedback: { text: string; ok: boolean } | null;
  checkType: () => void;
  mcqPicked: Record<string, "correct" | "wrong">;
  setMcqPicked: (v: Record<string, "correct" | "wrong">) => void;
}) {
  const isReverse = mode === "reverse";
  const isType = mode === "type";
  const isMcq = mode === "mcq";
  const isCloze = mode === "cloze";
  const isListening = mode === "listening";
  const isFlashcard = mode === "flashcard";

  const wordRowHidden =
    isMcq ||
    isCloze ||
    isListening ||
    ((isReverse || isType) && !quiz.quizRevealed && !quiz.quizTypeChecked);

  const showFullAnswer = quiz.quizRevealed && !isMcq;

  return (
    <>
      <div className="quiz-card__head">
        <p className="quiz-label" id="quizPromptLabel">
          {isListening ? "Listening" : isReverse || isType || isMcq || isCloze ? "Prompt" : "Word"}
        </p>
        <p id="quizCategory" className={`category-pill ${categoryClass(current.category)} quiz-card__pill`}>
          {current.category}
        </p>
      </div>

      <div className="quiz-card__main">
        <div className="quiz-word-row" id="quizWordRow" hidden={wordRowHidden}>
          <h3 id="quizWord">{isListening && !quiz.quizRevealed ? "····" : current.word}</h3>
          <button
            id="quizSpeakBtn"
            className="icon-btn"
            type="button"
            aria-label="Pronounce word"
            hidden={isListening || isReverse || isType || isMcq || isCloze}
            onClick={() => speakWord(current.word)}
          >
            <span className="ui-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 10v4h3l4 3V7L7 10H4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M15 9.5a3.5 3.5 0 0 1 0 5M17.5 7.5a6 6 0 0 1 0 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
          </button>
        </div>
        <p id="quizPromptText" className="quiz-prompt-text" hidden={!(isReverse || isType || isMcq || isCloze || isListening)}>
          {isListening
            ? quiz.quizRevealed
              ? current.meaning
              : quiz.quizListeningHeard
                ? "What does that word mean?"
                : "Play the audio, then guess the meaning."
            : isCloze
              ? cloze?.prompt
              : current.meaning}
        </p>
        <p id="quizPronunciation" className="quiz-pronunciation">
          {(isFlashcard || quiz.quizRevealed) && !isListening && current.pronunciation
            ? `/${current.pronunciation}/`
            : isListening && quiz.quizRevealed && current.pronunciation
              ? `/${current.pronunciation}/`
              : ""}
        </p>
      </div>

      <div id="quizTypeArea" className="quiz-type-area" hidden={!(isType || isCloze)}>
        <label className="quiz-type-label" htmlFor="quizTypeInput">
          Your answer
        </label>
        <div className="quiz-type-row">
          <input
            id="quizTypeInput"
            className="quiz-type-input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder={isCloze ? "Type the missing word…" : "Type the word…"}
            value={typeInput}
            disabled={quiz.quizTypeChecked}
            onChange={(e) => setTypeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                checkType();
              }
            }}
          />
          <button id="quizCheckTypeBtn" className="primary-btn" type="button" onClick={checkType}>
            Check
          </button>
        </div>
        {typeFeedback ? (
          <p
            id="quizTypeFeedback"
            className={`quiz-type-feedback${typeFeedback.ok ? " is-success" : " is-error"}`}
          >
            {typeFeedback.text}
          </p>
        ) : null}
      </div>

      <div id="quizMcqArea" className="quiz-mcq-grid" hidden={!isMcq}>
        {quiz.quizMcqChoices.map((item) => (
          <button
            key={item.word}
            type="button"
            className={`ghost-btn quiz-mcq-btn${mcqPicked[item.word] ? ` is-${mcqPicked[item.word] === "correct" ? "correct" : "wrong"}` : ""}`}
            disabled={Object.keys(mcqPicked).length > 0}
            onClick={() => {
              const correct = item.word.toLowerCase() === current.word.toLowerCase();
              const next: Record<string, "correct" | "wrong"> = {};
              quiz.quizMcqChoices.forEach((c) => {
                if (c.word.toLowerCase() === current.word.toLowerCase()) next[c.word] = "correct";
                else if (c.word === item.word && !correct) next[c.word] = "wrong";
              });
              if (!correct) next[item.word] = "wrong";
              setMcqPicked(next);
              quiz.onMcqPick(item.word, correct);
            }}
          >
            {item.word}
          </button>
        ))}
      </div>

      <div id="quizAnswer" className="quiz-answer" hidden={!showFullAnswer}>
        <p id="quizAnswerWordRow" hidden={isFlashcard && !isListening}>
          <strong>Word:</strong> <span id="quizAnswerWord">{current.word}</span>
        </p>
        <p>
          <strong>Meaning:</strong> <span id="quizMeaning">{current.meaning}</span>
        </p>
        <p>
          <strong>Synonym:</strong> <span id="quizSynonym">{current.synonym || "—"}</span>
        </p>
        <p>
          <strong>Antonym:</strong> <span id="quizAntonym">{current.antonym || "—"}</span>
        </p>
        <p>
          <strong>Example:</strong> <span id="quizSentence">{current.sentence || "—"}</span>
        </p>
      </div>

      <div className="quiz-actions">
        <button
          id="quizListenBtn"
          className="primary-btn"
          type="button"
          hidden={!isListening}
          onClick={async () => {
            quiz.setQuizListeningHeard(true);
            await speakWord(current.word);
          }}
        >
          {quiz.quizListeningHeard ? "Play again" : "Play audio"}
        </button>
        <button
          id="quizRevealBtn"
          className="primary-btn"
          type="button"
          hidden={isMcq || isType || isCloze || quiz.quizRevealed}
          onClick={() => quiz.setQuizRevealed(true)}
        >
          {isListening ? "Show answer" : isReverse || isType || isCloze ? "Show word" : "Show answer"}
        </button>
        <button
          id="quizKnowBtn"
          className="success-btn"
          type="button"
          hidden={isMcq || isType || isCloze || !quiz.quizRevealed}
          onClick={() => quiz.advanceQuiz(true)}
        >
          I know it
        </button>
        <button
          id="quizAgainBtn"
          className="danger-btn"
          type="button"
          hidden={isMcq || isType || isCloze || !quiz.quizRevealed}
          onClick={() => quiz.advanceQuiz(false)}
        >
          Not yet
        </button>
      </div>
    </>
  );
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function escapeHtml(value: string) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
