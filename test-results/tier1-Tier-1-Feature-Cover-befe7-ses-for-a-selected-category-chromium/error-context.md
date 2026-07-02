# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier1.spec.js >> Tier 1: Feature Coverage (Happy Path) >> T1.3.3: Travel phrasebook displays common phrases for a selected category
- Location: tests/tier1.spec.js:190:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#phrasebook-list .phrase-item')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#phrasebook-list .phrase-item')

```

```yaml
- main:
  - heading "Live Translator" [level=1]
  - text: Standard
  - checkbox
  - text: Walkie-Talkie
  - button "Toggle Saved Phrases Drawer" [expanded]: 📁 Saved Phrases
  - button "Open Saved Phrases Drawer"
  - paragraph: Speak in one language, read in another.
  - text: Person A Language
  - combobox "Person A Language":
    - option "English (Default)" [selected]
    - option "Mandarin Chinese"
    - option "Hindi"
    - option "Spanish"
    - option "French"
    - option "Arabic"
    - option "Bengali"
    - option "Russian"
    - option "Portuguese"
    - option "Urdu"
  - img
  - text: Person B Language
  - combobox "Person B Language":
    - option "English (Default)"
    - option "Mandarin Chinese"
    - option "Hindi"
    - option "Spanish" [selected]
    - option "French"
    - option "Arabic"
    - option "Bengali"
    - option "Russian"
    - option "Portuguese"
    - option "Urdu"
  - text: Speech Speed 0.85x
  - slider "Speech Speed": "0.85"
  - button "Start Translation"
  - button "Stop" [disabled]
  - heading "Transcript" [level=2]
  - paragraph: Listening will appear here...
  - heading "Translation" [level=2]
  - paragraph: Translation will appear here...
  - button "Save current translation to favorites": ⭐ Save
  - button "📋 Copy"
  - button "🔗 Share"
- complementary "Saved Phrases":
  - heading "Saved Phrases" [level=2]
  - button "Close Saved Phrases Drawer": ×
  - list:
    - listitem: No saved phrases
