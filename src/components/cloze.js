/**
 * Build a cloze (fill-in-the-blank) prompt from an example sentence.
 * Falls back to a simple blank prompt when the word is not in the sentence.
 */
export const buildClozePrompt = (item = {}) => {
  const word = String(item.word || "").trim();
  const sentence = String(item.sentence || "").trim();
  if (!word) {
    return { prompt: "Fill in the blank.", blanked: false, answer: "" };
  }

  if (!sentence) {
    return {
      prompt: `Fill in the blank: “_____” means “${item.meaning || "…"}”.`,
      blanked: false,
      answer: word,
    };
  }

  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escaped}\\b`, "i");
  if (pattern.test(sentence)) {
    return {
      prompt: sentence.replace(pattern, "_____"),
      blanked: true,
      answer: word,
    };
  }

  // Multi-word phrases: try a looser match
  const loose = new RegExp(escaped.replace(/\s+/g, "\\s+"), "i");
  if (loose.test(sentence)) {
    return {
      prompt: sentence.replace(loose, "_____"),
      blanked: true,
      answer: word,
    };
  }

  return {
    prompt: `${sentence}\n\nWhich word fits? _____`,
    blanked: false,
    answer: word,
  };
};
