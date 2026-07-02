window.tts = {
  rate: 0.85,

  setRate: function(rate) {
    this.rate = rate;
  },

  getBestVoice: function(lang) {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    // We want the general language match (e.g. "en" from "en-US")
    const baseLang = lang.split('-')[0].toLowerCase();

    // 1. Filter voices that match the language (either exactly or base language)
    const matchingVoices = voices.filter(v => v.lang.toLowerCase().startsWith(baseLang));
    
    if (matchingVoices.length === 0) return null;

    // 2. Score voices to find the best quality one
    let bestVoice = matchingVoices[0];
    let highestScore = -1;

    matchingVoices.forEach(voice => {
      let score = 0;
      const name = voice.name.toLowerCase();
      
      // Look for premium identifiers indicating high-quality neural voices
      if (name.includes('premium')) score += 50;
      if (name.includes('enhanced')) score += 40;
      if (name.includes('google')) score += 30; // Google's cloud voices in Chrome
      if (name.includes('siri')) score += 30;   // Siri voices on macOS
      if (name.includes('microsoft')) score += 20; 
      
      // Prefer exact locale match (e.g. en-US over en-GB if en-US is requested)
      if (voice.lang.toLowerCase() === lang.toLowerCase()) score += 10;
      
      if (score > highestScore) {
        highestScore = score;
        bestVoice = voice;
      }
    });
    
    return bestVoice;
  },

  play: function(text, lang) {
    if (!('speechSynthesis' in window)) {
      console.error('Web Speech API is not supported in this browser.');
      return;
    }

    if (!text) {
      console.warn('TTS: No text provided to speak.');
      return;
    }

    try {
      // Cancel any ongoing speech to avoid overlap
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang || 'en-US';
      
      // Set dynamic rate instead of hardcoded 0.85
      utterance.rate = this.rate !== undefined ? this.rate : 0.85;
      
      // Smart voice selection
      const bestVoice = this.getBestVoice(utterance.lang);
      if (bestVoice) {
        utterance.voice = bestVoice;
        console.log(`TTS: Selected premium voice -> ${bestVoice.name}`);
      } else {
        console.log(`TTS: Using default browser voice for -> ${utterance.lang}`);
      }
      
      utterance.onerror = (event) => {
        console.error('TTS Error occurred:', event.error);
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('TTS: Failed to play text.', error);
    }
  },
  
  stop: function() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
};

// Workaround for Chrome and Safari which load voices asynchronously
if ('speechSynthesis' in window) {
  // Trigger initial load
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    // Force voices to refresh when loaded
    window.speechSynthesis.getVoices();
  };
}
