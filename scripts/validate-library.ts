import { vocabularyData } from "../src/data/vocabulary";
import { topicData } from "../src/data/topics";
import { idiomData } from "../src/data/idioms";
import { normalizeCategory, CATEGORIES } from "../src/data/categories";

const fail = (code: number, message?: string) => {
  if (message) console.error(message);
  process.exit(code);
};

const toLower = (v: unknown) => String(v || "").trim().toLowerCase();

const isNonEmptyString = (v: unknown) => typeof v === "string" && v.trim().length > 0;

const run = () => {
  if (!Array.isArray(vocabularyData)) fail(1, "vocabularyData must be an array");
  if (!Array.isArray(topicData)) fail(1, "topicData must be an array");
  if (!Array.isArray(idiomData)) fail(1, "idiomData must be an array");

  const vocabSet = new Map<string, string>();
  const vocabIssues: { idx: number; word?: string; issue: string }[] = [];
  const duplicates: { word: string; first: string; secondIndex: number }[] = [];

  for (const [idx, item] of vocabularyData.entries()) {
    const word = item?.word;
    const key = toLower(word);
    if (!key) {
      vocabIssues.push({ idx, issue: "Missing word" });
      continue;
    }

    if (vocabSet.has(key)) {
      duplicates.push({ word: String(word), first: vocabSet.get(key)!, secondIndex: idx });
      continue;
    }

    if (!isNonEmptyString(item?.meaning)) {
      vocabIssues.push({ idx, word: String(word), issue: "Missing meaning" });
    }

    const normalizedCategory = normalizeCategory(item?.category);
    if (!isNonEmptyString(normalizedCategory)) {
      vocabIssues.push({ idx, word: String(word), issue: "Missing category" });
    }

    if (item?.category && !CATEGORIES.includes(item.category as (typeof CATEGORIES)[number])) {
      const mapped = normalizeCategory(item.category);
      if (!CATEGORIES.includes(mapped as (typeof CATEGORIES)[number])) {
        vocabIssues.push({
          idx,
          word: String(word),
          issue: `Unrecognized category: ${item.category}`,
        });
      }
    }

    vocabSet.set(key, String(word));
  }

  const missingWordRefs: { topicTitle: string; missingWord: string }[] = [];
  const missingIdiomRefs: { topicTitle: string; missingIdiom: string }[] = [];
  const topicIssues: { idx: number; title?: string; issue: string }[] = [];

  const idiomSet = new Map<string, string>();
  const idiomIssues: { idx: number; idiom?: string; issue: string }[] = [];
  const idiomDuplicates: { idiom: string; first: string; secondIndex: number }[] = [];

  for (const [idx, item] of idiomData.entries()) {
    const idiom = item?.idiom;
    const key = toLower(idiom);
    if (!key) {
      idiomIssues.push({ idx, issue: "Missing idiom" });
      continue;
    }

    if (idiomSet.has(key)) {
      idiomDuplicates.push({
        idiom: String(idiom),
        first: idiomSet.get(key)!,
        secondIndex: idx,
      });
      continue;
    }

    if (!isNonEmptyString(item?.date)) {
      idiomIssues.push({ idx, idiom: String(idiom), issue: "Missing date" });
    }
    if (!isNonEmptyString(item?.meaning)) {
      idiomIssues.push({ idx, idiom: String(idiom), issue: "Missing meaning" });
    }

    const questionsList = Array.isArray(item?.questions) ? item.questions : [];
    if (!Array.isArray(item?.questions) || questionsList.length === 0) {
      idiomIssues.push({ idx, idiom: String(idiom), issue: "Idiom has no questions" });
    }

    idiomSet.set(key, String(idiom));
  }

  for (const [idx, topic] of topicData.entries()) {
    const title = topic?.title;
    if (!isNonEmptyString(title)) topicIssues.push({ idx, issue: "Missing topic title" });
    if (!isNonEmptyString(topic?.date)) topicIssues.push({ idx, issue: "Missing topic date" });

    const vocabList = Array.isArray(topic?.vocabulary) ? topic.vocabulary : [];
    if (!Array.isArray(topic?.vocabulary) || vocabList.length === 0) {
      topicIssues.push({ idx, title: String(title), issue: "Topic has no vocabulary words" });
    }

    const questionsList = Array.isArray(topic?.questions) ? topic.questions : [];
    if (!Array.isArray(topic?.questions) || questionsList.length === 0) {
      topicIssues.push({ idx, title: String(title), issue: "Topic has no questions" });
    }

    for (const w of vocabList) {
      const wk = toLower(w);
      if (!wk) continue;
      if (!vocabSet.has(wk)) missingWordRefs.push({ topicTitle: String(title), missingWord: String(w) });
    }

    const idiomList = Array.isArray(topic?.idioms) ? topic.idioms : [];
    for (const phrase of idiomList) {
      const ik = toLower(phrase);
      if (!ik) continue;
      if (!idiomSet.has(ik)) {
        missingIdiomRefs.push({ topicTitle: String(title), missingIdiom: String(phrase) });
      }
    }
  }

  const summary = {
    vocabCount: vocabularyData.length,
    topicCount: topicData.length,
    idiomCount: idiomData.length,
    vocabIssues: vocabIssues.length,
    topicIssues: topicIssues.length,
    idiomIssues: idiomIssues.length,
    missingWordRefs: missingWordRefs.length,
    missingIdiomRefs: missingIdiomRefs.length,
    duplicates: duplicates.length,
    idiomDuplicates: idiomDuplicates.length,
  };

  console.log("IMX Library Validation");
  console.log("----------------------");
  console.log(summary);

  if (
    vocabIssues.length ||
    topicIssues.length ||
    idiomIssues.length ||
    idiomDuplicates.length
  ) {
    fail(1);
  }
  console.log("\nValidation passed.");
};

try {
  run();
} catch (err) {
  console.error(err);
  process.exit(1);
}
