import "./styles.css";
import { registerSW } from "virtual:pwa-register";
import { formatDate, fadeText } from "./components/helpers.js";
import {
  STORAGE,
  CATEGORIES,
  readStringList,
  writeJson,
  mergeVocabulary,
  mergeTopics,
  mergeIdioms,
  upsertCustomWord,
  softDeleteWord,
  upsertCustomTopic,
  softDeleteTopic,
  upsertCustomIdiom,
  softDeleteIdiom,
  idiomToQuizItem,
  getDueWords,
  gradeWord,
  buildExportPayload,
  applyImportPayload,
  readQuizSettings,
  saveQuizSettings,
  getWeakWords,
  getStudyStreakInfo,
  recordStudyActivity,
  getTopicsForWord,
  getMissingTopicWords,
  getMissingTopicIdioms,
  resolveTopicIdioms,
  shouldRemindBackup,
  markBackupExported,
  recordSpeakingPractice,
  getSpeakingPracticeFor,
  appendStudyEvent,
  parseVocabularyCsv,
  importVocabularyWords,
  getWritingResponsesForTopic,
  saveWritingResponse,
} from "./components/storage.js";
import {
  escapeHtml,
  categoryClass,
  iconSpeak,
  iconStar,
  iconChevron,
  iconShare,
} from "./components/dom.js";
import { speakWord, unlockAudio } from "./components/speech.js";
import { formatWordShare, formatTopicShare, formatIdiomShare, shareContent } from "./components/share.js";
import { buildClozePrompt } from "./components/cloze.js";
import { MOTIVATION_QUOTES, LESSON_TEMPLATE, IDIOM_TEMPLATE, state } from "./state.js";
import { renderProgressPage, renderHomeWeekStrip } from "./pages/progress.js";
import { EMPTY_FLOURISH, emptyStateWithFiltersHint } from "./ui/empty.js";
import { vocabularyData as seedVocabulary } from "./data/vocabulary.js";
import { topicData as seedTopics } from "./data/topics.js";
import { idiomData as seedIdioms } from "./data/idioms.js";


const els = {
  globalSearchInput: document.getElementById("globalSearchInput"),
  navLinks: document.querySelectorAll(".nav-link"),
  pages: document.querySelectorAll(".page"),
  themeToggle: document.getElementById("themeToggle"),
  newQuoteBtn: document.getElementById("newQuoteBtn"),
  motivationQuote: document.getElementById("motivationQuote"),
  homeTotalWords: document.getElementById("homeTotalWords"),
  homeTotalTopics: document.getElementById("homeTotalTopics"),
  homeTotalIdioms: document.getElementById("homeTotalIdioms"),
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
  idiomGrid: document.getElementById("idiomGrid"),
  idiomResultsText: document.getElementById("idiomResultsText"),
  idiomFavoriteToggle: document.getElementById("idiomFavoriteToggle"),
  addIdiomBtn: document.getElementById("addIdiomBtn"),
  idiomTemplateBtn: document.getElementById("idiomTemplateBtn"),
  favoriteVocabGrid: document.getElementById("favoriteVocabGrid"),
  favoriteTopicGrid: document.getElementById("favoriteTopicGrid"),
  favoriteIdiomGrid: document.getElementById("favoriteIdiomGrid"),
  quizStatusText: document.getElementById("quizStatusText"),
  quizProgressText: document.getElementById("quizProgressText"),
  quizCard: document.getElementById("quizCard"),
  quizEmpty: document.getElementById("quizEmpty"),
  quizEmptyRestartBtn: document.getElementById("quizEmptyRestartBtn"),
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
  quizSettingsToggle: document.getElementById("quizSettingsToggle"),
  quizToolbarPanel: document.getElementById("quizToolbarPanel"),
  homeStudyStreak: document.getElementById("homeStudyStreak"),
  homeWeakWords: document.getElementById("homeWeakWords"),
  homeWeakWordsList: document.getElementById("homeWeakWordsList"),
  homeReviewWeakBtn: document.getElementById("homeReviewWeakBtn"),
  topicTemplateBtn: document.getElementById("topicTemplateBtn"),
  navMoreBtn: document.getElementById("navMoreBtn"),
  navMoreMenu: document.getElementById("navMoreMenu"),
  siteChrome: document.getElementById("siteChrome"),
  exportBtn: document.getElementById("exportBtn"),
  importFileInput: document.getElementById("importFileInput"),
  importModeSelect: document.getElementById("importModeSelect"),
  importStatus: document.getElementById("importStatus"),
  modalRoot: document.getElementById("modalRoot"),
  modalTitle: document.getElementById("modalTitle"),
  modalBody: document.getElementById("modalBody"),
  appBanner: document.getElementById("appBanner"),
  offlineBanner: document.getElementById("offlineBanner"),
  restoreBuiltInBtn: document.getElementById("restoreBuiltInBtn"),
  homeWeekStrip: document.getElementById("homeWeekStrip"),
  progressRoot: document.getElementById("progress"),
  csvImportInput: document.getElementById("csvImportInput"),
  csvImportStatus: document.getElementById("csvImportStatus"),
  quizListenBtn: document.getElementById("quizListenBtn"),
};

const favoriteWords = new Set(readStringList(STORAGE.favoritesWords));
const favoriteTopics = new Set(readStringList(STORAGE.favoritesTopics));
const favoriteIdioms = new Set(readStringList(STORAGE.favoritesIdioms));
const completedTopics = new Set(readStringList(STORAGE.completedTopics));
const completedIdioms = new Set(readStringList(STORAGE.completedIdioms));

let baseVocabulary = [];
let baseTopics = [];
let baseIdioms = [];
let vocabularyData = [];
let topicData = [];
let idiomData = [];
let speakingTimerId = null;
let lastModalActiveElement = null;
let modalTrapKeydown = null;
let lastNavMoreActiveElement = null;
let navMoreTrapKeydown = null;

const clearSpeakingTimer = () => {
  if (speakingTimerId) {
    clearInterval(speakingTimerId);
    speakingTimerId = null;
  }
};

