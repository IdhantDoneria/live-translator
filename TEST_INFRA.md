# E2E Test Infrastructure & Guidelines

This document outlines the End-to-End (E2E) testing setup, architecture, test cases, and verification procedures for the Live Translator application.

---

## 1. Architecture Overview

To achieve robust, opaque-box E2E testing without modifying the core application code (`public/` and `server.js`), we utilize **Playwright** as our testing framework.

- **Frontend**: Serves from `/public` via Node.js Express server.
- **Backend**: Runs on port `1000`.
- **E2E Testing Runner**: Playwright launches the Express server, opens a headless browser instance, and executes tests against `http://localhost:1000`.
- **API and Hardware Mocking**:
  - We mock the **Web Speech API** (`SpeechRecognition` and `SpeechSynthesis`) using Playwright's `page.addInitScript` to inject client-side mock objects before the application load.
  - We mock the `/translate` Express endpoint using Playwright's `page.route` to ensure deterministic offline-compatible tests, while also allowing real translation tests if integration checks are needed.

---

## 2. Setup & Installation

### Prerequisites
- Node.js installed.

### Installation Steps

1. Install the Playwright Test runner as a development dependency:
   ```bash
   npm install -D @playwright/test
   ```

2. Install browser binaries (Chromium only is sufficient for lightweight verification):
   ```bash
   npx playwright install chromium --with-deps
   ```

3. Configure Playwright via `playwright.config.js` in the project root.

---

## 3. How to Run Tests

- **Run all E2E tests in headless mode**:
  ```bash
  npm test
  ```
  *(Note: This is mapped to `playwright test` in `package.json`)*

- **Run tests in headed (UI) mode**:
  ```bash
  npx playwright test --ui
  ```

- **Debug tests**:
  ```bash
  npx playwright test --debug
  ```

---

## 4. Test Suite Structure (4-Tier Coverage)

Our E2E test suite is divided into 4 tiers to verify features under happy paths, edge cases, integration, and real-world workloads.

### Tier 1: Feature Coverage (Happy Path)
- **T1.1: Basic Translation**: Translate text via standard UI controls. Verify that the Speech-to-Text transcript displays, the translate request is sent, and the translated text appears and is read aloud.
- **T1.2: Walkie-Talkie Translation**: Verify that holding Person A or Person B buttons initiates STT, and releasing triggers translation and speech output in the respective pane.
- **T1.3: Speech Speed Slider (R1)**: Verify that adjusting the speed slider to `1.5` updates the SpeechSynthesis playback rate to `1.5`.
- **T1.4: Save/Favorite Phrases (R2)**: Star a translation, open the side-drawer, and verify that the phrase is listed in `#favorites-list`.
- **T1.5: Travel Phrasebook (R3)**: Open the drawer, browse categories, click a phrase, and verify that it plays immediately in the target language.
- **T1.6: PWA Registration (R4)**: Verify that the index page references `manifest.json` and successfully registers the service worker (`sw.js`).

### Tier 2: Boundary & Corner Cases
- **T2.1: Speed Slider Extremes**: Set the speed slider to its boundaries (`0.5` and `2.0`) and verify that SpeechSynthesis correctly receives these rates.
- **T2.2: Empty Favorites & Drawer State**: Open the side-drawer when no favorites are saved and verify that a proper empty-state message/placeholder is displayed.
- **T2.3: Storage Integrity**: Write invalid JSON to `localStorage` under `live_translator_favorites` and verify that the application recovers gracefully without throwing fatal errors.
- **T2.4: Network Offline / Translation Failure**: Mock a network failure (500 error or offline state) for `/translate` and verify that the UI shows "Translation error" or "Network error" without crashing.

### Tier 3: Cross-Feature Integration
- **T3.1: Slider + Favorites Playback**: Adjust the speech speed slider to `0.7` and click a favorite phrase in the drawer. Verify that the favorite is read aloud at `0.7` speed.
- **T3.2: Slider + Phrasebook Playback**: Adjust the speech speed slider to `1.8` and click an emergency phrasebook item. Verify that it plays at `1.8` speed.
- **T3.3: Language Swap & WT Synchronization**: Swap languages in standard mode and verify that the Walkie-Talkie pane names and buttons dynamically update their language labels.

### Tier 4: Real-World Workload
- **T4.1: Interactive User Journey**:
  1. Open the page and change Person A to English, Person B to Spanish.
  2. Speak "Hello, how are you?" (Person A).
  3. Verify translation to "Hola, ¿cómo estás?".
  4. Save the translation to Favorites.
  5. Toggle to Walkie-Talkie mode.
  6. Perform a back-and-forth exchange between Person A and Person B.
  7. Open the drawer, select the saved favorite, and play it at `1.2` speed.
  8. Simulate offline mode (PWA) and verify that previously cached assets continue to load.

---

## 5. Implementation Strategy (No-Touch Injection)

To verify STT/TTS without modifying app source files, tests inject mocks using `page.addInitScript` before navigation:

```javascript
// Mocking SpeechRecognition
class MockSpeechRecognition {
  start() {
    if (this.onstart) setTimeout(() => this.onstart(), 50);
    window._triggerSpeechResult = (text) => {
      if (this.onresult) {
        this.onresult({
          resultIndex: 0,
          results: [[{ transcript: text }]]
        });
      }
    };
  }
  stop() {
    if (this.onend) setTimeout(() => this.onend(), 50);
  }
}
window.SpeechRecognition = MockSpeechRecognition;
window.webkitSpeechRecognition = MockSpeechRecognition;

// Mocking SpeechSynthesis
const spokenUtterances = [];
window._spokenUtterances = spokenUtterances;
window.speechSynthesis = {
  getVoices: () => [{ name: 'Google US English', lang: 'en-US' }],
  speak: (utt) => {
    spokenUtterances.push(utt);
    if (utt.onend) setTimeout(() => utt.onend(), 50);
  },
  cancel: () => {}
};
```

---

## 6. Verification Criteria

A test run is considered successful if:
1. Playwright reports `10 suites passed`.
2. Core assets are verified as cached by the Service Worker mock or offline reload check.
3. Consoles of tested pages report no uncaught JavaScript exceptions.
