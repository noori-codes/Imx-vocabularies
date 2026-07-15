const STORAGE_KEY = "imx-vocabulary-favorites";
const STORAGE_KEY_DATA = "imx-vocabulary-data";
const MOTIVATION_QUOTES = [
  "Small improvements every day lead to remarkable results.",
  "Discipline will take you where motivation cannot.",
  "One new word today is one more opportunity tomorrow.",
  "Consistency beats talent when talent doesn't work.",
  "Your future vocabulary depends on today's effort.",
  "Knowledge compounds just like interest.",
  "Don't study because you have to. Study because your future self will thank you.",
  "Every expert was once a beginner.",
  "Learning one word today is better than planning to learn one hundred tomorrow.",
  "The more words you know, the more clearly you can think.",
];

const defaultVocabulary = [
  {
    word: "Integrity",
    meaning: "Doing the right thing even when nobody is watching.",
    synonym: "Honesty",
    antonym: "Corruption",
    wordFamily: "Integrity, Integral",
    sentence: "A good leader always acts with integrity.",
    category: "Character & Values",
  },
  {
    word: "Resilience",
    meaning: "The ability to recover quickly from setbacks.",
    synonym: "Toughness",
    antonym: "Fragility",
    wordFamily: "Resilient, Resilience",
    sentence: "Her resilience helped her succeed after the failure.",
    category: "Growth & Self-Improvement",
  },
  {
    word: "Empathy",
    meaning: "The ability to understand and share another person’s feelings.",
    synonym: "Compassion",
    antonym: "Indifference",
    wordFamily: "Empathetic, Empathize",
    sentence: "Empathy is essential for building strong relationships.",
    category: "Mind & Psychology",
  },
  {
    word: "Perspective",
    meaning: "A particular way of viewing something.",
    synonym: "Viewpoint",
    antonym: "Narrow-mindedness",
    wordFamily: "Perspective, Perspectival",
    sentence: "A broader perspective can change your decisions.",
    category: "Mind & Psychology",
  },
  {
    word: "Ambition",
    meaning: "A strong desire to achieve success or power.",
    synonym: "Drive",
    antonym: "Apathy",
    wordFamily: "Ambitious, Ambitiously",
    sentence: "His ambition pushed him to work harder every day.",
    category: "Success & Wealth",
  },
  {
    word: "Innovation",
    meaning: "The introduction of new ideas or methods.",
    synonym: "Creativity",
    antonym: "Conservatism",
    wordFamily: "Innovate, Innovative",
    sentence: "Innovation is the engine of modern business.",
    category: "Technology & Future",
  },
  {
    word: "Mentorship",
    meaning: "Guidance and support provided by a more experienced person.",
    synonym: "Guidance",
    antonym: "Neglect",
    wordFamily: "Mentor, Mentorship",
    sentence: "Mentorship can accelerate learning and confidence.",
    category: "Leadership",
  },
  {
    word: "Community",
    meaning: "A group of people living or working together.",
    synonym: "Society",
    antonym: "Isolation",
    wordFamily: "Communal, Communicate",
    sentence: "A strong community makes life more meaningful.",
    category: "Society & Relationships",
  },
  {
    word: "Diligence",
    meaning: "Careful and persistent effort.",
    synonym: "Dedication",
    antonym: "Laziness",
    wordFamily: "Diligent, Diligently",
    sentence: "Diligence is often more important than talent.",
    category: "Growth & Self-Improvement",
  },
  {
    word: "Reflection",
    meaning: "Careful thought about something that happened.",
    synonym: "Contemplation",
    antonym: "Neglect",
    wordFamily: "Reflect, Reflective",
    sentence: "Reflection helps you learn from experience.",
    category: "Mind & Psychology",
  },
  {
    word: "Humility",
    meaning: "The quality of being modest and respectful.",
    synonym: "Modesty",
    antonym: "Arrogance",
    wordFamily: "Humble, Humbly",
    sentence: "Humility makes a person easier to trust.",
    category: "Character & Values",
  },
  {
    word: "Discipline",
    meaning: "The ability to control behavior in order to achieve goals.",
    synonym: "Self-control",
    antonym: "Impulsiveness",
    wordFamily: "Disciplined, Disciplinary",
    sentence: "Discipline turns good intentions into results.",
    category: "Growth & Self-Improvement",
  },
  {
    word: "Compassion",
    meaning: "Sympathetic concern for the suffering of others.",
    synonym: "Kindness",
    antonym: "Cruelty",
    wordFamily: "Compassionate, Compassionately",
    sentence: "Compassion drives many acts of generosity.",
    category: "Character & Values",
  },
  {
    word: "Courage",
    meaning: "The ability to face fear or danger.",
    synonym: "Bravery",
    antonym: "Cowardice",
    wordFamily: "Courageous, Courageously",
    sentence: "Courage is often needed before confidence appears.",
    category: "Challenges & Difficulties",
  },
  {
    word: "Adaptability",
    meaning: "The ability to adjust to new conditions.",
    synonym: "Flexibility",
    antonym: "Rigidity",
    wordFamily: "Adapt, Adaptive",
    sentence: "Adaptability is a valuable skill in uncertain times.",
    category: "Challenges & Difficulties",
  },
  {
    word: "Vision",
    meaning: "A clear idea of what you want to achieve.",
    synonym: "Foreshadowing",
    antonym: "Confusion",
    wordFamily: "Visualize, Visionary",
    sentence: "Great leaders often share a strong vision.",
    category: "Leadership",
  },
  {
    word: "Prosperity",
    meaning: "A state of success and financial well-being.",
    synonym: "Wealth",
    antonym: "Poverty",
    wordFamily: "Prosper, Prosperous",
    sentence: "Prosperity comes from discipline and smart choices.",
    category: "Success & Wealth",
  },
  {
    word: "Connection",
    meaning: "A link or relationship between people or ideas.",
    synonym: "Bond",
    antonym: "Separation",
    wordFamily: "Connect, Connected",
    sentence: "The connection between effort and result is clear.",
    category: "Society & Relationships",
  },
  {
    word: "Autonomy",
    meaning: "The ability to act independently and make your own decisions.",
    synonym: "Independence",
    antonym: "Dependence",
    wordFamily: "Autonomous, Autonomously",
    sentence: "Autonomy encourages responsibility and confidence.",
    category: "Growth & Self-Improvement",
  },
  {
    word: "Curiosity",
    meaning: "A strong desire to learn or know more.",
    synonym: "Inquisitiveness",
    antonym: "Apathy",
    wordFamily: "Curious, Curiously",
    sentence: "Curiosity often leads to discovery.",
    category: "Mind & Psychology",
  },
  {
    word: "Strategic",
    meaning: "Carefully planned to achieve a long-term goal.",
    synonym: "Calculated",
    antonym: "Impulsive",
    wordFamily: "Strategy, Strategize",
    sentence: "A strategic plan can save time and resources.",
    category: "Leadership",
  },
  {
    word: "Ethics",
    meaning: "Moral principles that guide behavior.",
    synonym: "Morality",
    antonym: "Immorality",
    wordFamily: "Ethical, Ethically",
    sentence: "Ethics matter in both business and personal life.",
    category: "Character & Values",
  },
  {
    word: "Collaboration",
    meaning: "Working together to achieve a common goal.",
    synonym: "Cooperation",
    antonym: "Competition",
    wordFamily: "Collaborate, Collaborative",
    sentence: "Collaboration often produces better results.",
    category: "Society & Relationships",
  },
  {
    word: "Momentum",
    meaning: "The force or progress gained by a moving object or process.",
    synonym: "Drive",
    antonym: "Stagnation",
    wordFamily: "Momentous, Momentum",
    sentence: "A small win can create momentum for the next step.",
    category: "Growth & Self-Improvement",
  },
  {
    word: "Concentration",
    meaning: "The ability to focus fully on a single task.",
    synonym: "Focus",
    antonym: "Distraction",
    wordFamily: "Concentrate, Concentrated",
    sentence: "Concentration improves when distractions are reduced.",
    category: "Mind & Psychology",
  },
  {
    word: "Sustainability",
    meaning: "The ability to continue over time without harming resources.",
    synonym: "Durability",
    antonym: "Wastefulness",
    wordFamily: "Sustainable, Sustain",
    sentence: "Sustainability is central to modern design.",
    category: "Technology & Future",
  },
  {
    word: "Confidence",
    meaning: "A feeling of self-assurance and trust in your abilities.",
    synonym: "Assurance",
    antonym: "Doubt",
    wordFamily: "Confident, Confidently",
    sentence: "Confidence grows through preparation and experience.",
    category: "Growth & Self-Improvement",
  },
  {
    word: "Perseverance",
    meaning: "Steady persistence despite difficulties.",
    synonym: "Endurance",
    antonym: "Quitters",
    wordFamily: "Persevere, Persevering",
    sentence:
      "Perseverance often separates short-term dreams from lasting success.",
    category: "Challenges & Difficulties",
  },
  {
    word: "Stability",
    meaning: "The condition of being steady and reliable.",
    synonym: "Consistency",
    antonym: "Instability",
    wordFamily: "Stable, Stabilize",
    sentence: "Stability creates a sense of safety and trust.",
    category: "Society & Relationships",
  },
  {
    word: "Accountability",
    meaning: "The obligation to accept responsibility for actions.",
    synonym: "Responsibility",
    antonym: "Irresponsibility",
    wordFamily: "Accountable, Accountably",
    sentence: "Accountability strengthens trust within a team.",
    category: "Leadership",
  },
  {
    word: "Imagination",
    meaning: "The ability to form new ideas or mental images.",
    synonym: "Creativeness",
    antonym: "Reality",
    wordFamily: "Imagine, Imaginary",
    sentence: "Imagination is the beginning of innovation.",
    category: "Technology & Future",
  },
  {
    word: "Patience",
    meaning: "The capacity to accept delay or difficulty calmly.",
    synonym: "Tolerance",
    antonym: "Impatience",
    wordFamily: "Patient, Patiently",
    sentence: "Patience is essential when learning a new skill.",
    category: "Challenges & Difficulties",
  },
];