const getFocusableElements = (container) => {
  if (!(container instanceof HTMLElement)) return [];
  const focusables = Array.from(
    container.querySelectorAll(
      [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(","),
    ),
  ).filter((el) => {
    const style = window.getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none";
  });
  return focusables;
};

const enableModalFocusTrap = () => {
  if (!els.modalRoot) return;

  const panel = els.modalRoot.querySelector(".modal__panel");
  if (!panel) return;

  // Ensure tabbing stays inside the dialog.
  modalTrapKeydown = (event) => {
    if (event.key !== "Tab") return;
    if (els.modalRoot.hidden) return;

    const focusables = getFocusableElements(panel);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || !panel.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  document.addEventListener("keydown", modalTrapKeydown);
};

const disableModalFocusTrap = () => {
  if (modalTrapKeydown) {
    document.removeEventListener("keydown", modalTrapKeydown);
    modalTrapKeydown = null;
  }
};

const enableNavMoreFocusTrap = () => {
  if (!els.navMoreMenu) return;
  if (els.navMoreMenu.hidden) return;

  const panel = els.navMoreMenu;
  navMoreTrapKeydown = (event) => {
    if (event.key !== "Tab") return;
    if (panel.hidden) return;

    const focusables = getFocusableElements(panel);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || !panel.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  document.addEventListener("keydown", navMoreTrapKeydown);
};

const disableNavMoreFocusTrap = () => {
  if (navMoreTrapKeydown) {
    document.removeEventListener("keydown", navMoreTrapKeydown);
    navMoreTrapKeydown = null;
  }
};

const speakWordFromUi = async (word, button) => {
  const target = button instanceof HTMLElement ? button : null;
  target?.classList.add("is-speaking");
  target?.setAttribute("aria-busy", "true");
  try {
    await speakWord(word);
  } finally {
    target?.classList.remove("is-speaking");
    target?.removeAttribute("aria-busy");
  }
};

const showToast = (message, isError = false) => {
  let toast = document.getElementById("speakToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "speakToast";
    toast.className = "speak-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.setAttribute("aria-atomic", "true");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle("is-error", isError);
  toast.classList.add("is-visible");
  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3200);
};

const shareItem = async (kind, payload) => {
  const title =
    kind === "topic" ? payload.title : kind === "idiom" ? payload.idiom : payload.word;
  const text =
    kind === "topic"
      ? formatTopicShare(payload)
      : kind === "idiom"
        ? formatIdiomShare(payload)
        : formatWordShare(payload);
  const result = await shareContent({ title: `IMX · ${title}`, text });
  if (result === "copied") showToast("Copied to clipboard");
  else if (result === "failed") showToast("Could not share", true);
};

const focusTopicByTitle = (title) => {
  switchPage("topics", { replace: false });
  state.searchTerm = "";
  state.topicFavoritesOnly = false;
  if (els.globalSearchInput) els.globalSearchInput.value = "";
  if (els.topicFavoriteToggle) els.topicFavoriteToggle.classList.remove("active");
  renderTopics();
  requestAnimationFrame(() => {
    const match = [...document.querySelectorAll(".topic-card")].find(
      (card) => card.dataset.title === title,
    );
    if (!match) return;
    match.classList.add("is-open");
    match.querySelector(".topic-card__header")?.setAttribute("aria-expanded", "true");
    match.scrollIntoView({ behavior: "smooth", block: "center" });
  });
};

const openWordDetail = (item) => {
  if (!item) return;
  const related = getTopicsForWord(item.word, topicData);
  openModal(item.word, `
    <div class="word-detail">
      ${item.pronunciation ? `<p class="pronunciation">/${escapeHtml(item.pronunciation)}/</p>` : ""}
      <p><strong>Meaning:</strong> ${escapeHtml(item.meaning)}</p>
      <p><strong>Synonym:</strong> ${escapeHtml(item.synonym || "—")}</p>
      <p><strong>Antonym:</strong> ${escapeHtml(item.antonym || "—")}</p>
      <p><strong>Example:</strong> ${escapeHtml(item.sentence || "—")}</p>
      ${item.notes ? `<p><strong>Notes:</strong> ${escapeHtml(item.notes)}</p>` : ""}
      ${
        Array.isArray(item.tags) && item.tags.length
          ? `<p><strong>Tags:</strong> ${item.tags.map((t) => escapeHtml(t)).join(", ")}</p>`
          : ""
      }
      ${
        related.length
          ? `<p class="appears-in"><strong>Appears in:</strong> ${related
              .map(
                (topic) =>
                  `<button type="button" class="link-btn" data-open-topic="${escapeHtml(topic.title)}">${escapeHtml(topic.title)}</button>`,
              )
              .join(", ")}</p>`
          : `<p class="appears-in muted">Not linked to a topic yet.</p>`
      }
      <div class="form-actions">
        <button type="button" class="ghost-btn" data-share-word>Share</button>
        <button type="button" class="primary-btn" data-edit-word>Edit</button>
      </div>
    </div>
  `);
  els.modalBody.querySelector("[data-share-word]")?.addEventListener("click", () => shareItem("word", item));
  els.modalBody.querySelector("[data-edit-word]")?.addEventListener("click", () => openWordModal(item));
  els.modalBody.querySelectorAll("[data-open-topic]").forEach((button) => {
    button.addEventListener("click", () => {
      closeModal();
      focusTopicByTitle(button.dataset.openTopic);
    });
  });
};


const saveFavorites = () => {
  writeJson(STORAGE.favoritesWords, [...favoriteWords]);
  writeJson(STORAGE.favoritesTopics, [...favoriteTopics]);
  writeJson(STORAGE.favoritesIdioms, [...favoriteIdioms]);
};

const saveCompletedTopics = () => {
  writeJson(STORAGE.completedTopics, [...completedTopics]);
};

const saveCompletedIdioms = () => {
  writeJson(STORAGE.completedIdioms, [...completedIdioms]);
};

const isTopicCompleted = (topic) => completedTopics.has(topic.title);

const isIdiomCompleted = (idiom) => completedIdioms.has(idiom.idiom);

const toggleTopicCompleted = (title) => {
  if (completedTopics.has(title)) completedTopics.delete(title);
  else {
    completedTopics.add(title);
    appendStudyEvent({ type: "topic_completed", meta: { title } });
  }
  saveCompletedTopics();
};

const toggleIdiomCompleted = (idiomPhrase) => {
  if (completedIdioms.has(idiomPhrase)) completedIdioms.delete(idiomPhrase);
  else {
    completedIdioms.add(idiomPhrase);
    appendStudyEvent({ type: "idiom_completed", meta: { idiom: idiomPhrase } });
  }
  saveCompletedIdioms();
};

const rebuildLibrary = () => {
  vocabularyData = mergeVocabulary(baseVocabulary);
  topicData = mergeTopics(baseTopics);
  idiomData = mergeIdioms(baseIdioms);
};

const refreshProgressViews = () => {
  if (els.progressRoot) renderProgressPage(els.progressRoot);
  renderHomeWeekStrip(els.homeWeekStrip, {
    onOpenProgress: () => switchPage("progress", { replace: false }),
  });
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
  renderHomeWeakWords();
  refreshProgressViews();
  renderVocabulary();
  renderTopics();
  renderIdioms();
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
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", isLight ? "#f6f3f1" : "#12100e");
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
  els.navLinks.forEach((button) => {
    if (!button.dataset.page) return;
    button.classList.toggle("active", button.dataset.page === page);
  });
  closeNavMore();
  if (updateHistory) updateUrlState(page, { replace });
  if (page === "quiz") {
    try {
      prepareQuiz({ preserveForce: true });
    } catch (error) {
      console.error("Quiz setup failed", error);
    }
  }
  if (page === "progress") refreshProgressViews();
  if (page === "home") {
    renderHomeStats();
    renderHomeWeakWords();
    refreshProgressViews();
  }
  syncQuizFocusMode();
};

const closeNavMore = () => {
  if (!els.navMoreBtn || !els.navMoreMenu) return;
  els.navMoreMenu.hidden = true;
  els.navMoreBtn.setAttribute("aria-expanded", "false");
  disableNavMoreFocusTrap();
  if (lastNavMoreActiveElement && typeof lastNavMoreActiveElement.focus === "function") {
    lastNavMoreActiveElement.focus();
  }
  lastNavMoreActiveElement = null;
};

const toggleNavMore = () => {
  if (!els.navMoreBtn || !els.navMoreMenu) return;
  const currentlyOpen = !els.navMoreMenu.hidden;
  if (currentlyOpen) {
    closeNavMore();
    return;
  }

  lastNavMoreActiveElement = document.activeElement;
  els.navMoreMenu.hidden = false;
  els.navMoreBtn.setAttribute("aria-expanded", "true");

  enableNavMoreFocusTrap();
  const focusables = getFocusableElements(els.navMoreMenu);
  const first = focusables[0];
  first?.focus();
};

const setQuizSettingsOpen = (open) => {
  if (!els.quizToolbarPanel || !els.quizSettingsToggle) return;
  els.quizToolbarPanel.hidden = !open;
  els.quizSettingsToggle.setAttribute("aria-expanded", String(open));
};

const syncQuizFocusMode = () => {
  const quizPage = document.getElementById("quiz");
  if (!quizPage) return;
  const summaryVisible = Boolean(els.quizSummary && !els.quizSummary.hidden);
  const inSession =
    state.activePage === "quiz" && Boolean(currentQuizItem()) && !summaryVisible;
  quizPage.classList.toggle("is-focus", inSession);
  if (inSession) setQuizSettingsOpen(false);
};

const updateScrollChrome = () => {
  document.body.classList.toggle("is-scrolled", window.scrollY > 24);
};

const closeModal = () => {
  clearSpeakingTimer();
  disableModalFocusTrap();
  els.modalRoot.hidden = true;
  els.modalBody.innerHTML = "";
  state.editingWord = null;
  state.editingTopic = null;
  // Restore keyboard focus to where the user opened the modal.
  lastModalActiveElement?.focus?.();
  lastModalActiveElement = null;
};

const openModal = (title, bodyHtml) => {
  els.modalTitle.textContent = title;
  els.modalBody.innerHTML = bodyHtml;
  lastModalActiveElement = document.activeElement;
  els.modalRoot.hidden = false;
  const firstField = els.modalBody.querySelector("input, textarea, select");
  firstField?.focus();
  enableModalFocusTrap();
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
    notes: "",
    tags: [],
    category: "Learning",
  };
  const tagsValue = Array.isArray(values.tags) ? values.tags.join(", ") : String(values.tags || "");

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
      <label class="full">Tags (comma-separated)<input name="tags" value="${escapeHtml(tagsValue)}" placeholder="formal, exam, work" /></label>
      <label class="full">Personal notes<textarea name="notes" rows="2">${escapeHtml(values.notes || "")}</textarea></label>
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

const openTopicModal = (item = null, { fromTemplate = false } = {}) => {
  state.editingTopic = item?.title || null;
  const values = item || {
    title: "",
    date: new Date().toISOString().slice(0, 10),
    summary: "",
    notes: "",
    vocabulary: [],
    idioms: [],
    questions: [],
  };

  openModal(item ? "Edit topic" : fromTemplate ? "New lesson from template" : "Add topic", `
    <form id="topicForm" class="form-grid">
      <label class="full">Title<input name="title" required value="${escapeHtml(values.title)}" placeholder="Your discussion title" /></label>
      <label>Date<input name="date" type="date" required value="${escapeHtml(values.date)}" /></label>
      <label class="full">Summary<textarea name="summary" rows="3" required>${escapeHtml(values.summary)}</textarea></label>
      <label class="full">Notes<textarea name="notes" rows="2">${escapeHtml(values.notes)}</textarea></label>
      <label class="full">Vocabulary words (comma-separated, ~10)<textarea name="vocabulary" rows="2">${escapeHtml(
        (values.vocabulary || []).join(", "),
      )}</textarea></label>
      <p id="topicVocabHint" class="form-hint full" hidden></p>
      <label class="full">Idioms / phrases (one per line, ~5)<textarea name="idioms" rows="3">${escapeHtml(
        (values.idioms || []).join("\n"),
      )}</textarea></label>
      <p id="topicIdiomHint" class="form-hint full" hidden></p>
      <label class="full">Discussion questions (one per line)<textarea name="questions" rows="3">${escapeHtml(
        (values.questions || []).join("\n"),
      )}</textarea></label>
      <div class="form-actions full">
        <button type="button" class="ghost-btn" data-close-modal>Cancel</button>
        <button type="submit" class="primary-btn">Save topic</button>
      </div>
    </form>
  `);

  const formEl = els.modalBody.querySelector("#topicForm");
  const vocabField = formEl.querySelector('[name="vocabulary"]');
  const idiomField = formEl.querySelector('[name="idioms"]');
  const hint = formEl.querySelector("#topicVocabHint");
  const idiomHint = formEl.querySelector("#topicIdiomHint");

  const updateMissingHint = () => {
    const listed = String(vocabField.value || "")
      .split(",")
      .map((word) => word.trim())
      .filter(Boolean);
    const known = new Set(vocabularyData.map((entry) => entry.word.toLowerCase()));
    const missing = listed.filter((word) => !known.has(word.toLowerCase()));
    if (!missing.length) {
      hint.hidden = true;
      hint.textContent = "";
    } else {
      hint.hidden = false;
      hint.textContent = `Missing from vocabulary library: ${missing.join(", ")}. You can still save, then add them later.`;
    }

    const idiomListed = String(idiomField.value || "")
      .split("\n")
      .map((phrase) => phrase.trim())
      .filter(Boolean);
    const knownIdioms = new Set(idiomData.map((entry) => entry.idiom.toLowerCase()));
    const missingIdioms = idiomListed.filter((phrase) => !knownIdioms.has(phrase.toLowerCase()));
    if (!missingIdioms.length) {
      idiomHint.hidden = true;
      idiomHint.textContent = "";
    } else {
      idiomHint.hidden = false;
      idiomHint.textContent = `Missing from idiom library: ${missingIdioms.join(", ")}. Add full definitions in src/data/idioms.js (or ask me).`;
    }
  };

  vocabField.addEventListener("input", updateMissingHint);
  idiomField.addEventListener("input", updateMissingHint);
  updateMissingHint();

  formEl.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const listed = String(payload.vocabulary || "")
      .split(",")
      .map((word) => word.trim())
      .filter(Boolean);
    const known = new Set(vocabularyData.map((entry) => entry.word.toLowerCase()));
    const missing = listed.filter((word) => !known.has(word.toLowerCase()));
    if (missing.length) {
      const proceed = confirm(
        `These words are not in your vocabulary library yet:\n\n${missing.join(", ")}\n\nSave topic anyway?`,
      );
      if (!proceed) return;
    }
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
      if (missing.length) {
        showToast(`Saved. Add ${missing.length} missing word${missing.length === 1 ? "" : "s"} when ready.`);
      }
    } catch (error) {
      alert(error.message || "Could not save topic");
    }
  });
};

