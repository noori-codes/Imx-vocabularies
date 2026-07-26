import { formatDate, fadeText } from "./components/helpers.js";
import {
  STORAGE,
  CATEGORIES,
  readStringList,
  writeJson,
  mergeVocabulary,
  mergeTopics,
  upsertCustomWord,
  softDeleteWord,
  upsertCustomTopic,
  softDeleteTopic,
  getDueWords,
  gradeWord,
  buildExportPayload,
  applyImportPayload,
} from "./components/storage.js";

const MOTIVATION_QUOTES = [
  "One new word today is one more opportunity tomorrow.",
  "Consistency beats talent.",
  "Knowledge grows when it is shared.",
  "Great speakers are made, not born.",
  "The more words you know, the more clearly you can think.",
  "The best investment is in yourself.",
  "Small improvements every day lead to remarkable results.",
  "Discipline will take you where motivation cannot.",
  "Every expert was once a beginner.",
  "Learning one word today is better than planning to learn one hundred tomorrow.",
];

const state = {
  activePage: "home",
  searchTerm: "",
  vocabCategory: "All",
  vocabSort: "az",
  vocabFavoritesOnly: false,
  topicFavoritesOnly: false,
  quizQueue: [],
  quizIndex: 0,
  quizRevealed: false,
  quizForceAll: false,
  quizScope: "due",
  editingWord: null,
  editingTopic: null,
};

const els = {
  globalSearchInput: document.getElementById("globalSearchInput"),
  navLinks: document.querySelectorAll(".nav-link"),
  pages: document.querySelectorAll(".page"),
  themeToggle: document.getElementById("themeToggle"),
  newQuoteBtn: document.getElementById("newQuoteBtn"),
  motivationQuote: document.getElementById("motivationQuote"),
  homeTotalWords: document.getElementById("homeTotalWords"),
  homeTotalTopics: document.getElementById("homeTotalTopics"),
  homeFavoriteWords: document.getElementById("homeFavoriteWords"),
  homeDueWords: document.getElementById("homeDueWords"),
  vocabCategoryButtons: document.getElementById("vocabCategoryButtons"),
  vocabGrid: document.getElementById("vocabGrid"),
  vocabResultsText: document.getElementById("vocabResultsText"),
  vocabFavoriteToggle: document.getElementById("vocabFavoriteToggle"),
  vocabSortSelect: document.getElementById("vocabSortSelect"),
  addWordBtn: document.getElementById("addWordBtn"),
  topicGrid: document.getElementById("topicGrid"),
  topicResultsText: document.getElementById("topicResultsText"),
  topicFavoriteToggle: document.getElementById("topicFavoriteToggle"),
  addTopicBtn: document.getElementById("addTopicBtn"),
  favoriteVocabGrid: document.getElementById("favoriteVocabGrid"),
  favoriteTopicGrid: document.getElementById("favoriteTopicGrid"),
  quizStatusText: document.getElementById("quizStatusText"),
  quizProgressText: document.getElementById("quizProgressText"),
  quizCard: document.getElementById("quizCard"),
  quizEmpty: document.getElementById("quizEmpty"),
  quizWord: document.getElementById("quizWord"),
  quizPronunciation: document.getElementById("quizPronunciation"),
  quizCategory: document.getElementById("quizCategory"),
  quizAnswer: document.getElementById("quizAnswer"),
  quizMeaning: document.getElementById("quizMeaning"),
  quizSynonym: document.getElementById("quizSynonym"),
  quizAntonym: document.getElementById("quizAntonym"),
  quizSentence: document.getElementById("quizSentence"),
  quizRevealBtn: document.getElementById("quizRevealBtn"),
  quizKnowBtn: document.getElementById("quizKnowBtn"),
  quizAgainBtn: document.getElementById("quizAgainBtn"),
  quizSpeakBtn: document.getElementById("quizSpeakBtn"),
  quizRestartBtn: document.getElementById("quizRestartBtn"),
  quizScopeSelect: document.getElementById("quizScopeSelect"),
  exportBtn: document.getElementById("exportBtn"),
  importFileInput: document.getElementById("importFileInput"),
  importModeSelect: document.getElementById("importModeSelect"),
  importStatus: document.getElementById("importStatus"),
  modalRoot: document.getElementById("modalRoot"),
  modalTitle: document.getElementById("modalTitle"),
  modalBody: document.getElementById("modalBody"),
};

const favoriteWords = new Set(readStringList(STORAGE.favoritesWords));
const favoriteTopics = new Set(readStringList(STORAGE.favoritesTopics));
const completedTopics = new Set(readStringList(STORAGE.completedTopics));

let baseVocabulary = [];
let baseTopics = [];
let vocabularyData = [];
let topicData = [];

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const categoryClass = (category) =>
  `cat-${String(category || "learning")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

const iconSpeak = `
  <span class="ui-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 10v4h3l4 3V7L7 10H4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M15 9.5a3.5 3.5 0 0 1 0 5M17.5 7.5a6 6 0 0 1 0 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  </span>