let vocabulary = [];

const categoryOrder = [
  "All",
  "Growth & Self-Improvement",
  "Mind & Psychology",
  "Character & Values",
  "Society & Relationships",
  "Success & Wealth",
  "Technology & Future",
  "Leadership",
  "Challenges & Difficulties",
];

const state = { activeCategory: "All", searchTerm: "" };

const searchInput = document.getElementById("searchInput");
const filterButtons = document.getElementById("filterButtons");
const vocabGrid = document.getElementById("vocabGrid");
const resultsSummary = document.getElementById("resultsSummary");
const totalWords = document.getElementById("totalWords");
const favoriteCount = document.getElementById("favoriteCount");
const themeToggle = document.getElementById("themeToggle");
const motivationQuote = document.getElementById("motivationQuote");
const newQuoteBtn = document.getElementById("newQuoteBtn");
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");

const favorites = new Set(
  JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"),
);

function loadVocabulary() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DATA);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return defaultVocabulary.slice();
}

function saveVocabulary() {
  try {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(vocabulary));
  } catch (e) {}
}

function saveFavorites() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
}

function renderFilters() {
  filterButtons.innerHTML = "";
  categoryOrder.forEach((category) => {
    const button = document.createElement("button");
    button.className = "filter-btn";
    if (state.activeCategory === category) button.classList.add("is-active");
    button.textContent = category === "All" ? "All" : category;
    button.addEventListener("click", () => {
      state.activeCategory = category;
      renderFilters();
      renderVocabulary();
    });
    filterButtons.appendChild(button);
  });
}

