import { useEffect, useRef, useState } from "react";
import {
  appendStudyEvent,
  getSpeakingPracticeFor,
  getWritingResponsesForTopic,
  recordSpeakingPractice,
  recordStudyActivity,
  saveWritingResponse,
} from "../../lib/storage";
import { formatDate } from "../../lib/helpers";
import { useAppShell } from "../../state/appShell";
import type { Idiom, Topic } from "../../types/models";

type PracticeEntry = Topic | Idiom;

export function SpeakingPracticeModal({ entry }: { entry: PracticeEntry }) {
  const title = "title" in entry ? entry.title : entry.idiom;
  const questions =
    entry.questions?.length > 0
      ? entry.questions
      : ["Talk about this for one minute using your own words."];
  const { closeModal, showToast, bumpProgress } = useAppShell();
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(75);
  const totalSec = 75;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const history = getSpeakingPracticeFor(title);
  const circumference = 2 * Math.PI * 52;

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const startTimer = () => {
    clearTimer();
    setRemaining(totalSec);
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        const next = r - 1;
        if (next <= 0) clearTimer();
        return Math.max(0, next);
      });
    }, 1000);
  };

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [index]);

  const finishSpeaking = () => {
    clearTimer();
    recordSpeakingPractice(title);
    recordStudyActivity();
    appendStudyEvent({
      type: "speaking",
      meta: { title, questions: questions.length, minutes: Math.max(2, questions.length) },
    });
    closeModal();
    showToast(`Speaking complete · ${questions.length} question${questions.length === 1 ? "" : "s"}`);
    bumpProgress();
  };

  const progress = (totalSec - remaining) / totalSec;

  return (
    <div className="speaking-practice">
      <p className="speaking-topic">{title}</p>
      <p className="speaking-meta">
        {history?.lastPracticed
          ? `Practiced ${history.count || 1}× · last ${formatDate(history.lastPracticed.slice(0, 10))}`
          : "First session — speak for about a minute per question."}
      </p>
      <p className="speaking-progress">
        Question <span id="speakQIndex">{index + 1}</span> of {questions.length}
      </p>
      <div className="speaking-ring-wrap" aria-hidden="true">
        <svg className="speaking-ring" viewBox="0 0 120 120">
          <circle className="speaking-ring__track" cx="60" cy="60" r="52" />
          <circle
            id="speakRingFill"
            className="speaking-ring__fill"
            cx="60"
            cy="60"
            r="52"
            style={{
              strokeDasharray: String(circumference),
              strokeDashoffset: String(circumference * progress),
            }}
          />
        </svg>
        <p
          id="speakTimer"
          className={`speaking-timer${remaining <= 10 ? " is-urgent" : ""}`}
        >
          {formatSeconds(remaining)}
        </p>
      </div>
      <p id="speakPrompt" className="speaking-prompt">
        {questions[index]}
      </p>
      <div className="form-actions speaking-actions">
        <button
          type="button"
          className="ghost-btn"
          id="speakPrevBtn"
          disabled={index === 0}
          onClick={() => index > 0 && setIndex((i) => i - 1)}
        >
          Previous
        </button>
        <button type="button" className="ghost-btn" id="speakRestartBtn" onClick={startTimer}>
          Restart timer
        </button>
        <button
          type="button"
          className="primary-btn"
          id="speakNextBtn"
          onClick={() => {
            if (index >= questions.length - 1) finishSpeaking();
            else setIndex((i) => i + 1);
          }}
        >
          {index >= questions.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
      <button type="button" className="success-btn full-width" id="speakDoneBtn" onClick={finishSpeaking}>
        Mark practiced
      </button>
    </div>
  );
}

export function WritingPracticeModal({ topic }: { topic: Topic }) {
  const questions =
    topic.questions?.length > 0
      ? topic.questions
      : ["Write a short paragraph about this topic using new vocabulary."];
  const saved = getWritingResponsesForTopic(topic.title);
  const { showToast, bumpProgress } = useAppShell();

  return (
    <div className="writing-practice">
      <p className="speaking-topic">{topic.title}</p>
      <p className="speaking-meta">
        Answer each question in your own words. Responses stay on this device.
      </p>
      <div className="writing-list">
        {questions.map((question, qIndex) => {
          const entry = saved[String(qIndex)] || {};
          return (
            <WritingItem
              key={qIndex}
              index={qIndex}
              question={question}
              initialText={entry.text || ""}
              initialGrade={entry.grade || ""}
              topicTitle={topic.title}
              onSaved={() => {
                showToast("Writing saved");
                bumpProgress();
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function WritingItem({
  index,
  question,
  initialText,
  initialGrade,
  topicTitle,
  onSaved,
}: {
  index: number;
  question: string;
  initialText: string;
  initialGrade: string;
  topicTitle: string;
  onSaved: () => void;
}) {
  const [text, setText] = useState(initialText);
  const [grade, setGrade] = useState(initialGrade);

  return (
    <article className="writing-item" data-index={index}>
      <p className="writing-question">{question}</p>
      <textarea
        className="writing-input"
        rows={3}
        placeholder="Write your response…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="writing-grade-row">
        <label className="select-wrap">
          <span>Self-grade</span>
          <select
            className="writing-grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          >
            <option value="">—</option>
            <option value="strong">Strong</option>
            <option value="ok">OK</option>
            <option value="retry">Retry</option>
          </select>
        </label>
        <button
          type="button"
          className="primary-btn writing-save-btn"
          onClick={() => {
            saveWritingResponse(topicTitle, index, { text, grade });
            recordStudyActivity();
            appendStudyEvent({
              type: "writing",
              meta: { title: topicTitle, index, grade, minutes: 4 },
            });
            onSaved();
          }}
        >
          Save
        </button>
      </div>
    </article>
  );
}
