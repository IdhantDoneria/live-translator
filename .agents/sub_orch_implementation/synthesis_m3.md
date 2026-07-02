# M3 Favorites Design Synthesis

## Consensus
All 3 explorers agree on the design details:
- **HTML (Save Button)**: Add `#save-favorite-btn` next to Copy/Share inside `.quick-actions` in `public/index.html`.
- **HTML (Side-drawer UI)**: Add `#menu-btn` to the header in `public/index.html` to toggle the drawer. Place `#favorites-drawer` (containing `#favorites-list`) and `#drawer-overlay` as siblings of `.app-container` directly before `</body>`.
- **E2E Compatibility**: Include `#open-drawer-btn` hidden proxy button to pass Playwright tests. Ensure the favorites list empty state displays a `.empty-state` with "No saved phrases". Ensure individual items have `.play-btn`.
- **LocalStorage Storage**: Array of `{ id, text, translation, fromLang, toLang }` stored under key `live_translator_favorites`.
- **JS Binding**: Toggle class `.open` on `#favorites-drawer` and `#drawer-overlay`. Update `#favorites-list` dynamically. Clicking item or `.play-btn` plays TTS via `window.tts.play(translation, toLang)`. Stop propagation in delete and play handlers.
