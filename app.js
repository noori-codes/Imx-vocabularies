import { formatDate, fadeText } from "./components/helpers.js";

const STORAGE_KEY_WORDS = "imx-hub-word-favorites";
const STORAGE_KEY_TOPICS = "imx-hub-topic-favorites";
const STORAGE_KEY_THEME = "imx-hub-theme";

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
};

const globalSearchInput = document.getElementById("globalSearchInput");
const navLinks = document.querySelectorAll(".nav-link");
const pages = document.querySelectorAll(".page");
const themeToggle = document.getElementById("themeToggle");
const newQuoteBtn = document.getElementById("newQuoteBtn");
const motivationQuote = document.getElementById("motivationQuote");
const homeTotalWords = document.getElementById("homeTotalWords");
const homeTotalTopics = document.getElementById("homeTotalTopics");
const homeFavoriteWords = document.getElementById("homeFavoriteWords");
const homeFavoriteTopics = document.getElementById("homeFavoriteTopics");
const vocabCategoryButtons = document.getElementById("vocabCategoryButtons");
const vocabGrid = document.getElementById("vocabGrid");
const vocabResultsText = document.getElementById("vocabResultsText");
const vocabFavoriteToggle = document.getElementById("vocabFavoriteToggle");
const vocabSortSelect = document.getElementById("vocabSortSelect");
const topicGrid = document.getElementById("topicGrid");
const topicResultsText = document.getElementById("topicResultsText");
const topicFavoriteToggle = document.getElementById("topicFavoriteToggle");
const favoriteVocabGrid = document.getElementById("favoriteVocabGrid");
const favoriteTopicGrid = document.getElementById("favoriteTopicGrid");

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const readStoredList = (key) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (error) {
    console.warn(`Could not read localStorage key "${key}"`, error);
    return [];
  }
};

const favoriteWords = new Set(readStoredList(STORAGE_KEY_WORDS));
const favoriteTopics = new Set(readStoredList(STORAGE_KEY_TOPICS));

let vocabularyData = [];
let topicData = [];

const loadData = async () => {
  try {
    const [vocabModule, topicsModule] = await Promise.all([
      import("./data/vocabulary.js"),
      import("./data/topics.js"),
    ]);

    vocabularyData = vocabModule.vocabularyData || [];
    topicData = topicsModule.topicData || [];

    let seeded = false;
    topicData.forEach((topic) => {
      if (topic.favorite && !favoriteTopics.has(topic.title)) {
        favoriteTopics.add(topic.title);
        seeded = true;
      }
    });
    if (seeded) saveFavorites();
  } catch (error) {
    console.error("Failed to load data modules", error);
  }
};

const saveFavorites = () => {
  try {
    localStorage.setItem(STORAGE_KEY_WORDS, JSON.stringify([...favoriteWords]));
    localStorage.setItem(
      STORAGE_KEY_TOPICS,
      JSON.stringify([...favoriteTopics]),
    );
  } catch (error) {
    console.warn("Could not save favorites", error);
  }
};

const applyTheme = (theme) => {
  const isLight = theme === "light";
  document.body.classList.toggle("light", isLight);
  themeToggle.textContent = isLight ? "☀️" : "🌙";
  themeToggle.setAttribute(
    "aria-label",
    isLight ? "Switch to dark theme" : "Switch to light theme",
  );
};

const loadTheme = () => {
  const saved = localStorage.getItem(STORAGE_KEY_THEME);
  applyTheme(saved === "light" ? "light" : "dark");
};

const saveTheme = () => {
  const theme = document.body.classList.contains("light") ? "light" : "dark";
  try {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  } catch (error) {
    console.warn("Could not save theme", error);
  }
};

const updateUrlState = (page, { replace = true } = {}) => {
  const url = new URL(window.location.href);
  url.searchParams.set("page", page);
  if (replace) {
    window.history.replaceState({ page }, "", url);
  } else {
    window.history.pushState({ page }, "", url);
  }
};

const switchPage = (page, { updateHistory = true, replace = true } = {}) => {
  if (!document.getElementById(page)) page = "home";
  state.activePage = page;
  pages.forEach((section) =>
    section.classList.toggle("page--active", section.id === page),
  );
  navLinks.forEach((button) =>
    button.classList.toggle("active", button.dataset.page === page),
  );
  if (updateHistory) updateUrlState(page, { replace });
};

