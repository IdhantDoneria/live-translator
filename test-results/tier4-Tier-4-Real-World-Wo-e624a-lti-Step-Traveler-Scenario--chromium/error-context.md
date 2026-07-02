# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier4.spec.js >> Tier 4: Real-World Workloads >> T4.1: Interactive User Journey (Multi-Step Traveler Scenario)
- Location: tests/tier4.spec.js:10:3

# Error details

```
Error: page.reload: net::ERR_INTERNET_DISCONNECTED
Call log:
  - waiting for navigation until "load"

```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | const { injectSpeechMocks, mockTranslationAPI } = require('./mock-helper');
  3   | 
  4   | test.describe('Tier 4: Real-World Workloads', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await injectSpeechMocks(page);
  7   |     await mockTranslationAPI(page);
  8   |   });
  9   | 
  10  |   test('T4.1: Interactive User Journey (Multi-Step Traveler Scenario)', async ({ page, context }) => {
  11  |     await page.goto('/');
  12  | 
  13  |     // 1. Set languages
  14  |     await page.selectOption('#source-lang', 'en-US');
  15  |     await page.selectOption('#target-lang', 'es-ES');
  16  | 
  17  |     // 2. Translate "Hello, how are you?"
  18  |     await page.click('#start-btn');
  19  |     await page.evaluate(() => window._triggerSpeechResult('Hello, how are you?'));
  20  |     await page.click('#stop-btn');
  21  |     await expect(page.locator('#translated-box')).toHaveText('Hola');
  22  | 
  23  |     // 3. Save to Favorites
  24  |     await page.click('#save-favorite-btn');
  25  | 
  26  |     // 4. Toggle Walkie-Talkie mode
  27  |     await page.evaluate(() => {
  28  |       const el = document.getElementById('mode-toggle');
  29  |       el.checked = true;
  30  |       el.dispatchEvent(new Event('change'));
  31  |     });
  32  | 
  33  |     // 5. Back-and-forth exchange
  34  |     await page.dispatchEvent('#wt-start-a', 'mousedown');
  35  |     await page.evaluate(() => window._triggerSpeechResult('hello'));
  36  |     await page.dispatchEvent('#wt-start-a', 'mouseup');
  37  |     await expect(page.locator('#wt-transcript-b')).toHaveText('Hola');
  38  | 
  39  |     await page.dispatchEvent('#wt-start-b', 'mousedown');
  40  |     await page.evaluate(() => window._triggerSpeechResult('bye'));
  41  |     await page.dispatchEvent('#wt-start-b', 'mouseup');
  42  |     await expect(page.locator('#wt-transcript-a')).toHaveText('Adiós');
  43  | 
  44  |     // 6. Open drawer, select saved favorite, play at 1.2 speed
  45  |     await page.click('#menu-btn');
  46  |     await page.evaluate(() => {
  47  |       const el = document.getElementById('speed-slider');
  48  |       el.value = '1.20';
  49  |       el.dispatchEvent(new Event('input'));
  50  |     });
  51  |     await page.click('#favorites-list .favorite-item .play-btn');
  52  |     
  53  |     const rate = await page.evaluate(() => {
  54  |       return window._spokenUtterances[window._spokenUtterances.length - 1].rate;
  55  |     });
  56  |     expect(rate).toBe(1.2);
  57  | 
  58  |     // 7. Go offline and verify
  59  |     await context.setOffline(true);
> 60  |     await page.reload();
      |                ^ Error: page.reload: net::ERR_INTERNET_DISCONNECTED
  61  |     await expect(page.locator('#start-btn')).toBeVisible();
  62  |   });
  63  | 
  64  |   test('T4.2: High Load Rapid Translation Stream', async ({ page }) => {
  65  |     await page.goto('/');
  66  |     await page.click('#start-btn');
  67  | 
  68  |     // Rapidly trigger 5 speech inputs
  69  |     for (let i = 1; i <= 5; i++) {
  70  |       await page.evaluate((num) => {
  71  |         window._triggerSpeechResult('Speech ' + num);
  72  |       }, i);
  73  |     }
  74  |     await page.click('#stop-btn');
  75  |     // Verify no crash and some content remains
  76  |     const body = page.locator('body');
  77  |     await expect(body).toBeVisible();
  78  |   });
  79  | 
  80  |   test('T4.3: Intensive Speed Adjustment & TTS Stream', async ({ page }) => {
  81  |     await page.goto('/');
  82  |     
  83  |     // Rapidly change rate and speak
  84  |     const rates = ['0.60', '1.10', '1.90', '0.55', '2.00'];
  85  |     for (const rateStr of rates) {
  86  |       await page.evaluate((r) => {
  87  |         const el = document.getElementById('speed-slider');
  88  |         el.value = r;
  89  |         el.dispatchEvent(new Event('input'));
  90  |       }, rateStr);
  91  |       await page.evaluate((r) => {
  92  |         window.tts.play('Speak at ' + r, 'en-US');
  93  |       }, rateStr);
  94  |     }
  95  | 
  96  |     const utterances = await page.evaluate(() => window._spokenUtterances);
  97  |     expect(utterances.length).toBeGreaterThanOrEqual(5);
  98  |     // Last one should match 2.00
  99  |     expect(utterances[utterances.length - 1].rate).toBe(2.0);
  100 |   });
  101 | 
  102 |   test('T4.4: Extensive Favorites Management Workload', async ({ page }) => {
  103 |     await page.context().addInitScript(() => {
  104 |       const favorites = [];
  105 |       for (let i = 1; i <= 10; i++) {
  106 |         favorites.push({
  107 |           id: 'fav-' + i,
  108 |           text: 'Text ' + i,
  109 |           translation: 'Translation ' + i,
  110 |           fromLang: 'en-US',
  111 |           toLang: 'es-ES'
  112 |         });
  113 |       }
  114 |       window.localStorage.setItem('live_translator_favorites', JSON.stringify(favorites));
  115 |     });
  116 | 
  117 |     await page.goto('/');
  118 |     await page.click('#menu-btn');
  119 |     const favItems = page.locator('#favorites-list .favorite-item');
  120 |     const count = await favItems.count();
  121 |     expect(count).toBe(10);
  122 |   });
  123 | 
  124 |   test('T4.5: Full App State Reset and Recovery Workload', async ({ page }) => {
  125 |     await page.goto('/');
  126 |     // Set some state
  127 |     await page.evaluate(() => {
  128 |       window.localStorage.setItem('live_translator_favorites', JSON.stringify([
  129 |         { id: '1', text: 'Old', translation: 'Viejo', fromLang: 'en-US', toLang: 'es-ES' }
  130 |       ]));
  131 |       const el = document.getElementById('speed-slider');
  132 |       el.value = '1.75';
  133 |       el.dispatchEvent(new Event('input'));
  134 |     });
  135 | 
  136 |     // Reset localStorage
  137 |     await page.evaluate(() => {
  138 |       window.localStorage.clear();
  139 |     });
  140 |     await page.reload();
  141 | 
  142 |     // Verify speed resets to default 0.85
  143 |     const sliderValue = await page.locator('#speed-slider').inputValue();
  144 |     expect(sliderValue).toBe('0.85');
  145 |   });
  146 | });
  147 | 
```