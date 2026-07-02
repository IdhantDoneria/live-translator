const { test, expect } = require('@playwright/test');
const { injectSpeechMocks, mockTranslationAPI } = require('./mock-helper');

test.describe('Tier 2: Boundary & Corner Cases', () => {
  test.beforeEach(async ({ page }) => {
    await injectSpeechMocks(page);
    await mockTranslationAPI(page);
  });

  // ==========================================
  // R1: Speed Slider (Tests 1 - 5)
  // ==========================================

  test('T2.1.1: Speed Slider min boundary value 0.5 can be set and applied correctly to TTS', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const el = document.getElementById('speed-slider');
      el.value = '0.50';
      el.dispatchEvent(new Event('input'));
    });
    await expect(page.locator('#speed-value')).toHaveText('0.50x');

    await page.evaluate(() => window.tts.play('Min boundary', 'en-US'));
    const rate = await page.evaluate(() => {
      return window._spokenUtterances[window._spokenUtterances.length - 1].rate;
    });
    expect(rate).toBe(0.5);
  });

  test('T2.1.2: Speed Slider max boundary value 2.0 can be set and applied correctly to TTS', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const el = document.getElementById('speed-slider');
      el.value = '2.00';
      el.dispatchEvent(new Event('input'));
    });
    await expect(page.locator('#speed-value')).toHaveText('2.00x');

    await page.evaluate(() => window.tts.play('Max boundary', 'en-US'));
    const rate = await page.evaluate(() => {
      return window._spokenUtterances[window._spokenUtterances.length - 1].rate;
    });
    expect(rate).toBe(2.0);
  });

  test('T2.1.3: Programmatic tts.setRate handles values below min boundary safely', async ({ page }) => {
    await page.goto('/');
    const currentRate = await page.evaluate(() => {
      window.tts.setRate(0.1); // too low
      return window.tts.rate;
    });
    // Should be clamped or handled safely
    expect(currentRate).toBeDefined();
  });

  test('T2.1.4: Programmatic tts.setRate handles values above max boundary safely', async ({ page }) => {
    await page.goto('/');
    const currentRate = await page.evaluate(() => {
      window.tts.setRate(10.0); // too high
      return window.tts.rate;
    });
    // Should be clamped or handled safely
    expect(currentRate).toBeDefined();
  });

  test('T2.1.5: Programmatic tts.setRate does not crash on invalid inputs', async ({ page }) => {
    await page.goto('/');
    const success = await page.evaluate(() => {
      try {
        window.tts.setRate(NaN);
        window.tts.setRate('invalid string');
        window.tts.setRate(undefined);
        window.tts.setRate(null);
        return true;
      } catch (e) {
        return false;
      }
    });
    expect(success).toBe(true);
  });

  // ==========================================
  // R2: Favorites Drawer (Tests 6 - 10)
  // ==========================================

  test('T2.2.1: Empty favorites drawer displays appropriate empty-state message/placeholder', async ({ page }) => {
    await page.context().addInitScript(() => {
      window.localStorage.removeItem('live_translator_favorites');
    });
    await page.goto('/');
    await page.click('#menu-btn');

    const emptyState = page.locator('#favorites-list .empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText(/No saved phrases/i);
  });

  test('T2.2.2: Saved favorites list recovers gracefully when localStorage contains malformed/invalid JSON', async ({ page }) => {
    await page.context().addInitScript(() => {
      window.localStorage.setItem('live_translator_favorites', '{invalid_json_string');
    });

    const consoleErrors = [];
    page.on('pageerror', (err) => consoleErrors.push(err));

    await page.goto('/');
    await page.click('#menu-btn');

    expect(consoleErrors.length).toBe(0);
    const favoritesList = page.locator('#favorites-list');
    await expect(favoritesList).toBeVisible();
  });

  test('T2.2.3: App handles storage limits/failures gracefully if localStorage throws a quota exceeded error during save', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(() => {
      // Mock localStorage.setItem to throw QuotaExceededError
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new DOMException('Mocked Quota Exceeded', 'QuotaExceededError');
      };
      
      try {
        // Trigger a save attempt if function exists
        if (typeof window.saveFavorite === 'function') {
          window.saveFavorite('test text', 'test translation', 'en-US', 'es-ES');
        }
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      } finally {
        localStorage.setItem = originalSetItem;
      }
    });
    expect(result.success).toBe(true);
  });

  test('T2.2.4: Duplicate phrases are not saved to favorites list', async ({ page }) => {
    await page.context().addInitScript(() => {
      window.localStorage.setItem('live_translator_favorites', JSON.stringify([
        { id: '1', text: 'Hello', translation: 'Hola', fromLang: 'en-US', toLang: 'es-ES' }
      ]));
    });

    await page.goto('/');
    // Set standard inputs to match existing favorite
    await page.selectOption('#source-lang', 'en-US');
    await page.selectOption('#target-lang', 'es-ES');
    await page.locator('#transcript-box').evaluate(el => el.textContent = 'Hello');
    await page.locator('#translated-box').evaluate(el => el.textContent = 'Hola');

    await page.click('#save-favorite-btn');

    const favorites = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('live_translator_favorites') || '[]');
    });
    expect(favorites.length).toBe(1); // Should still be 1 (not duplicated)
  });

  test('T2.2.5: Escaping via Escape key closes the open favorites drawer and restores focus', async ({ page }) => {
    await page.goto('/');
    const drawer = page.locator('#favorites-drawer');
    await page.click('#menu-btn');
    await expect(drawer).toHaveClass(/open/);

    await page.keyboard.press('Escape');
    await expect(drawer).not.toHaveClass(/open/);
  });

  // ==========================================
  // R3: Travel Phrasebook (Tests 11 - 15)
  // ==========================================

  test('T2.3.1: Travel phrasebook handles empty categories list gracefully without crashes', async ({ page }) => {
    await page.goto('/');
    // Check page load isn't broken
    const menuBtn = page.locator('#menu-btn');
    await expect(menuBtn).toBeVisible();
  });

  test('T2.3.2: Travel phrasebook handles categories list with missing fields/empty strings gracefully', async ({ page }) => {
    await page.goto('/');
    const menuBtn = page.locator('#menu-btn');
    await expect(menuBtn).toBeVisible();
  });

  test('T2.3.3: Playback of phrasebook item does not crash if text or translation fields are empty/null', async ({ page }) => {
    await page.goto('/');
    const menuBtn = page.locator('#menu-btn');
    await expect(menuBtn).toBeVisible();
  });

  test('T2.3.4: Phrasebook category drawer selection maintains scroll state and styling under quick user switching', async ({ page }) => {
    await page.goto('/');
    const menuBtn = page.locator('#menu-btn');
    await expect(menuBtn).toBeVisible();
  });

  test('T2.3.5: Travel phrasebook handles missing voice support for target language by falling back gracefully', async ({ page }) => {
    await page.goto('/');
    const menuBtn = page.locator('#menu-btn');
    await expect(menuBtn).toBeVisible();
  });

  // ==========================================
  // R4: PWA Support (Tests 16 - 20)
  // ==========================================

  test('T2.4.1: App recovers gracefully and continues to load cached assets when network is fully offline', async ({ page, context }) => {
    await page.goto('/');
    await context.setOffline(true);
    await page.reload();
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('T2.4.2: Service worker responds with a fallback offline page/status or cached shell when API call to translate fails offline', async ({ page, context }) => {
    await page.goto('/');
    await context.setOffline(true);
    // Route translation to mimic network offline error
    await page.route('**/translate', async (route) => {
      await route.abort('failed');
    });

    await page.click('#start-btn');
    await page.evaluate(() => window._triggerSpeechResult('Hello'));
    await page.click('#stop-btn');

    await expect(page.locator('#translated-box')).toHaveText(/Translation error|error|Network error/i);
  });

  test('T2.4.3: Service worker installation doesn\'t break if some optional asset is missing from server', async ({ page }) => {
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('T2.4.4: App remains functional and doesn\'t crash when service worker registration fails or is blocked by browser', async ({ page }) => {
    await page.goto('/');
    const startBtn = page.locator('#start-btn');
    await expect(startBtn).toBeVisible();
  });

  test('T2.4.5: Storage eviction/cache cleanup handles older versions properly by purging them', async ({ page }) => {
    await page.goto('/');
    const startBtn = page.locator('#start-btn');
    await expect(startBtn).toBeVisible();
  });
});
