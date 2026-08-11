import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const repoRoot = path.resolve(fileURLToPath(import.meta.url), "../..");
const dataDir = path.join(repoRoot, "data");

const vocabularyPath = pathToFileURL(path.join(dataDir, "vocabulary.js")).href;
const topicsPath = pathToFileURL(path.join(dataDir, "topics.js")).href;
const categoriesPath = pathToFileURL(path.join(dataDir, "categories.js")).href;

const fail = (code, message) => {
  if (message) console.error(message);
  process.exit(code);
};

const toLower = (v) => String(v || "").trim().toLowerCase();

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

const run = async () => {
  const [{ vocabularyData }, { topicData }, { normalizeCategory, CATEGORIES }] = await Promise.all([
    import(vocabularyPath),
    import(topicsPath),
    import(categoriesPath),
  ]);

  if (!Array.isArray(vocabularyData)) fail(1, "vocabularyData must be an array");
  if (!Array.isArray(topicData)) fail(1, "topicData must be an array");

  const vocabSet = new Map(); // lower(word) -> original word
  const vocabIssues = [];
  const duplicates = [];

  for (const [idx, item] of vocabularyData.entries()) {
    const word = item?.word;
    const key = toLower(word);
    if (!key) {
      vocabIssues.push({ idx, issue: "Missing word", item });
      continue;
    }

    if (vocabSet.has(key)) {
      duplicates.push({ word, first: vocabSet.get(key), secondIndex: idx });
      continue;
    }

    if (!isNonEmptyString(item?.meaning)) {
      vocabIssues.push({ idx, word, issue: "Missing meaning", item });
    }

    const normalizedCategory = normalizeCategory(item?.category);
    if (!isNonEmptyString(normalizedCategory)) {
      vocabIssues.push({ idx, word, issue: "Missing category", item });
    }

    // If the raw category is not in our list and the alias mapper didn't fix it,
    // treat it as a content issue (but don't hard-fail).
    if (item?.category && !CATEGORIES.includes(item.category)) {
      const mapped = normalizeCategory(item.category);
      if (!CATEGORIES.includes(mapped)) {
        vocabIssues.push({ idx, word, issue: `Unrecognized category: ${item.category}`, item });
      }
    }

    vocabSet.set(key, word);
  }

  const missingWordRefs = [];
  const topicIssues = [];

  for (const [idx, topic] of topicData.entries()) {
    const title = topic?.title;
    if (!isNonEmptyString(title)) topicIssues.push({ idx, issue: "Missing topic title", topic });
    if (!isNonEmptyString(topic?.date)) topicIssues.push({ idx, issue: "Missing topic date", topic });

    const vocabList = Array.isArray(topic?.vocabulary) ? topic.vocabulary : [];
    if (!Array.isArray(topic?.vocabulary) || vocabList.length === 0) {
      topicIssues.push({ idx, title, issue: "Topic has no vocabulary words", topic });
    }

    const questionsList = Array.isArray(topic?.questions) ? topic.questions : [];
    if (!Array.isArray(topic?.questions) || questionsList.length === 0) {
      topicIssues.push({ idx, title, issue: "Topic has no questions", topic });
    }

    for (const w of vocabList) {
      const wk = toLower(w);
      if (!wk) continue;
      if (!vocabSet.has(wk)) missingWordRefs.push({ topicTitle: title, missingWord: w });
    }
  }

  const summary = {
    vocabCount: vocabularyData.length,
    topicCount: topicData.length,
    vocabIssues: vocabIssues.length,
    topicIssues: topicIssues.length,
    missingWordRefs: missingWordRefs.length,
    duplicates: duplicates.length,
  };

  console.log("IMX Library Validation");
  console.log("----------------------");
  console.log(summary);

  if (duplicates.length) {
    console.log("\nDuplicates (case-insensitive word):");
    for (const d of duplicates.slice(0, 20)) {
      console.log(`- ${d.word} (first: ${d.first}, secondIndex: ${d.secondIndex})`);
    }
  }

  if (vocabIssues.length) {
    console.log("\nVocabulary issues (first 20):");
    for (const v of vocabIssues.slice(0, 20)) {
      console.log(`- idx ${v.idx}${v.word ? ` word=${v.word}` : ""}: ${v.issue}`);
    }
  }

  if (topicIssues.length) {
    console.log("\nTopic issues (first 20):");
    for (const t of topicIssues.slice(0, 20)) {
      console.log(`- idx ${t.idx}${t.title ? ` title=${t.title}` : ""}: ${t.issue}`);
    }
  }

  if (missingWordRefs.length) {
    console.log("\nMissing vocab links (first 20):");
    for (const m of missingWordRefs.slice(0, 20)) {
      console.log(`- topic="${m.topicTitle}": missing "${m.missingWord}"`);
    }
  }

  // Hard-fail on structural issues that will break the UI.
  // Missing vocab links are handled by your UI (and can be intentional),
  // so we don't fail the whole script for that.
  if (vocabIssues.length || topicIssues.length) fail(1);
  console.log("\nValidation passed.");
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

