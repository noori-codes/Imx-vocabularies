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
  readQuizSettings,
  saveQuizSettings,
  getWeakWords,
  getStudyStreakInfo,
  recordStudyActivity,
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
  quizMode: "flashcard",
  quizCategoryFilter: "All",
  quizTimerEnabled: false,
  quizRequeueMissed: true,
  quizSessionLimit: null,
  quizMcqChoices: [],
  quizTypeChecked: false,
  quizCardTimerId: null,
  quizCardTimerRemaining: 0,
  quizSessionStats: { known: 0, again: 0, missed: [], total: 0 },
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
  quizModeSelect: document.getElementById("quizModeSelect"),
  quizCategorySelect: document.getElementById("quizCategorySelect"),
  quizTimerToggle: document.getElementById("quizTimerToggle"),
  quizRequeueToggle: document.getElementById("quizRequeueToggle"),
  quizPrintBtn: document.getElementById("quizPrintBtn"),
  quizProgressBar: document.getElementById("quizProgressBar"),
  quizProgressFill: document.getElementById("quizProgressFill"),
  quizTimerText: document.getElementById("quizTimerText"),
  quizPromptLabel: document.getElementById("quizPromptLabel"),
  quizWordRow: document.getElementById("quizWordRow"),
  quizPromptText: document.getElementById("quizPromptText"),
  quizTypeArea: document.getElementById("quizTypeArea"),
  quizTypeInput: document.getElementById("quizTypeInput"),
  quizCheckTypeBtn: document.getElementById("quizCheckTypeBtn"),
  quizTypeFeedback: document.getElementById("quizTypeFeedback"),
  quizMcqArea: document.getElementById("quizMcqArea"),
  quizAnswerWordRow: document.getElementById("quizAnswerWordRow"),
  quizAnswerWord: document.getElementById("quizAnswerWord"),
  quizSummary: document.getElementById("quizSummary"),
  quizSummaryStats: document.getElementById("quizSummaryStats"),
  quizSummaryMissedWrap: document.getElementById("quizSummaryMissedWrap"),
  quizSummaryMissed: document.getElementById("quizSummaryMissed"),
  quizReviewMissedBtn: document.getElementById("quizReviewMissedBtn"),
  quizNewSessionBtn: document.getElementById("quizNewSessionBtn"),
  quizPrintSheet: document.getElementById("quizPrintSheet"),
  homeStudyStreak: document.getElementById("homeStudyStreak"),
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
  if (page === "quiz") {
    try {
      prepareQuiz({ preserveForce: true });
    } catch (error) {
      console.error("Quiz setup failed", error);
    }
  }
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

const DATA_VERSION = "2026-07-27-exam";