function getFilteredVocabulary() {
  const term = state.searchTerm.trim().toLowerCase();
  return vocabulary
    .map((w, i) => ({ item: w, index: i }))
    .filter(({ item }) => {
      const matchesCategory =
        state.activeCategory === "All" ||
        item.category === state.activeCategory;
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
      const matchesSearch = !term || haystack.includes(term);
      return matchesCategory && matchesSearch;
    });
}

function renderVocabulary() {
  const filtered = getFilteredVocabulary();
  vocabGrid.innerHTML = "";
  resultsSummary.textContent = `Showing ${filtered.length} of ${vocabulary.length} vocabulary words`;
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML =
      "<h3>No matches yet</h3><p>Try a different keyword or category.</p>";
    vocabGrid.appendChild(empty);
    return;
  }

  filtered.forEach(({ item, index }) => {
    const isFavorite = favorites.has(item.word);
    const card = document.createElement("article");
    card.className = "vocab-card";
    card.innerHTML = `
      <div class="card-top">
        <h3>${item.word}</h3>
        <div class="card-actions">
          <button class="favorite-btn ${isFavorite ? "is-favorite" : ""}" data-word="${item.word}" aria-label="Favorite ${item.word}">${isFavorite ? "★" : "☆"}</button>
          <button class="edit-btn" data-index="${index}" aria-label="Edit ${item.word}">✏️</button>
          <button class="delete-btn" data-index="${index}" aria-label="Delete ${item.word}">🗑️</button>
        </div>
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
      <span class="category-pill">${item.category}</span>
    `;
    vocabGrid.appendChild(card);
  });

  // attach handlers
  document.querySelectorAll(".favorite-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const word = button.getAttribute("data-word");
      if (favorites.has(word)) favorites.delete(word);
      else favorites.add(word);
      saveFavorites();
      updateStats();
      renderVocabulary();
    });
  });

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () =>
      openEditModal(Number(btn.getAttribute("data-index"))),
    );
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-index"));
      const confirmed = confirm(`Delete "${vocabulary[idx].word}"?`);
      if (!confirmed) return;
      vocabulary.splice(idx, 1);
      saveVocabulary();
      updateStats();
      renderVocabulary();
    });
  });
}