const getUniqueCategories = () => {
  const categories = new Set(vocabularyData.map((item) => item.category));
  return ["All", ...[...categories].sort((a, b) => a.localeCompare(b))];
};

const renderCategoryButtons = () => {
  const categories = getUniqueCategories();
  vocabCategoryButtons.innerHTML = "";

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-btn ${state.vocabCategory === category ? "is-active" : ""}`;
    button.textContent = category;
    button.addEventListener("click", () => {
      state.vocabCategory = category;
      renderCategoryButtons();
      renderVocabulary();
    });
    vocabCategoryButtons.appendChild(button);
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
    .sort((a, b) => {
      return state.vocabSort === "za"
        ? b.word.localeCompare(a.word)
        : a.word.localeCompare(b.word);
    });
};

const renderVocabulary = () => {
  const filtered = filterVocabulary();
  vocabGrid.innerHTML = "";

  vocabResultsText.textContent = `Showing ${filtered.length} vocabulary words`;

  if (!filtered.length) {
    const fallback = document.createElement("div");
    fallback.className = "empty-state";
    fallback.innerHTML = `
      <h3>No vocabulary found</h3>
      <p>Try a different search term or category.</p>
    `;
    vocabGrid.appendChild(fallback);
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement("article");
    card.className = "vocab-card";
    const isFavorite = favoriteWords.has(item.word);
    const word = escapeHtml(item.word);

    card.innerHTML = `
      <div class="card-top">
        <div>
          <h3>${word}</h3>
          <div class="category-pill">${escapeHtml(item.category)}</div>
        </div>
        <button type="button" class="favorite-btn ${isFavorite ? "is-favorite" : ""}" data-word="${word}" aria-label="Toggle favorite ${word}" aria-pressed="${isFavorite}">
          ${isFavorite ? "★" : "☆"}
        </button>
      </div>
      <span class="meta-line">Meaning</span>
      <span class="meta-value">${escapeHtml(item.meaning)}</span>
      <span class="meta-line">Synonym</span>
      <span class="meta-value">${escapeHtml(item.synonym)}</span>
      <span class="meta-line">Antonym</span>
      <span class="meta-value">${escapeHtml(item.antonym)}</span>
      <span class="meta-line">Word Family</span>
      <span class="meta-value">${escapeHtml(item.wordFamily)}</span>
      <span class="meta-line">Example</span>
      <span class="meta-value">“${escapeHtml(item.sentence)}”</span>
    `;

    const button = card.querySelector(".favorite-btn");
    button.addEventListener("click", () => {
      if (favoriteWords.has(item.word)) {
        favoriteWords.delete(item.word);
      } else {
        favoriteWords.add(item.word);
      }
      saveFavorites();
      renderVocabulary();
      renderFavorites();
      renderHomeStats();
    });

    vocabGrid.appendChild(card);
  });
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
  topicGrid.innerHTML = "";

  topicResultsText.textContent = `Showing ${filtered.length} presentation topics`;

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <h3>No topics match your search</h3>
      <p>Try broadening the search term or unchecking favorites.</p>
    `;
    topicGrid.appendChild(empty);
    return;
  }

  filtered.forEach((topic, index) => {
    const card = document.createElement("article");
    card.className = "topic-card";
    const isFavorite = favoriteTopics.has(topic.title);
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
                <span class="mini-vocab-pron">/ˈwɜːrd/</span>
              </div>
              <p class="mini-vocab-meta"><strong>Meaning:</strong> Not added yet</p>
              <p class="mini-vocab-meta"><strong>Synonym:</strong> Not added yet</p>
              <p class="mini-vocab-meta"><strong>Antonym:</strong> Not added yet</p>
              <p class="mini-vocab-meta"><strong>Example:</strong> Add this word to the vocabulary list for full details.</p>
            </div>
          `;
        }

        return `
          <div class="mini-vocab-card">
            <div class="mini-vocab-head">
              <h5>${escapeHtml(wordData.word)}</h5>
              <span class="mini-vocab-pron">/${escapeHtml(wordData.pronunciation || "ˈwɜːrd")}/</span>
            </div>
            <p class="mini-vocab-meta"><strong>Meaning:</strong> ${escapeHtml(wordData.meaning)}</p>
            <p class="mini-vocab-meta"><strong>Synonym:</strong> ${escapeHtml(wordData.synonym)}</p>
            <p class="mini-vocab-meta"><strong>Antonym:</strong> ${escapeHtml(wordData.antonym)}</p>
            <p class="mini-vocab-meta"><strong>Example:</strong> ${escapeHtml(wordData.sentence)}</p>
          </div>
        `;
      })
      .join("");

    card.innerHTML = `
      <div class="topic-card__header" role="button" tabindex="0" data-topic="${title}" aria-expanded="false" aria-controls="${detailsId}">
        <div class="topic-headline">
          <p class="topic-eyebrow">📅 ${escapeHtml(formatDate(topic.date))}</p>
          <h3>${title}</h3>
          <div class="topic-row">
          </div>
        </div>
        <div class="topic-card__actions">
          <button type="button" class="topic-favorite-btn ${isFavorite ? "is-favorite" : ""}" data-topic="${title}" aria-label="Toggle favorite topic ${title}" aria-pressed="${isFavorite}">
            ${isFavorite ? "★" : "☆"}
          </button>
          <span class="topic-toggle-icon" aria-hidden="true">▼</span>
        </div>
      </div>
      <div class="topic-details" id="${detailsId}">
        <div class="topic-detail-block">
          <h4>📝 Summary</h4>
          <p>${escapeHtml(topic.summary)}</p>
        </div>
        <div class="topic-detail-block">
          <h4>📖 Vocabulary</h4>
          <div class="mini-vocab-grid">
            ${vocabularyCards}
          </div>
        </div>
        ${topic.notes ? `<div class="topic-detail-block"><h4>📒 Personal Notes</h4><p>${escapeHtml(topic.notes)}</p></div>` : ""}
        ${topic.questions.length ? `<div class="topic-detail-block"><h4>❓ Discussion Questions</h4><ul>${topic.questions.map((question) => `<li>${escapeHtml(question)}</li>`).join("")}</ul></div>` : ""}
      </div>
    `;

    const favoriteButton = card.querySelector(".topic-favorite-btn");
    favoriteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      if (favoriteTopics.has(topic.title)) {
        favoriteTopics.delete(topic.title);
      } else {
        favoriteTopics.add(topic.title);
      }
      saveFavorites();
      renderTopics();
      renderFavorites();
      renderHomeStats();
    });

    const toggleButton = card.querySelector(".topic-card__header");
    const setExpanded = (open) => {
      card.classList.toggle("is-open", open);
      toggleButton.setAttribute("aria-expanded", String(open));
      const icon = card.querySelector(".topic-toggle-icon");
      icon.textContent = open ? "▲" : "▼";
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

    topicGrid.appendChild(card);
  });
};

const renderFavorites = () => {
  favoriteVocabGrid.innerHTML = "";
  favoriteTopicGrid.innerHTML = "";

  const favoriteWordsList = vocabularyData.filter((item) =>
    favoriteWords.has(item.word),
  );
  const favoriteTopicsList = topicData.filter((item) =>
    favoriteTopics.has(item.title),
  );

  if (!favoriteWordsList.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <h3>No favorite vocabulary yet</h3>
      <p>Mark words as favorites to save them here.</p>
    `;
    favoriteVocabGrid.appendChild(empty);
  } else {
    favoriteWordsList.forEach((word) => {
      const card = document.createElement("article");
      card.className = "vocab-card";
      const safeWord = escapeHtml(word.word);
      card.innerHTML = `
        <div class="card-top">
          <div>
            <h3>${safeWord}</h3>
            <div class="category-pill">${escapeHtml(word.category)}</div>
          </div>
          <button type="button" class="favorite-btn is-favorite" data-word="${safeWord}" aria-label="Remove favorite ${safeWord}" aria-pressed="true">
            ★
          </button>
        </div>
        <span class="meta-line">Meaning</span>
        <span class="meta-value">${escapeHtml(word.meaning)}</span>
      `;
      card.querySelector(".favorite-btn").addEventListener("click", () => {
        favoriteWords.delete(word.word);
        saveFavorites();
        renderVocabulary();
        renderFavorites();
        renderHomeStats();
      });
      favoriteVocabGrid.appendChild(card);
    });
  }

  if (!favoriteTopicsList.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <h3>No favorite topics yet</h3>
      <p>Mark topics as favorites to save them here.</p>
    `;
    favoriteTopicGrid.appendChild(empty);
  } else {
    favoriteTopicsList.forEach((topic) => {
      const card = document.createElement("article");
      card.className = "topic-card";
      const safeTitle = escapeHtml(topic.title);
      card.innerHTML = `
        <div class="topic-card__header">
          <div class="topic-headline">
            <p class="topic-eyebrow">${escapeHtml(formatDate(topic.date))}</p>
            <h3>${safeTitle}</h3>
            <div class="topic-row">
            </div>
          </div>
          <button type="button" class="topic-favorite-btn is-favorite" data-topic="${safeTitle}" aria-label="Remove favorite topic ${safeTitle}" aria-pressed="true">
            ★
          </button>
        </div>
      `;
      card
        .querySelector(".topic-favorite-btn")
        .addEventListener("click", () => {
          favoriteTopics.delete(topic.title);
          saveFavorites();
          renderTopics();
          renderFavorites();
          renderHomeStats();
        });
      favoriteTopicGrid.appendChild(card);
    });
  }
};

const renderHomeStats = () => {
  homeTotalWords.textContent = vocabularyData.length;
  homeTotalTopics.textContent = topicData.length;
  homeFavoriteWords.textContent = favoriteWords.size;
  if (homeFavoriteTopics) {
    homeFavoriteTopics.textContent = favoriteTopics.size;
  }
};

const renderQuote = () => {
  const quote =
    MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];
  fadeText(motivationQuote, quote);
};

const applySearch = () => {
  renderVocabulary();
  renderTopics();

  const term = state.searchTerm.trim();
  if (
    term &&
    (state.activePage === "home" || state.activePage === "about")
  ) {
    const vocabMatches = filterVocabulary().length;
    const topicMatches = filterTopics().length;
    if (vocabMatches || topicMatches) {
      switchPage(vocabMatches >= topicMatches ? "vocabulary" : "topics", {
        replace: true,
      });
    }
  }
};

const attachListeners = () => {
  navLinks.forEach((button) => {
    button.addEventListener("click", () =>
      switchPage(button.dataset.page, { replace: false }),
    );
  });

  window.addEventListener("popstate", () => {
    const page = new URL(window.location.href).searchParams.get("page");
    switchPage(page && document.getElementById(page) ? page : "home", {
      updateHistory: false,
    });
  });

  globalSearchInput.addEventListener("input", (event) => {
    state.searchTerm = event.target.value;
    applySearch();
  });

  themeToggle.addEventListener("click", () => {
    const next = document.body.classList.contains("light") ? "dark" : "light";
    applyTheme(next);
    saveTheme();
  });

  newQuoteBtn.addEventListener("click", renderQuote);

  vocabFavoriteToggle.addEventListener("click", () => {
    state.vocabFavoritesOnly = !state.vocabFavoritesOnly;
    vocabFavoriteToggle.classList.toggle("active", state.vocabFavoritesOnly);
    renderVocabulary();
  });

  topicFavoriteToggle.addEventListener("click", () => {
    state.topicFavoritesOnly = !state.topicFavoritesOnly;
    topicFavoriteToggle.classList.toggle("active", state.topicFavoritesOnly);
    renderTopics();
  });

  vocabSortSelect.addEventListener("change", (event) => {
    state.vocabSort = event.target.value;
    renderVocabulary();
  });
};

const init = async () => {
  loadTheme();
  await loadData();

  const page = new URL(window.location.href).searchParams.get("page");
  switchPage(page && document.getElementById(page) ? page : "home");

  renderCategoryButtons();
  renderHomeStats();
  renderVocabulary();
  renderTopics();
  renderFavorites();
  renderQuote();
  attachListeners();
};

init();