`;

const iconStar = (filled) => `
  <span class="ui-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="${filled ? "currentColor" : "none"}">
      <path d="m12 4.2 2.1 4.3 4.7.7-3.4 3.3.8 4.7L12 15.2 7.8 17.2l.8-4.7-3.4-3.3 4.7-.7L12 4.2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
    </svg>
  </span>
`;

const iconChevron = `
  <span class="ui-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none">
      <path d="m7 10 5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </span>
`;


let cachedVoices = [];
let currentAudio = null;

const loadVoices = () => {
  if (!window.speechSynthesis) return [];
  cachedVoices = window.speechSynthesis.getVoices();
  return cachedVoices;
};

if (window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
}

const pickEnglishVoice = () => {
  const voices = cachedVoices.length ? cachedVoices : loadVoices();
  if (!voices.length) return null;
  return (
    voices.find(
      (voice) =>
        /en-US/i.test(voice.lang) &&
        /google|neural|premium|natural/i.test(voice.name),
    ) ||
    voices.find((voice) => /en-US/i.test(voice.lang)) ||
    voices.find((voice) => /^en(-|$)/i.test(voice.lang)) ||
    voices[0]
  );
};

const showSpeakFeedback = (message, isError = false) => {
  let toast = document.getElementById("speakToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "speakToast";
    toast.className = "speak-toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle("is-error", isError);
  toast.classList.add("is-visible");
  window.clearTimeout(showSpeakFeedback._timer);
  showSpeakFeedback._timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3500);
};

const stopSpeaking = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

const playAudioUrl = (url) =>
  new Promise((resolve, reject) => {
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => {
      currentAudio = null;
      resolve(true);
    };
    audio.onerror = () => {
      currentAudio = null;
      reject(new Error("audio failed"));
    };
    audio.play().then(() => {}).catch(reject);
  });

const speakWithDictionaryAudio = async (phrase) => {
  const cleaned = phrase.toLowerCase().trim();
  const candidates = [
    cleaned,
    cleaned.split(/\s+/)[0],
    cleaned.replace(/-/g, ""),
    cleaned.replace(/[^a-z'-]/gi, ""),
  ].filter((item, index, arr) => item && arr.indexOf(item) === index);

  for (const query of candidates) {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`,
    );
    if (!response.ok) continue;

    const data = await response.json();
    const audioUrl = (data || [])
      .flatMap((entry) => entry.phonetics || [])
      .map((item) => item.audio)
      .find((src) => typeof src === "string" && src.trim());

    if (!audioUrl) continue;
    await playAudioUrl(audioUrl);
    return true;
  }

  return false;
};

const speakWithSpeechSynthesis = (phrase) =>
  new Promise((resolve, reject) => {
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== "function") {
      reject(new Error("unsupported"));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    utterance.pitch = 1;

    const voice = pickEnglishVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || "en-US";
    } else if (!loadVoices().length) {
      reject(new Error("no-voices"));
      return;
    }

    utterance.onend = () => resolve(true);
    utterance.onerror = (event) => {
      if (event.error === "canceled" || event.error === "interrupted") {
        resolve(false);
        return;
      }
      reject(new Error(event.error || "synthesis-error"));
    };

    const start = () => {
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    };

    // Chrome bug: cancel() immediately before speak() can silently fail.
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
      window.setTimeout(start, 60);
    } else {
      start();
    }
  });

