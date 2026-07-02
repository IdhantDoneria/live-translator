# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier2.spec.js >> Tier 2: Boundary & Corner Cases >> T2.4.1: App recovers gracefully and continues to load cached assets when network is fully offline
- Location: tests/tier2.spec.js:209:3

# Error details

```
Error: page.reload: net::ERR_INTERNET_DISCONNECTED
Call log:
  - waiting for navigation until "load"

```

# Test source

```ts
  112 |   });
  113 | 
  114 |   test('T2.2.3: App handles storage limits/failures gracefully if localStorage throws a quota exceeded error during save', async ({ page }) => {
  115 |     await page.goto('/');
  116 |     const result = await page.evaluate(() => {
  117 |       // Mock localStorage.setItem to throw QuotaExceededError
  118 |       const originalSetItem = localStorage.setItem;
  119 |       localStorage.setItem = () => {
  120 |         throw new DOMException('Mocked Quota Exceeded', 'QuotaExceededError');
  121 |       };
  122 |       
  123 |       try {
  124 |         // Trigger a save attempt if function exists
  125 |         if (typeof window.saveFavorite === 'function') {
  126 |           window.saveFavorite('test text', 'test translation', 'en-US', 'es-ES');
  127 |         }
  128 |         return { success: true };
  129 |       } catch (e) {
  130 |         return { success: false, error: e.message };
  131 |       } finally {
  132 |         localStorage.setItem = originalSetItem;
  133 |       }
  134 |     });
  135 |     expect(result.success).toBe(true);
  136 |   });
  137 | 
  138 |   test('T2.2.4: Duplicate phrases are not saved to favorites list', async ({ page }) => {
  139 |     await page.context().addInitScript(() => {
  140 |       window.localStorage.setItem('live_translator_favorites', JSON.stringify([
  141 |         { id: '1', text: 'Hello', translation: 'Hola', fromLang: 'en-US', toLang: 'es-ES' }
  142 |       ]));
  143 |     });
  144 | 
  145 |     await page.goto('/');
  146 |     // Set standard inputs to match existing favorite
  147 |     await page.selectOption('#source-lang', 'en-US');
  148 |     await page.selectOption('#target-lang', 'es-ES');
  149 |     await page.locator('#transcript-box').evaluate(el => el.textContent = 'Hello');
  150 |     await page.locator('#translated-box').evaluate(el => el.textContent = 'Hola');
  151 | 
  152 |     await page.click('#save-favorite-btn');
  153 | 
  154 |     const favorites = await page.evaluate(() => {
  155 |       return JSON.parse(localStorage.getItem('live_translator_favorites') || '[]');
  156 |     });
  157 |     expect(favorites.length).toBe(1); // Should still be 1 (not duplicated)
  158 |   });
  159 | 
  160 |   test('T2.2.5: Escaping via Escape key closes the open favorites drawer and restores focus', async ({ page }) => {
  161 |     await page.goto('/');
  162 |     const drawer = page.locator('#favorites-drawer');
  163 |     await page.click('#menu-btn');
  164 |     await expect(drawer).toHaveClass(/open/);
  165 | 
  166 |     await page.keyboard.press('Escape');
  167 |     await expect(drawer).not.toHaveClass(/open/);
  168 |   });
  169 | 
  170 |   // ==========================================
  171 |   // R3: Travel Phrasebook (Tests 11 - 15)
  172 |   // ==========================================
  173 | 
  174 |   test('T2.3.1: Travel phrasebook handles empty categories list gracefully without crashes', async ({ page }) => {
  175 |     await page.goto('/');
  176 |     // Check page load isn't broken
  177 |     const menuBtn = page.locator('#menu-btn');
  178 |     await expect(menuBtn).toBeVisible();
  179 |   });
  180 | 
  181 |   test('T2.3.2: Travel phrasebook handles categories list with missing fields/empty strings gracefully', async ({ page }) => {
  182 |     await page.goto('/');
  183 |     const menuBtn = page.locator('#menu-btn');
  184 |     await expect(menuBtn).toBeVisible();
  185 |   });
  186 | 
  187 |   test('T2.3.3: Playback of phrasebook item does not crash if text or translation fields are empty/null', async ({ page }) => {
  188 |     await page.goto('/');
  189 |     const menuBtn = page.locator('#menu-btn');
  190 |     await expect(menuBtn).toBeVisible();
  191 |   });
  192 | 
  193 |   test('T2.3.4: Phrasebook category drawer selection maintains scroll state and styling under quick user switching', async ({ page }) => {
  194 |     await page.goto('/');
  195 |     const menuBtn = page.locator('#menu-btn');
  196 |     await expect(menuBtn).toBeVisible();
  197 |   });
  198 | 
  199 |   test('T2.3.5: Travel phrasebook handles missing voice support for target language by falling back gracefully', async ({ page }) => {
  200 |     await page.goto('/');
  201 |     const menuBtn = page.locator('#menu-btn');
  202 |     await expect(menuBtn).toBeVisible();
  203 |   });
  204 | 
  205 |   // ==========================================
  206 |   // R4: PWA Support (Tests 16 - 20)
  207 |   // ==========================================
  208 | 
  209 |   test('T2.4.1: App recovers gracefully and continues to load cached assets when network is fully offline', async ({ page, context }) => {
  210 |     await page.goto('/');
  211 |     await context.setOffline(true);
> 212 |     await page.reload();
      |                ^ Error: page.reload: net::ERR_INTERNET_DISCONNECTED
  213 |     const body = page.locator('body');
  214 |     await expect(body).toBeVisible();
  215 |   });
  216 | 
  217 |   test('T2.4.2: Service worker responds with a fallback offline page/status or cached shell when API call to translate fails offline', async ({ page, context }) => {
  218 |     await page.goto('/');
  219 |     await context.setOffline(true);
  220 |     // Route translation to mimic network offline error
  221 |     await page.route('**/translate', async (route) => {
  222 |       await route.abort('failed');
  223 |     });
  224 | 
  225 |     await page.click('#start-btn');
  226 |     await page.evaluate(() => window._triggerSpeechResult('Hello'));
  227 |     await page.click('#stop-btn');
  228 | 
  229 |     await expect(page.locator('#translated-box')).toHaveText(/Translation error|error|Network error/i);
  230 |   });
  231 | 
  232 |   test('T2.4.3: Service worker installation doesn\'t break if some optional asset is missing from server', async ({ page }) => {
  233 |     await page.goto('/');
  234 |     const body = page.locator('body');
  235 |     await expect(body).toBeVisible();
  236 |   });
  237 | 
  238 |   test('T2.4.4: App remains functional and doesn\'t crash when service worker registration fails or is blocked by browser', async ({ page }) => {
  239 |     await page.goto('/');
  240 |     const startBtn = page.locator('#start-btn');
  241 |     await expect(startBtn).toBeVisible();
  242 |   });
  243 | 
  244 |   test('T2.4.5: Storage eviction/cache cleanup handles older versions properly by purging them', async ({ page }) => {
  245 |     await page.goto('/');
  246 |     const startBtn = page.locator('#start-btn');
  247 |     await expect(startBtn).toBeVisible();
  248 |   });
  249 | });
  250 | 
```