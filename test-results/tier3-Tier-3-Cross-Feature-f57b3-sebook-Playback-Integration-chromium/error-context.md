# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier3.spec.js >> Tier 3: Cross-Feature Integration >> T3.2: Speed Slider + Phrasebook Playback Integration
- Location: tests/tier3.spec.js:40:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#phrasebook-list .phrase-item').first()

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - main [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - heading "Live Translator" [level=1] [ref=e8]
        - generic [ref=e9]:
          - generic [ref=e10]: Standard
          - generic [ref=e11]:
            - checkbox
          - generic [ref=e13]: Walkie-Talkie
        - button "Toggle Saved Phrases Drawer" [expanded] [ref=e14] [cursor=pointer]: 📁 Saved Phrases
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
          - generic [ref=e32]: 1.80x
        - slider "Speech Speed" [ref=e33] [cursor=pointer]: "1.8"
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
  - complementary "Saved Phrases" [ref=e54]:
    - generic [ref=e55]:
      - heading "Saved Phrases" [level=2] [ref=e56]
      - button "Close Saved Phrases Drawer" [active] [ref=e57] [cursor=pointer]: ×
    - list [ref=e59]:
      - listitem [ref=e60]: No saved phrases
```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | const { injectSpeechMocks, mockTranslationAPI } = require('./mock-helper');
  3   | 
  4   | test.describe('Tier 3: Cross-Feature Integration', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await injectSpeechMocks(page);
  7   |     await mockTranslationAPI(page);
  8   |   });
  9   | 
  10  |   test('T3.1: Speed Slider + Favorites Playback Integration', async ({ page }) => {
  11  |     // Seed initial favorites
  12  |     await page.context().addInitScript(() => {
  13  |       window.localStorage.setItem('live_translator_favorites', JSON.stringify([
  14  |         { id: '123', text: 'Hello', translation: 'Hola', fromLang: 'en-US', toLang: 'es-ES' }
  15  |       ]));
  16  |     });
  17  | 
  18  |     await page.goto('/');
  19  |     
  20  |     // Open drawer
  21  |     await page.click('#menu-btn');
  22  | 
  23  |     // Adjust speed slider to 0.70
  24  |     await page.evaluate(() => {
  25  |       const el = document.getElementById('speed-slider');
  26  |       el.value = '0.70';
  27  |       el.dispatchEvent(new Event('input'));
  28  |     });
  29  | 
  30  |     // Play favorite
  31  |     await page.click('#favorites-list .favorite-item .play-btn');
  32  | 
  33  |     // Verify speech playback at rate 0.7
  34  |     const rate = await page.evaluate(() => {
  35  |       return window._spokenUtterances[window._spokenUtterances.length - 1].rate;
  36  |     });
  37  |     expect(rate).toBe(0.7);
  38  |   });
  39  | 
  40  |   test('T3.2: Speed Slider + Phrasebook Playback Integration', async ({ page }) => {
  41  |     await page.goto('/');
  42  |     
  43  |     // Open drawer
  44  |     await page.click('#menu-btn');
  45  | 
  46  |     // Adjust speed slider to 1.80
  47  |     await page.evaluate(() => {
  48  |       const el = document.getElementById('speed-slider');
  49  |       el.value = '1.80';
  50  |       el.dispatchEvent(new Event('input'));
  51  |     });
  52  | 
  53  |     // Click phrasebook item
> 54  |     await page.locator('#phrasebook-list .phrase-item').first().click();
      |                                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
  55  | 
  56  |     // Verify speech playback at rate 1.8
  57  |     const rate = await page.evaluate(() => {
  58  |       return window._spokenUtterances[window._spokenUtterances.length - 1].rate;
  59  |     });
  60  |     expect(rate).toBe(1.8);
  61  |   });
  62  | 
  63  |   test('T3.3: Language Swap & WT Synchronization', async ({ page }) => {
  64  |     await page.goto('/');
  65  |     
  66  |     // Select starting languages
  67  |     await page.selectOption('#source-lang', 'en-US');
  68  |     await page.selectOption('#target-lang', 'es-ES');
  69  | 
  70  |     // Click the swap icon
  71  |     await page.click('.icon-swap');
  72  | 
  73  |     // Verify source and target select dropdown values are swapped
  74  |     const srcVal = await page.locator('#source-lang').inputValue();
  75  |     const tgtVal = await page.locator('#target-lang').inputValue();
  76  |     expect(srcVal).toBe('es-ES');
  77  |     expect(tgtVal).toBe('en-US');
  78  | 
  79  |     // Toggle Walkie-Talkie mode and verify names are swapped
  80  |     await page.evaluate(() => {
  81  |       const el = document.getElementById('mode-toggle');
  82  |       el.checked = true;
  83  |       el.dispatchEvent(new Event('change'));
  84  |     });
  85  |     await expect(page.locator('#wt-name-a')).toContainText('Spanish');
  86  |     await expect(page.locator('#wt-name-b')).toContainText('English');
  87  |   });
  88  | 
  89  |   test('T3.4: PWA Offline Mode + Favorites List Storage Integrity', async ({ page, context }) => {
  90  |     await page.goto('/');
  91  |     
  92  |     // Go offline
  93  |     await context.setOffline(true);
  94  |     await page.reload();
  95  | 
  96  |     // Perform translation
  97  |     await page.click('#start-btn');
  98  |     await page.evaluate(() => window._triggerSpeechResult('Hello offline'));
  99  |     await page.click('#stop-btn');
  100 |     await expect(page.locator('#translated-box')).toHaveText('Hola');
  101 | 
  102 |     // Save translation
  103 |     await page.click('#save-favorite-btn');
  104 | 
  105 |     // Open drawer and verify it is rendered
  106 |     await page.click('#menu-btn');
  107 |     const favItem = page.locator('#favorites-list .favorite-item').first();
  108 |     await expect(favItem).toBeVisible();
  109 |     await expect(favItem.locator('.fav-translation')).toHaveText('Hola');
  110 |   });
  111 | });
  112 | 
```