const speakWithOnlineTts = async (phrase) => {
  // Media-element fallback when local speech voices are missing (common on Linux).
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(
    phrase.slice(0, 100),
  )}`;
  await playAudioUrl(url);
  return true;
};

const speakWord = async (text) => {
  const phrase = String(text || "").trim();
  if (!phrase) return;

  stopSpeaking();

  try {
    if (await speakWithDictionaryAudio(phrase)) return;
  } catch (error) {
    console.warn("Dictionary audio unavailable", error);
  }

  try {
    await speakWithSpeechSynthesis(phrase);
    return;
  } catch (error) {
    console.warn("Speech synthesis unavailable", error);
  }

  try {
    if (await speakWithOnlineTts(phrase)) return;
  } catch (error) {
    console.warn("Online TTS unavailable", error);
  }

  showSpeakFeedback(
    "Pronunciation unavailable. Allow network audio, or fix Linux speech-dispatcher.",
    true,
  );
};

const saveFavorites = () => {
  writeJson(STORAGE.favoritesWords, [...favoriteWords]);
  writeJson(STORAGE.favoritesTopics, [...favoriteTopics]);
};

const saveCompletedTopics = () => {
  writeJson(STORAGE.completedTopics, [...completedTopics]);
};

const isTopicCompleted = (topic) => completedTopics.has(topic.title);

const toggleTopicCompleted = (title) => {
  if (completedTopics.has(title)) completedTopics.delete(title);
  else completedTopics.add(title);
  saveCompletedTopics();
};

const rebuildLibrary = () => {
  vocabularyData = mergeVocabulary(baseVocabulary);
  topicData = mergeTopics(baseTopics);
};

const refreshAll = () => {
  rebuildLibrary();
  if (
    state.vocabCategory !== "All" &&
    !CATEGORIES.includes(state.vocabCategory)
  ) {
    state.vocabCategory = "All";
  }
  populateQuizScopeSelect();
  renderCategoryButtons();
  renderHomeStats();
  renderVocabulary();
  renderTopics();
  renderFavorites();
  prepareQuiz({ preserveForce: true });
};

const applyTheme = (theme) => {
  const isLight = theme === "light";
  document.body.classList.toggle("light", isLight);
  const darkIcon = els.themeToggle.querySelector(".theme-icon-dark");
  const lightIcon = els.themeToggle.querySelector(".theme-icon-light");
  if (darkIcon && lightIcon) {
    // Show the opposite theme icon (moon in light mode, sun in dark mode).
    darkIcon.hidden = !isLight;
    lightIcon.hidden = isLight;
  }
  els.themeToggle.setAttribute(
    "aria-label",
    isLight ? "Switch to dark theme" : "Switch to light theme",
  );
};

const loadTheme = () => {
  const saved = localStorage.getItem(STORAGE.theme);
  applyTheme(saved === "light" ? "light" : "dark");
};

const saveTheme = () => {
  const theme = document.body.classList.contains("light") ? "light" : "dark";
  localStorage.setItem(STORAGE.theme, theme);
};

const updateUrlState = (page, { replace = true } = {}) => {
  const url = new URL(window.location.href);
  url.searchParams.set("page", page);
  if (replace) window.history.replaceState({ page }, "", url);
  else window.history.pushState({ page }, "", url);
};

const switchPage = (page, { updateHistory = true, replace = true } = {}) => {
  if (!document.getElementById(page)) page = "home";
  state.activePage = page;
  els.pages.forEach((section) =>
    section.classList.toggle("page--active", section.id === page),
  );
  els.navLinks.forEach((button) =>
    button.classList.toggle("active", button.dataset.page === page),
  );
  if (updateHistory) updateUrlState(page, { replace });
  if (page === "quiz") prepareQuiz({ preserveForce: true });
};

const closeModal = () => {
  els.modalRoot.hidden = true;
  els.modalBody.innerHTML = "";
  state.editingWord = null;
  state.editingTopic = null;
};

const openModal = (title, bodyHtml) => {
  els.modalTitle.textContent = title;
  els.modalBody.innerHTML = bodyHtml;
  els.modalRoot.hidden = false;
  const firstField = els.modalBody.querySelector("input, textarea, select");
  firstField?.focus();
};

const categoryOptions = (selected = "Learning") =>
  CATEGORIES.map(
    (category) =>
      `<option value="${escapeHtml(category)}" ${
        category === selected ? "selected" : ""
      }>${escapeHtml(category)}</option>`,
  ).join("");

const openWordModal = (item = null) => {
  state.editingWord = item?.word || null;
  const values = item || {
    word: "",
    pronunciation: "",
    meaning: "",
    synonym: "",
    antonym: "",
    wordFamily: "",
    sentence: "",
    category: "Learning",
  };

  openModal(item ? "Edit word" : "Add word", `
    <form id="wordForm" class="form-grid">
      <label>Word<input name="word" required value="${escapeHtml(values.word)}" /></label>
      <label>Pronunciation<input name="pronunciation" value="${escapeHtml(values.pronunciation)}" placeholder="rɪˈɡrɛt" /></label>
      <label>Category<select name="category">${categoryOptions(values.category)}</select></label>
      <label class="full">Meaning<textarea name="meaning" required rows="2">${escapeHtml(values.meaning)}</textarea></label>
      <label>Synonym<input name="synonym" value="${escapeHtml(values.synonym)}" /></label>
      <label>Antonym<input name="antonym" value="${escapeHtml(values.antonym)}" /></label>
      <label class="full">Word family<input name="wordFamily" value="${escapeHtml(values.wordFamily)}" /></label>
      <label class="full">Example sentence<textarea name="sentence" rows="2">${escapeHtml(values.sentence)}</textarea></label>
      <div class="form-actions full">
        <button type="button" class="ghost-btn" data-close-modal>Cancel</button>
        <button type="submit" class="primary-btn">Save word</button>
      </div>
    </form>
  `);

  els.modalBody.querySelector("#wordForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const previousWord = state.editingWord;
      const saved = upsertCustomWord(payload, { previousWord });
      if (previousWord && previousWord !== saved.word && favoriteWords.has(previousWord)) {
        favoriteWords.delete(previousWord);
        favoriteWords.add(saved.word);
        saveFavorites();
      }
      closeModal();
      refreshAll();
    } catch (error) {
      alert(error.message || "Could not save word");
    }
  });
};

const openTopicModal = (item = null) => {
  state.editingTopic = item?.title || null;
  const values = item || {
    title: "",
    date: new Date().toISOString().slice(0, 10),
    summary: "",
    notes: "",
    vocabulary: [],
    questions: [],
  };

  openModal(item ? "Edit topic" : "Add topic", `
    <form id="topicForm" class="form-grid">
      <label class="full">Title<input name="title" required value="${escapeHtml(values.title)}" /></label>
      <label>Date<input name="date" type="date" required value="${escapeHtml(values.date)}" /></label>
      <label class="full">Summary<textarea name="summary" rows="3" required>${escapeHtml(values.summary)}</textarea></label>
      <label class="full">Notes<textarea name="notes" rows="2">${escapeHtml(values.notes)}</textarea></label>
      <label class="full">Vocabulary words (comma-separated)<textarea name="vocabulary" rows="2">${escapeHtml(
        (values.vocabulary || []).join(", "),
      )}</textarea></label>
      <label class="full">Discussion questions (one per line)<textarea name="questions" rows="3">${escapeHtml(
        (values.questions || []).join("\n"),
      )}</textarea></label>
      <div class="form-actions full">
        <button type="button" class="ghost-btn" data-close-modal>Cancel</button>
        <button type="submit" class="primary-btn">Save topic</button>
      </div>
    </form>
  `);

  els.modalBody.querySelector("#topicForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const previousTitle = state.editingTopic;
      const saved = upsertCustomTopic(payload, { previousTitle });
      if (previousTitle && previousTitle !== saved.title && favoriteTopics.has(previousTitle)) {
        favoriteTopics.delete(previousTitle);
        favoriteTopics.add(saved.title);
        saveFavorites();
      }
      closeModal();
      refreshAll();
    } catch (error) {
      alert(error.message || "Could not save topic");
    }
  });
};

const loadData = async () => {
  try {
    const [vocabModule, topicsModule] = await Promise.all([
      import("./data/vocabulary.js"),
      import("./data/topics.js"),
    ]);
    baseVocabulary = vocabModule.vocabularyData || [];
    baseTopics = topicsModule.topicData || [];
    rebuildLibrary();

    let seededFavorites = false;
    let seededCompleted = false;
    topicData.forEach((topic) => {
      if (topic.favorite && !favoriteTopics.has(topic.title)) {
        favoriteTopics.add(topic.title);
        seededFavorites = true;
      }
      if (topic.completed && !completedTopics.has(topic.title)) {
        completedTopics.add(topic.title);
        seededCompleted = true;
      }
    });
    if (seededFavorites) saveFavorites();
    if (seededCompleted) saveCompletedTopics();
  } catch (error) {
    console.error("Failed to load data modules", error);
  }
};

const renderCategoryButtons = () => {
  const categories = ["All", ...CATEGORIES];
  els.vocabCategoryButtons.innerHTML = "";

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-btn ${state.vocabCategory === category ? "is-active" : ""}`;
    if (category !== "All") button.classList.add(categoryClass(category));
    button.textContent = category;
    button.addEventListener("click", () => {
      state.vocabCategory = category;
      renderCategoryButtons();
      renderVocabulary();
    });
    els.vocabCategoryButtons.appendChild(button);
  });
};