const openTopicFromTemplate = () => {
  openTopicModal(
    {
      ...LESSON_TEMPLATE,
      date: new Date().toISOString().slice(0, 10),
    },
    { fromTemplate: true },
  );
};

const openIdiomModal = (item = null, { fromTemplate = false } = {}) => {
  state.editingIdiom = item?.idiom || null;
  const values = item || {
    idiom: "",
    date: new Date().toISOString().slice(0, 10),
    meaning: "",
    pronunciation: "",
    example: "",
    usage: "",
    summary: "",
    notes: "",
    questions: [],
  };

  openModal(item ? "Edit idiom" : fromTemplate ? "New idiom from template" : "Add idiom", `
    <form id="idiomForm" class="form-grid">
      <label class="full">Idiom<input name="idiom" required value="${escapeHtml(values.idiom)}" placeholder="Break the ice" /></label>
      <label>Date<input name="date" type="date" required value="${escapeHtml(values.date)}" /></label>
      <label>Pronunciation<input name="pronunciation" value="${escapeHtml(values.pronunciation || "")}" placeholder="breɪk ði aɪs" /></label>
      <label class="full">Meaning<textarea name="meaning" rows="2" required>${escapeHtml(values.meaning)}</textarea></label>
      <label class="full">Example sentence<textarea name="example" rows="2">${escapeHtml(values.example || "")}</textarea></label>
      <label class="full">Usage notes<textarea name="usage" rows="2">${escapeHtml(values.usage || "")}</textarea></label>
      <label class="full">Summary<textarea name="summary" rows="2">${escapeHtml(values.summary || "")}</textarea></label>
      <label class="full">Personal notes<textarea name="notes" rows="2">${escapeHtml(values.notes || "")}</textarea></label>
      <label class="full">Discussion questions (one per line)<textarea name="questions" rows="4" required>${escapeHtml(
        (values.questions || []).join("\n"),
      )}</textarea></label>
      <div class="form-actions full">
        <button type="button" class="ghost-btn" data-close-modal>Cancel</button>
        <button type="submit" class="primary-btn">Save idiom</button>
      </div>
    </form>
  `);

  els.modalBody.querySelector("#idiomForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const previousIdiom = state.editingIdiom;
      const saved = upsertCustomIdiom(payload, { previousIdiom });
      if (previousIdiom && previousIdiom !== saved.idiom && favoriteIdioms.has(previousIdiom)) {
        favoriteIdioms.delete(previousIdiom);
        favoriteIdioms.add(saved.idiom);
        saveFavorites();
      }
      if (previousIdiom && previousIdiom !== saved.idiom && completedIdioms.has(previousIdiom)) {
        completedIdioms.delete(previousIdiom);
        completedIdioms.add(saved.idiom);
        saveCompletedIdioms();
      }
      closeModal();
      refreshAll();
    } catch (error) {
      alert(error.message || "Could not save idiom");
    }
  });
};

const openIdiomFromTemplate = () => {
  openIdiomModal(
    {
      ...IDIOM_TEMPLATE,
      date: new Date().toISOString().slice(0, 10),
    },
    { fromTemplate: true },
  );
};

const showAppBanner = (message, { variant = "info" } = {}) => {
  if (!els.appBanner) return;
  els.appBanner.textContent = message;
  els.appBanner.hidden = false;
  els.appBanner.dataset.variant = variant;
};

const hideAppBanner = () => {
  if (!els.appBanner) return;
  els.appBanner.hidden = true;
  els.appBanner.textContent = "";
};

const clearViewFilters = () => {
  state.searchTerm = "";
  state.vocabFavoritesOnly = false;
  state.topicFavoritesOnly = false;
  state.idiomFavoritesOnly = false;
  state.vocabCategory = "All";
  if (els.globalSearchInput) els.globalSearchInput.value = "";
  els.vocabFavoriteToggle?.classList.remove("active");
  els.topicFavoriteToggle?.classList.remove("active");
  els.idiomFavoriteToggle?.classList.remove("active");
  renderCategoryButtons();
  renderVocabulary();
  renderTopics();
  renderIdioms();
  renderFavorites();
};

const restoreBuiltInLibrary = () => {
  writeJson(STORAGE.deletedWords, []);
  writeJson(STORAGE.deletedTopics, []);
  writeJson(STORAGE.deletedIdioms, []);
  refreshAll();
  hideAppBanner();
  if (els.importStatus) {
    els.importStatus.textContent = "Built-in words, topics, and idioms restored.";
  }
};

const loadData = async () => {
  try {
    baseVocabulary = Array.isArray(seedVocabulary) ? seedVocabulary : [];
    baseTopics = Array.isArray(seedTopics) ? seedTopics : [];
    baseIdioms = Array.isArray(seedIdioms) ? seedIdioms : [];
    if (!baseVocabulary.length || !baseTopics.length) {
      throw new Error("Built-in library files loaded empty");
    }
    rebuildLibrary();

    if (vocabularyData.length === 0 && baseVocabulary.length > 0) {
      showAppBanner(
        "Your deletion list hides the full built-in library. Restore it anytime from Data.",
        { variant: "info" },
      );
    } else {
      hideAppBanner();
    }
    return true;
  } catch (error) {
    console.error(error);
    showAppBanner(
      "Could not load the vocabulary library. Check the browser console, then hard-refresh.",
      { variant: "error" },
    );
    baseVocabulary = [];
    baseTopics = [];
    baseIdioms = [];
    vocabularyData = [];
    topicData = [];
    idiomData = [];
    return false;
  }
};

