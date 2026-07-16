const STORAGE_KEY_WORDS = "imx-hub-word-favorites";
const STORAGE_KEY_TOPICS = "imx-hub-topic-favorites";

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
const homeCompletedTopics = document.getElementById("homeCompletedTopics");
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

const favoriteWords = new Set(
  JSON.parse(localStorage.getItem(STORAGE_KEY_WORDS) || "[]"),
);
const favoriteTopics = new Set(
  JSON.parse(localStorage.getItem(STORAGE_KEY_TOPICS) || "[]"),
);

let vocabularyData = [];
let topicData = [];

const formatDate = (isoString) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const loadData = async () => {
  try {
    const [vocabModule, topicsModule] = await Promise.all([
      import("./data/vocabulary.js"),
      import("./data/topics.js"),
    ]);

    vocabularyData = vocabModule.vocabularyData || [];
    topicData = topicsModule.topicData || [];
  } catch (error) {
    console.error("Failed to load data modules", error);
  }
};

const saveFavorites = () => {
  localStorage.setItem(STORAGE_KEY_WORDS, JSON.stringify([...favoriteWords]));
  localStorage.setItem(STORAGE_KEY_TOPICS, JSON.stringify([...favoriteTopics]));
};

const updateUrlState = (page) => {
  const url = new URL(window.location.href);
  url.searchParams.set("page", page);
  window.history.replaceState({}, "", url);
};

const switchPage = (page) => {
  state.activePage = page;
  pages.forEach((section) =>
    section.classList.toggle("page--active", section.id === page),
  );
  navLinks.forEach((button) =>
    button.classList.toggle("active", button.dataset.page === page),
  );
  updateUrlState(page);
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

    card.innerHTML = `
      <div class="card-top">
        <div>
          <h3>${item.word}</h3>
          <div class="category-pill">${item.category}</div>
        </div>
        <button type="button" class="favorite-btn ${isFavorite ? "is-favorite" : ""}" data-word="${item.word}" aria-label="Toggle favorite ${item.word}">
          ${isFavorite ? "★" : "☆"}
        </button>
      </div>
      <span class="meta-line">Meaning</span>
      <span class="meta-value">${item.meaning}</span>
      <span class="meta-line">Synonym</span>
      <span class="meta-value">${item.synonym}</span>
      <span class="meta-line">Antonym</span>
      <span class="meta-value">${item.antonym}</span>
      <span class="meta-line">Word Family</span>
      <span class="meta-value">${item.wordFamily}</span>
      <span class="meta-line">Example</span>
      <span class="meta-value">“${item.sentence}”</span>
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

  filtered.forEach((topic) => {
    const card = document.createElement("article");
    card.className = "topic-card";
    const isFavorite = favoriteTopics.has(topic.title);

    const vocabularyCards = topic.vocabulary
      .map((word) => {
        const wordData = vocabularyData.find(
          (item) => item.word.toLowerCase() === word.toLowerCase(),
        );
        if (!wordData) {
          return `
            <div class="mini-vocab-card">
              <div class="mini-vocab-head">
                <h5>${word}</h5>
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
              <h5>${wordData.word}</h5>
              <span class="mini-vocab-pron">/${wordData.pronunciation || "ˈwɜːrd"}/</span>
            </div>
            <p class="mini-vocab-meta"><strong>Meaning:</strong> ${wordData.meaning}</p>
            <p class="mini-vocab-meta"><strong>Synonym:</strong> ${wordData.synonym}</p>
            <p class="mini-vocab-meta"><strong>Antonym:</strong> ${wordData.antonym}</p>
            <p class="mini-vocab-meta"><strong>Example:</strong> ${wordData.sentence}</p>
          </div>
        `;
      })
      .join("");

    card.innerHTML = `
      <div class="topic-card__header" role="button" tabindex="0" data-topic="${topic.title}">
        <div class="topic-headline">
          <p class="topic-eyebrow">📅 ${formatDate(topic.date)}</p>
          <h3>${topic.title}</h3>
          <div class="topic-row">
            <span class="badge ${topic.completed ? "badge-completed" : ""}">${topic.completed ? "Completed" : "In progress"}</span>
            <span class="badge">${topic.vocabulary.length} words</span>
          </div>
        </div>
        <div class="topic-card__actions">
          <button type="button" class="topic-favorite-btn ${isFavorite ? "is-favorite" : ""}" data-topic="${topic.title}" aria-label="Toggle favorite topic ${topic.title}">
            ${isFavorite ? "★" : "☆"}
          </button>
          <span class="topic-toggle-icon" aria-hidden="true">▼</span>
        </div>
      </div>
      <div class="topic-details">
        <div class="topic-detail-block">
          <h4>📝 Summary</h4>
          <p>${topic.summary}</p>
        </div>
        <div class="topic-detail-block">
          <h4>📖 Vocabulary</h4>
          <div class="mini-vocab-grid">
            ${vocabularyCards}
          </div>
        </div>
        ${topic.notes ? `<div class="topic-detail-block"><h4>📒 Personal Notes</h4><p>${topic.notes}</p></div>` : ""}
        ${topic.questions.length ? `<div class="topic-detail-block"><h4>❓ Discussion Questions</h4><ul>${topic.questions.map((question) => `<li>${question}</li>`).join("")}</ul></div>` : ""}
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
    toggleButton.addEventListener("click", (event) => {
      if (event.target.closest(".topic-favorite-btn")) return;
      card.classList.toggle("is-open");
      const icon = card.querySelector(".topic-toggle-icon");
      icon.textContent = card.classList.contains("is-open") ? "▲" : "▼";
    });

    toggleButton.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleButton.click();
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
      card.innerHTML = `
        <div class="card-top">
          <div>
            <h3>${word.word}</h3>
            <div class="category-pill">${word.category}</div>
          </div>
          <button type="button" class="favorite-btn is-favorite" data-word="${word.word}" aria-label="Remove favorite ${word.word}">
            ★
          </button>
        </div>
        <span class="meta-line">Meaning</span>
        <span class="meta-value">${word.meaning}</span>
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
      card.innerHTML = `
        <div class="topic-card__header">
          <div class="topic-headline">
            <p class="topic-eyebrow">${formatDate(topic.date)}</p>
            <h3>${topic.title}</h3>
            <div class="topic-row">
              <span class="badge ${topic.completed ? "badge-completed" : ""}">${topic.completed ? "Completed" : "In progress"}</span>
            </div>
          </div>
          <button type="button" class="topic-favorite-btn is-favorite" data-topic="${topic.title}" aria-label="Remove favorite topic ${topic.title}">
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
  homeCompletedTopics.textContent = topicData.filter(
    (topic) => topic.completed,
  ).length;
};

const renderQuote = () => {
  const quote =
    MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];
  motivationQuote.classList.add("text-fade-out");
  setTimeout(() => {
    motivationQuote.textContent = quote;
    motivationQuote.classList.remove("text-fade-out");
  }, 180);
};

const applySearch = () => {
  renderVocabulary();
  renderTopics();
};

const attachListeners = () => {
  navLinks.forEach((button) => {
    button.addEventListener("click", () => switchPage(button.dataset.page));
  });

  globalSearchInput.addEventListener("input", (event) => {
    state.searchTerm = event.target.value;
    applySearch();
  });

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    themeToggle.textContent = document.body.classList.contains("light")
      ? "☀️"
      : "🌙";
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
