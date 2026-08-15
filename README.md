# IMX English Hub

Personal English study journal for vocabulary, presentation topics, quizzes, favorites, progress tracking, and daily motivation quotes.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

Production build:

```bash
npm run build
npm run preview
```

Content validation:

```bash
npm run validate:content
```

## Features

- **Vocabulary & topics** with search, filters, favorites, tags/notes, and share/copy
- **Word ↔ topic linking** — open a word from a topic, see “Appears in” on vocab cards
- **In-app add/edit/delete** for words and topics (saved in `localStorage`)
- **Lesson template** — start a new topic with vocab + question placeholders
- **Missing vocab warnings** when a topic lists words not in the library
- **Spaced-repetition quiz** with flashcard, reverse, type, MCQ, cloze, and listening modes
- **Topic practice** — practice words, a 10-card exam, speaking drills, or writing prompts
- **Progress** — streak, activity calendar, weekly stats, and daily/weekly goals
- **Weak words** on Home plus a one-tap review session
- **CSV vocabulary import** plus JSON export/import backups
- **Pronunciation** via Youdao / Google TTS audio with speechSynthesis fallback
- **Installable PWA** for offline use
- **8 focused categories:** Emotions, Mindset, Character, Learning, Speaking, Lifestyle, Society, Growth

## Project structure

```
index.html
vite.config.js
public/IMX-logo.png
src/
  main.js                 # app bootstrap & wiring
  state.js                # shared UI state
  styles.css              # imports style modules
  styles/                 # tokens, layout, components, quiz, progress…
  pages/progress.js       # Progress page + home week strip
  ui/empty.js
  components/             # storage, speech, share, cloze, dom helpers
  data/                   # vocabulary, topics, categories
scripts/validate-library.js
```

## Add content

- Prefer the **Add word** / **Add topic** / **From template** buttons in the UI
- Or edit `src/data/vocabulary.js` and `src/data/topics.js` for permanent base content
- Custom edits, favorites, quiz progress, history, and deletions stay in the browser until you export a backup