function updateStats() {
  totalWords.textContent = vocabulary.length;
  favoriteCount.textContent = favorites.size;
}

function openEditModal(index) {
  const item = vocabulary[index];
  if (!item) return;
  editModal.classList.remove("hidden");
  editForm.elements["editIndex"].value = index;
  editForm.elements["word"].value = item.word;
  editForm.elements["meaning"].value = item.meaning;
  editForm.elements["synonym"].value = item.synonym;
  editForm.elements["antonym"].value = item.antonym;
  editForm.elements["wordFamily"].value = item.wordFamily;
  editForm.elements["sentence"].value = item.sentence;
  editForm.elements["category"].value = item.category;
}

function closeEditModal() {
  editModal.classList.add("hidden");
}

editForm &&
  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const idx = Number(editForm.elements["editIndex"].value);
    if (isNaN(idx)) return;
    const updated = {
      word: editForm.elements["word"].value.trim(),
      meaning: editForm.elements["meaning"].value.trim(),
      synonym: editForm.elements["synonym"].value.trim(),
      antonym: editForm.elements["antonym"].value.trim(),
      wordFamily: editForm.elements["wordFamily"].value.trim(),
      sentence: editForm.elements["sentence"].value.trim(),
      category: editForm.elements["category"].value.trim() || "Uncategorized",
    };
    vocabulary[idx] = updated;
    saveVocabulary();
    closeEditModal();
    updateStats();
    renderVocabulary();
  });

// cancel button
const cancelEdit = document.getElementById("cancelEdit");
if (cancelEdit) cancelEdit.addEventListener("click", closeEditModal);

function showRandomQuote() {
  const randomQuote =
    MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];
  motivationQuote.classList.add("is-fading");
  window.setTimeout(() => {
    motivationQuote.textContent = randomQuote;
    motivationQuote.classList.remove("is-fading");
  }, 180);
}

searchInput.addEventListener("input", (event) => {
  state.searchTerm = event.target.value;
  renderVocabulary();
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light");
  const isLight = document.body.classList.contains("light");
  themeToggle.textContent = isLight ? "☀️" : "🌙";
});

newQuoteBtn.addEventListener("click", showRandomQuote);

// initialize
vocabulary = loadVocabulary();
updateStats();
renderFilters();
renderVocabulary();
showRandomQuote();
