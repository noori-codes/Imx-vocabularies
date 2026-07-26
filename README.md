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

- **Vocabulary & topics** with search, filters, and favorites
- **In-app add/edit/delete** for words and topics (saved in `localStorage`)
- **Spaced-repetition quiz** with Know / Not yet scheduling
- **Pronunciation** via browser text-to-speech
- **Export / import** JSON backups on the Data page
- **8 focused categories:** Emotions, Mindset, Character, Learning, Speaking, Lifestyle, Society, Growth

## Project structure

```
index.html
app.js
styles.css
components/
  helpers.js
  storage.js          # localStorage merge, quiz, import/export
data/
  vocabulary.js       # base vocabulary
  topics.js           # base topics
  categories.js       # category list + aliases
IMX-logo.png
```

## Add content

- Prefer the **Add word** / **Add topic** buttons in the UI
- Or edit `data/vocabulary.js` and `data/topics.js` for permanent base content
- Custom edits, favorites, quiz progress, and deletions stay in the browser until you export a backup
