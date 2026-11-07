import { useEffect, useRef, useState } from "react";
import {
  Check,
  Ear,
  Eye,
  Keyboard,
  LayoutGrid,
  PencilLine,
  RotateCcw,
  Settings2,
  SkipForward,
  Volume2,
  X,
} from "lucide-react";
import { categoryClass } from "../lib/dom";
import { sessionAccuracy } from "../lib/quizLogic";
import { speakWord, unlockAudio } from "../lib/speech";
import { CATEGORIES, useLibrary } from "../state/libraryStore";
import { useQuiz } from "../state/quizStore";
import { useAppShell } from "../state/appShell";
import type { QuizMode, Word } from "../types/models";

const MODE_OPTIONS: { id: QuizMode; label: string; icon: typeof Eye }[] = [
  { id: "flashcard", label: "Flashcard", icon: Eye },
  { id: "reverse", label: "Reverse", icon: RotateCcw },
  { id: "type", label: "Type", icon: Keyboard },
  { id: "mcq", label: "MCQ", icon: LayoutGrid },
  { id: "cloze", label: "Cloze", icon: PencilLine },
  { id: "listening", label: "Listen", icon: Ear },
];

export function ExamPage() {
  const { topicData, idiomData } = useLibrary();
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
    if (shell.activePage !== "quiz") return;
    quiz.prepareQuiz({ preserveForce: true, restart: false });
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
    if (mode === "mcq" || mode === "type" || mode === "cloze") {
      quiz.clearCardTimer();
      return;
    }
    quiz.startCardTimer(() => {
      if (!quiz.quizRevealed) {
        quiz.setQuizRevealed(true);
        return;
      }
      quiz.advanceQuiz(false);
    });
    return () => quiz.clearCardTimer();
  }, [current?.word, mode, quiz.quizRevealed, quiz.showSummary]);

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

      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        if (current && !quiz.showSummary && !quiz.quizTypeChecked) quiz.advanceQuiz(false);
        return;
      }

      if (event.key === "1") {
        event.preventDefault();
        if (quiz.quizRevealed && current && mode !== "mcq" && mode !== "type" && mode !== "cloze") {
          quiz.advanceQuiz(true);
        }
      }
      if (event.key === "2") {
        event.preventDefault();
        if (quiz.quizRevealed && current && mode !== "mcq" && mode !== "type" && mode !== "cloze") {
          quiz.advanceQuiz(false);
        }
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
    if (String(quiz.quizScope).startsWith("topic:")) return "No words found for this topic";
    if (quiz.quizScope === "favorites") return "No favorite words in this filter";
    if (quiz.quizScope === "weak") return "No weak words right now — great job";
    return "You're caught up";
  };

  const showEmpty =
    !current && !quiz.showSummary && quiz.quizSessionStats.answered === 0;

  const showCard = Boolean(current) && !quiz.showSummary;

  const progressPct = quiz.quizSessionStats.total
    ? Math.min(
        100,
        Math.round((quiz.quizSessionStats.answered / quiz.quizSessionStats.total) * 100),
      )
    : 0;

  const accuracy = sessionAccuracy(quiz.quizSessionStats);

  const checkType = () => {
    if (!current || quiz.quizTypeChecked) return;
    const correct = quiz.checkTypedQuizAnswer(typeInput);
    setTypeFeedback({
      text: correct
        ? "Correct — next card…"
        : `Not quite — “${current.word}”. Moving on…`,
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
          <h2>Exam studio</h2>
        </div>
        <div className="quiz-focus-bar">
          <button
            id="quizSettingsToggle"
            className="ghost-btn quiz-settings-toggle"
            type="button"
            aria-expanded={settingsOpen}
            aria-controls="quizToolbarPanel"
            onClick={() => setSettingsOpen((o) => !o)}
          >
            <Settings2 size={15} aria-hidden="true" />
            Settings
          </button>
          <button
            id="quizRestartBtn"
            className="ghost-btn"
            type="button"
            onClick={() => quiz.prepareQuiz({ forceAll: true, restart: true })}
          >
            <RotateCcw size={15} aria-hidden="true" />
            Restart
          </button>
        </div>
      </div>

      <div className="quiz-mode-strip" role="tablist" aria-label="Exam mode">
        {MODE_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={mode === option.id}
              className={`quiz-mode-chip${mode === option.id ? " is-active" : ""}`}
              onClick={() => quiz.setQuizMode(option.id)}
            >
              <Icon aria-hidden="true" />
              {option.label}
            </button>
          );
        })}
      </div>

      <div id="quizToolbarPanel" className="quiz-toolbar-panel" hidden={!settingsOpen}>
        <div className="quiz-toolbar">
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
                quiz.prepareQuiz({ forceAll: force, restart: true, scopeOverride: scope });
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
                quiz.prepareQuiz({
                  preserveForce: true,
                  forceAll: quiz.quizForceAll,
                  restart: true,
                });
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

      <div className="quiz-body">
        <QuizStatus
          current={current}
          quiz={quiz}
          showSummary={quiz.showSummary}
          showEmpty={showEmpty}
          progressPct={progressPct}
        />

        <div
          id="quizCard"
          className={`quiz-card quiz-card--${mode}${quiz.quizRevealed ? " is-revealed" : ""}`}
          hidden={!showCard}
        >
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
          <div className="quiz-summary__hero">
            <p className="eyebrow">Session complete</p>
            <h3>{accuracy != null && accuracy >= 80 ? "Strong session" : "Session wrapped"}</h3>
          </div>
          <div className="quiz-summary__stats-grid">
            <div className="quiz-summary__stat">
              <span>Known</span>
              <strong>{quiz.quizSessionStats.known}</strong>
            </div>
            <div className="quiz-summary__stat">
              <span>Again</span>
              <strong>{quiz.quizSessionStats.again}</strong>
            </div>
            <div className="quiz-summary__stat">
              <span>Reviews</span>
              <strong>{quiz.quizSessionStats.answered}</strong>
            </div>
            <div className="quiz-summary__stat">
              <span>Accuracy</span>
              <strong>{accuracy == null ? "—" : `${accuracy}%`}</strong>
            </div>
          </div>
          {quiz.quizSessionStats.missed.length ? (
            <div id="quizSummaryMissedWrap" className="quiz-summary__missed">
              <p className="quiz-summary__label">Review these words</p>
              <ul id="quizSummaryMissed">
                {quiz.quizSessionStats.missed.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="quiz-summary__label">Clean run — nothing missed</p>
          )}
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
              onClick={() => quiz.prepareQuiz({ forceAll: quiz.quizForceAll, restart: true })}
            >
              New session
            </button>
          </div>
        </div>

        <div id="quizEmpty" className="quiz-empty" hidden={!showEmpty}>
          <p className="eyebrow">Ready when you are</p>
          <h3>{emptyMessage()}</h3>
          <p>
            {quiz.quizScope === "due"
              ? "No words are due right now. Practice the full pool, or switch mode and start a fresh session."
              : "Nothing matched this filter. Open Settings to change scope, or practice everything."}
          </p>
          <div className="quiz-empty__actions">
            <button
              id="quizEmptyRestartBtn"
              className="primary-btn"
              type="button"
              onClick={() => quiz.prepareQuiz({ forceAll: true, restart: true })}
            >
              Practice all words
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setSettingsOpen(true)}
            >
              Open settings
            </button>
          </div>
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
  const timerVisible = Boolean(quiz.quizTimerEnabled && current && !showSummary);
  const remaining = Math.max(0, quiz.quizQueue.length - quiz.quizIndex);

  return (
    <div className="quiz-session-bar" hidden={showEmpty && !showSummary}>
      <div className="quiz-session-bar__meta">
        <p id="quizStatusText">
          {showSummary
            ? "Session complete"
            : current
              ? `${quiz.describeQuizScope()} · ${quiz.describeQuizMode()}`
              : "Loading exam…"}
        </p>
        <p id="quizProgressText">
          {current && !showSummary
            ? `${quiz.quizSessionStats.answered}/${quiz.quizSessionStats.total} done · ${remaining} left`
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
        <div
          id="quizProgressFill"
          className="quiz-progress-bar__fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div className="quiz-timer-row">
        <p
          id="quizTimerText"
          className={`quiz-timer${quiz.quizCardTimerRemaining <= 5 ? " is-urgent" : ""}`}
          hidden={!timerVisible}
        >
          {quiz.quizCardTimerRemaining}s left
        </p>
        <ShortcutsHint quiz={quiz} hidden={showSummary || showEmpty || !current} />
      </div>
    </div>
  );
}

