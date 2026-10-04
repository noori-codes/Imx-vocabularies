const copyText = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  return ok;
};

export const formatWordShare = (item) => {
  const lines = [
    item.word,
    item.pronunciation ? `/${item.pronunciation}/` : "",
    item.meaning ? `Meaning: ${item.meaning}` : "",
    item.synonym ? `Synonym: ${item.synonym}` : "",
    item.antonym ? `Antonym: ${item.antonym}` : "",
    item.sentence ? `Example: ${item.sentence}` : "",
    "",
    "— IMX English Hub",
  ].filter((line, index, arr) => line || (index > 0 && arr[index - 1]));
  return lines.join("\n");
};

export const formatTopicShare = (topic) => {
  const vocab = (topic.vocabulary || []).join(", ");
  const idioms = (topic.idioms || []).join(", ");
  const questions = (topic.questions || [])
    .map((question, index) => `${index + 1}. ${question}`)
    .join("\n");
  return [
    topic.title,
    topic.date ? `Date: ${topic.date}` : "",
    topic.summary ? `\n${topic.summary}` : "",
    vocab ? `\nVocabulary: ${vocab}` : "",
    idioms ? `\nIdioms: ${idioms}` : "",
    questions ? `\nDiscussion questions:\n${questions}` : "",
    "",
    "— IMX English Hub",
  ]
    .filter(Boolean)
    .join("\n");
};

export const formatIdiomShare = (idiom) => {
  const questions = (idiom.questions || [])
    .map((question, index) => `${index + 1}. ${question}`)
    .join("\n");
  return [
    idiom.idiom,
    idiom.date ? `Date: ${idiom.date}` : "",
    idiom.pronunciation ? `/${idiom.pronunciation}/` : "",
    idiom.meaning ? `Meaning: ${idiom.meaning}` : "",
    idiom.example ? `Example: ${idiom.example}` : "",
    idiom.usage ? `Usage: ${idiom.usage}` : "",
    idiom.summary ? `\n${idiom.summary}` : "",
    questions ? `\nDiscussion questions:\n${questions}` : "",
    "",
    "— IMX English Hub",
  ]
    .filter(Boolean)
    .join("\n");
};

export const shareContent = async ({ title, text }) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch (error) {
      if (error?.name === "AbortError") return "cancelled";
    }
  }

  const ok = await copyText(text);
  return ok ? "copied" : "failed";
};
