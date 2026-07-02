const { expect } = require('@playwright/test');

// Inject STT and TTS mocks
async function injectSpeechMocks(page) {
  await page.addInitScript(() => {
    // Mock SpeechRecognition / webkitSpeechRecognition
    class MockSpeechRecognition {
      constructor() {
        this.continuous = false;
        this.interimResults = false;
        this.lang = 'en-US';
      }
      start() {
        if (this.onstart) {
          setTimeout(() => this.onstart(), 10);
        }
        window._triggerSpeechResult = (text, isFinal = true) => {
          if (this.onresult) {
            const event = {
              resultIndex: 0,
              results: [
                Object.assign([
                  { transcript: text }
                ], { isFinal: isFinal })
              ]
            };
            this.onresult(event);
          }
        };
      }
      stop() {
        if (this.onend) {
          setTimeout(() => this.onend(), 10);
        }
      }
    }

    Object.defineProperty(window, 'SpeechRecognition', {
      value: MockSpeechRecognition,
      writable: true,
      configurable: true
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      value: MockSpeechRecognition,
      writable: true,
      configurable: true
    });

    // Mock speechSynthesis
    const spokenUtterances = [];
    window._spokenUtterances = spokenUtterances;

    class MockSpeechSynthesisUtterance {
      constructor(text) {
        this.text = text;
        this.lang = 'en-US';
        this.rate = 1.0;
        this.voice = null;
      }
    }

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: MockSpeechSynthesisUtterance,
      writable: true,
      configurable: true
    });

    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        getVoices: () => [
          { name: 'Google US English', lang: 'en-US' },
          { name: 'Google Spanish', lang: 'es-ES' },
          { name: 'Google French', lang: 'fr-FR' },
          { name: 'Google German', lang: 'de-DE' }
        ],
        speak: (utt) => {
          spokenUtterances.push({
            text: utt.text,
            lang: utt.lang,
            rate: utt.rate,
            voiceName: utt.voice ? utt.voice.name : null
          });
          if (utt.onend) {
            setTimeout(() => utt.onend(), 10);
          } else {
            // Fallback trigger if onend wasn't attached as property but event listener
            const event = new Event('end');
            if (typeof utt.dispatchEvent === 'function') {
              utt.dispatchEvent(event);
            }
          }
        },
        cancel: () => {},
        onvoiceschanged: null
      },
      writable: true,
      configurable: true
    });
  });
}

// Mock translate responses
async function mockTranslationAPI(page, customTranslations = {}) {
  await page.route('**/translate', async (route) => {
    const payload = route.request().postDataJSON();
    let translatedText = 'Mocked Translation';
    
    if (payload && payload.text) {
      const textLower = payload.text.toLowerCase();
      if (customTranslations[textLower]) {
        translatedText = customTranslations[textLower];
      } else if (textLower.includes('train')) {
        translatedText = '¿Dónde está la estación de tren?';
      } else if (textLower.includes('thank')) {
        translatedText = 'Gracias';
      } else if (textLower.includes('hello')) {
        translatedText = 'Hola';
      } else if (textLower.includes('bye')) {
        translatedText = 'Adiós';
      }
    }
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ translatedText })
    });
  });
}

module.exports = {
  injectSpeechMocks,
  mockTranslationAPI
};
