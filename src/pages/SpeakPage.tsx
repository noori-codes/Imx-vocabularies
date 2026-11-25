import { useEffect, useMemo, useState } from "react";
import {
  Ear,
  Eye,
  EyeOff,
  Headphones,
  Mic,
  Pause,
  Play,
  SkipForward,
  Users,
} from "lucide-react";
import {
  appendStudyEvent,
  recordSpeakingPractice,
  recordStudyActivity,
  resolveTopicIdioms,
} from "../lib/storage";
import { speakWord, stopSpeaking, unlockAudio } from "../lib/speech";
import { useAppShell } from "../state/appShell";
import { useLibrary } from "../state/libraryStore";
import type { Word } from "../types/models";

type SpeakMode = "repeat" | "shadow";
type Line = {
  id: string;
  text: string;
  meaning: string;
  kind: "example" | "question";
};

const PARTNERS = ["You", "Partner"] as const;

export function SpeakPage() {
  const { topicData, vocabularyData, idiomData, favoriteWords } = useLibrary();
  const { focusTopicTitle, setFocusTopicTitle, showToast, bumpProgress } = useAppShell();

  const [source, setSource] = useState<string>("latest");
  const [mode, setMode] = useState<SpeakMode>("repeat");
  const [showText, setShowText] = useState(true);
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState(0);
  const [phase, setPhase] = useState<"listen" | "repeat" | "shadow">("listen");
  const [doneCount, setDoneCount] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);

  useEffect(() => {
    if (!focusTopicTitle) return;
    const match = topicData.find((t) => t.title === focusTopicTitle);
    if (match) {
      setSource(`topic:${match.title}`);
      setIndex(0);
      setDoneCount(0);
      setSessionStarted(false);
      setPhase("listen");
    }
    setFocusTopicTitle(null);
  }, [focusTopicTitle, setFocusTopicTitle, topicData]);

  const latestTopic = topicData[0] || null;

  const lines = useMemo(() => {
    const buildFromTopic = (title: string): Line[] => {
      const topic = topicData.find((t) => t.title === title);
      if (!topic) return [];
      const wanted = new Set((topic.vocabulary || []).map((w) => w.toLowerCase()));
      const words = vocabularyData.filter((item) => wanted.has(item.word.toLowerCase()));
      const idioms = resolveTopicIdioms(topic, idiomData);
      const out: Line[] = [];

      words.forEach((item) => {
        if (!item.sentence?.trim()) return;
        out.push({
          id: `e:${item.word}`,
          text: item.sentence.trim(),
          meaning: `${item.word} — ${item.meaning}`,
          kind: "example",
        });
      });

      idioms.forEach((item) => {
        if (!item.example?.trim()) return;
        out.push({
          id: `ie:${item.idiom}`,
          text: item.example.trim(),
          meaning: `${item.idiom} — ${item.meaning}`,
          kind: "example",
        });
      });

      (topic.questions || []).forEach((question, qi) => {
        const text = String(question || "").trim();
        if (!text) return;
        out.push({
          id: `q:${title}:${qi}`,
          text,
          meaning: "Discussion question — answer in your own words after repeating.",
          kind: "question",
        });
      });

      return dedupeLines(out);
    };

    if (source === "favorites") {
      return dedupeLines(
        vocabularyData
          .filter((item) => favoriteWords.has(item.word))
          .flatMap((item) => sentenceLinesFromWord(item)),
      );
    }
    if (source === "latest") {
      return latestTopic ? buildFromTopic(latestTopic.title) : [];
    }
    if (source.startsWith("topic:")) {
      return buildFromTopic(source.slice("topic:".length));
    }
    return dedupeLines(
      vocabularyData
        .filter((item) => item.sentence?.trim())
        .slice(0, 30)
        .flatMap((item) => sentenceLinesFromWord(item)),
    );
  }, [source, topicData, vocabularyData, idiomData, favoriteWords, latestTopic]);

  const current = lines[index] || null;
  const partner = PARTNERS[turn % 2];

  useEffect(() => {
    setIndex(0);
    setDoneCount(0);
    setPhase(mode === "shadow" ? "shadow" : "listen");
    setSessionStarted(false);
    stopSpeaking();
  }, [source, mode]);

  const playCurrent = async (slow = false) => {
    if (!current) return;
    unlockAudio();
    setSessionStarted(true);
    await speakWord(current.text, slow ? { rate: 0.72, preferSynth: true } : undefined);
  };

  const markHeard = () => {
    if (mode === "shadow") {
      setPhase("shadow");
      return;
    }
    setPhase("repeat");
  };

  const nextLine = () => {
    stopSpeaking();
    setDoneCount((n) => n + 1);
    if (index >= lines.length - 1) {
      finishSession();
      return;
    }
    setIndex((i) => i + 1);
    setPhase(mode === "shadow" ? "shadow" : "listen");
    if (mode === "repeat") setTurn((t) => t + 1);
  };

  const finishSession = () => {
    stopSpeaking();
    const title =
      source.startsWith("topic:")
        ? source.slice("topic:".length)
        : source === "latest" && latestTopic
          ? latestTopic.title
          : "Speak practice";
    recordSpeakingPractice(title);
    recordStudyActivity();
    appendStudyEvent({
      type: "speaking",
      meta: {
        title,
        mode,
        lines: doneCount + (current ? 1 : 0),
        minutes: Math.max(3, Math.round((doneCount + 1) * 0.4)),
      },
    });
    bumpProgress();
    showToast(
      mode === "shadow"
        ? `Shadowing complete · ${lines.length} lines`
        : `Listen & repeat complete · ${lines.length} lines`,
    );
    setIndex(0);
    setDoneCount(0);
    setPhase(mode === "shadow" ? "shadow" : "listen");
    setSessionStarted(false);
  };

  const progressPct = lines.length
    ? Math.min(100, Math.round((index / lines.length) * 100))
    : 0;

  return (
    <section id="speak" className="page page--active">
      <div className="page-header">
        <div>
          <p className="eyebrow">Together</p>
          <h2>Speak lab</h2>
          <p className="speak-lede">
            Practice full sentences together — listen &amp; repeat, or shadow the audio.
          </p>
        </div>
      </div>

      <div className="speak-setup">
        <label className="select-wrap">
          <span>Source</span>
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="latest">Latest topic{latestTopic ? ` · ${latestTopic.title}` : ""}</option>
            <option value="favorites">Favorite words</option>
            <option value="all">Mixed vocabulary</option>
            {topicData.map((topic) => (
              <option key={topic.title} value={`topic:${topic.title}`}>
                {topic.title}
              </option>
            ))}
          </select>
        </label>

        <div className="speak-mode-toggle" role="tablist" aria-label="Speak mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "repeat"}
            className={`speak-mode-chip${mode === "repeat" ? " is-active" : ""}`}
            onClick={() => setMode("repeat")}
          >
            <Users size={15} aria-hidden="true" />
            Listen &amp; repeat
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "shadow"}
            className={`speak-mode-chip${mode === "shadow" ? " is-active" : ""}`}
            onClick={() => setMode("shadow")}
          >
            <Headphones size={15} aria-hidden="true" />
            Shadowing
          </button>
        </div>
      </div>

      {!current ? (
        <div className="speak-empty">
          <p className="eyebrow">Nothing to practice</p>
          <h3>No sentences in this source</h3>
          <p>Pick a topic with example sentences or discussion questions.</p>
        </div>
      ) : (
        <div className="speak-stage">
          <div className="speak-stage__meta">
            <p>
              {index + 1} / {lines.length}
              {mode === "repeat" ? ` · ${partner}'s turn` : " · Shadow along"}
            </p>
            <div className="speak-progress" aria-hidden="true">
              <span style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className={`speak-card speak-card--${phase}`}>
            <div className="speak-card__top">
              <span className="speak-kind">{labelForKind(current.kind)}</span>
              {mode === "repeat" ? (
                <span className="speak-turn">
                  <Mic size={14} aria-hidden="true" />
                  {partner}
                </span>
              ) : (
                <span className="speak-turn">
                  <Ear size={14} aria-hidden="true" />
                  Shadow
                </span>
              )}
            </div>

            <p className={`speak-line${showText ? "" : " is-hidden"}`}>
              {showText ? current.text : "········"}
            </p>
            <p className="speak-meaning">{showText ? current.meaning : "Listen first, then reveal."}</p>

            <div className="speak-phase">
              {mode === "repeat" ? (
                phase === "listen" ? (
                  <p>
                    <strong>{partner === "You" ? "Partner" : "You"}</strong> plays the audio.
                    Then <strong>{partner}</strong> repeats it.
                  </p>
                ) : (
                  <p>
                    <strong>{partner}</strong> — say it out loud. Partner checks clarity.
                  </p>
                )
              ) : (
                <p>Play the line and speak with it at the same time. Slow it down if needed.</p>
              )}
            </div>
          </div>

          <div className="speak-actions">
            <button type="button" className="primary-btn" onClick={() => playCurrent(false)}>
              <Play size={15} aria-hidden="true" />
              {sessionStarted ? "Play again" : "Play"}
            </button>
            <button type="button" className="ghost-btn" onClick={() => playCurrent(true)}>
              Slow
            </button>
            <button type="button" className="ghost-btn" onClick={() => stopSpeaking()}>
              <Pause size={15} aria-hidden="true" />
              Stop
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setShowText((v) => !v)}
              aria-pressed={showText}
            >
              {showText ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
              {showText ? "Hide text" : "Show text"}
            </button>
            {mode === "repeat" && phase === "listen" ? (
              <button type="button" className="success-btn" onClick={markHeard}>
                Heard it — repeat
              </button>
            ) : (
              <button type="button" className="success-btn" onClick={nextLine}>
                <SkipForward size={15} aria-hidden="true" />
                {index >= lines.length - 1 ? "Finish" : "Next line"}
              </button>
            )}
          </div>

          <ol className="speak-tips">
            {mode === "repeat" ? (
              <>
                <li>Sit facing each other. One controls Play; the other speaks.</li>
                <li>Swap turns each line — the pill shows whose turn it is.</li>
                <li>Hide the text once you know the line to train your ear.</li>
              </>
            ) : (
              <>
                <li>Start Slow, then move to normal speed.</li>
                <li>Match the rhythm, not just the words.</li>
                <li>Record yourselves on your phone if you want a second pass.</li>
              </>
            )}
          </ol>
        </div>
      )}
    </section>
  );
}

function sentenceLinesFromWord(item: Word): Line[] {
  if (!item.sentence?.trim()) return [];
  return [
    {
      id: `e:${item.word}`,
      text: item.sentence.trim(),
      meaning: `${item.word} — ${item.meaning}`,
      kind: "example",
    },
  ];
}

function dedupeLines(lines: Line[]): Line[] {
  const seen = new Set<string>();
  return lines.filter((line) => {
    const key = line.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function labelForKind(kind: Line["kind"]) {
  return kind === "question" ? "Question" : "Sentence";
}
