import { FormEvent, useState } from "react";
import { CATEGORIES } from "../../state/libraryStore";
import { useLibrary } from "../../state/libraryStore";
import { useAppShell } from "../../state/appShell";
import { getTopicsForWord } from "../../lib/storage";
import { formatWordShare, shareContent } from "../../lib/share";
import type { Word } from "../../types/models";

export function WordDetailModal({ item }: { item: Word }) {
  const { topicData } = useLibrary();
  const { closeModal, openModal, navigate, setFocusTopicTitle } = useAppShell();
  const related = getTopicsForWord(item.word, topicData);

  const onShare = async () => {
    await shareContent({ title: `IMX · ${item.word}`, text: formatWordShare(item) });
  };

  return (
    <div className="word-detail">
      {item.pronunciation ? (
        <p className="pronunciation">/{item.pronunciation}/</p>
      ) : null}
      <p>
        <strong>Meaning:</strong> {item.meaning}
      </p>
      <p>
        <strong>Synonym:</strong> {item.synonym || "—"}
      </p>
      <p>
        <strong>Antonym:</strong> {item.antonym || "—"}
      </p>
      <p>
        <strong>Example:</strong> {item.sentence || "—"}
      </p>
      {item.notes ? (
        <p>
          <strong>Notes:</strong> {item.notes}
        </p>
      ) : null}
      {item.tags?.length ? (
        <p>
          <strong>Tags:</strong> {item.tags.join(", ")}
        </p>
      ) : null}
      {related.length ? (
        <p className="appears-in">
          <strong>Appears in:</strong>{" "}
          {related.map((topic, i) => (
            <span key={topic.title}>
              {i > 0 ? ", " : ""}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  closeModal();
                  setFocusTopicTitle(topic.title);
                  navigate("topics", { replace: false });
                }}
              >
                {topic.title}
              </button>
            </span>
          ))}
        </p>
      ) : (
        <p className="appears-in muted">Not linked to a topic yet.</p>
      )}
      <div className="form-actions">
        <button type="button" className="ghost-btn" onClick={onShare}>
          Share
        </button>
        <button
          type="button"
          className="primary-btn"
          onClick={() => openModal("Edit word", <WordFormModal item={item} />)}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

export function WordFormModal({ item }: { item?: Partial<Word> | null }) {
  const { upsertWord } = useLibrary();
  const { closeModal, showToast } = useAppShell();
  const [values] = useState(() => ({
    word: item?.word ?? "",
    pronunciation: item?.pronunciation ?? "",
    meaning: item?.meaning ?? "",
    synonym: item?.synonym ?? "",
    antonym: item?.antonym ?? "",
    wordFamily: item?.wordFamily ?? "",
    sentence: item?.sentence ?? "",
    notes: item?.notes ?? "",
    tags: Array.isArray(item?.tags) ? item.tags.join(", ") : "",
    category: item?.category ?? "Learning",
  }));
  const previousWord = item?.word ?? null;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      upsertWord(payload, previousWord);
      closeModal();
      showToast("Word saved");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not save word");
    }
  };

  return (
    <form id="wordForm" className="form-grid" onSubmit={onSubmit}>
      <label>
        Word
        <input name="word" required defaultValue={values.word} />
      </label>
      <label>
        Pronunciation
        <input name="pronunciation" defaultValue={values.pronunciation} placeholder="rɪˈɡrɛt" />
      </label>
      <label>
        Category
        <select name="category" defaultValue={String(values.category)}>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <label className="full">
        Meaning
        <textarea name="meaning" required rows={2} defaultValue={values.meaning} />
      </label>
      <label>
        Synonym
        <input name="synonym" defaultValue={values.synonym} />
      </label>
      <label>
        Antonym
        <input name="antonym" defaultValue={values.antonym} />
      </label>
      <label className="full">
        Word family
        <input name="wordFamily" defaultValue={values.wordFamily} />
      </label>
      <label className="full">
        Example sentence
        <textarea name="sentence" rows={2} defaultValue={values.sentence} />
      </label>
      <label className="full">
        Tags (comma-separated)
        <input name="tags" defaultValue={values.tags} placeholder="formal, exam, work" />
      </label>
      <label className="full">
        Personal notes
        <textarea name="notes" rows={2} defaultValue={values.notes} />
      </label>
      <div className="form-actions full">
        <button type="button" className="ghost-btn" data-close-modal onClick={closeModal}>
          Cancel
        </button>
        <button type="submit" className="primary-btn">
          Save word
        </button>
      </div>
    </form>
  );
}
