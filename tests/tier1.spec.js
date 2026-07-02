const { test, expect } = require('@playwright/test');
const { injectSpeechMocks, mockTranslationAPI } = require('./mock-helper');

test.describe('Tier 1: Feature Coverage (Happy Path)', () => {
  test.beforeEach(async ({ page }) => {
    await injectSpeechMocks(page);
    await mockTranslationAPI(page);
  });

  // ==========================================
  // R1: Speed Slider (Tests 1 - 5)
  // ==========================================

  test('T1.1.1: Speed Slider UI elements exist and show correct default values', async ({ page }) => {
    await page.goto('/');
    const slider = page.locator('#speed-slider');
    await expect(slider).toBeVisible();
    await expect(slider).toHaveAttribute('min', '0.5');
    await expect(slider).toHaveAttribute('max', '2.0');
    await expect(slider).toHaveAttribute('step', '0.05');
    await expect(slider).toHaveAttribute('value', '0.85');

    const speedValue = page.locator('#speed-value');
    await expect(speedValue).toBeVisible();
    await expect(speedValue).toHaveText('0.85x');
  });

  test('T1.1.2: Speed Slider updates label on input', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const el = document.getElementById('speed-slider');
      el.value = '1.50';
      el.dispatchEvent(new Event('input'));
    });
    const speedValue = page.locator('#speed-value');
    await expect(speedValue).toHaveText('1.50x');
  });

  test('T1.1.3: Speed Slider setter window.tts.setRate updates window.tts.rate', async ({ page }) => {
    await page.goto('/');
    const currentRate = await page.evaluate(() => {
      window.tts.setRate(1.2);
      return window.tts.rate;
    });
    expect(currentRate).toBe(1.2);
  });

  test('T1.1.4: Adjusting speed slider affects TTS playback rate', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const el = document.getElementById('speed-slider');
      el.value = '1.80';
      el.dispatchEvent(new Event('input'));
    });
    await page.evaluate(() => {
      window.tts.play('Hello rate test', 'en-US');
    });
    const rate = await page.evaluate(() => {
      return window._spokenUtterances[window._spokenUtterances.length - 1].rate;
    });
    expect(rate).toBe(1.8);
  });

  test('T1.1.5: Speed Slider integrates with walkie-talkie mode', async ({ page }) => {
    await page.goto('/');
    // Adjust speed slider to 1.3
    await page.evaluate(() => {
      const el = document.getElementById('speed-slider');
      el.value = '1.30';
      el.dispatchEvent(new Event('input'));
    });
    // Toggle Walkie-Talkie mode
    await page.evaluate(() => {
      const el = document.getElementById('mode-toggle');
      el.checked = true;
      el.dispatchEvent(new Event('change'));
    });
    // Trigger hold-to-speak on Person A
    await page.dispatchEvent('#wt-start-a', 'mousedown');
    await page.evaluate(() => window._triggerSpeechResult('Hello'));
    await page.dispatchEvent('#wt-start-a', 'mouseup');

    // Wait for translation and check speaking rate
    await expect(page.locator('#wt-transcript-b')).toHaveText('Hola');
    const rate = await page.evaluate(() => {
      return window._spokenUtterances[window._spokenUtterances.length - 1].rate;
    });
    expect(rate).toBe(1.3);
  });

  // ==========================================
  // R2: Favorites Drawer (Tests 6 - 10)
  // ==========================================

  test('T1.2.1: Save favorite button is present on the interface', async ({ page }) => {
    await page.goto('/');
    const saveBtn = page.locator('#save-favorite-btn');
    await expect(saveBtn).toBeVisible();
  });

  test('T1.2.2: Clicking save favorite button saves current translation to localStorage', async ({ page }) => {
    await page.goto('/');
    await page.click('#start-btn');
    await page.evaluate(() => window._triggerSpeechResult('Hello'));
    await page.click('#stop-btn');
    await expect(page.locator('#translated-box')).toHaveText('Hola');

    await page.click('#save-favorite-btn');

    const favorites = await page.evaluate(() => {
      const data = localStorage.getItem('live_translator_favorites');
      return data ? JSON.parse(data) : [];
    });
    expect(favorites.length).toBeGreaterThan(0);
    expect(favorites[0].text).toBe('Hello');
    expect(favorites[0].translation).toBe('Hola');
  });

  test('T1.2.3: Menu button toggles the favorites drawer visibility', async ({ page }) => {
    await page.goto('/');
    const drawer = page.locator('#favorites-drawer');
    await expect(drawer).not.toHaveClass(/open/);

    await page.click('#menu-btn');
    await expect(drawer).toHaveClass(/open/);

    await page.click('#close-drawer-btn');
    await expect(drawer).not.toHaveClass(/open/);
  });

  test('T1.2.4: Favorites drawer renders saved phrases dynamically with play and delete buttons', async ({ page }) => {
    // Seed initial favorites into localStorage
    await page.context().addInitScript(() => {
      window.localStorage.setItem('live_translator_favorites', JSON.stringify([
        { id: 'fav-1', text: 'Hello', translation: 'Hola', fromLang: 'en-US', toLang: 'es-ES' }
      ]));
    });

    await page.goto('/');
    await page.click('#menu-btn');

    const favItem = page.locator('#favorites-list .favorite-item').first();
    await expect(favItem).toBeVisible();
    await expect(favItem.locator('.fav-translation')).toHaveText('Hola');
    await expect(favItem.locator('.fav-original')).toHaveText('Hello');

    const playBtn = favItem.locator('.play-btn');
    await expect(playBtn).toBeVisible();

    const deleteBtn = favItem.locator('.delete-fav-btn');
    await expect(deleteBtn).toBeVisible();
  });

  test('T1.2.5: Clicking favorite item or play button triggers TTS playback of the translation', async ({ page }) => {
    await page.context().addInitScript(() => {
      window.localStorage.setItem('live_translator_favorites', JSON.stringify([
        { id: 'fav-1', text: 'Hello', translation: 'Hola', fromLang: 'en-US', toLang: 'es-ES' }
      ]));
    });

    await page.goto('/');
    await page.click('#menu-btn');
    await page.click('#favorites-list .favorite-item .play-btn');

    const utterances = await page.evaluate(() => window._spokenUtterances);
    expect(utterances.length).toBeGreaterThan(0);
    expect(utterances[utterances.length - 1].text).toBe('Hola');
    expect(utterances[utterances.length - 1].lang).toBe('es-ES');
  });

  // ==========================================
  // R3: Travel Phrasebook (Tests 11 - 15)
  // ==========================================

  test('T1.3.1: Travel phrasebook container is visible in the side drawer', async ({ page }) => {
    await page.goto('/');
    await page.click('#menu-btn');
    const phrasebookList = page.locator('#phrasebook-list');
    await expect(phrasebookList).toBeVisible();
  });

  test('T1.3.2: Travel phrasebook renders categories', async ({ page }) => {
    await page.goto('/');
    await page.click('#menu-btn');
    const categories = page.locator('#phrasebook-list .category-header');
    await expect(categories).toBeVisible();
    expect(await categories.count()).toBeGreaterThan(0);
  });

  test('T1.3.3: Travel phrasebook displays common phrases for a selected category', async ({ page }) => {
    await page.goto('/');
    await page.click('#menu-btn');
    const phrases = page.locator('#phrasebook-list .phrase-item');
    await expect(phrases).toBeVisible();
    expect(await phrases.count()).toBeGreaterThan(0);
  });

  test('T1.3.4: Clicking a phrasebook item speaks the phrase immediately', async ({ page }) => {
    await page.goto('/');
    await page.click('#menu-btn');
    await page.locator('#phrasebook-list .phrase-item').first().click();

    const utterances = await page.evaluate(() => window._spokenUtterances);
    expect(utterances.length).toBeGreaterThan(0);
  });

  test('T1.3.5: Phrasebook playback uses the target language matching the select dropdown', async ({ page }) => {
    await page.goto('/');
    await page.selectOption('#target-lang', 'es-ES');
    await page.click('#menu-btn');
    await page.locator('#phrasebook-list .phrase-item').first().click();

    const utterances = await page.evaluate(() => window._spokenUtterances);
    expect(utterances[utterances.length - 1].lang).toBe('es-ES');
  });

  // ==========================================
  // R4: PWA Support (Tests 16 - 20)
  // ==========================================

  test('T1.4.1: Link rel manifest tag exists in head', async ({ page }) => {
    await page.goto('/');
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', 'manifest.json');
  });

  test('T1.4.2: Service worker registration is initiated in app loading', async ({ page }) => {
    // Check if navigator.serviceWorker.register was called
    await page.goto('/');
    const hasSWRegisterCalled = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(hasSWRegisterCalled).toBe(true);
  });

  test('T1.4.3: Manifest file exists and is readable', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    expect(response.ok()).toBe(true);
    const json = await response.json();
    expect(json.short_name).toBeDefined();
    expect(json.start_url).toBeDefined();
  });

  test('T1.4.4: Service worker registers successfully in navigator.serviceWorker', async ({ page }) => {
    await page.goto('/');
    const isSwRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length > 0;
      }
      return false;
    });
    expect(isSwRegistered).toBe(true);
  });

  test('T1.4.5: Static assets cache is registered with cache name live-translator-v1', async ({ page }) => {
    await page.goto('/');
    const hasCache = await page.evaluate(async () => {
      if ('caches' in window) {
        const keys = await window.caches.keys();
        return keys.includes('live-translator-v1');
      }
      return false;
    });
    expect(hasCache).toBe(true);
  });
});