```

# Test source

```ts
  94  | 
  95  |   test('T1.2.1: Save favorite button is present on the interface', async ({ page }) => {
  96  |     await page.goto('/');
  97  |     const saveBtn = page.locator('#save-favorite-btn');
  98  |     await expect(saveBtn).toBeVisible();
  99  |   });
  100 | 
  101 |   test('T1.2.2: Clicking save favorite button saves current translation to localStorage', async ({ page }) => {
  102 |     await page.goto('/');
  103 |     await page.click('#start-btn');
  104 |     await page.evaluate(() => window._triggerSpeechResult('Hello'));
  105 |     await page.click('#stop-btn');
  106 |     await expect(page.locator('#translated-box')).toHaveText('Hola');
  107 | 
  108 |     await page.click('#save-favorite-btn');
  109 | 
  110 |     const favorites = await page.evaluate(() => {
  111 |       const data = localStorage.getItem('live_translator_favorites');
  112 |       return data ? JSON.parse(data) : [];
  113 |     });
  114 |     expect(favorites.length).toBeGreaterThan(0);
  115 |     expect(favorites[0].text).toBe('Hello');
  116 |     expect(favorites[0].translation).toBe('Hola');
  117 |   });
  118 | 
  119 |   test('T1.2.3: Menu button toggles the favorites drawer visibility', async ({ page }) => {
  120 |     await page.goto('/');
  121 |     const drawer = page.locator('#favorites-drawer');
  122 |     await expect(drawer).not.toHaveClass(/open/);
  123 | 
  124 |     await page.click('#menu-btn');
  125 |     await expect(drawer).toHaveClass(/open/);
  126 | 
  127 |     await page.click('#close-drawer-btn');
  128 |     await expect(drawer).not.toHaveClass(/open/);
  129 |   });
  130 | 
  131 |   test('T1.2.4: Favorites drawer renders saved phrases dynamically with play and delete buttons', async ({ page }) => {
  132 |     // Seed initial favorites into localStorage
  133 |     await page.context().addInitScript(() => {
  134 |       window.localStorage.setItem('live_translator_favorites', JSON.stringify([
  135 |         { id: 'fav-1', text: 'Hello', translation: 'Hola', fromLang: 'en-US', toLang: 'es-ES' }
  136 |       ]));
  137 |     });
  138 | 
  139 |     await page.goto('/');
  140 |     await page.click('#menu-btn');
  141 | 
  142 |     const favItem = page.locator('#favorites-list .favorite-item').first();
  143 |     await expect(favItem).toBeVisible();
  144 |     await expect(favItem.locator('.fav-translation')).toHaveText('Hola');
  145 |     await expect(favItem.locator('.fav-original')).toHaveText('Hello');
  146 | 
  147 |     const playBtn = favItem.locator('.play-btn');
  148 |     await expect(playBtn).toBeVisible();
  149 | 
  150 |     const deleteBtn = favItem.locator('.delete-fav-btn');
  151 |     await expect(deleteBtn).toBeVisible();
  152 |   });
  153 | 
  154 |   test('T1.2.5: Clicking favorite item or play button triggers TTS playback of the translation', async ({ page }) => {
  155 |     await page.context().addInitScript(() => {
  156 |       window.localStorage.setItem('live_translator_favorites', JSON.stringify([
  157 |         { id: 'fav-1', text: 'Hello', translation: 'Hola', fromLang: 'en-US', toLang: 'es-ES' }
  158 |       ]));
  159 |     });
  160 | 
  161 |     await page.goto('/');
  162 |     await page.click('#menu-btn');
  163 |     await page.click('#favorites-list .favorite-item .play-btn');
  164 | 
  165 |     const utterances = await page.evaluate(() => window._spokenUtterances);
  166 |     expect(utterances.length).toBeGreaterThan(0);
  167 |     expect(utterances[utterances.length - 1].text).toBe('Hola');
  168 |     expect(utterances[utterances.length - 1].lang).toBe('es-ES');
  169 |   });
  170 | 
  171 |   // ==========================================
  172 |   // R3: Travel Phrasebook (Tests 11 - 15)
  173 |   // ==========================================
  174 | 
  175 |   test('T1.3.1: Travel phrasebook container is visible in the side drawer', async ({ page }) => {
  176 |     await page.goto('/');
  177 |     await page.click('#menu-btn');
  178 |     const phrasebookList = page.locator('#phrasebook-list');
  179 |     await expect(phrasebookList).toBeVisible();
  180 |   });
  181 | 
  182 |   test('T1.3.2: Travel phrasebook renders categories', async ({ page }) => {
  183 |     await page.goto('/');
  184 |     await page.click('#menu-btn');
  185 |     const categories = page.locator('#phrasebook-list .category-header');
  186 |     await expect(categories).toBeVisible();
  187 |     expect(await categories.count()).toBeGreaterThan(0);
  188 |   });
  189 | 
  190 |   test('T1.3.3: Travel phrasebook displays common phrases for a selected category', async ({ page }) => {
  191 |     await page.goto('/');
  192 |     await page.click('#menu-btn');
  193 |     const phrases = page.locator('#phrasebook-list .phrase-item');
> 194 |     await expect(phrases).toBeVisible();
      |                           ^ Error: expect(locator).toBeVisible() failed
  195 |     expect(await phrases.count()).toBeGreaterThan(0);
  196 |   });
  197 | 
  198 |   test('T1.3.4: Clicking a phrasebook item speaks the phrase immediately', async ({ page }) => {
  199 |     await page.goto('/');
  200 |     await page.click('#menu-btn');
  201 |     await page.locator('#phrasebook-list .phrase-item').first().click();
  202 | 
  203 |     const utterances = await page.evaluate(() => window._spokenUtterances);
  204 |     expect(utterances.length).toBeGreaterThan(0);
  205 |   });
  206 | 
  207 |   test('T1.3.5: Phrasebook playback uses the target language matching the select dropdown', async ({ page }) => {
  208 |     await page.goto('/');
  209 |     await page.selectOption('#target-lang', 'es-ES');
  210 |     await page.click('#menu-btn');
  211 |     await page.locator('#phrasebook-list .phrase-item').first().click();
  212 | 
  213 |     const utterances = await page.evaluate(() => window._spokenUtterances);
  214 |     expect(utterances[utterances.length - 1].lang).toBe('es-ES');
  215 |   });
  216 | 
  217 |   // ==========================================
  218 |   // R4: PWA Support (Tests 16 - 20)
  219 |   // ==========================================
  220 | 
  221 |   test('T1.4.1: Link rel manifest tag exists in head', async ({ page }) => {
  222 |     await page.goto('/');
  223 |     const manifestLink = page.locator('link[rel="manifest"]');
  224 |     await expect(manifestLink).toHaveAttribute('href', 'manifest.json');
  225 |   });
  226 | 
  227 |   test('T1.4.2: Service worker registration is initiated in app loading', async ({ page }) => {
  228 |     // Check if navigator.serviceWorker.register was called
  229 |     await page.goto('/');
  230 |     const hasSWRegisterCalled = await page.evaluate(() => {
  231 |       return 'serviceWorker' in navigator;
  232 |     });
  233 |     expect(hasSWRegisterCalled).toBe(true);
  234 |   });
  235 | 
  236 |   test('T1.4.3: Manifest file exists and is readable', async ({ page }) => {
  237 |     const response = await page.request.get('/manifest.json');
  238 |     expect(response.ok()).toBe(true);
  239 |     const json = await response.json();
  240 |     expect(json.short_name).toBeDefined();
  241 |     expect(json.start_url).toBeDefined();
  242 |   });
  243 | 
  244 |   test('T1.4.4: Service worker registers successfully in navigator.serviceWorker', async ({ page }) => {
  245 |     await page.goto('/');
  246 |     const isSwRegistered = await page.evaluate(async () => {
  247 |       if ('serviceWorker' in navigator) {
  248 |         const registrations = await navigator.serviceWorker.getRegistrations();
  249 |         return registrations.length > 0;
  250 |       }
  251 |       return false;
  252 |     });
  253 |     expect(isSwRegistered).toBe(true);
  254 |   });
  255 | 
  256 |   test('T1.4.5: Static assets cache is registered with cache name live-translator-v1', async ({ page }) => {
  257 |     await page.goto('/');
  258 |     const hasCache = await page.evaluate(async () => {
  259 |       if ('caches' in window) {
  260 |         const keys = await window.caches.keys();
  261 |         return keys.includes('live-translator-v1');
  262 |       }
  263 |       return false;
  264 |     });
  265 |     expect(hasCache).toBe(true);
  266 |   });
  267 | });
  268 | 
```