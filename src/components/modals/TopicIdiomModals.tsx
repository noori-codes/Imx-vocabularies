import { FormEvent, useMemo, useState } from "react";
import { useLibrary } from "../../state/libraryStore";
import { useAppShell } from "../../state/appShell";
import type { Idiom, Topic } from "../../types/models";

export function TopicFormModal({
  item,
  fromTemplate = false,
}: {
  item?: Partial<Topic> | null;
  fromTemplate?: boolean;
}) {
  const { vocabularyData, idiomData, upsertTopic } = useLibrary();
  const { closeModal, showToast } = useAppShell();
  const previousTitle = item?.title ?? null;
  const values = useMemo(
    () => ({
      title: item?.title ?? "",
      date: item?.date ?? new Date().toISOString().slice(0, 10),
      summary: item?.summary ?? "",
      notes: item?.notes ?? "",
      vocabulary: (item?.vocabulary ?? []).join(", "),
      idioms: (item?.idioms ?? []).join("\n"),
      questions: (item?.questions ?? []).join("\n"),
    }),
    [item],
  );
  const [vocabHint, setVocabHint] = useState("");
  const [idiomHint, setIdiomHint] = useState("");

  const updateHints = (vocabRaw: string, idiomRaw: string) => {
    const listed = vocabRaw
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);
    const known = new Set(vocabularyData.map((e) => e.word.toLowerCase()));
    const missing = listed.filter((w) => !known.has(w.toLowerCase()));
    setVocabHint(
      missing.length
        ? `Missing from vocabulary library: ${missing.join(", ")}. You can still save, then add them later.`
        : "",
    );
    const idiomListed = idiomRaw
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);
    const knownIdioms = new Set(idiomData.map((e) => e.idiom.toLowerCase()));
    const missingIdioms = idiomListed.filter((p) => !knownIdioms.has(p.toLowerCase()));
    setIdiomHint(
      missingIdioms.length
        ? `Missing from idiom library: ${missingIdioms.join(", ")}. Add full definitions in src/data/idioms.ts (or ask me).`
        : "",
    );
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const listed = String(payload.vocabulary || "")
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);
    const known = new Set(vocabularyData.map((e) => e.word.toLowerCase()));
    const missing = listed.filter((w) => !known.has(w.toLowerCase()));
    if (missing.length) {
      const proceed = confirm(
        `These words are not in your vocabulary library yet:\n\n${missing.join(", ")}\n\nSave topic anyway?`,
      );
      if (!proceed) return;
    }
    try {
      upsertTopic(payload, previousTitle);
      closeModal();
      if (missing.length) {
        showToast(`Saved. Add ${missing.length} missing word${missing.length === 1 ? "" : "s"} when ready.`);
      } else showToast("Topic saved");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not save topic");
    }
  };

  const titleLabel = item?.title
    ? "Edit topic"
    : fromTemplate
      ? "New lesson from template"
      : "Add topic";

  return (
    <>
      <p className="sr-only">{titleLabel}</p>
      <form
        id="topicForm"
        className="form-grid"
        onSubmit={onSubmit}
        onChange={(e) => {
          const form = e.currentTarget;
          updateHints(
            (form.querySelector('[name="vocabulary"]') as HTMLTextAreaElement)?.value || "",
            (form.querySelector('[name="idioms"]') as HTMLTextAreaElement)?.value || "",
          );
        }}
      >
        <label className="full">
          Title
          <input name="title" required defaultValue={values.title} placeholder="Your discussion title" />
        </label>
        <label>
          Date
          <input name="date" type="date" required defaultValue={values.date} />
        </label>
        <label className="full">
          Summary
          <textarea name="summary" rows={3} required defaultValue={values.summary} />
        </label>
        <label className="full">
          Notes
          <textarea name="notes" rows={2} defaultValue={values.notes} />
        </label>
        <label className="full">
          Vocabulary words (comma-separated, ~10)
          <textarea name="vocabulary" rows={2} defaultValue={values.vocabulary} />
        </label>
        {vocabHint ? (
          <p id="topicVocabHint" className="form-hint full">
            {vocabHint}
          </p>
        ) : null}
        <label className="full">
          Idioms / phrases (one per line, ~5)
          <textarea name="idioms" rows={3} defaultValue={values.idioms} />
        </label>
        {idiomHint ? (
          <p id="topicIdiomHint" className="form-hint full">
            {idiomHint}
          </p>
        ) : null}
        <label className="full">
          Discussion questions (one per line)
          <textarea name="questions" rows={3} defaultValue={values.questions} />
        </label>
        <div className="form-actions full">
          <button type="button" className="ghost-btn" onClick={closeModal}>
            Cancel
          </button>
          <button type="submit" className="primary-btn">
            Save topic
          </button>
        </div>
      </form>
    </>
  );
}

export function IdiomFormModal({
  item,
  fromTemplate = false,
}: {
  item?: Partial<Idiom> | null;
  fromTemplate?: boolean;
}) {
  const { upsertIdiom } = useLibrary();
  const { closeModal, showToast } = useAppShell();
  const previousIdiom = item?.idiom ?? null;
  const values = useMemo(
    () => ({
      idiom: item?.idiom ?? "",
      date: item?.date ?? new Date().toISOString().slice(0, 10),
      meaning: item?.meaning ?? "",
      pronunciation: item?.pronunciation ?? "",
      example: item?.example ?? "",
      usage: item?.usage ?? "",
      summary: item?.summary ?? "",
      notes: item?.notes ?? "",
      questions: (item?.questions ?? []).join("\n"),
    }),
    [item],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      upsertIdiom(payload, previousIdiom);
      closeModal();
      showToast("Idiom saved");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not save idiom");
    }
  };

  return (
    <form id="idiomForm" className="form-grid" onSubmit={onSubmit}>
      <label className="full">
        Idiom
        <input name="idiom" required defaultValue={values.idiom} placeholder="Break the ice" />
      </label>
      <label>
        Date
        <input name="date" type="date" required defaultValue={values.date} />
      </label>
      <label>
        Pronunciation
        <input name="pronunciation" defaultValue={values.pronunciation} placeholder="breɪk ði aɪs" />
      </label>
      <label className="full">
        Meaning
        <textarea name="meaning" rows={2} required defaultValue={values.meaning} />
      </label>
      <label className="full">
        Example sentence
        <textarea name="example" rows={2} defaultValue={values.example} />
      </label>
      <label className="full">
        Usage notes
        <textarea name="usage" rows={2} defaultValue={values.usage} />
      </label>
      <label className="full">
        Summary
        <textarea name="summary" rows={2} defaultValue={values.summary} />
      </label>
      <label className="full">
        Personal notes
        <textarea name="notes" rows={2} defaultValue={values.notes} />
      </label>
      <label className="full">
        Discussion questions (one per line)
        <textarea name="questions" rows={4} required defaultValue={values.questions} />
      </label>
      <div className="form-actions full">
        <button type="button" className="ghost-btn" onClick={closeModal}>
          Cancel
        </button>
        <button type="submit" className="primary-btn">
          Save idiom
        </button>
      </div>
    </form>
  );
}
