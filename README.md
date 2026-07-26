# IMX English Hub

Personal English study journal for vocabulary, presentation topics, favorites, and daily motivation quotes.

## Run locally

This site uses ES modules, so open it through a local server (not by double-clicking `index.html`).

```bash
# Python
python3 -m http.server 8080

# or Node
npx --yes serve .
```

Then visit `http://localhost:8080`.

## Project structure

```
index.html          # App shell and pages
app.js              # Routing, search, favorites, rendering
styles.css          # Theme and layout
components/helpers.js
data/vocabulary.js  # Vocabulary entries (edit this)
data/topics.js      # Presentation topics (edit this)
IMX-logo.png
```

## Add content

- **Vocabulary:** append an object to `vocabularyData` in `data/vocabulary.js`
- **Topics:** add a `createTopic({ ... })` entry in `data/topics.js`
- Topic vocabulary words should match entries in `vocabulary.js` (case-insensitive)

Favorites and theme preference are saved in the browser via `localStorage`.
