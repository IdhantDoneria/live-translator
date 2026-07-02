# Original User Request

## Initial Request — 2026-07-02T22:19:16+05:30

Add four new features to the existing Live Translator web application: a speech speed slider, a phrase saving system, a travel phrasebook, and PWA (offline/installable) support.

Working directory: `/Users/idhantdoneria/translator`
Integrity mode: development

## Requirements

### R1. Speech Speed Slider
Add a UI slider that allows users to control the TTS (Text-to-Speech) speaking rate.

### R2. Save / Favorite Phrases
Add a mechanism (e.g., a star icon) to save translated phrases. Saved phrases should persist across page reloads (e.g., using `localStorage`). Display these favorites in a hidden side-drawer that slides out when clicking a menu button, allowing them to be clicked and spoken aloud instantly.

### R3. Emergency / Travel Phrasebook
Add a section containing pre-translated common phrases categorized by situations (Medical, Airport, Restaurant, etc.). Place this phrasebook inside the same sliding side-drawer as the Favorites. Users can click these to instantly trigger the TTS audio in the target language.

### R4. Progressive Web App (PWA) Support
Add a `manifest.json` and a Service Worker to make the web application installable on mobile devices and cache core assets for offline UI loading. Generate placeholder icon images (192x192 and 512x512) for the PWA manifest using an image generation script or tool.

### R5. Version Control & Deployment
Commit all changes to the local Git repository and push them to GitHub (`origin main`). This will trigger the automatic Vercel deployment.

## Acceptance Criteria

### Functionality
- [ ] The speech speed slider correctly modifies the `utterance.rate` in `tts.js`.
- [ ] Saved phrases persist in `localStorage` and can be played back.
- [ ] The Phrasebook is visible in the UI and clicking a phrase speaks it in the selected target language.
- [ ] The app passes a basic PWA lighthouse check (manifest exists, service worker registers).
- [ ] Changes are successfully pushed to GitHub.