const loadData = async () => {
  try {
    // Bump DATA_VERSION when you edit data files so browsers pick up changes.
    const [vocabModule, topicsModule] = await Promise.all([
      import(`./data/vocabulary.js?v=${DATA_VERSION}`),
      import(`./data/topics.js?v=${DATA_VERSION}`),
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
          <button type="button" class="ghost-btn exam-topic-btn">Exam session (10)</button>
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
    card.querySelector(".exam-topic-btn")?.addEventListener("click", () => {
      startTopicExam(topic.title);
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
  els.homeDueWords.textContent = getDueWords(vocabularyData).length;

  if (els.homeStudyStreak) {
    const { streak, studiedToday } = getStudyStreakInfo();
    if (studiedToday) {
      els.homeStudyStreak.textContent =
        streak > 1
          ? `You studied today — ${streak}-day streak. Keep it going.`
          : "You studied today. Nice work — come back tomorrow for a streak.";
    } else {
      els.homeStudyStreak.textContent =
        streak > 0
          ? `${streak}-day streak waiting — review a few due words today.`
          : "Review a few due words, then add one new idea from your latest presentation.";
    }
  }
};

const QUIZ_SESSION_SIZE = 15;
const QUIZ_CARD_TIMER_SEC = 20;

const applyQuizSettingsToState = () => {
  const saved = readQuizSettings();
  state.quizScope = saved.scope || "due";
  state.quizMode = saved.mode || "flashcard";
  state.quizCategoryFilter = saved.categoryFilter || "All";
  state.quizTimerEnabled = Boolean(saved.timer);
  state.quizRequeueMissed = saved.requeue !== false;
};

const persistQuizSettings = () => {
  saveQuizSettings({
    scope: state.quizScope,
    mode: state.quizMode,
    categoryFilter: state.quizCategoryFilter,
    timer: state.quizTimerEnabled,
    requeue: state.quizRequeueMissed,
  });
};

const syncQuizControlsFromState = () => {
  if (els.quizModeSelect) els.quizModeSelect.value = state.quizMode;
  if (els.quizCategorySelect) els.quizCategorySelect.value = state.quizCategoryFilter;
  if (els.quizTimerToggle) els.quizTimerToggle.checked = state.quizTimerEnabled;
  if (els.quizRequeueToggle) els.quizRequeueToggle.checked = state.quizRequeueMissed;
};

const populateQuizCategorySelect = () => {
  if (!els.quizCategorySelect) return;
  const previous = state.quizCategoryFilter;
  els.quizCategorySelect.innerHTML = "";
  const addOption = (value, label) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    els.quizCategorySelect.appendChild(option);
  };
  addOption("All", "All categories");
  CATEGORIES.forEach((category) => addOption(category, category));
  const hasPrevious = [...els.quizCategorySelect.options].some(
    (option) => option.value === previous,
  );
  els.quizCategorySelect.value = hasPrevious ? previous : "All";
  state.quizCategoryFilter = els.quizCategorySelect.value;
};

const getQuizWordPool = () => {
  let pool = vocabularyData;

  if (state.quizScope === "favorites") {
    pool = pool.filter((item) => favoriteWords.has(item.word));
  } else if (state.quizScope === "weak") {
    pool = getWeakWords(pool);
  } else if (String(state.quizScope).startsWith("topic:")) {
    const topicTitle = state.quizScope.slice("topic:".length);
    const topic = topicData.find((item) => item.title === topicTitle);
    if (topic) {
      const wanted = new Set(topic.vocabulary.map((word) => word.toLowerCase()));
      pool = pool.filter((item) => wanted.has(item.word.toLowerCase()));
    }
  }

  if (state.quizCategoryFilter && state.quizCategoryFilter !== "All") {
    pool = pool.filter((item) => item.category === state.quizCategoryFilter);
  }

  return pool;
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
  addOption("favorites", "Favorites only");
  addOption("weak", "Weak words (recent again)");
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
  if (state.quizScope === "favorites") return "Favorite words";
  if (state.quizScope === "weak") return "Weak words";
  if (String(state.quizScope).startsWith("topic:")) {
    const title = state.quizScope.slice("topic:".length);
    return state.quizSessionLimit === 10 ? `Topic exam: ${title}` : `Topic: ${title}`;
  }
  return "Exam practice";
};

const describeQuizMode = () => {
  const modes = {
    flashcard: "Word → meaning",
    reverse: "Meaning → word",
    type: "Type the word",
    mcq: "Pick the word",
  };
  return modes[state.quizMode] || modes.flashcard;
};

const clearQuizCardTimer = () => {
  if (state.quizCardTimerId) {
    clearInterval(state.quizCardTimerId);
    state.quizCardTimerId = null;
  }
  if (els.quizTimerText) els.quizTimerText.hidden = true;
};

const startQuizCardTimer = () => {
  clearQuizCardTimer();
  if (!state.quizTimerEnabled || !currentQuizItem()) return;

  state.quizCardTimerRemaining = QUIZ_CARD_TIMER_SEC;
  if (els.quizTimerText) {
    els.quizTimerText.hidden = false;
    els.quizTimerText.textContent = `${state.quizCardTimerRemaining}s`;
  }

  state.quizCardTimerId = setInterval(() => {
    state.quizCardTimerRemaining -= 1;
    if (els.quizTimerText) {
      els.quizTimerText.textContent = `${Math.max(0, state.quizCardTimerRemaining)}s`;
      els.quizTimerText.classList.toggle(
        "is-urgent",
        state.quizCardTimerRemaining <= 5,
      );
    }
    if (state.quizCardTimerRemaining <= 0) {
      clearQuizCardTimer();
      if (state.quizMode === "mcq" || state.quizTypeChecked) return;
      if (!state.quizRevealed) {
        state.quizRevealed = true;
        renderQuizCard();
      }
    }
  }, 1000);
};

const shuffle = (items) => {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

const pickMcqChoices = (correct, pool) => {
  const sameCategory = pool.filter(
    (item) =>
      item.word.toLowerCase() !== correct.word.toLowerCase() &&
      item.category === correct.category,
  );
  const fallback = pool.filter(
    (item) => item.word.toLowerCase() !== correct.word.toLowerCase(),
  );
  const distractorPool = sameCategory.length >= 3 ? sameCategory : fallback;
  const distractors = shuffle(distractorPool).slice(0, 3);
  while (distractors.length < 3 && fallback.length) {
    const next = fallback.find(
      (item) =>
        !distractors.some((d) => d.word === item.word) &&
        item.word !== correct.word,
    );
    if (!next) break;
    distractors.push(next);
  }
  return shuffle([correct, ...distractors.slice(0, 3)]);
};

const normalizeTypedWord = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\s'-]/gi, "");

const wordsMatchTyped = (typed, word) =>
  normalizeTypedWord(typed) === normalizeTypedWord(word);

const updateQuizProgressBar = () => {
  if (!els.quizProgressBar || !els.quizProgressFill) return;
  const total = state.quizSessionStats.total || state.quizQueue.length;
  if (!total || !currentQuizItem()) {
    els.quizProgressBar.hidden = true;
    return;
  }
  const done = state.quizSessionStats.known + state.quizSessionStats.again;
  const current = Math.min(done + 1, total);
  const pct = Math.round((current / total) * 100);
  els.quizProgressBar.hidden = false;
  els.quizProgressBar.setAttribute("aria-valuenow", String(pct));
  els.quizProgressFill.style.width = `${pct}%`;
};

const hideQuizSummary = () => {
  if (els.quizSummary) els.quizSummary.hidden = true;
};

const showQuizSummary = () => {
  clearQuizCardTimer();
  if (els.quizCard) els.quizCard.hidden = true;
  if (els.quizEmpty) els.quizEmpty.hidden = true;
  if (!els.quizSummary) return;

  const { known, again, missed, total } = state.quizSessionStats;
  els.quizSummary.hidden = false;
  els.quizSummaryStats.textContent = `${known} known · ${again} again · ${total} cards · ${describeQuizMode()}`;

  if (missed.length && els.quizSummaryMissed && els.quizSummaryMissedWrap) {
    els.quizSummaryMissed.innerHTML = missed
      .map((word) => `<li>${escapeHtml(word)}</li>`)
      .join("");
    els.quizSummaryMissedWrap.hidden = false;
    if (els.quizReviewMissedBtn) els.quizReviewMissedBtn.hidden = false;
  } else {
    if (els.quizSummaryMissedWrap) els.quizSummaryMissedWrap.hidden = true;
    if (els.quizReviewMissedBtn) els.quizReviewMissedBtn.hidden = true;
  }

  if (els.quizStatusText) els.quizStatusText.textContent = "Session complete";
  if (els.quizProgressText) els.quizProgressText.textContent = describeQuizScope();
  if (els.quizProgressBar) els.quizProgressBar.hidden = true;
};

const resetQuizSessionStats = (total) => {
  state.quizSessionStats = { known: 0, again: 0, missed: [], total };
};

const renderQuizMcq = (current, pool) => {
  if (!els.quizMcqArea) return;
  state.quizMcqChoices = pickMcqChoices(current, pool);
  els.quizMcqArea.innerHTML = state.quizMcqChoices
    .map(
      (item) =>
        `<button type="button" class="ghost-btn quiz-mcq-btn" data-word="${escapeHtml(item.word)}">${escapeHtml(item.word)}</button>`,
    )
    .join("");
  els.quizMcqArea.querySelectorAll(".quiz-mcq-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const picked = button.dataset.word;
      const correct = picked.toLowerCase() === current.word.toLowerCase();
      button.classList.add(correct ? "is-correct" : "is-wrong");
      els.quizMcqArea.querySelectorAll(".quiz-mcq-btn").forEach((btn) => {
        btn.disabled = true;
        if (btn.dataset.word.toLowerCase() === current.word.toLowerCase()) {
          btn.classList.add("is-correct");
        }
      });
      setTimeout(() => advanceQuiz(correct), correct ? 420 : 900);
    });
  });
};

const renderQuizCard = () => {
  hideQuizSummary();
  const current = currentQuizItem();
  const pool = getQuizWordPool();
  const mode = state.quizMode;

  if (!els.quizCard || !els.quizEmpty) return;

  if (!current) {
    clearQuizCardTimer();
    els.quizCard.hidden = true;
    if (state.quizSessionStats.known + state.quizSessionStats.again > 0) {
      showQuizSummary();
      return;
    }
    els.quizEmpty.hidden = false;
    if (els.quizStatusText) {
      els.quizStatusText.textContent = state.quizForceAll
        ? "Session complete"
        : String(state.quizScope).startsWith("topic:")
          ? "No words found for this topic"
          : state.quizScope === "favorites"
            ? "No favorite words in this filter"
            : state.quizScope === "weak"
              ? "No weak words right now — great job"
              : "You're caught up";
    }
    if (els.quizProgressText) els.quizProgressText.textContent = describeQuizScope();
    if (els.quizProgressBar) els.quizProgressBar.hidden = true;
    return;
  }

  state.quizTypeChecked = false;
  els.quizEmpty.hidden = true;
  els.quizCard.hidden = false;

  const isReverse = mode === "reverse";
  const isType = mode === "type";
  const isMcq = mode === "mcq";
  const isFlashcard = mode === "flashcard";

  if (els.quizPromptLabel) {
    els.quizPromptLabel.textContent = isReverse || isType || isMcq ? "Prompt" : "Word";
  }
  if (els.quizWordRow) {
    els.quizWordRow.hidden =
      isMcq || ((isReverse || isType) && !state.quizRevealed && !state.quizTypeChecked);
  }
  if (els.quizPromptText) {
    els.quizPromptText.hidden = !(isReverse || isType || isMcq);
    els.quizPromptText.textContent = current.meaning;
  }
  if (els.quizWord) els.quizWord.textContent = current.word;
  if (els.quizPronunciation) {
    els.quizPronunciation.textContent =
    isFlashcard || state.quizRevealed
      ? current.pronunciation
        ? `/${current.pronunciation}/`
        : ""
      : "";
  }
  if (els.quizCategory) {
    els.quizCategory.className = `category-pill ${categoryClass(current.category)}`;
    els.quizCategory.textContent = current.category;
  }
  if (els.quizMeaning) els.quizMeaning.textContent = current.meaning;
  if (els.quizSynonym) els.quizSynonym.textContent = current.synonym || "—";
  if (els.quizAntonym) els.quizAntonym.textContent = current.antonym || "—";
  if (els.quizSentence) els.quizSentence.textContent = current.sentence || "—";
  if (els.quizAnswerWord) els.quizAnswerWord.textContent = current.word;

  if (els.quizTypeArea) els.quizTypeArea.hidden = !isType;
  if (els.quizMcqArea) els.quizMcqArea.hidden = !isMcq;
  if (isType && els.quizTypeInput) {
    els.quizTypeInput.value = "";
    els.quizTypeInput.disabled = false;
    if (els.quizTypeFeedback) els.quizTypeFeedback.hidden = true;
  }
  if (isMcq) renderQuizMcq(current, pool);

  const showFullAnswer = state.quizRevealed && !isMcq;
  if (els.quizAnswer) els.quizAnswer.hidden = !showFullAnswer;
  if (els.quizAnswerWordRow) {
    els.quizAnswerWordRow.hidden = isFlashcard;
  }

  if (els.quizRevealBtn) {
    els.quizRevealBtn.hidden = isMcq || isType || state.quizRevealed;
    els.quizRevealBtn.textContent =
      isReverse || isType ? "Show word" : "Show answer";
  }
  if (els.quizKnowBtn) els.quizKnowBtn.hidden = isMcq || isType || !state.quizRevealed;
  if (els.quizAgainBtn) els.quizAgainBtn.hidden = isMcq || isType || !state.quizRevealed;
  if (els.quizSpeakBtn) els.quizSpeakBtn.hidden = isReverse || isType || isMcq;

  if (els.quizShortcutsHint) {
    els.quizShortcutsHint.hidden = isMcq;
  }

  if (els.quizStatusText) {
    els.quizStatusText.textContent = `${describeQuizScope()} · ${describeQuizMode()}`;
  }
  if (els.quizProgressText) {
    els.quizProgressText.textContent = `Card ${Math.min(
      state.quizSessionStats.known + state.quizSessionStats.again + 1,
      state.quizSessionStats.total || state.quizQueue.length,
    )} of ${state.quizSessionStats.total || state.quizQueue.length}`;
  }
  updateQuizProgressBar();
  startQuizCardTimer();
};

const prepareQuiz = ({ forceAll = false, preserveForce = false, limit = null } = {}) => {
  if (!preserveForce) state.quizForceAll = forceAll;
  else if (forceAll) state.quizForceAll = true;

  if (limit != null) state.quizSessionLimit = limit;
  else if (!preserveForce) state.quizSessionLimit = null;

  hideQuizSummary();
  clearQuizCardTimer();

  const pool = getQuizWordPool();
  const useAllInScope =
    state.quizForceAll ||
    state.quizScope === "all" ||
    state.quizScope === "favorites" ||
    state.quizScope === "weak" ||
    String(state.quizScope).startsWith("topic:");

  const due = useAllInScope
    ? pool.map((item) => ({ item }))
    : getDueWords(pool);

  state.quizQueue = shuffle(due.map(({ item }) => item));
  const sessionCap = state.quizSessionLimit || QUIZ_SESSION_SIZE;
  if (!useAllInScope || state.quizSessionLimit) {
    state.quizQueue = state.quizQueue.slice(0, sessionCap);
  } else if (useAllInScope && !String(state.quizScope).startsWith("topic:")) {
    state.quizQueue = state.quizQueue.slice(0, sessionCap);
  }

  resetQuizSessionStats(state.quizQueue.length);
  state.quizIndex = 0;
  state.quizRevealed = false;
  try {
    renderQuizCard();
  } catch (error) {
    console.error("Quiz render failed", error);
  }
  renderHomeStats();
};

const startTopicQuiz = (topicTitle) => {
  state.quizScope = `topic:${topicTitle}`;
  state.quizSessionLimit = null;
  if (els.quizScopeSelect) {
    populateQuizScopeSelect();
    els.quizScopeSelect.value = state.quizScope;
  }
  persistQuizSettings();
  switchPage("quiz", { replace: false });
  prepareQuiz({ forceAll: true });
};

const startTopicExam = (topicTitle) => {
  state.quizScope = `topic:${topicTitle}`;
  state.quizMode = "flashcard";
  syncQuizControlsFromState();
  if (els.quizScopeSelect) {
    populateQuizScopeSelect();
    els.quizScopeSelect.value = state.quizScope;
  }
  persistQuizSettings();
  switchPage("quiz", { replace: false });
  prepareQuiz({ forceAll: true, limit: 10 });
};

const reviewMissedQuiz = () => {
  const missedWords = state.quizSessionStats.missed;
  if (!missedWords.length) return;
  const lookup = new Map(
    vocabularyData.map((item) => [item.word.toLowerCase(), item]),
  );
  state.quizQueue = missedWords
    .map((word) => lookup.get(word.toLowerCase()))
    .filter(Boolean);
  resetQuizSessionStats(state.quizQueue.length);
  state.quizIndex = 0;
  state.quizRevealed = false;
  state.quizForceAll = true;
  hideQuizSummary();
  renderQuizCard();
};

const advanceQuiz = (knewIt) => {
  const current = currentQuizItem();
  if (!current) return;

  clearQuizCardTimer();
  recordStudyActivity();

  if (knewIt) state.quizSessionStats.known += 1;
  else {
    state.quizSessionStats.again += 1;
    if (!state.quizSessionStats.missed.includes(current.word)) {
      state.quizSessionStats.missed.push(current.word);
    }
  }

  gradeWord(current.word, knewIt);

  if (!knewIt && state.quizRequeueMissed) {
    state.quizQueue.push(current);
  }

  state.quizIndex += 1;
  state.quizRevealed = false;
  renderQuizCard();
  renderHomeStats();
};

const checkTypedQuizAnswer = () => {
  const current = currentQuizItem();
  if (!current || state.quizMode !== "type" || state.quizTypeChecked) return;

  const typed = els.quizTypeInput?.value || "";
  const correct = wordsMatchTyped(typed, current.word);
  state.quizTypeChecked = true;
  if (els.quizTypeInput) els.quizTypeInput.disabled = true;

  if (els.quizTypeFeedback) {
    els.quizTypeFeedback.hidden = false;
    els.quizTypeFeedback.textContent = correct
      ? "Correct!"
      : `Not quite — the word was “${current.word}”.`;
    els.quizTypeFeedback.classList.toggle("is-success", correct);
    els.quizTypeFeedback.classList.toggle("is-error", !correct);
  }

  state.quizRevealed = true;
  els.quizAnswer.hidden = false;
  if (els.quizAnswerWordRow) els.quizAnswerWordRow.hidden = false;
  els.quizWordRow.hidden = false;
  els.quizWord.textContent = current.word;
  els.quizPronunciation.textContent = current.pronunciation
    ? `/${current.pronunciation}/`
    : "";
  els.quizRevealBtn.hidden = true;
  els.quizKnowBtn.hidden = false;
  els.quizAgainBtn.hidden = false;

  if (correct) {
    setTimeout(() => advanceQuiz(true), 650);
  }
};

const buildPrintExamSheet = () => {
  if (!els.quizPrintSheet) return;
  const pool = shuffle(getQuizWordPool()).slice(0, 30);
  const wordsHtml = pool
    .map(
      (item, index) =>
        `<tr><td>${index + 1}.</td><td class="print-blank"></td><td>${escapeHtml(item.category)}</td></tr>`,
    )
    .join("");
  const answersHtml = pool
    .map(
      (item, index) =>
        `<tr><td>${index + 1}.</td><td><strong>${escapeHtml(item.word)}</strong></td><td>${escapeHtml(item.meaning)}</td></tr>`,
    )
    .join("");

  els.quizPrintSheet.innerHTML = `
    <div class="quiz-print-page">
      <h1>IMX Exam Sheet — Words</h1>
      <p>${escapeHtml(describeQuizScope())} · ${new Date().toLocaleDateString()}</p>
      <table><thead><tr><th>#</th><th>Your word</th><th>Category</th></tr></thead><tbody>${wordsHtml}</tbody></table>
    </div>
    <div class="quiz-print-page quiz-print-page--answers">
      <h1>Answer key</h1>
      <table><thead><tr><th>#</th><th>Word</th><th>Meaning</th></tr></thead><tbody>${answersHtml}</tbody></table>
    </div>
  `;
  els.quizPrintSheet.hidden = false;
  window.print();
  els.quizPrintSheet.hidden = true;
};

const renderQuote = () => {
  const quote =
    MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];
  fadeText(els.motivationQuote, quote);
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

let listenersReady = false;

const attachListeners = () => {
  if (listenersReady) return;
  listenersReady = true;
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

  els.globalSearchInput?.addEventListener("input", (event) => {
    state.searchTerm = event.target.value;
    applySearch();
  });

  els.themeToggle?.addEventListener("click", () => {
    const next = document.body.classList.contains("light") ? "dark" : "light";
    applyTheme(next);
    saveTheme();
  });

  els.newQuoteBtn?.addEventListener("click", renderQuote);
  els.addWordBtn?.addEventListener("click", () => openWordModal());
  els.addTopicBtn?.addEventListener("click", () => openTopicModal());

  els.vocabFavoriteToggle?.addEventListener("click", () => {
    state.vocabFavoritesOnly = !state.vocabFavoritesOnly;
    els.vocabFavoriteToggle.classList.toggle("active", state.vocabFavoritesOnly);
    renderVocabulary();
  });

  els.topicFavoriteToggle?.addEventListener("click", () => {
    state.topicFavoritesOnly = !state.topicFavoritesOnly;
    els.topicFavoriteToggle.classList.toggle("active", state.topicFavoritesOnly);
    renderTopics();
  });

  els.vocabSortSelect?.addEventListener("change", (event) => {
    state.vocabSort = event.target.value;
    renderVocabulary();
  });

  els.quizRevealBtn?.addEventListener("click", () => {
    state.quizRevealed = true;
    renderQuizCard();
  });
  els.quizKnowBtn?.addEventListener("click", () => advanceQuiz(true));
  els.quizAgainBtn?.addEventListener("click", () => advanceQuiz(false));
  els.quizSpeakBtn?.addEventListener("click", () => {
    const current = currentQuizItem();
    if (current) speakWord(current.word);
  });
  els.quizRestartBtn?.addEventListener("click", () => prepareQuiz({ forceAll: true }));
  els.quizScopeSelect?.addEventListener("change", (event) => {
    state.quizScope = event.target.value;
    persistQuizSettings();
    prepareQuiz({
      forceAll:
        state.quizScope === "all" ||
        state.quizScope === "favorites" ||
        state.quizScope === "weak" ||
        String(state.quizScope).startsWith("topic:"),
    });
  });

  els.quizModeSelect?.addEventListener("change", (event) => {
    state.quizMode = event.target.value;
    persistQuizSettings();
    state.quizRevealed = false;
    renderQuizCard();
  });

  els.quizCategorySelect?.addEventListener("change", (event) => {
    state.quizCategoryFilter = event.target.value;
    persistQuizSettings();
    prepareQuiz({ preserveForce: true, forceAll: state.quizForceAll });
  });

  els.quizTimerToggle?.addEventListener("change", (event) => {
    state.quizTimerEnabled = event.target.checked;
    persistQuizSettings();
    startQuizCardTimer();
  });

  els.quizRequeueToggle?.addEventListener("change", (event) => {
    state.quizRequeueMissed = event.target.checked;
    persistQuizSettings();
  });

  els.quizCheckTypeBtn?.addEventListener("click", checkTypedQuizAnswer);
  els.quizTypeInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      checkTypedQuizAnswer();
    }
  });

  els.quizReviewMissedBtn?.addEventListener("click", reviewMissedQuiz);
  els.quizNewSessionBtn?.addEventListener("click", () =>
    prepareQuiz({ forceAll: state.quizForceAll }),
  );
  els.quizPrintBtn?.addEventListener("click", buildPrintExamSheet);

  els.exportBtn?.addEventListener("click", exportBackup);
  els.importFileInput?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) importBackup(file);
    event.target.value = "";
  });

  els.modalRoot?.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-modal]")) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && els.modalRoot && !els.modalRoot.hidden) {
      closeModal();
      return;
    }

    if (state.activePage !== "quiz" || (els.modalRoot && !els.modalRoot.hidden)) return;
    if (isTypingTarget(event.target) && state.quizMode !== "type") return;

    if (event.key === " " || event.code === "Space") {
      event.preventDefault();
      if (!currentQuizItem()) return;
      if (state.quizMode === "mcq") return;
      if (state.quizMode === "type" && !state.quizTypeChecked) return;
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
  attachListeners();

  applyQuizSettingsFromState();
  renderCategoryButtons();
  populateQuizScopeSelect();
  populateQuizCategorySelect();
  syncQuizControlsFromState();
  if (els.quizScopeSelect) els.quizScopeSelect.value = state.quizScope;

  const page = new URL(window.location.href).searchParams.get("page");
  switchPage(page && document.getElementById(page) ? page : "home", {
    updateHistory: false,
  });

  renderHomeStats();
  renderVocabulary();
  renderTopics();
  renderFavorites();
  try {
    prepareQuiz({ preserveForce: true });
  } catch (error) {
    console.error("Quiz setup failed", error);
  }
  renderQuote();
};

init().catch((error) => {
  console.error("App failed to start", error);
  attachListeners();
});
