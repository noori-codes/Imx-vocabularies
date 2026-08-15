export const MOTIVATION_QUOTES = [
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

export const LESSON_TEMPLATE = {
  title: "",
  summary: "Write a short overview of the discussion theme.",
  notes: "Personal reminders, examples, or links for this lesson.",
  vocabulary: ["word1", "word2", "word3"],
  questions: [
    "What does this topic mean in everyday life?",
    "Share a personal example related to this theme.",
    "What vocabulary from this lesson will you reuse this week?",
  ],
};

export const state = {
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
  quizListeningHeard: false,
  editingWord: null,
  editingTopic: null,
};

export const library = {
  baseVocabulary: [],
  baseTopics: [],
  vocabularyData: [],
  topicData: [],
};
