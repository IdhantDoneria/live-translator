# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier1.spec.js >> Tier 1: Feature Coverage (Happy Path) >> T1.4.5: Static assets cache is registered with cache name live-translator-v1
- Location: tests/tier1.spec.js:256:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - heading "Live Translator" [level=1] [ref=e8]
        - generic [ref=e9]:
          - generic [ref=e10]: Standard
          - generic [ref=e11]:
            - checkbox
          - generic [ref=e13]: Walkie-Talkie
        - button "Toggle Saved Phrases Drawer" [ref=e14] [cursor=pointer]: 📁 Saved Phrases
        - button "Open Saved Phrases Drawer" [ref=e15]
      - paragraph [ref=e16]: Speak in one language, read in another.
    - generic [ref=e17]:
      - generic [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]: Person A Language
          - combobox "Person A Language" [ref=e21] [cursor=pointer]:
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
        - img [ref=e23] [cursor=pointer]
        - generic [ref=e26]:
          - generic [ref=e27]: Person B Language
          - combobox "Person B Language" [ref=e28] [cursor=pointer]:
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
      - generic [ref=e29]:
        - generic [ref=e30]:
          - generic [ref=e31]: Speech Speed
          - generic [ref=e32]: 0.85x
        - slider "Speech Speed" [ref=e33] [cursor=pointer]: "0.85"
    - generic [ref=e34]:
      - generic [ref=e36]:
        - button "Start Translation" [ref=e37] [cursor=pointer]
        - button "Stop" [disabled] [ref=e38]
      - generic [ref=e39]:
        - generic [ref=e40]:
          - heading "Transcript" [level=2] [ref=e41]
          - paragraph [ref=e43]: Listening will appear here...
        - generic [ref=e44]:
          - heading "Translation" [level=2] [ref=e45]
          - generic [ref=e46]:
            - paragraph [ref=e48]: Translation will appear here...
            - generic [ref=e49]:
              - button "Save current translation to favorites" [ref=e50] [cursor=pointer]: ⭐ Save
              - button "📋 Copy" [ref=e51] [cursor=pointer]
              - button "🔗 Share" [ref=e52] [cursor=pointer]
  - complementary [ref=e53]:
    - generic [ref=e54]:
      - heading [level=2] [ref=e55]: Saved Phrases
      - button [ref=e56] [cursor=pointer]: ×
```

# Test source

```ts
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
  194 |     await expect(phrases).toBeVisible();
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
> 265 |     expect(hasCache).toBe(true);
      |                      ^ Error: expect(received).toBe(expected) // Object.is equality
  266 |   });
  267 | });
  268 | 
```