const renderCategoryButtons = () => {
  if (!els.vocabCategoryButtons) return;
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
        item.notes,
        item.category,
        ...(Array.isArray(item.tags) ? item.tags : []),
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
  const related = getTopicsForWord(item.word, topicData);
  const hasExtra =
    !compact && Boolean(item.synonym || item.antonym || item.wordFamily);

  card.innerHTML = `
    <div class="card-top">
      <div class="card-title">
        <h3><button type="button" class="word-title-btn">${word}</button></h3>
        <div class="category-pill ${catClass}">${escapeHtml(item.category)}</div>
      </div>
      <div class="card-actions">
        <button type="button" class="icon-btn speak-btn" aria-label="Pronounce ${word}">${iconSpeak}</button>
        <button type="button" class="icon-btn share-btn" aria-label="Share ${word}">${iconShare}</button>
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
      <span class="meta-line">Example</span>
      <span class="meta-value">“${escapeHtml(item.sentence || "—")}”</span>
      ${
        hasExtra
          ? `<div class="vocab-details" hidden>
              <span class="meta-line">Synonym</span>
              <span class="meta-value">${escapeHtml(item.synonym || "—")}</span>
              <span class="meta-line">Antonym</span>
              <span class="meta-value">${escapeHtml(item.antonym || "—")}</span>
              <span class="meta-line">Word Family</span>
              <span class="meta-value">${escapeHtml(item.wordFamily || "—")}</span>
            </div>
            <button type="button" class="ghost-btn vocab-more-btn" aria-expanded="false">More details</button>`
          : ""
      }
    `
    }
    ${
      related.length
        ? `<p class="appears-in"><span class="meta-line">Appears in</span> ${related
            .slice(0, 3)
            .map(
              (topic) =>
                `<button type="button" class="link-btn topic-link-btn" data-topic="${escapeHtml(topic.title)}">${escapeHtml(topic.title)}</button>`,
            )
            .join(", ")}${related.length > 3 ? ` +${related.length - 3}` : ""}</p>`
        : ""
    }
    </div>
    <div class="card-footer-actions">
      <button type="button" class="ghost-btn edit-btn">Edit</button>
      <button type="button" class="danger-btn delete-btn">Delete</button>
    </div>
  `;

  card.querySelector(".word-title-btn")?.addEventListener("click", () => openWordDetail(item));
  card.querySelector(".speak-btn").addEventListener("click", (event) => {
    speakWordFromUi(item.word, event.currentTarget);
  });
  card.querySelector(".share-btn")?.addEventListener("click", () => shareItem("word", item));
  card.querySelector(".favorite-btn").addEventListener("click", () => {
    if (favoriteWords.has(item.word)) favoriteWords.delete(item.word);
    else favoriteWords.add(item.word);
    saveFavorites();
    renderVocabulary();
    renderFavorites();
    renderHomeStats();
  });
  card.querySelectorAll(".topic-link-btn").forEach((button) => {
    button.addEventListener("click", () => focusTopicByTitle(button.dataset.topic));
  });
  const moreBtn = card.querySelector(".vocab-more-btn");
  const details = card.querySelector(".vocab-details");
  moreBtn?.addEventListener("click", () => {
    const willOpen = details.hidden;
    details.hidden = !willOpen;
    moreBtn.setAttribute("aria-expanded", String(willOpen));
    moreBtn.textContent = willOpen ? "Less details" : "More details";
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
  if (!els.vocabGrid || !els.vocabResultsText) return;
  const filtered = filterVocabulary();
  els.vocabGrid.innerHTML = "";
  els.vocabResultsText.textContent = `Showing ${filtered.length} vocabulary words`;

  if (!filtered.length) {
    const fallback = document.createElement("div");
    fallback.className = "empty-state";
    fallback.innerHTML = emptyStateWithFiltersHint(
      vocabularyData.length ? "No vocabulary found" : "Vocabulary not loaded",
      vocabularyData.length
        ? "Try a different search term or category, or add a new word."
        : "Run npm run dev and open the local URL, then hard-refresh.",
      {
        hasLibrary: vocabularyData.length > 0,
        showClear: Boolean(state.searchTerm.trim()) || state.vocabCategory !== "All" || state.vocabFavoritesOnly,
      },
    );
    fallback.querySelector("[data-clear-filters]")?.addEventListener("click", clearViewFilters);
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
      (topic.vocabulary || []).join(" "),
      (topic.idioms || []).join(" "),
      (topic.questions || []).join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });
};


const openSpeakingPractice = (entry) => {
  const title = entry.title || entry.idiom || "Practice";
  const questions = entry.questions?.length
    ? entry.questions
    : ["Talk about this for one minute using your own words."];
  let index = 0;
  let remaining = 75;
  const totalSec = 75;
  const history = getSpeakingPracticeFor(title);

  openModal("Speaking practice", `
    <div class="speaking-practice">
      <p class="speaking-topic">${escapeHtml(title)}</p>
      <p class="speaking-meta">${
        history?.lastPracticed
          ? `Practiced ${history.count || 1}× · last ${escapeHtml(formatDate(history.lastPracticed.slice(0, 10)))}`
          : "First session — speak for about a minute per question."
      }</p>
      <p class="speaking-progress">Question <span id="speakQIndex">1</span> of ${questions.length}</p>
      <div class="speaking-ring-wrap" aria-hidden="true">
        <svg class="speaking-ring" viewBox="0 0 120 120">
          <circle class="speaking-ring__track" cx="60" cy="60" r="52" />
          <circle id="speakRingFill" class="speaking-ring__fill" cx="60" cy="60" r="52" />
        </svg>
        <p id="speakTimer" class="speaking-timer">1:15</p>
      </div>
      <p id="speakPrompt" class="speaking-prompt">${escapeHtml(questions[0])}</p>
      <div class="form-actions speaking-actions">
        <button type="button" class="ghost-btn" id="speakPrevBtn">Previous</button>
        <button type="button" class="ghost-btn" id="speakRestartBtn">Restart timer</button>
        <button type="button" class="primary-btn" id="speakNextBtn">Next</button>
      </div>
      <button type="button" class="success-btn full-width" id="speakDoneBtn">Mark practiced</button>
    </div>
  `);

  const promptEl = els.modalBody.querySelector("#speakPrompt");
  const timerEl = els.modalBody.querySelector("#speakTimer");
  const ringFill = els.modalBody.querySelector("#speakRingFill");
  const indexEl = els.modalBody.querySelector("#speakQIndex");
  const prevBtn = els.modalBody.querySelector("#speakPrevBtn");
  const nextBtn = els.modalBody.querySelector("#speakNextBtn");
  const circumference = 2 * Math.PI * 52;
  if (ringFill) {
    ringFill.style.strokeDasharray = String(circumference);
    ringFill.style.strokeDashoffset = "0";
  }

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const finishSpeaking = () => {
    clearSpeakingTimer();
    recordSpeakingPractice(title);
    recordStudyActivity();
    appendStudyEvent({
      type: "speaking",
      meta: { title, questions: questions.length, minutes: Math.max(2, questions.length) },
    });
    closeModal();
    showToast(`Speaking complete · ${questions.length} question${questions.length === 1 ? "" : "s"}`);
    renderTopics();
    renderIdioms();
    renderHomeStats();
    refreshProgressViews();
  };

  const renderPrompt = () => {
    promptEl.textContent = questions[index];
    indexEl.textContent = String(index + 1);
    prevBtn.disabled = index === 0;
    nextBtn.textContent = index >= questions.length - 1 ? "Finish" : "Next";
  };

  const startTimer = () => {
    clearSpeakingTimer();
    remaining = totalSec;
    timerEl.textContent = formatSeconds(remaining);
    timerEl.classList.remove("is-urgent");
    if (ringFill) ringFill.style.strokeDashoffset = "0";
    speakingTimerId = setInterval(() => {
      remaining -= 1;
      timerEl.textContent = formatSeconds(Math.max(0, remaining));
      timerEl.classList.toggle("is-urgent", remaining <= 10);
      if (ringFill) {
        const progress = (totalSec - Math.max(0, remaining)) / totalSec;
        ringFill.style.strokeDashoffset = String(circumference * progress);
      }
      if (remaining <= 0) clearSpeakingTimer();
    }, 1000);
  };

  prevBtn.addEventListener("click", () => {
    if (index <= 0) return;
    index -= 1;
    renderPrompt();
    startTimer();
  });
  nextBtn.addEventListener("click", () => {
    if (index >= questions.length - 1) {
      finishSpeaking();
      return;
    }
    index += 1;
    renderPrompt();
    startTimer();
  });
  els.modalBody.querySelector("#speakRestartBtn").addEventListener("click", startTimer);
  els.modalBody.querySelector("#speakDoneBtn").addEventListener("click", finishSpeaking);

  renderPrompt();
  startTimer();
};

const openWritingPractice = (topic) => {
  const questions = topic.questions?.length
    ? topic.questions
    : ["Write a short paragraph about this topic using new vocabulary."];
  const saved = getWritingResponsesForTopic(topic.title);

  openModal("Writing prompts", `
    <div class="writing-practice">
      <p class="speaking-topic">${escapeHtml(topic.title)}</p>
      <p class="speaking-meta">Answer each question in your own words. Responses stay on this device.</p>
      <div class="writing-list">
        ${questions
          .map((question, index) => {
            const entry = saved[String(index)] || {};
            return `
              <article class="writing-item" data-index="${index}">
                <p class="writing-question">${escapeHtml(question)}</p>
                <textarea class="writing-input" rows="3" placeholder="Write your response…">${escapeHtml(entry.text || "")}</textarea>
                <div class="writing-grade-row">
                  <label class="select-wrap">
                    <span>Self-grade</span>
                    <select class="writing-grade">
                      <option value="" ${!entry.grade ? "selected" : ""}>—</option>
                      <option value="strong" ${entry.grade === "strong" ? "selected" : ""}>Strong</option>
                      <option value="ok" ${entry.grade === "ok" ? "selected" : ""}>OK</option>
                      <option value="retry" ${entry.grade === "retry" ? "selected" : ""}>Retry</option>
                    </select>
                  </label>
                  <button type="button" class="primary-btn writing-save-btn">Save</button>
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    </div>
  `);

  els.modalBody.querySelectorAll(".writing-item").forEach((item) => {
    item.querySelector(".writing-save-btn")?.addEventListener("click", () => {
      const index = item.dataset.index;
      const textValue = item.querySelector(".writing-input")?.value || "";
      const grade = item.querySelector(".writing-grade")?.value || "";
      saveWritingResponse(topic.title, index, { text: textValue, grade });
      recordStudyActivity();
      appendStudyEvent({
        type: "writing",
        meta: { title: topic.title, index: Number(index), grade, minutes: 4 },
      });
      showToast("Writing saved");
      refreshProgressViews();
    });
  });
};

const renderTopics = () => {
  if (!els.topicGrid || !els.topicResultsText) return;
  const filtered = filterTopics();
  els.topicGrid.innerHTML = "";
  const completedCount = topicData.filter((topic) => isTopicCompleted(topic)).length;
  els.topicResultsText.textContent = `Showing ${filtered.length} daily lessons · ${completedCount} completed`;

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = emptyStateWithFiltersHint(
      topicData.length ? "No topics match your filters" : "Topics not loaded",
      topicData.length
        ? "Try broadening the search term or add a new topic."
        : "Run npm run dev and open the local URL, then hard-refresh.",
      {
        hasLibrary: topicData.length > 0,
        showClear: Boolean(state.searchTerm.trim()) || state.topicFavoritesOnly,
      },
    );
    empty.querySelector("[data-clear-filters]")?.addEventListener("click", clearViewFilters);
    els.topicGrid.appendChild(empty);
    return;
  }

  filtered.forEach((topic, index) => {
    const card = document.createElement("article");
    const isFavorite = favoriteTopics.has(topic.title);
    const isCompleted = isTopicCompleted(topic);
    const missing = getMissingTopicWords(topic, vocabularyData);
    const missingIdioms = getMissingTopicIdioms(topic, idiomData);
    const topicIdiomCount = (topic.idioms || []).length;
    const speaking = getSpeakingPracticeFor(topic.title);
    card.className = `topic-card${isCompleted ? " is-completed" : ""}`;
    card.dataset.title = topic.title;
    const detailsId = `topic-details-${index}`;
    const title = escapeHtml(topic.title);

    const vocabularyCards = topic.vocabulary
      .map((word) => {
        const wordData = vocabularyData.find(
          (item) => item.word.toLowerCase() === word.toLowerCase(),
        );
        if (!wordData) {
          return `
            <div class="mini-vocab-card is-missing">
              <div class="mini-vocab-head">
                <h5>${escapeHtml(word)}</h5>
                <span class="status-pill status-pill--warn">Missing</span>
              </div>
              <p class="mini-vocab-meta"><strong>Meaning:</strong> Not added yet</p>
              <button type="button" class="ghost-btn add-missing-btn" data-missing-word="${escapeHtml(word)}">Add word</button>
            </div>
          `;
        }
        return `
          <div class="mini-vocab-card" data-open-word="${escapeHtml(wordData.word)}">
            <div class="mini-vocab-head">
              <h5><button type="button" class="word-title-btn open-word-btn">${escapeHtml(wordData.word)}</button></h5>
              <button type="button" class="icon-btn mini-speak" data-speak="${escapeHtml(wordData.word)}" aria-label="Pronounce ${escapeHtml(wordData.word)}">${iconSpeak}</button>
            </div>
            <p class="mini-vocab-pron">/${escapeHtml(wordData.pronunciation || "ˈwɜːrd")}/</p>
            <p class="mini-vocab-meta"><strong>Meaning:</strong> ${escapeHtml(wordData.meaning)}</p>
            <p class="mini-vocab-meta"><strong>Example:</strong> ${escapeHtml(wordData.sentence)}</p>
          </div>
        `;
      })
      .join("");

    const idiomCards = (topic.idioms || [])
      .map((phrase, idiomIndex) => {
        const idiom = idiomData.find(
          (item) => item.idiom.toLowerCase() === phrase.toLowerCase(),
        );
        const indexLabel = String(idiomIndex + 1).padStart(2, "0");
        if (!idiom) {
          return `
            <li class="topic-idiom is-missing">
              <span class="topic-idiom__index" aria-hidden="true">${indexLabel}</span>
              <div class="topic-idiom__body">
                <div class="topic-idiom__head">
                  <h5>${escapeHtml(phrase)}</h5>
                  <span class="status-pill status-pill--warn">Missing</span>
                </div>
                <p class="topic-idiom__meaning">Not added to the idiom library yet.</p>
              </div>
            </li>
          `;
        }
        return `
          <li class="topic-idiom">
            <span class="topic-idiom__index" aria-hidden="true">${indexLabel}</span>
            <div class="topic-idiom__body">
              <div class="topic-idiom__head">
                <h5>${escapeHtml(idiom.idiom)}</h5>
                <button type="button" class="icon-btn mini-speak" data-speak="${escapeHtml(idiom.idiom)}" aria-label="Pronounce ${escapeHtml(idiom.idiom)}">${iconSpeak}</button>
              </div>
              ${
                idiom.pronunciation
                  ? `<p class="topic-idiom__pron">/${escapeHtml(idiom.pronunciation)}/</p>`
                  : ""
              }
              <p class="topic-idiom__meaning">${escapeHtml(idiom.meaning)}</p>
              ${
                idiom.example
                  ? `<blockquote class="topic-idiom__example">${escapeHtml(idiom.example)}</blockquote>`
                  : ""
              }
              ${
                idiom.usage
                  ? `<p class="topic-idiom__usage"><span>When to use</span>${escapeHtml(idiom.usage)}</p>`
                  : ""
              }
            </div>
          </li>
        `;
      })
      .join("");

    card.innerHTML = `
      <div class="topic-card__header" role="button" tabindex="0" aria-expanded="false" aria-controls="${detailsId}">
        <div class="topic-headline">
          <p class="topic-eyebrow">${escapeHtml(formatDate(topic.date))}${isCompleted ? " · Completed" : ""}${
            speaking?.count ? ` · Spoken ${speaking.count}×` : ""
          }</p>
          <h3>${title}</h3>
          <div class="topic-badges">
            ${isCompleted ? '<span class="status-pill">Completed</span>' : ""}
            <span class="status-pill">${topic.vocabulary.length} words</span>
            ${
              topicIdiomCount
                ? `<span class="status-pill status-pill--idiom">${topicIdiomCount} idiom${topicIdiomCount === 1 ? "" : "s"}</span>`
                : ""
            }
            ${
              missing.length
                ? `<span class="status-pill status-pill--warn">${missing.length} missing word${missing.length === 1 ? "" : "s"}</span>`
                : ""
            }
            ${
              missingIdioms.length
                ? `<span class="status-pill status-pill--warn">${missingIdioms.length} missing idiom${missingIdioms.length === 1 ? "" : "s"}</span>`
                : ""
            }
          </div>
        </div>
        <div class="topic-card__actions">
          <button type="button" class="icon-btn share-topic-btn" aria-label="Share topic ${title}">${iconShare}</button>
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
        ${
          topicIdiomCount
            ? `<div class="topic-detail-block topic-idioms-block">
          <div class="topic-section-head">
            <p class="topic-section-eyebrow">Phrases</p>
            <h4>Idioms for this lesson</h4>
            <p class="topic-section-note">Practice these while you discuss — meaning first, then try the example aloud.</p>
          </div>
          <ol class="topic-idiom-list">${idiomCards}</ol>
        </div>`
            : ""
        }
        ${topic.notes ? `<div class="topic-detail-block"><h4>Personal Notes</h4><p>${escapeHtml(topic.notes)}</p></div>` : ""}
        ${
          topic.questions.length
            ? `<div class="topic-detail-block"><h4>Discussion Questions</h4><ul>${topic.questions
                .map((question) => `<li>${escapeHtml(question)}</li>`)
                .join("")}</ul></div>`
            : ""
        }
        <div class="card-footer-actions">
          <button type="button" class="primary-btn practice-topic-btn">Practice lesson</button>
          <button type="button" class="ghost-btn exam-topic-btn">Exam session (10)</button>
          <button type="button" class="ghost-btn speaking-topic-btn">Speaking practice</button>
          <button type="button" class="ghost-btn writing-topic-btn">Writing prompts</button>
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

    card.querySelector(".share-topic-btn")?.addEventListener("click", (event) => {
      event.stopPropagation();
      shareItem("topic", topic);
    });

    const toggleButton = card.querySelector(".topic-card__header");
    const setExpanded = (open) => {
      card.classList.toggle("is-open", open);
      toggleButton.setAttribute("aria-expanded", String(open));
    };

    toggleButton.addEventListener("click", (event) => {
      if (event.target.closest(".topic-favorite-btn, .share-topic-btn")) return;
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
        speakWordFromUi(button.dataset.speak, button);
      });
    });

    card.querySelectorAll(".open-word-btn").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const word = button.textContent.trim();
        const wordData = vocabularyData.find(
          (item) => item.word.toLowerCase() === word.toLowerCase(),
        );
        if (wordData) openWordDetail(wordData);
      });
    });

    card.querySelectorAll(".add-missing-btn").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        openWordModal({
          word: button.dataset.missingWord,
          pronunciation: "",
          meaning: "",
          synonym: "",
          antonym: "",
          wordFamily: "",
          sentence: "",
          category: "Learning",
        });
      });
    });

    card.querySelector(".practice-topic-btn").addEventListener("click", () => {
      startTopicQuiz(topic.title);
    });
    card.querySelector(".exam-topic-btn")?.addEventListener("click", () => {
      startTopicExam(topic.title);
    });
    card.querySelector(".speaking-topic-btn")?.addEventListener("click", () => {
      openSpeakingPractice(topic);
    });
    card.querySelector(".writing-topic-btn")?.addEventListener("click", () => {
      openWritingPractice(topic);
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

const filterIdioms = () => {
  const term = state.searchTerm.trim().toLowerCase();
  return idiomData.filter((idiom) => {
    const matchesFavorite =
      !state.idiomFavoritesOnly || favoriteIdioms.has(idiom.idiom);
    if (!matchesFavorite) return false;
    if (!term) return true;
    const haystack = [
      idiom.idiom,
      idiom.meaning,
      idiom.example,
      idiom.usage,
      idiom.summary,
      idiom.notes,
      idiom.date,
      (idiom.questions || []).join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });
};

const renderIdioms = () => {
  if (!els.idiomGrid || !els.idiomResultsText) return;
  const filtered = filterIdioms();
  els.idiomGrid.innerHTML = "";
  const completedCount = idiomData.filter((idiom) => isIdiomCompleted(idiom)).length;
  els.idiomResultsText.textContent = `Showing ${filtered.length} idioms · ${completedCount} completed`;

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = emptyStateWithFiltersHint(
      idiomData.length ? "No idioms match your filters" : "Idioms not loaded",
      idiomData.length
        ? "Try broadening the search term or add a new idiom."
        : "Run npm run dev and open the local URL, then hard-refresh.",
      {
        hasLibrary: idiomData.length > 0,
        showClear: Boolean(state.searchTerm.trim()) || state.idiomFavoritesOnly,
      },
    );
    empty.querySelector("[data-clear-filters]")?.addEventListener("click", clearViewFilters);
    els.idiomGrid.appendChild(empty);
    return;
  }

  filtered.forEach((idiom, index) => {
    const card = document.createElement("article");
    const isFavorite = favoriteIdioms.has(idiom.idiom);
    const isCompleted = isIdiomCompleted(idiom);
    const speaking = getSpeakingPracticeFor(idiom.idiom);
    card.className = `topic-card${isCompleted ? " is-completed" : ""}`;
    card.dataset.idiom = idiom.idiom;
    const detailsId = `idiom-details-${index}`;
    const title = escapeHtml(idiom.idiom);

    card.innerHTML = `
      <div class="topic-card__header" role="button" tabindex="0" aria-expanded="false" aria-controls="${detailsId}">
        <div class="topic-headline">
          <p class="topic-eyebrow">${escapeHtml(formatDate(idiom.date))}${isCompleted ? " · Completed" : ""}${
            speaking?.count ? ` · Spoken ${speaking.count}×` : ""
          }</p>
          <h3>${title}</h3>
          <div class="topic-badges">
            ${isCompleted ? '<span class="status-pill">Completed</span>' : ""}
            <span class="status-pill">Idiom</span>
          </div>
        </div>
        <div class="topic-card__actions">
          <button type="button" class="icon-btn share-idiom-btn" aria-label="Share idiom ${title}">${iconShare}</button>
          <button type="button" class="topic-favorite-btn ${isFavorite ? "is-favorite" : ""}" aria-label="Toggle favorite idiom ${title}" aria-pressed="${isFavorite}">
            ${iconStar(isFavorite)}
          </button>
          <span class="topic-toggle-icon" aria-hidden="true">${iconChevron}</span>
        </div>
      </div>
      <div class="topic-details" id="${detailsId}">
        <div class="topic-detail-block">
          <h4>Meaning</h4>
          <p>${escapeHtml(idiom.meaning)}</p>
          ${
            idiom.pronunciation
              ? `<p class="mini-vocab-pron">/${escapeHtml(idiom.pronunciation)}/</p>`
              : ""
          }
        </div>
        ${
          idiom.example
            ? `<div class="topic-detail-block"><h4>Example</h4><p>${escapeHtml(idiom.example)}</p></div>`
            : ""
        }
        ${
          idiom.usage
            ? `<div class="topic-detail-block"><h4>When to use it</h4><p>${escapeHtml(idiom.usage)}</p></div>`
            : ""
        }
        ${
          idiom.summary
            ? `<div class="topic-detail-block"><h4>Summary</h4><p>${escapeHtml(idiom.summary)}</p></div>`
            : ""
        }
        ${
          idiom.notes
            ? `<div class="topic-detail-block"><h4>Personal Notes</h4><p>${escapeHtml(idiom.notes)}</p></div>`
            : ""
        }
        ${
          idiom.questions.length
            ? `<div class="topic-detail-block"><h4>Discussion Questions</h4><ul>${idiom.questions
                .map((question) => `<li>${escapeHtml(question)}</li>`)
                .join("")}</ul></div>`
            : ""
        }
        <div class="card-footer-actions">
          <button type="button" class="primary-btn practice-idiom-btn">Practice idiom</button>
          <button type="button" class="ghost-btn exam-idiom-btn">Exam session</button>
          <button type="button" class="ghost-btn speaking-idiom-btn">Speaking practice</button>
          <button type="button" class="ghost-btn complete-idiom-btn">${isCompleted ? "Mark incomplete" : "Mark completed"}</button>
          <button type="button" class="ghost-btn edit-idiom-btn">Edit</button>
          <button type="button" class="danger-btn delete-idiom-btn">Delete</button>
        </div>
      </div>
    `;

    card.querySelector(".topic-favorite-btn").addEventListener("click", (event) => {
      event.stopPropagation();
      if (favoriteIdioms.has(idiom.idiom)) favoriteIdioms.delete(idiom.idiom);
      else favoriteIdioms.add(idiom.idiom);
      saveFavorites();
      renderIdioms();
      renderFavorites();
      renderHomeStats();
    });

    card.querySelector(".share-idiom-btn")?.addEventListener("click", (event) => {
      event.stopPropagation();
      shareItem("idiom", idiom);
    });

    const toggleButton = card.querySelector(".topic-card__header");
    const setExpanded = (open) => {
      card.classList.toggle("is-open", open);
      toggleButton.setAttribute("aria-expanded", String(open));
    };

    toggleButton.addEventListener("click", (event) => {
      if (event.target.closest(".topic-favorite-btn, .share-idiom-btn")) return;
      setExpanded(!card.classList.contains("is-open"));
    });
    toggleButton.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setExpanded(!card.classList.contains("is-open"));
      }
    });

    card.querySelector(".practice-idiom-btn").addEventListener("click", () => {
      startIdiomQuiz(idiom.idiom);
    });
    card.querySelector(".exam-idiom-btn")?.addEventListener("click", () => {
      startIdiomExam(idiom.idiom);
    });
    card.querySelector(".speaking-idiom-btn")?.addEventListener("click", () => {
      openSpeakingPractice(idiom);
    });
    card.querySelector(".complete-idiom-btn").addEventListener("click", () => {
      toggleIdiomCompleted(idiom.idiom);
      renderIdioms();
      populateQuizScopeSelect();
      renderHomeStats();
    });
    card.querySelector(".edit-idiom-btn").addEventListener("click", () => openIdiomModal(idiom));
    card.querySelector(".delete-idiom-btn").addEventListener("click", () => {
      if (!confirm(`Delete “${idiom.idiom}”?`)) return;
      softDeleteIdiom(idiom.idiom);
      favoriteIdioms.delete(idiom.idiom);
      completedIdioms.delete(idiom.idiom);
      saveFavorites();
      saveCompletedIdioms();
      refreshAll();
    });

    els.idiomGrid.appendChild(card);
  });
};

const renderFavorites = () => {
  els.favoriteVocabGrid.innerHTML = "";
  els.favoriteTopicGrid.innerHTML = "";
  if (els.favoriteIdiomGrid) els.favoriteIdiomGrid.innerHTML = "";

  const favoriteWordsList = vocabularyData.filter((item) =>
    favoriteWords.has(item.word),
  );
  const favoriteTopicsList = topicData.filter((item) =>
    favoriteTopics.has(item.title),
  );
  const favoriteIdiomsList = idiomData.filter((item) =>
    favoriteIdioms.has(item.idiom),
  );

  if (!favoriteWordsList.length) {
    els.favoriteVocabGrid.innerHTML = `
      <div class="empty-state">
        ${EMPTY_FLOURISH}
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
        ${EMPTY_FLOURISH}
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

  if (els.favoriteIdiomGrid) {
    if (!favoriteIdiomsList.length) {
      els.favoriteIdiomGrid.innerHTML = `
        <div class="empty-state">
          ${EMPTY_FLOURISH}
          <h3>No favorite idioms yet</h3>
          <p>Mark idioms as favorites to save them here.</p>
        </div>
      `;
    } else {
      favoriteIdiomsList.forEach((idiom) => {
        const card = document.createElement("article");
        card.className = "topic-card";
        card.innerHTML = `
          <div class="topic-card__header">
            <div class="topic-headline">
              <p class="topic-eyebrow">${escapeHtml(formatDate(idiom.date))}</p>
              <h3>${escapeHtml(idiom.idiom)}</h3>
            </div>
            <button type="button" class="topic-favorite-btn is-favorite" aria-pressed="true">${iconStar(true)}</button>
          </div>
        `;
        card.querySelector(".topic-favorite-btn").addEventListener("click", () => {
          favoriteIdioms.delete(idiom.idiom);
          saveFavorites();
          renderIdioms();
          renderFavorites();
          renderHomeStats();
        });
        els.favoriteIdiomGrid.appendChild(card);
      });
    }
  }
};

const renderHomeStats = () => {
  els.homeTotalWords.textContent = vocabularyData.length;
  els.homeTotalTopics.textContent = topicData.length;
  if (els.homeTotalIdioms) els.homeTotalIdioms.textContent = idiomData.length;
  els.homeFavoriteWords.textContent = favoriteWords.size;
  const idiomQuizItems = idiomData.map(idiomToQuizItem);
  const dueWords = getDueWords(vocabularyData).length;
  const dueIdioms = getDueWords(idiomQuizItems).length;
  els.homeDueWords.textContent = dueWords + dueIdioms;

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

  renderHomeWeakWords();
};

const renderHomeWeakWords = () => {
  if (!els.homeWeakWords || !els.homeWeakWordsList) return;
  const weak = getWeakWords(vocabularyData, { limit: 6 });
  if (!weak.length) {
    els.homeWeakWords.hidden = true;
    els.homeWeakWordsList.innerHTML = "";
    return;
  }

  els.homeWeakWords.hidden = false;
  els.homeWeakWordsList.innerHTML = weak
    .map(
      (item) =>
        `<li><button type="button" class="link-btn" data-weak-word="${escapeHtml(item.word)}">${escapeHtml(item.word)}</button><span>${escapeHtml(item.meaning)}</span></li>`,
    )
    .join("");

  els.homeWeakWordsList.querySelectorAll("[data-weak-word]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = vocabularyData.find(
        (entry) => entry.word.toLowerCase() === button.dataset.weakWord.toLowerCase(),
      );
      if (item) openWordDetail(item);
    });
  });
};

