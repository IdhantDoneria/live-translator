# Project: Live Translator Features

## Architecture
- **Frontend**: Vanilla HTML/CSS/JavaScript served statically from `/public`.
  - `index.html`: Main UI view containing control inputs, transcript, translation boxes, and sliding drawer.
  - `css/style.css`: Styles for the UI, drawer, layout, and sliders.
  - `js/app.js`: Main frontend logic, Event Listeners, and translation fetching.
  - `js/tts.js`: TTS player controlling speaking rates via Web Speech API.
  - `js/stt.js`: Web Speech API implementation for speech recognition.
  - `sw.js`: PWA service worker caching static assets.
  - `manifest.json`: PWA configuration including metadata and app icons.
- **Backend**: Node.js Express server running on port 1000.
  - `server.js`: Handles POST requests at `/translate` by invoking `google-translate-api-x`.

## Code Layout
- `public/index.html` - App HTML
- `public/css/style.css` - UI Styles
- `public/js/app.js` - Main controller
- `public/js/tts.js` - Speech synthesis interface
- `public/js/stt.js` - Speech recognition interface
- `public/sw.js` - Service worker (to be created)
- `public/manifest.json` - PWA Manifest (to be created)
- `public/icons/` - PWA App Icons (to be created)

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | E2E Testing Track | Create the full E2E test suite covering R1, R2, R3, R4 | None | IN_PROGRESS |
| M2 | Speech Speed Slider | Implement Speech Speed Slider UI and TTS speed rate control (R1) | M1 | IN_PROGRESS |
| M3 | Save / Favorite Phrases | Implement Save Phrases, LocalStorage support, drawer UI list, playback (R2) | M1 | IN_PROGRESS |
| M4 | Emergency / Travel Phrasebook | Implement Situation Phrasebook in drawer UI, instant speak (R3) | M1 | PLANNED |
| M5 | PWA Support | Implement manifest.json, sw.js caching, register SW, generate icons (R4) | M1 | PLANNED |
| M6 | Final Verification | Pass 100% of E2E tests (Phase 1) and run adversarial coverage tests (Phase 2) | M2, M3, M4, M5 | PLANNED |
| M7 | Version Control & Deployment | Git commit and push to main, triggering Vercel deployment (R5) | M6 | PLANNED |

## Interface Contracts
### Speech Speed Slider
- Element: `#speed-slider` (range: 0.5 to 2.0, default 0.85)
- Binding: `window.tts.setRate(rate)` or reading directly from `#speed-slider` value in `tts.js`.

### Save / Favorite Phrases
- Element: `#save-favorite-btn` (icon button to star current translation)
- Storage key: `live_translator_favorites` (array of `{ id, text, translation, fromLang, toLang }`)
- Elements in Drawer: `#favorites-list` container, items triggering TTS playback.

### Emergency Phrasebook
- Data structure: JSON/Array of categories (e.g. "Medical", "Airport", "Restaurant") containing common phrases with text and translation keys.
- Elements in Drawer: `#phrasebook-list` container.

### PWA Service Worker
- Cache Name: `live-translator-v1`
- Cached Assets: `/`, `/index.html`, `/css/style.css`, `/js/app.js`, `/js/tts.js`, `/js/stt.js`, `/js/languages.js`, `/js/visualizer.js`, `/manifest.json`, `/icons/icon-192.png`, `/icons/icon-512.png`.
