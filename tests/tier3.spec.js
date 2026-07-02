const { test, expect } = require('@playwright/test');
const { injectSpeechMocks, mockTranslationAPI } = require('./mock-helper');

test.describe('Tier 3: Cross-Feature Integration', () => {
  test.beforeEach(async ({ page }) => {
    await injectSpeechMocks(page);
    await mockTranslationAPI(page);
  });

  test('T3.1: Speed Slider + Favorites Playback Integration', async ({ page }) => {
    // Seed initial favorites
    await page.context().addInitScript(() => {
      window.localStorage.setItem('live_translator_favorites', JSON.stringify([
        { id: '123', text: 'Hello', translation: 'Hola', fromLang: 'en-US', toLang: 'es-ES' }
      ]));
    });

    await page.goto('/');
    
    // Open drawer
    await page.click('#menu-btn');

    // Adjust speed slider to 0.70
    await page.evaluate(() => {
      const el = document.getElementById('speed-slider');
      el.value = '0.70';
      el.dispatchEvent(new Event('input'));
    });

    // Play favorite
    await page.click('#favorites-list .favorite-item .play-btn');

    // Verify speech playback at rate 0.7
    const rate = await page.evaluate(() => {
      return window._spokenUtterances[window._spokenUtterances.length - 1].rate;
    });
    expect(rate).toBe(0.7);
  });

  test('T3.2: Speed Slider + Phrasebook Playback Integration', async ({ page }) => {
    await page.goto('/');
    
    // Open drawer
    await page.click('#menu-btn');

    // Adjust speed slider to 1.80
    await page.evaluate(() => {
      const el = document.getElementById('speed-slider');
      el.value = '1.80';
      el.dispatchEvent(new Event('input'));
    });

    // Click phrasebook item
    await page.locator('#phrasebook-list .phrase-item').first().click();

    // Verify speech playback at rate 1.8
    const rate = await page.evaluate(() => {
      return window._spokenUtterances[window._spokenUtterances.length - 1].rate;
    });
    expect(rate).toBe(1.8);
  });

  test('T3.3: Language Swap & WT Synchronization', async ({ page }) => {
    await page.goto('/');
    
    // Select starting languages
    await page.selectOption('#source-lang', 'en-US');
    await page.selectOption('#target-lang', 'es-ES');

    // Click the swap icon
    await page.click('.icon-swap');

    // Verify source and target select dropdown values are swapped
    const srcVal = await page.locator('#source-lang').inputValue();
    const tgtVal = await page.locator('#target-lang').inputValue();
    expect(srcVal).toBe('es-ES');
    expect(tgtVal).toBe('en-US');

    // Toggle Walkie-Talkie mode and verify names are swapped
    await page.evaluate(() => {
      const el = document.getElementById('mode-toggle');
      el.checked = true;
      el.dispatchEvent(new Event('change'));
    });
    await expect(page.locator('#wt-name-a')).toContainText('Spanish');
    await expect(page.locator('#wt-name-b')).toContainText('English');
  });

  test('T3.4: PWA Offline Mode + Favorites List Storage Integrity', async ({ page, context }) => {
    await page.goto('/');
    
    // Go offline
    await context.setOffline(true);
    await page.reload();

    // Perform translation
    await page.click('#start-btn');
    await page.evaluate(() => window._triggerSpeechResult('Hello offline'));
    await page.click('#stop-btn');
    await expect(page.locator('#translated-box')).toHaveText('Hola');

    // Save translation
    await page.click('#save-favorite-btn');

    // Open drawer and verify it is rendered
    await page.click('#menu-btn');
    const favItem = page.locator('#favorites-list .favorite-item').first();
    await expect(favItem).toBeVisible();
    await expect(favItem.locator('.fav-translation')).toHaveText('Hola');
  });
});