const startWeakWordsQuiz = () => {
  state.quizScope = "weak";
  state.quizSessionLimit = null;
  if (els.quizScopeSelect) {
    populateQuizScopeSelect();
    els.quizScopeSelect.value = "weak";
  }
  persistQuizSettings();
  switchPage("quiz", { replace: false });
  prepareQuiz({ forceAll: true });
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

  if (state.quizScope === "due") {
    pool = [...vocabularyData, ...idiomData.map(idiomToQuizItem)];
  } else if (state.quizScope === "idioms") {
    pool = idiomData.map(idiomToQuizItem);
  } else if (String(state.quizScope).startsWith("idiom:")) {
    const phrase = state.quizScope.slice("idiom:".length);
    const match = idiomData.find((item) => item.idiom === phrase);
    pool = match ? [idiomToQuizItem(match)] : [];
  } else if (state.quizScope === "favorites") {
    pool = pool.filter((item) => favoriteWords.has(item.word));
  } else if (state.quizScope === "weak") {
    pool = getWeakWords(pool);
  } else if (String(state.quizScope).startsWith("topic:")) {
    const topicTitle = state.quizScope.slice("topic:".length);
    const topic = topicData.find((item) => item.title === topicTitle);
    if (topic) {
      const wanted = new Set(
        (topic.vocabulary || []).map((word) => word.toLowerCase()),
      );
      const wordItems = vocabularyData.filter((item) =>
        wanted.has(item.word.toLowerCase()),
      );
      const idiomItems = resolveTopicIdioms(topic, idiomData).map(idiomToQuizItem);
      pool = [...wordItems, ...idiomItems];
    }
  }

  const idiomScoped =
    state.quizScope === "idioms" || String(state.quizScope).startsWith("idiom:");
  if (
    !idiomScoped &&
    state.quizCategoryFilter &&
    state.quizCategoryFilter !== "All"
  ) {
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
  addOption("idioms", "All idioms");
  addOption("favorites", "Favorites only");
  addOption("weak", "Weak words (recent again)");
  topicData.forEach((topic) => {
    addOption(`topic:${topic.title}`, topic.title);
  });
  idiomData.forEach((idiom) => {
    addOption(`idiom:${idiom.idiom}`, `Idiom: ${idiom.idiom}`);
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
  if (state.quizScope === "idioms") return "All idioms";
  if (state.quizScope === "favorites") return "Favorite words";
  if (state.quizScope === "weak") return "Weak words";
  if (String(state.quizScope).startsWith("topic:")) {
    const title = state.quizScope.slice("topic:".length);
    return state.quizSessionLimit === 10 ? `Topic exam: ${title}` : `Topic: ${title}`;
  }
  if (String(state.quizScope).startsWith("idiom:")) {
    const phrase = state.quizScope.slice("idiom:".length);
    return state.quizSessionLimit ? `Idiom exam: ${phrase}` : `Idiom: ${phrase}`;
  }
  return "Exam practice";
};

const describeQuizMode = () => {
  const modes = {
    flashcard: "Word → meaning",
    reverse: "Meaning → word",
    type: "Type the word",
    mcq: "Pick the word",
    cloze: "Fill the blank",
    listening: "Listen → meaning",
  };
  return modes[state.quizMode] || modes.flashcard;
};

const clearQuizAdvanceTimer = () => {
  if (quizAdvanceTimer) {
    clearTimeout(quizAdvanceTimer);
    quizAdvanceTimer = null;
  }
};

const getQuizShortcutsHint = () => {
  const mode = state.quizMode;
  if (mode === "mcq") return "";
  if (mode === "listening") {
    return state.quizRevealed
      ? "Shortcuts: <kbd>1</kbd> know · <kbd>2</kbd> again"
      : "Shortcuts: <kbd>L</kbd> listen · <kbd>Space</kbd> reveal";
  }
  if (mode === "type" || mode === "cloze") {
    return state.quizTypeChecked
      ? "Shortcuts: <kbd>1</kbd> know · <kbd>2</kbd> again"
      : "Shortcuts: <kbd>Enter</kbd> check answer";
  }
  return "Shortcuts: <kbd>Space</kbd> reveal · <kbd>1</kbd> know · <kbd>2</kbd> again";
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
  const total = state.quizQueue.length;
  if (!total || !currentQuizItem()) {
    els.quizProgressBar.hidden = true;
    return;
  }
  const current = state.quizIndex + 1;
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
  appendStudyEvent({
    type: "quiz_session",
    meta: { known, again, total, mode: state.quizMode, minutes: Math.max(3, Math.round(total * 0.4)) },
  });
  refreshProgressViews();

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
  if (els.quizShortcutsHint) els.quizShortcutsHint.hidden = true;
  syncQuizFocusMode();
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
    if (els.quizShortcutsHint) els.quizShortcutsHint.hidden = true;
    if (els.quizTimerText) els.quizTimerText.hidden = true;
    syncQuizFocusMode();
    return;
  }

  state.quizTypeChecked = false;
  els.quizEmpty.hidden = true;
  els.quizCard.hidden = false;

  const isReverse = mode === "reverse";
  const isType = mode === "type";
  const isMcq = mode === "mcq";
  const isCloze = mode === "cloze";
  const isListening = mode === "listening";
  const isFlashcard = mode === "flashcard";
  const cloze = isCloze ? buildClozePrompt(current) : null;

  if (els.quizPromptLabel) {
    els.quizPromptLabel.textContent =
      isListening ? "Listening" : isReverse || isType || isMcq || isCloze ? "Prompt" : "Word";
  }
  if (els.quizWordRow) {
    els.quizWordRow.hidden =
      isMcq ||
      isCloze ||
      isListening ||
      ((isReverse || isType) && !state.quizRevealed && !state.quizTypeChecked);
  }
  if (els.quizPromptText) {
    if (isListening) {
      els.quizPromptText.hidden = false;
      els.quizPromptText.textContent = state.quizRevealed
        ? current.meaning
        : state.quizListeningHeard
          ? "What does that word mean?"
          : "Play the audio, then guess the meaning.";
    } else {
      els.quizPromptText.hidden = !(isReverse || isType || isMcq || isCloze);
      els.quizPromptText.textContent = isCloze ? cloze.prompt : current.meaning;
    }
  }
  if (els.quizWord) {
    els.quizWord.textContent = isListening && !state.quizRevealed ? "····" : current.word;
  }
  if (els.quizPronunciation) {
    els.quizPronunciation.textContent =
    (isFlashcard || state.quizRevealed) && !isListening
      ? current.pronunciation
        ? `/${current.pronunciation}/`
        : ""
      : isListening && state.quizRevealed && current.pronunciation
        ? `/${current.pronunciation}/`
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

  if (els.quizTypeArea) els.quizTypeArea.hidden = !(isType || isCloze);
  if (els.quizMcqArea) els.quizMcqArea.hidden = !isMcq;
  if ((isType || isCloze) && els.quizTypeInput) {
    els.quizTypeInput.value = "";
    els.quizTypeInput.disabled = false;
    els.quizTypeInput.placeholder = isCloze ? "Type the missing word…" : "Type the word…";
    if (els.quizTypeFeedback) els.quizTypeFeedback.hidden = true;
  }
  if (isMcq) renderQuizMcq(current, pool);

  const showFullAnswer = state.quizRevealed && !isMcq;
  if (els.quizAnswer) els.quizAnswer.hidden = !showFullAnswer;
  if (els.quizListenBtn) {
    els.quizListenBtn.hidden = !isListening;
    els.quizListenBtn.textContent = state.quizListeningHeard ? "Play again" : "Play audio";
  }
  if (els.quizRevealBtn) {
    els.quizRevealBtn.hidden = isMcq || isType || isCloze || state.quizRevealed;
    els.quizRevealBtn.textContent =
      isListening ? "Show answer" : isReverse || isType || isCloze ? "Show word" : "Show answer";
  }
  if (els.quizKnowBtn) {
    els.quizKnowBtn.hidden = isMcq || isType || isCloze || !state.quizRevealed;
  }
  if (els.quizAgainBtn) {
    els.quizAgainBtn.hidden = isMcq || isType || isCloze || !state.quizRevealed;
  }
  if (els.quizSpeakBtn) {
    els.quizSpeakBtn.hidden = isListening || isReverse || isType || isMcq || isCloze;
  }
  if (els.quizAnswerWordRow) {
    els.quizAnswerWordRow.hidden = isFlashcard && !isListening;
  }

  const hint = getQuizShortcutsHint();
  if (els.quizShortcutsHint) {
    els.quizShortcutsHint.hidden = !hint;
    els.quizShortcutsHint.innerHTML = hint;
  }

  if (els.quizStatusText) {
    const remaining = state.quizQueue.length - state.quizIndex;
    els.quizStatusText.textContent = `${describeQuizScope()} · ${describeQuizMode()} · ${remaining} left`;
  }
  if (els.quizProgressText) {
    els.quizProgressText.textContent = `Card ${state.quizIndex + 1} of ${state.quizQueue.length}`;
  }
  updateQuizProgressBar();
  startQuizCardTimer();
  syncQuizFocusMode();

  if ((isType || isCloze) && els.quizTypeInput && !state.quizTypeChecked) {
    requestAnimationFrame(() => els.quizTypeInput.focus());
  }
};

const prepareQuiz = ({ forceAll = false, preserveForce = false, limit = null } = {}) => {
  if (!preserveForce) state.quizForceAll = forceAll;
  else if (forceAll) state.quizForceAll = true;

  if (limit != null) state.quizSessionLimit = limit;
  else if (!preserveForce) state.quizSessionLimit = null;

  hideQuizSummary();
  clearQuizCardTimer();
  clearQuizAdvanceTimer();

  const pool = getQuizWordPool();
  const useAllInScope =
    state.quizForceAll ||
    state.quizScope === "all" ||
    state.quizScope === "idioms" ||
    state.quizScope === "favorites" ||
    state.quizScope === "weak" ||
    String(state.quizScope).startsWith("topic:") ||
    String(state.quizScope).startsWith("idiom:");

  const due = useAllInScope
    ? pool.map((item) => ({ item }))
    : getDueWords(pool);

  state.quizQueue = shuffle(due.map(({ item }) => item));
  const sessionCap = state.quizSessionLimit || QUIZ_SESSION_SIZE;
  if (!useAllInScope || state.quizSessionLimit) {
    state.quizQueue = state.quizQueue.slice(0, sessionCap);
  } else if (
    useAllInScope &&
    !String(state.quizScope).startsWith("topic:") &&
    !String(state.quizScope).startsWith("idiom:")
  ) {
    state.quizQueue = state.quizQueue.slice(0, sessionCap);
  }

  resetQuizSessionStats(state.quizQueue.length);
  state.quizIndex = 0;
  state.quizRevealed = false;
  state.quizListeningHeard = false;
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

const startIdiomQuiz = (idiomPhrase) => {
  state.quizScope = `idiom:${idiomPhrase}`;
  state.quizSessionLimit = null;
  if (els.quizScopeSelect) {
    populateQuizScopeSelect();
    els.quizScopeSelect.value = state.quizScope;
  }
  persistQuizSettings();
  switchPage("quiz", { replace: false });
  prepareQuiz({ forceAll: true });
};

const startIdiomExam = (idiomPhrase) => {
  state.quizScope = "idioms";
  state.quizMode = "flashcard";
  syncQuizControlsFromState();
  if (els.quizScopeSelect) {
    populateQuizScopeSelect();
    els.quizScopeSelect.value = state.quizScope;
  }
  persistQuizSettings();
  switchPage("quiz", { replace: false });
  prepareQuiz({ forceAll: true, limit: Math.min(10, Math.max(1, idiomData.length)) });
};

const reviewMissedQuiz = () => {
  const missedWords = state.quizSessionStats.missed;
  if (!missedWords.length) return;
  const lookup = new Map([
    ...vocabularyData.map((item) => [item.word.toLowerCase(), item]),
    ...idiomData.map((item) => [item.idiom.toLowerCase(), idiomToQuizItem(item)]),
  ]);
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

  clearQuizAdvanceTimer();
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
  appendStudyEvent({
    type: "quiz_grade",
    meta: { word: current.word, knewIt: Boolean(knewIt), mode: state.quizMode },
  });

  if (!knewIt && state.quizRequeueMissed) {
    state.quizQueue.push(current);
  }

  state.quizIndex += 1;
  state.quizRevealed = false;
  state.quizListeningHeard = false;
  renderQuizCard();
  renderHomeStats();
  refreshProgressViews();
};

const checkTypedQuizAnswer = () => {
  const current = currentQuizItem();
  const typingMode = state.quizMode === "type" || state.quizMode === "cloze";
  if (!current || !typingMode || state.quizTypeChecked) return;

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
  if (els.quizWordRow) els.quizWordRow.hidden = false;
  els.quizWord.textContent = current.word;
  els.quizPronunciation.textContent = current.pronunciation
    ? `/${current.pronunciation}/`
    : "";
  els.quizRevealBtn.hidden = true;
  els.quizKnowBtn.hidden = false;
  els.quizAgainBtn.hidden = false;

  if (els.quizShortcutsHint) {
    const hint = getQuizShortcutsHint();
    els.quizShortcutsHint.hidden = !hint;
    els.quizShortcutsHint.innerHTML = hint;
  }

  if (correct) {
    clearQuizAdvanceTimer();
    quizAdvanceTimer = setTimeout(() => {
      quizAdvanceTimer = null;
      advanceQuiz(true);
    }, 650);
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
  renderIdioms();
  const term = state.searchTerm.trim();
  if (term && (state.activePage === "home" || state.activePage === "about" || state.activePage === "data")) {
    const vocabMatches = filterVocabulary().length;
    const topicMatches = filterTopics().length;
    const idiomMatches = filterIdioms().length;
    const best = Math.max(vocabMatches, topicMatches, idiomMatches);
    if (best > 0) {
      const page =
        best === vocabMatches
          ? "vocabulary"
          : best === topicMatches
            ? "topics"
            : "idioms";
      switchPage(page, { replace: true });
    }
  }
};

const exportBackup = () => {
  const payload = buildExportPayload({
    favoriteWords,
    favoriteTopics,
    favoriteIdioms,
    completedTopics,
    completedIdioms,
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
  markBackupExported();
  hideAppBanner();
  showToast("Backup downloaded");
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
    favoriteIdioms.clear();
    readStringList(STORAGE.favoritesIdioms).forEach((idiom) => favoriteIdioms.add(idiom));
    completedTopics.clear();
    readStringList(STORAGE.completedTopics).forEach((title) =>
      completedTopics.add(title),
    );
    completedIdioms.clear();
    readStringList(STORAGE.completedIdioms).forEach((idiom) =>
      completedIdioms.add(idiom),
    );

    refreshAll();
    els.importStatus.textContent = `Import complete (${mode}).`;
  } catch (error) {
    console.error(error);
    els.importStatus.textContent = error.message || "Import failed.";
  }
};

let listenersReady = false;
let searchDebounceTimer = null;
let quizAdvanceTimer = null;

const attachListeners = () => {
  if (listenersReady) return;
  listenersReady = true;
  els.navLinks.forEach((button) => {
    button.addEventListener("click", () => {
      if (!button.dataset.page) return;
      switchPage(button.dataset.page, { replace: false });
    });
  });

  els.navMoreBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleNavMore();
  });

  document.addEventListener("click", (event) => {
    if (!els.navMoreMenu || els.navMoreMenu.hidden) return;
    if (event.target.closest(".nav-more")) return;
    closeNavMore();
  });

  window.addEventListener("scroll", updateScrollChrome, { passive: true });
  updateScrollChrome();

  // Unlock audio on first real user gesture so mobile browsers allow playback.
  const unlockOnce = () => {
    unlockAudio();
    document.removeEventListener("pointerdown", unlockOnce);
    document.removeEventListener("keydown", unlockOnce);
  };
  document.addEventListener("pointerdown", unlockOnce, { once: true });
  document.addEventListener("keydown", unlockOnce, { once: true });

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
    window.clearTimeout(searchDebounceTimer);
    searchDebounceTimer = window.setTimeout(() => {
      applySearch();
    }, 130);
  });

  els.themeToggle?.addEventListener("click", () => {
    const next = document.body.classList.contains("light") ? "dark" : "light";
    applyTheme(next);
    saveTheme();
  });

  els.newQuoteBtn?.addEventListener("click", renderQuote);
  els.addWordBtn?.addEventListener("click", () => openWordModal());
  els.addTopicBtn?.addEventListener("click", () => openTopicModal());
  els.topicTemplateBtn?.addEventListener("click", openTopicFromTemplate);
  els.addIdiomBtn?.addEventListener("click", () => openIdiomModal());
  els.idiomTemplateBtn?.addEventListener("click", openIdiomFromTemplate);
  els.homeReviewWeakBtn?.addEventListener("click", startWeakWordsQuiz);

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

  els.idiomFavoriteToggle?.addEventListener("click", () => {
    state.idiomFavoritesOnly = !state.idiomFavoritesOnly;
    els.idiomFavoriteToggle.classList.toggle("active", state.idiomFavoritesOnly);
    renderIdioms();
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
  els.quizSpeakBtn?.addEventListener("click", (event) => {
    const current = currentQuizItem();
    if (current) speakWordFromUi(current.word, event.currentTarget);
  });
  els.quizRestartBtn?.addEventListener("click", () => prepareQuiz({ forceAll: true }));
  els.quizEmptyRestartBtn?.addEventListener("click", () => prepareQuiz({ forceAll: true }));
  els.quizScopeSelect?.addEventListener("change", (event) => {
    state.quizScope = event.target.value;
    persistQuizSettings();
    prepareQuiz({
      forceAll:
        state.quizScope === "all" ||
        state.quizScope === "idioms" ||
        state.quizScope === "favorites" ||
        state.quizScope === "weak" ||
        String(state.quizScope).startsWith("topic:") ||
        String(state.quizScope).startsWith("idiom:"),
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
  els.quizListenBtn?.addEventListener("click", async (event) => {
    const current = currentQuizItem();
    if (!current || state.quizMode !== "listening") return;
    state.quizListeningHeard = true;
    await speakWordFromUi(current.word, event.currentTarget);
    renderQuizCard();
  });
  els.quizSettingsToggle?.addEventListener("click", () => {
    const open = Boolean(els.quizToolbarPanel?.hidden);
    setQuizSettingsOpen(open);
  });

  els.csvImportInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (els.csvImportStatus) els.csvImportStatus.textContent = "Importing CSV…";
    try {
      const textValue = await file.text();
      const { words, errors } = parseVocabularyCsv(textValue);
      const imported = importVocabularyWords(words);
      refreshAll();
      const errNote = errors.length ? ` · ${errors.length} row warning${errors.length === 1 ? "" : "s"}` : "";
      if (els.csvImportStatus) {
        els.csvImportStatus.textContent = `Imported ${imported} word${imported === 1 ? "" : "s"}${errNote}.`;
      }
      showToast(`Imported ${imported} words from CSV`);
    } catch (error) {
      console.error(error);
      if (els.csvImportStatus) els.csvImportStatus.textContent = error.message || "CSV import failed.";
    }
    event.target.value = "";
  });

  els.restoreBuiltInBtn?.addEventListener("click", () => {
    if (
      !confirm(
        "Restore all built-in words and topics? This clears your deletion list (custom words are kept).",
      )
    ) {
      return;
    }
    restoreBuiltInLibrary();
  });

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
    if (event.key === "Escape") {
      if (els.quizToolbarPanel && !els.quizToolbarPanel.hidden) {
        setQuizSettingsOpen(false);
        return;
      }
      if (els.navMoreMenu && !els.navMoreMenu.hidden) {
        closeNavMore();
        return;
      }
      if (els.modalRoot && !els.modalRoot.hidden) {
        closeModal();
        return;
      }
    }

    if (state.activePage !== "quiz" || (els.modalRoot && !els.modalRoot.hidden)) return;
    if (isTypingTarget(event.target)) return;

    if ((event.key === "l" || event.key === "L") && state.quizMode === "listening") {
      event.preventDefault();
      const current = currentQuizItem();
      if (!current) return;
      state.quizListeningHeard = true;
      speakWordFromUi(current.word, els.quizListenBtn);
      renderQuizCard();
      return;
    }

    if (event.key === " " || event.code === "Space") {
      event.preventDefault();
      if (!currentQuizItem()) return;
      if (state.quizMode === "mcq") return;
      if ((state.quizMode === "type" || state.quizMode === "cloze") && !state.quizTypeChecked) return;
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

  const syncOfflineBanner = () => {
    if (!els.offlineBanner) return;
    const offline = !navigator.onLine;
    els.offlineBanner.hidden = !offline;
  };
  syncOfflineBanner();
  window.addEventListener("online", syncOfflineBanner);
  window.addEventListener("offline", syncOfflineBanner);
};

const maybeRemindBackup = () => {
  if (!shouldRemindBackup({ days: 7 }) || !els.appBanner) return;
  els.appBanner.hidden = false;
  els.appBanner.dataset.variant = "info";
  els.appBanner.innerHTML = `
    <span>Backup reminder: download a JSON export so your custom words, topics, and idioms stay safe.</span>
    <button type="button" class="ghost-btn app-banner__action" data-backup-now>Export now</button>
    <button type="button" class="icon-btn app-banner__dismiss" data-dismiss-banner aria-label="Dismiss">×</button>
  `;
  els.appBanner.querySelector("[data-backup-now]")?.addEventListener("click", () => {
    exportBackup();
    switchPage("data", { replace: false });
  });
  els.appBanner.querySelector("[data-dismiss-banner]")?.addEventListener("click", hideAppBanner);
};

const registerServiceWorker = () => {
  try {
    registerSW({ immediate: true });
  } catch (error) {
    console.warn("Service worker registration failed", error);
  }
};

const init = async () => {
  loadTheme();
  const dataOk = await loadData();
  attachListeners();
  registerServiceWorker();

  applyQuizSettingsToState();
  renderCategoryButtons();
  populateQuizScopeSelect();
  populateQuizCategorySelect();
  syncQuizControlsFromState();
  if (els.quizScopeSelect) els.quizScopeSelect.value = state.quizScope;

  const page = new URL(window.location.href).searchParams.get("page");
  switchPage(page && document.getElementById(page) ? page : "home", {
    updateHistory: false,
  });

  if (dataOk) {
    renderHomeStats();
    renderHomeWeakWords();
    refreshProgressViews();
    renderVocabulary();
    renderTopics();
    renderIdioms();
    renderFavorites();
    try {
      prepareQuiz({ preserveForce: true });
    } catch (error) {
      console.error("Quiz setup failed", error);
    }
    renderQuote();
    maybeRemindBackup();
  } else {
    renderHomeStats();
    refreshProgressViews();
  }
};

init().catch((error) => {
  console.error("App failed to start", error);
  attachListeners();
});