function ShortcutsHint({ quiz, hidden }: { quiz: ReturnType<typeof useQuiz>; hidden: boolean }) {
  const mode = quiz.quizMode;
  let hint = "";
  if (mode === "mcq") hint = "<kbd>S</kbd> skip";
  else if (mode === "listening") {
    hint = quiz.quizRevealed
      ? "<kbd>1</kbd> know · <kbd>2</kbd> again · <kbd>S</kbd> skip"
      : "<kbd>L</kbd> listen · <kbd>Space</kbd> reveal · <kbd>S</kbd> skip";
  } else if (mode === "type" || mode === "cloze") {
    hint = quiz.quizTypeChecked
      ? "Advancing…"
      : "<kbd>Enter</kbd> check · <kbd>S</kbd> skip";
  } else {
    hint = "<kbd>Space</kbd> reveal · <kbd>1</kbd> know · <kbd>2</kbd> again · <kbd>S</kbd> skip";
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
  mode: QuizMode;
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
  const gradingLocked = quiz.quizTypeChecked || Object.keys(mcqPicked).length > 0;

  const promptLabel = isListening
    ? "Listening"
    : isReverse || isType || isMcq || isCloze
      ? "Prompt"
      : "Word";

  return (
    <>
      <div className="quiz-card__head">
        <p className="quiz-label" id="quizPromptLabel">
          {promptLabel}
        </p>
        <p
          id="quizCategory"
          className={`category-pill ${categoryClass(current.category)} quiz-card__pill`}
        >
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
            <Volume2 size={18} aria-hidden="true" />
          </button>
        </div>
        <p
          id="quizPromptText"
          className="quiz-prompt-text"
          hidden={!(isReverse || isType || isMcq || isCloze || isListening)}
        >
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
          <button
            id="quizCheckTypeBtn"
            className="primary-btn"
            type="button"
            disabled={quiz.quizTypeChecked || !typeInput.trim()}
            onClick={checkType}
          >
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
            className={`quiz-choice-btn${
              mcqPicked[item.word]
                ? ` is-${mcqPicked[item.word] === "correct" ? "correct" : "wrong"}`
                : ""
            }`}
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

      <div
        id="quizAnswer"
        className={`quiz-answer${isFlashcard || isReverse ? " quiz-answer--face" : ""}`}
        hidden={!showFullAnswer}
      >
        <p id="quizAnswerWordRow" hidden={isFlashcard && !isListening}>
          <strong>Word</strong> <span id="quizAnswerWord">{current.word}</span>
        </p>
        <p>
          <strong>Meaning</strong> <span id="quizMeaning">{current.meaning}</span>
        </p>
        <p>
          <strong>Synonym</strong> <span id="quizSynonym">{current.synonym || "—"}</span>
        </p>
        <p>
          <strong>Antonym</strong> <span id="quizAntonym">{current.antonym || "—"}</span>
        </p>
        <p>
          <strong>Example</strong> <span id="quizSentence">{current.sentence || "—"}</span>
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
          <Volume2 size={15} aria-hidden="true" />
          {quiz.quizListeningHeard ? "Play again" : "Play audio"}
        </button>
        <button
          id="quizRevealBtn"
          className="primary-btn"
          type="button"
          hidden={isMcq || isType || isCloze || quiz.quizRevealed}
          onClick={() => quiz.setQuizRevealed(true)}
        >
          <Eye size={15} aria-hidden="true" />
          {isListening ? "Show answer" : isReverse ? "Show word" : "Show answer"}
        </button>
        <button
          id="quizKnowBtn"
          className="success-btn"
          type="button"
          hidden={isMcq || isType || isCloze || !quiz.quizRevealed}
          onClick={() => quiz.advanceQuiz(true)}
        >
          <Check size={15} aria-hidden="true" />
          I know it
        </button>
        <button
          id="quizAgainBtn"
          className="danger-btn"
          type="button"
          hidden={isMcq || isType || isCloze || !quiz.quizRevealed}
          onClick={() => quiz.advanceQuiz(false)}
        >
          <X size={15} aria-hidden="true" />
          Not yet
        </button>
        <button
          id="quizSkipBtn"
          className="ghost-btn"
          type="button"
          hidden={gradingLocked}
          onClick={() => quiz.advanceQuiz(false)}
        >
          <SkipForward size={15} aria-hidden="true" />
          Skip
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
