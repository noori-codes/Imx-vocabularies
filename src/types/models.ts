export type Category =
  | "Emotions"
  | "Mindset"
  | "Character"
  | "Learning"
  | "Speaking"
  | "Lifestyle"
  | "Society"
  | "Growth";

export interface Word {
  word: string;
  pronunciation?: string;
  meaning: string;
  synonym?: string;
  antonym?: string;
  wordFamily?: string;
  sentence?: string;
  notes?: string;
  tags?: string[];
  category: Category | string;
  custom?: boolean;
  isIdiom?: boolean;
}

export interface Topic {
  title: string;
  date: string;
  summary: string;
  notes: string;
  vocabulary: string[];
  idioms: string[];
  questions: string[];
  favorite?: boolean;
  completed?: boolean;
  custom?: boolean;
}

export interface Idiom {
  idiom: string;
  date: string;
  meaning: string;
  pronunciation: string;
  example: string;
  usage: string;
  summary: string;
  notes: string;
  questions: string[];
  favorite?: boolean;
  completed?: boolean;
  custom?: boolean;
}

export type QuizMode =
  | "flashcard"
  | "reverse"
  | "type"
  | "mcq"
  | "cloze"
  | "listening";

export type QuizScope =
  | "due"
  | "all"
  | "idioms"
  | "favorites"
  | "weak"
  | `topic:${string}`
  | `idiom:${string}`;

export interface QuizProgressEntry {
  interval: number;
  ease: number;
  repetitions: number;
  nextReview: string;
  lastResult: "know" | "again";
  updatedAt: string;
}

export interface QuizSettings {
  scope: QuizScope | string;
  mode: QuizMode;
  timer: boolean;
  requeue: boolean;
  categoryFilter: string;
}

export interface QuizSessionStats {
  known: number;
  again: number;
  missed: Word[];
  total: number;
}

export type PageId =
  | "home"
  | "vocabulary"
  | "idioms"
  | "topics"
  | "quiz"
  | "progress"
  | "favorites"
  | "data"
  | "about";

export type ThemeMode = "dark" | "light";

export interface StudyGoals {
  dailyReviews: number;
  weeklyMinutes: number;
}

export interface StudyEvent {
  type: string;
  at: string;
  [key: string]: unknown;
}

export interface ExportPayload {
  version: number;
  exportedAt: string;
  vocabulary?: Word[];
  topics?: Topic[];
  idioms?: Idiom[];
  favorites?: {
    words?: string[];
    topics?: string[];
    idioms?: string[];
  };
  completed?: {
    topics?: string[];
    idioms?: string[];
  };
  quizProgress?: Record<string, QuizProgressEntry>;
  quizSettings?: QuizSettings;
  studyHistory?: StudyEvent[];
  studyGoals?: StudyGoals;
  speakingPractice?: unknown;
  writingResponses?: unknown;
  theme?: ThemeMode;
}