const filterVocabulary = () => {
  const term = state.searchTerm.trim().toLowerCase();

  return vocabularyData
    .filter((item) => {
      const matchesCategory =
        state.vocabCategory === "All" || item.category === state.vocabCategory;
      const matchesFavorite =
        !state.vocabFavoritesOnly || favoriteWords.has(item.word);
      if (!matchesCategory || !matchesFavorite) return false;
      if (!term) return true;

      const haystack = [
        item.word,
        item.meaning,
        item.synonym,
        item.antonym,
        item.wordFamily,
        item.sentence,
        item.category,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    })
    .sort((a, b) =>
      state.vocabSort === "za"
        ? b.word.localeCompare(a.word)
        : a.word.localeCompare(b.word),
    );
};

const createVocabCard = (item, { compact = false } = {}) => {
  const card = document.createElement("article");
  const catClass = categoryClass(item.category);
  card.className = `vocab-card ${catClass}`;
  const isFavorite = favoriteWords.has(item.word);
  const word = escapeHtml(item.word);

  card.innerHTML = `
    <div class="card-top">
      <div class="card-title">
        <h3>${word}</h3>
        <div class="category-pill ${catClass}">${escapeHtml(item.category)}</div>
      </div>
      <div class="card-actions">
        <button type="button" class="icon-btn speak-btn" aria-label="Pronounce ${word}">${iconSpeak}</button>
        <button type="button" class="favorite-btn ${isFavorite ? "is-favorite" : ""}" aria-label="Toggle favorite ${word}" aria-pressed="${isFavorite}">
          ${iconStar(isFavorite)}
        </button>
      </div>
    </div>
    <div class="card-body">
    ${item.pronunciation ? `<p class="pronunciation">/${escapeHtml(item.pronunciation)}/</p>` : ""}
    <span class="meta-line">Meaning</span>
    <span class="meta-value">${escapeHtml(item.meaning)}</span>
    ${
      compact
        ? ""
        : `
      <span class="meta-line">Synonym</span>
      <span class="meta-value">${escapeHtml(item.synonym)}</span>
      <span class="meta-line">Antonym</span>
      <span class="meta-value">${escapeHtml(item.antonym)}</span>
      <span class="meta-line">Word Family</span>
      <span class="meta-value">${escapeHtml(item.wordFamily)}</span>
      <span class="meta-line">Example</span>
      <span class="meta-value">“${escapeHtml(item.sentence)}”</span>
    `
    }
    </div>
    <div class="card-footer-actions">
      <button type="button" class="ghost-btn edit-btn">Edit</button>
      <button type="button" class="danger-btn delete-btn">Delete</button>
    </div>
  `;

  card.querySelector(".speak-btn").addEventListener("click", () => speakWord(item.word));
  card.querySelector(".favorite-btn").addEventListener("click", () => {
    if (favoriteWords.has(item.word)) favoriteWords.delete(item.word);
    else favoriteWords.add(item.word);
    saveFavorites();
    renderVocabulary();
    renderFavorites();
    renderHomeStats();
  });
  card.querySelector(".edit-btn").addEventListener("click", () => openWordModal(item));
  card.querySelector(".delete-btn").addEventListener("click", () => {
    if (!confirm(`Delete “${item.word}”?`)) return;
    softDeleteWord(item.word);
    favoriteWords.delete(item.word);
    saveFavorites();
    refreshAll();
  });

  return card;
};

const renderVocabulary = () => {
  const filtered = filterVocabulary();
  els.vocabGrid.innerHTML = "";
  els.vocabResultsText.textContent = `Showing ${filtered.length} vocabulary words`;

  if (!filtered.length) {
    const fallback = document.createElement("div");
    fallback.className = "empty-state";
    fallback.innerHTML = `
      <h3>No vocabulary found</h3>
      <p>Try a different search term or category, or add a new word.</p>
    `;
    els.vocabGrid.appendChild(fallback);
    return;
  }

  filtered.forEach((item) => els.vocabGrid.appendChild(createVocabCard(item)));
};

const filterTopics = () => {
  const term = state.searchTerm.trim().toLowerCase();
  return topicData.filter((topic) => {
    const matchesFavorite =
      !state.topicFavoritesOnly || favoriteTopics.has(topic.title);
    if (!matchesFavorite) return false;
    if (!term) return true;
    const haystack = [
      topic.title,
      topic.summary,
      topic.notes,
      topic.date,
      topic.vocabulary.join(" "),
      topic.questions.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });
};

const renderTopics = () => {
  const filtered = filterTopics();
  els.topicGrid.innerHTML = "";
  const completedCount = topicData.filter((topic) => isTopicCompleted(topic)).length;
  els.topicResultsText.textContent = `Showing ${filtered.length} presentation topics · ${completedCount} completed`;

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <h3>No topics match your search</h3>
      <p>Try broadening the search term or add a new topic.</p>
    `;
    els.topicGrid.appendChild(empty);
    return;
  }

  filtered.forEach((topic, index) => {
    const card = document.createElement("article");
    const isFavorite = favoriteTopics.has(topic.title);
    const isCompleted = isTopicCompleted(topic);
    card.className = `topic-card${isCompleted ? " is-completed" : ""}`;
    const detailsId = `topic-details-${index}`;
    const title = escapeHtml(topic.title);

    const vocabularyCards = topic.vocabulary
      .map((word) => {
        const wordData = vocabularyData.find(
          (item) => item.word.toLowerCase() === word.toLowerCase(),
        );
        if (!wordData) {
          return `
            <div class="mini-vocab-card">
              <div class="mini-vocab-head">
                <h5>${escapeHtml(word)}</h5>
              </div>
              <p class="mini-vocab-meta"><strong>Meaning:</strong> Not added yet</p>
            </div>
          `;
        }
        return `
          <div class="mini-vocab-card">
            <div class="mini-vocab-head">
              <h5>${escapeHtml(wordData.word)}</h5>
              <button type="button" class="icon-btn mini-speak" data-speak="${escapeHtml(wordData.word)}" aria-label="Pronounce ${escapeHtml(wordData.word)}">${iconSpeak}</button>
            </div>
            <p class="mini-vocab-pron">/${escapeHtml(wordData.pronunciation || "ˈwɜːrd")}/</p>
            <p class="mini-vocab-meta"><strong>Meaning:</strong> ${escapeHtml(wordData.meaning)}</p>
            <p class="mini-vocab-meta"><strong>Example:</strong> ${escapeHtml(wordData.sentence)}</p>
          </div>
        `;
      })
      .join("");

    card.innerHTML = `
      <div class="topic-card__header" role="button" tabindex="0" aria-expanded="false" aria-controls="${detailsId}">
        <div class="topic-headline">
          <p class="topic-eyebrow">${escapeHtml(formatDate(topic.date))}${isCompleted ? " · Completed" : ""}</p>
          <h3>${title}</h3>
          ${isCompleted ? '<span class="status-pill">Completed</span>' : ""}
        </div>
        <div class="topic-card__actions">
          <button type="button" class="topic-favorite-btn ${isFavorite ? "is-favorite" : ""}" aria-label="Toggle favorite topic ${title}" aria-pressed="${isFavorite}">
            ${iconStar(isFavorite)}
          </button>
          <span class="topic-toggle-icon" aria-hidden="true">${iconChevron}</span>
        </div>
      </div>
      <div class="topic-details" id="${detailsId}">
        <div class="topic-detail-block">
          <h4>Summary</h4>
          <p>${escapeHtml(topic.summary)}</p>
        </div>
        <div class="topic-detail-block">
          <h4>Vocabulary</h4>
          <div class="mini-vocab-grid">${vocabularyCards}</div>
        </div>
        ${topic.notes ? `<div class="topic-detail-block"><h4>Personal Notes</h4><p>${escapeHtml(topic.notes)}</p></div>` : ""}
        ${
          topic.questions.length
            ? `<div class="topic-detail-block"><h4>Discussion Questions</h4><ul>${topic.questions
                .map((question) => `<li>${escapeHtml(question)}</li>`)
                .join("")}</ul></div>`
            : ""
        }
        <div class="card-footer-actions">
          <button type="button" class="primary-btn practice-topic-btn">Practice words</button>
          <button type="button" class="ghost-btn complete-topic-btn">${isCompleted ? "Mark incomplete" : "Mark completed"}</button>
          <button type="button" class="ghost-btn edit-topic-btn">Edit</button>
          <button type="button" class="danger-btn delete-topic-btn">Delete</button>
        </div>
      </div>
    `;

    card.querySelector(".topic-favorite-btn").addEventListener("click", (event) => {
      event.stopPropagation();
      if (favoriteTopics.has(topic.title)) favoriteTopics.delete(topic.title);
      else favoriteTopics.add(topic.title);
      saveFavorites();
      renderTopics();
      renderFavorites();
      renderHomeStats();
    });

    const toggleButton = card.querySelector(".topic-card__header");
    const setExpanded = (open) => {
      card.classList.toggle("is-open", open);
      toggleButton.setAttribute("aria-expanded", String(open));
    };

    toggleButton.addEventListener("click", (event) => {
      if (event.target.closest(".topic-favorite-btn")) return;
      setExpanded(!card.classList.contains("is-open"));
    });
    toggleButton.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setExpanded(!card.classList.contains("is-open"));
      }
    });

    card.querySelectorAll(".mini-speak").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        speakWord(button.dataset.speak);
      });
    });

    card.querySelector(".practice-topic-btn").addEventListener("click", () => {
      startTopicQuiz(topic.title);
    });

    card.querySelector(".complete-topic-btn").addEventListener("click", () => {
      toggleTopicCompleted(topic.title);
      renderTopics();
      populateQuizScopeSelect();
      renderHomeStats();
    });

    card.querySelector(".edit-topic-btn").addEventListener("click", () => openTopicModal(topic));
    card.querySelector(".delete-topic-btn").addEventListener("click", () => {
      if (!confirm(`Delete “${topic.title}”?`)) return;
      softDeleteTopic(topic.title);
      favoriteTopics.delete(topic.title);
      completedTopics.delete(topic.title);
      saveFavorites();
      saveCompletedTopics();
      refreshAll();
    });

    els.topicGrid.appendChild(card);
  });
};

const renderFavorites = () => {
  els.favoriteVocabGrid.innerHTML = "";
  els.favoriteTopicGrid.innerHTML = "";

  const favoriteWordsList = vocabularyData.filter((item) =>
    favoriteWords.has(item.word),
  );
  const favoriteTopicsList = topicData.filter((item) =>
    favoriteTopics.has(item.title),
  );

  if (!favoriteWordsList.length) {
    els.favoriteVocabGrid.innerHTML = `
      <div class="empty-state">
        <h3>No favorite vocabulary yet</h3>
        <p>Mark words as favorites to save them here.</p>
      </div>
    `;
  } else {
    favoriteWordsList.forEach((item) => {
      els.favoriteVocabGrid.appendChild(createVocabCard(item, { compact: true }));
    });
  }

  if (!favoriteTopicsList.length) {
    els.favoriteTopicGrid.innerHTML = `
      <div class="empty-state">
        <h3>No favorite topics yet</h3>
        <p>Mark topics as favorites to save them here.</p>
      </div>
    `;
  } else {
    favoriteTopicsList.forEach((topic) => {
      const card = document.createElement("article");
      card.className = "topic-card";
      card.innerHTML = `
        <div class="topic-card__header">
          <div class="topic-headline">
            <p class="topic-eyebrow">${escapeHtml(formatDate(topic.date))}</p>
            <h3>${escapeHtml(topic.title)}</h3>
          </div>
          <button type="button" class="topic-favorite-btn is-favorite" aria-pressed="true">${iconStar(true)}</button>
        </div>
      `;
      card.querySelector(".topic-favorite-btn").addEventListener("click", () => {
        favoriteTopics.delete(topic.title);
        saveFavorites();
        renderTopics();
        renderFavorites();
        renderHomeStats();
      });
      els.favoriteTopicGrid.appendChild(card);
    });
  }
};

const renderHomeStats = () => {
  els.homeTotalWords.textContent = vocabularyData.length;
  els.homeTotalTopics.textContent = topicData.length;
  els.homeFavoriteWords.textContent = favoriteWords.size;
  els.homeDueWords.textContent = getDueWords(getQuizWordPool()).length;
};

const renderQuote = () => {
  const quote =
    MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];
  fadeText(els.motivationQuote, quote);
};

const getQuizWordPool = () => {
  if (!String(state.quizScope).startsWith("topic:")) {
    return vocabularyData;
  }
  const topicTitle = state.quizScope.slice("topic:".length);
  const topic = topicData.find((item) => item.title === topicTitle);
  if (!topic) return vocabularyData;

  const wanted = new Set(topic.vocabulary.map((word) => word.toLowerCase()));
  return vocabularyData.filter((item) => wanted.has(item.word.toLowerCase()));
};

const populateQuizScopeSelect = () => {
  if (!els.quizScopeSelect) return;
  const previous = state.quizScope;
  els.quizScopeSelect.innerHTML = "";

  const addOption = (value, label) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    els.quizScopeSelect.appendChild(option);
  };

  addOption("due", "Due words");
  addOption("all", "All vocabulary");
  topicData.forEach((topic) => {
    addOption(`topic:${topic.title}`, topic.title);
  });

  const hasPrevious = [...els.quizScopeSelect.options].some(
    (option) => option.value === previous,
  );
  els.quizScopeSelect.value = hasPrevious ? previous : "due";
  state.quizScope = els.quizScopeSelect.value;
};

const currentQuizItem = () => state.quizQueue[state.quizIndex] || null;

const describeQuizScope = () => {
  if (state.quizScope === "all") return "All vocabulary";
  if (state.quizScope === "due") return "Due words";
  if (String(state.quizScope).startsWith("topic:")) {
    return `Topic: ${state.quizScope.slice("topic:".length)}`;
  }
  return "Quiz";
};

const renderQuizCard = () => {
  const current = currentQuizItem();
  if (!current) {
    els.quizCard.hidden = true;
    els.quizEmpty.hidden = false;
    els.quizStatusText.textContent = state.quizForceAll
      ? "Session complete"
      : String(state.quizScope).startsWith("topic:")
        ? "No words found for this topic"
        : "You're caught up";
    els.quizProgressText.textContent = describeQuizScope();
    return;
  }

  els.quizEmpty.hidden = true;
  els.quizCard.hidden = false;
  els.quizWord.textContent = current.word;
  els.quizPronunciation.textContent = current.pronunciation
    ? `/${current.pronunciation}/`
    : "";
  els.quizCategory.className = `category-pill ${categoryClass(current.category)}`;
  els.quizCategory.textContent = current.category;
  els.quizMeaning.textContent = current.meaning;
  els.quizSynonym.textContent = current.synonym || "—";
  els.quizAntonym.textContent = current.antonym || "—";
  els.quizSentence.textContent = current.sentence || "—";
  els.quizAnswer.hidden = !state.quizRevealed;
  els.quizRevealBtn.hidden = state.quizRevealed;
  els.quizKnowBtn.hidden = !state.quizRevealed;
  els.quizAgainBtn.hidden = !state.quizRevealed;
  els.quizStatusText.textContent = describeQuizScope();
  els.quizProgressText.textContent = `Card ${state.quizIndex + 1} of ${state.quizQueue.length}`;
};

const shuffle = (items) => {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

const prepareQuiz = ({ forceAll = false, preserveForce = false } = {}) => {
  if (!preserveForce) state.quizForceAll = forceAll;
  else if (forceAll) state.quizForceAll = true;

  const pool = getQuizWordPool();
  const useAllInScope =
    state.quizForceAll ||
    state.quizScope === "all" ||
    String(state.quizScope).startsWith("topic:");

  const due = useAllInScope
    ? pool.map((item) => ({ item }))
    : getDueWords(pool);

  const SESSION_SIZE = 15;
  state.quizQueue = shuffle(due.map(({ item }) => item));
  if (!useAllInScope) {
    state.quizQueue = state.quizQueue.slice(0, SESSION_SIZE);
  }
  state.quizIndex = 0;
  state.quizRevealed = false;
  renderQuizCard();
  renderHomeStats();
};

const startTopicQuiz = (topicTitle) => {
  state.quizScope = `topic:${topicTitle}`;
  if (els.quizScopeSelect) {
    populateQuizScopeSelect();
    els.quizScopeSelect.value = state.quizScope;
  }
  switchPage("quiz", { replace: false });
  prepareQuiz({ forceAll: true });
};

const advanceQuiz = (knewIt) => {
  const current = currentQuizItem();
  if (!current) return;
  gradeWord(current.word, knewIt);
  state.quizIndex += 1;
  state.quizRevealed = false;
  renderQuizCard();
  renderHomeStats();
};

const isTypingTarget = (target) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
};

const applySearch = () => {
  renderVocabulary();
  renderTopics();
  const term = state.searchTerm.trim();
  if (term && (state.activePage === "home" || state.activePage === "about" || state.activePage === "data")) {
    const vocabMatches = filterVocabulary().length;
    const topicMatches = filterTopics().length;
    if (vocabMatches || topicMatches) {
      switchPage(vocabMatches >= topicMatches ? "vocabulary" : "topics", {
        replace: true,
      });
    }
  }
};

const exportBackup = () => {
  const payload = buildExportPayload({
    favoriteWords,
    favoriteTopics,
    completedTopics,
  });
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `imx-english-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const importBackup = async (file) => {
  els.importStatus.textContent = "Importing…";
  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    const mode = els.importModeSelect.value === "replace" ? "replace" : "merge";
    applyImportPayload(payload, { mode });

    favoriteWords.clear();
    readStringList(STORAGE.favoritesWords).forEach((word) => favoriteWords.add(word));
    favoriteTopics.clear();
    readStringList(STORAGE.favoritesTopics).forEach((title) => favoriteTopics.add(title));
    completedTopics.clear();
    readStringList(STORAGE.completedTopics).forEach((title) =>
      completedTopics.add(title),
    );

    refreshAll();
    els.importStatus.textContent = `Import complete (${mode}).`;
  } catch (error) {
    console.error(error);
    els.importStatus.textContent = error.message || "Import failed.";
  }
};

const attachListeners = () => {
  els.navLinks.forEach((button) => {
    button.addEventListener("click", () =>
      switchPage(button.dataset.page, { replace: false }),
    );
  });

  document.querySelectorAll("[data-jump]").forEach((button) => {
    button.addEventListener("click", () =>
      switchPage(button.dataset.jump, { replace: false }),
    );
  });

  window.addEventListener("popstate", () => {
    const page = new URL(window.location.href).searchParams.get("page");
    switchPage(page && document.getElementById(page) ? page : "home", {
      updateHistory: false,
    });
  });

  els.globalSearchInput.addEventListener("input", (event) => {
    state.searchTerm = event.target.value;
    applySearch();
  });

  els.themeToggle.addEventListener("click", () => {
    const next = document.body.classList.contains("light") ? "dark" : "light";
    applyTheme(next);
    saveTheme();
  });

  els.newQuoteBtn.addEventListener("click", renderQuote);
  els.addWordBtn.addEventListener("click", () => openWordModal());
  els.addTopicBtn.addEventListener("click", () => openTopicModal());

  els.vocabFavoriteToggle.addEventListener("click", () => {
    state.vocabFavoritesOnly = !state.vocabFavoritesOnly;
    els.vocabFavoriteToggle.classList.toggle("active", state.vocabFavoritesOnly);
    renderVocabulary();
  });

  els.topicFavoriteToggle.addEventListener("click", () => {
    state.topicFavoritesOnly = !state.topicFavoritesOnly;
    els.topicFavoriteToggle.classList.toggle("active", state.topicFavoritesOnly);
    renderTopics();
  });

  els.vocabSortSelect.addEventListener("change", (event) => {
    state.vocabSort = event.target.value;
    renderVocabulary();
  });

  els.quizRevealBtn.addEventListener("click", () => {
    state.quizRevealed = true;
    renderQuizCard();
  });
  els.quizKnowBtn.addEventListener("click", () => advanceQuiz(true));
  els.quizAgainBtn.addEventListener("click", () => advanceQuiz(false));
  els.quizSpeakBtn.addEventListener("click", () => {
    const current = currentQuizItem();
    if (current) speakWord(current.word);
  });
  els.quizRestartBtn.addEventListener("click", () => prepareQuiz({ forceAll: true }));
  els.quizScopeSelect?.addEventListener("change", (event) => {
    state.quizScope = event.target.value;
    prepareQuiz({
      forceAll:
        state.quizScope === "all" || String(state.quizScope).startsWith("topic:"),
    });
  });

  els.exportBtn.addEventListener("click", exportBackup);
  els.importFileInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) importBackup(file);
    event.target.value = "";
  });

  els.modalRoot.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-modal]")) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.modalRoot.hidden) {
      closeModal();
      return;
    }

    if (state.activePage !== "quiz" || !els.modalRoot.hidden) return;
    if (isTypingTarget(event.target)) return;

    if (event.key === " " || event.code === "Space") {
      event.preventDefault();
      if (!currentQuizItem()) return;
      if (!state.quizRevealed) {
        state.quizRevealed = true;
        renderQuizCard();
      }
      return;
    }

    if (event.key === "1") {
      event.preventDefault();
      if (state.quizRevealed && currentQuizItem()) advanceQuiz(true);
      return;
    }

    if (event.key === "2") {
      event.preventDefault();
      if (state.quizRevealed && currentQuizItem()) advanceQuiz(false);
    }
  });
};

const init = async () => {
  loadTheme();
  await loadData();

  const page = new URL(window.location.href).searchParams.get("page");
  switchPage(page && document.getElementById(page) ? page : "home");

  renderCategoryButtons();
  populateQuizScopeSelect();
  renderHomeStats();
  renderVocabulary();
  renderTopics();
  renderFavorites();
  prepareQuiz();
  renderQuote();
  attachListeners();
};

init();
