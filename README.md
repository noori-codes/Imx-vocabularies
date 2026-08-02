# IMX English Hub

Personal English study journal for vocabulary, presentation topics, quizzes, favorites, and daily motivation quotes.

## Run locally

This site uses ES modules, so open it through a local server (not by double-clicking `index.html`).

```bash
# Python
python3 -m http.server 8080

# or Node
npx --yes serve .
```

Then visit `http://localhost:8080`.

## Features

- **Vocabulary & topics** with search, filters, favorites, and share/copy
- **Word ↔ topic linking** — open a word from a topic, see “Appears in” on vocab cards
- **In-app add/edit/delete** for words and topics (saved in `localStorage`)
- **Lesson template** — start a new topic with vocab + question placeholders
- **Missing vocab warnings** when a topic lists words not in the library
- **Spaced-repetition quiz** with flashcard, reverse, type, MCQ, and cloze modes
- **Topic practice** — practice words or a 10-card exam from any topic
- **Speaking practice** — timed discussion-question drills per topic
- **Weak words** on Home plus a one-tap review session
- **Session summary** with missed-word review
- **Pronunciation** via Youdao / Google TTS audio with speechSynthesis fallback
- **Installable PWA** for offline use
- **8 focused categories:** Emotions, Mindset, Character, Learning, Speaking, Lifestyle, Society, Growth

## Project structure

```
index.html
app.js
styles.css
manifest.webmanifest
sw.js
components/
  helpers.js
  storage.js          # localStorage merge, quiz, import/export, streaks
  dom.js              # HTML helpers + icons
  speech.js           # pronunciation (Youdao / Google TTS + native fallback)
  share.js            # share / clipboard
  cloze.js            # fill-in-the-blank prompts
data/
  vocabulary.js       # base vocabulary
  topics.js           # base topics
  categories.js       # category list + aliases
IMX-logo.png
```

## Add content

- Prefer the **Add word** / **Add topic** / **From template** buttons in the UI
- Or edit `data/vocabulary.js` and `data/topics.js` for permanent base content
- Custom edits, favorites, quiz progress, and deletions stay in the browser until you export a backup
