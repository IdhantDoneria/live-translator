# Handoff Report — Save / Favorite Phrases (R2) Design

## 1. Observation
- **File:** `public/index.html`
  - Quick action buttons container:
    ```html
    122:             <div class="quick-actions">
    123:               <button id="copy-btn" class="icon-btn" title="Copy to Clipboard">📋 Copy</button>
    124:               <button id="share-btn" class="icon-btn" title="Share">🔗 Share</button>
    125:             </div>
    ```
- **File:** `public/js/app.js`
  - DOM content loaded selector and listener attachments:
    ```javascript
    1: document.addEventListener('DOMContentLoaded', () => {
    ...
    11:     const copyBtn = document.getElementById('copy-btn');
    12:     const shareBtn = document.getElementById('share-btn');
    ```
  - Standard mode translation handler:
    ```javascript
    158:                 async (text) => {
    159:                     if (transcriptBox) transcriptBox.textContent = text;
    160:                     await doTranslation(text, srcCode, tgtCode, translatedBox);
    161:                 }
    ```
- **File:** `public/css/style.css`
  - Glass-morphism parameters:
    ```css
    7:   --glass-bg: rgba(255, 255, 255, 0.03);
    8:   --glass-border: rgba(255, 255, 255, 0.1);
    14:   --blur: blur(20px);
    ```
- **File:** `public/js/tts.js`
  - Plays the translation using the Web Speech API:
    ```javascript
    47:   play: function(text, lang) {
    ...
    62:       const utterance = new SpeechSynthesisUtterance(text);
    63:       utterance.lang = lang || 'en-US';
    ```

## 2. Logic Chain
1. To offer users the ability to favorite translated phrases, a trigger button `#save-favorite-btn` must be placed in the DOM. Based on the observation of `public/index.html` lines 122–125, the existing `.quick-actions` container is the most logical position because it groups all post-translation actions (copying, sharing, and now saving) together.
2. The user requested storing favorites in `localStorage` under key `'live_translator_favorites'` as `{ id, text, translation, fromLang, toLang }`. This requires creating helper functions to retrieve, parse, and stringify an array of these objects in `localStorage`.
3. To display the favorites, a sidebar/drawer is necessary. Placing the drawer container `#favorites-drawer` inside `<body>` but outside `.app-container` prevents CSS layout and relative positioning overflows from masking the drawer. Adding a slide transition via CSS transform/translate provides a clean, native-feeling user experience.
4. To play the translation, a click listener must trigger `window.tts.play(translation, toLang)`. By attaching an event listener to the container `#favorites-list` (using event delegation), we can easily retrieve data attributes (`data-translation` and `data-tolang`) from the clicked card's elements and pass them directly to the play function.

## 3. Caveats
- **Browser Compatibility**: LocalStorage space limit (typically 5MB) is assumed to be more than sufficient for text phrases.
- **Language Codes**: Assumed the target language code string retrieved from the dropdown selection matches the locale required by the TTS engine (e.g. `es-ES` instead of `es`). This is confirmed by how `doTranslation` passes `tgtCode` to `window.tts.play(translatedText, tgtCode)` in `public/js/app.js`.

## 4. Conclusion
The proposed design in `analysis.md` completely fulfills all parts of the R2 requirements:
- Placed `#save-favorite-btn` inside the `.quick-actions` container.
- Structured a JSON-based local storage scheme under key `'live_translator_favorites'`.
- Outlined a GPU-accelerated side-drawer UI with mobile responsiveness.
- Bound a delegated listener to `#favorites-list` that plays phrases instantly using `window.tts.play()`.

## 5. Verification Method
- **Static Inspection**: Read the `analysis.md` file in the agent folder to ensure it details:
  - Exact HTML additions for buttons and drawer.
  - Complete localStorage schema.
  - Event listener and TTS play delegation JavaScript code.
- **Integration Validation**: Once implemented, the developer should check:
  - Browser DevTools -> Application tab -> Local Storage to verify elements are added under the `live_translator_favorites` key.
  - Triggering the drawer toggles `.favorites-drawer` with the `.open` class.
  - Clicking any saved phrase card or play icon triggers speech.
