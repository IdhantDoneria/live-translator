const { test, expect } = require('@playwright/test');
const { injectSpeechMocks, mockTranslationAPI } = require('./mock-helper');

test.describe('Tier 4: Real-World Workloads', () => {
  test.beforeEach(async ({ page }) => {
    await injectSpeechMocks(page);
    await mockTranslationAPI(page);
  });

  test('T4.1: Interactive User Journey (Multi-Step Traveler Scenario)', async ({ page, context }) => {
    await page.goto('/');

    // 1. Set languages
    await page.selectOption('#source-lang', 'en-US');
    await page.selectOption('#target-lang', 'es-ES');

    // 2. Translate "Hello, how are you?"
    await page.click('#start-btn');
    await page.evaluate(() => window._triggerSpeechResult('Hello, how are you?'));
    await page.click('#stop-btn');
    await expect(page.locator('#translated-box')).toHaveText('Hola');

    // 3. Save to Favorites
    await page.click('#save-favorite-btn');

    // 4. Toggle Walkie-Talkie mode
    await page.evaluate(() => {
      const el = document.getElementById('mode-toggle');
      el.checked = true;
      el.dispatchEvent(new Event('change'));
    });

    // 5. Back-and-forth exchange
    await page.dispatchEvent('#wt-start-a', 'mousedown');
    await page.evaluate(() => window._triggerSpeechResult('hello'));
    await page.dispatchEvent('#wt-start-a', 'mouseup');
    await expect(page.locator('#wt-transcript-b')).toHaveText('Hola');

    await page.dispatchEvent('#wt-start-b', 'mousedown');
    await page.evaluate(() => window._triggerSpeechResult('bye'));
    await page.dispatchEvent('#wt-start-b', 'mouseup');
    await expect(page.locator('#wt-transcript-a')).toHaveText('Adiós');

    // 6. Open drawer, select saved favorite, play at 1.2 speed
    await page.click('#menu-btn');
    await page.evaluate(() => {
      const el = document.getElementById('speed-slider');
      el.value = '1.20';
      el.dispatchEvent(new Event('input'));
    });
    await page.click('#favorites-list .favorite-item .play-btn');
    
    const rate = await page.evaluate(() => {
      return window._spokenUtterances[window._spokenUtterances.length - 1].rate;
    });
    expect(rate).toBe(1.2);

    // 7. Go offline and verify
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#start-btn')).toBeVisible();
  });

  test('T4.2: High Load Rapid Translation Stream', async ({ page }) => {
    await page.goto('/');
    await page.click('#start-btn');

    // Rapidly trigger 5 speech inputs
    for (let i = 1; i <= 5; i++) {
      await page.evaluate((num) => {
        window._triggerSpeechResult('Speech ' + num);
      }, i);
    }
    await page.click('#stop-btn');
    // Verify no crash and some content remains
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('T4.3: Intensive Speed Adjustment & TTS Stream', async ({ page }) => {
    await page.goto('/');
    
    // Rapidly change rate and speak
    const rates = ['0.60', '1.10', '1.90', '0.55', '2.00'];
    for (const rateStr of rates) {
      await page.evaluate((r) => {
        const el = document.getElementById('speed-slider');
        el.value = r;
        el.dispatchEvent(new Event('input'));
      }, rateStr);
      await page.evaluate((r) => {
        window.tts.play('Speak at ' + r, 'en-US');
      }, rateStr);
    }

    const utterances = await page.evaluate(() => window._spokenUtterances);
    expect(utterances.length).toBeGreaterThanOrEqual(5);
    // Last one should match 2.00
    expect(utterances[utterances.length - 1].rate).toBe(2.0);
  });

  test('T4.4: Extensive Favorites Management Workload', async ({ page }) => {
    await page.context().addInitScript(() => {
      const favorites = [];
      for (let i = 1; i <= 10; i++) {
        favorites.push({
          id: 'fav-' + i,
          text: 'Text ' + i,
          translation: 'Translation ' + i,
          fromLang: 'en-US',
          toLang: 'es-ES'
        });
      }
      window.localStorage.setItem('live_translator_favorites', JSON.stringify(favorites));
    });

    await page.goto('/');
    await page.click('#menu-btn');
    const favItems = page.locator('#favorites-list .favorite-item');
    const count = await favItems.count();
    expect(count).toBe(10);
  });

  test('T4.5: Full App State Reset and Recovery Workload', async ({ page }) => {
    await page.goto('/');
    // Set some state
    await page.evaluate(() => {
      window.localStorage.setItem('live_translator_favorites', JSON.stringify([
        { id: '1', text: 'Old', translation: 'Viejo', fromLang: 'en-US', toLang: 'es-ES' }
      ]));
      const el = document.getElementById('speed-slider');
      el.value = '1.75';
      el.dispatchEvent(new Event('input'));
    });

    // Reset localStorage
    await page.evaluate(() => {
      window.localStorage.clear();
    });
    await page.reload();

    // Verify speed resets to default 0.85
    const sliderValue = await page.locator('#speed-slider').inputValue();
    expect(sliderValue).toBe('0.85');
  });
});
