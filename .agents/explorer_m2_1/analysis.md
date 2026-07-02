# Speech Speed Slider (R1) Analysis and Design Report

## Executive Summary
This report details the architectural design and implementation plan for the **Speech Speed Slider (R1)** feature of the Live Translator. The requirements specify:
- Adding a range slider (id: `#speed-slider`, range: `0.5` to `2.0`, default `0.85`).
- Styling the slider to match the glassmorphic neon aesthetic in `style.css`.
- Binding changes of the slider to the Text-to-Speech (TTS) rate in `tts.js` via `app.js` using the defined interface contracts.

---

## 1. HTML Insertion (public/index.html)

### Location Recommendation
The speech speed setting applies globally to translations produced by both **Standard** and **Walkie-Talkie** modes. Therefore, the optimal place to insert the slider is within `<section class="shared-controls">` in `public/index.html`, right below the `<div class="lang-selectors">` container (approx. lines 82-83).

### Proposed HTML Snippet
```html
    <!-- Language Selectors (Shared between modes) -->
    <section class="shared-controls">
      <div class="lang-selectors">
        ...
      </div>

      <!-- Speech Speed Control (New) -->
      <div class="speed-control-container">
        <label for="speed-slider">
          Speech Speed: <span id="speed-value">0.85x</span>
        </label>
        <input 
          type="range" 
          id="speed-slider" 
          min="0.5" 
          max="2.0" 
          step="0.05" 
          value="0.85"
          aria-label="Speech Speed"
        >
      </div>
    </section>
```

---

## 2. CSS Styling (public/css/style.css)

### Styling Approach
The slider and its container must fit within the glassmorphism theme defined in `style.css` (using `--glass-bg`, `--glass-border`, and the violet accent color `--primary: #8b5cf6`).

We recommend appending the following rules to the **NEW FEATURES CSS** section (around line 386):

### Proposed CSS Snippet
```css
/* Speech Speed Slider Container */
.speed-control-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(0, 0, 0, 0.2);
  padding: 20px 24px;
  border-radius: 16px;
  border: 1px solid var(--glass-border);
  margin-top: 20px;
}

.speed-control-container label {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.speed-control-container label span {
  color: var(--primary);
  font-weight: 700;
}

/* Custom Slider Styling */
#speed-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  cursor: pointer;
  transition: background 0.3s ease;
}

/* Chrome, Safari, Opera, and Edge */
#speed-slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 6px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

#speed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  height: 18px;
  width: 18px;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
  margin-top: -6px; /* Center thumb vertically on track */
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
  transition: transform 0.1s ease, background-color 0.3s ease;
}

#speed-slider::-webkit-slider-thumb:hover {
  background: var(--primary-hover);
  transform: scale(1.15);
}

/* Firefox */
#speed-slider::-moz-range-track {
  width: 100%;
  height: 6px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

#speed-slider::-moz-range-thumb {
  height: 18px;
  width: 18px;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
  border: none;
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
  transition: transform 0.1s ease, background-color 0.3s ease;
}

#speed-slider::-moz-range-thumb:hover {
  background: var(--primary-hover);
  transform: scale(1.15);
}
```

---

## 3. JS Binding Logic (public/js/tts.js & public/js/app.js)

To follow clean separation of concerns, the Speech Synthesis library (`tts.js`) should expose a property and setter, while the application controller (`app.js`) handles DOM events and passes data to it.

### A. Modifications in `public/js/tts.js`
1. Add `rate: 0.85,` as a property of `window.tts`.
2. Add a helper function `setRate(rate)` to set the speech speed rate.
3. Update `play(text, lang)` to use `this.rate` instead of the hardcoded `0.85`.

#### Before:
```javascript
      // Slow down the speech slightly for better comprehension
      utterance.rate = 0.85;
```

#### After:
```javascript
      // Use the dynamically configured rate
      utterance.rate = this.rate;
```

#### Full proposed `tts.js` additions/changes:
```javascript
window.tts = {
  rate: 0.85, // Default speech speed rate

  setRate: function(newRate) {
    const rateVal = parseFloat(newRate);
    if (!isNaN(rateVal) && rateVal >= 0.5 && rateVal <= 2.0) {
      this.rate = rateVal;
      console.log(`TTS: Speech rate updated to ${this.rate}`);
    } else {
      console.warn(`TTS: Invalid rate value: ${newRate}`);
    }
  },

  getBestVoice: function(lang) {
     ...
  },

  play: function(text, lang) {
      ...
      // Slow down the speech slightly for better comprehension
      utterance.rate = this.rate;
      ...
  }
}
```

### B. Modifications in `public/js/app.js`
In the DOMContentLoaded event listener (inside `public/js/app.js`), we must:
1. Reference the `#speed-slider` and `#speed-value` elements.
2. Bind an `'input'` event listener to the slider to update the displayed speed text and propagate the value change to `window.tts.setRate(val)`.

#### Proposed Additions to `app.js`:
```javascript
    // Speech Speed Control Elements
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');

    if (speedSlider) {
        // Initialize values based on window.tts default state
        if (window.tts) {
            speedSlider.value = window.tts.rate;
        }
        if (speedValue) {
            speedValue.textContent = `${parseFloat(speedSlider.value).toFixed(2)}x`;
        }

        // Bind input events to update dynamic rate
        speedSlider.addEventListener('input', (e) => {
            const currentVal = parseFloat(e.target.value);
            if (window.tts && typeof window.tts.setRate === 'function') {
                window.tts.setRate(currentVal);
            }
            if (speedValue) {
                speedValue.textContent = `${currentVal.toFixed(2)}x`;
            }
        });
    }
```

---

## 4. Alternative Approaches Considered

### Alternative: Direct DOM query in `tts.js`
Instead of having `app.js` handle DOM events and call `window.tts.setRate`, `tts.js` could directly retrieve the rate from the input slider during playback:
```javascript
const speedSlider = document.getElementById('speed-slider');
utterance.rate = speedSlider ? parseFloat(speedSlider.value) : 0.85;
```
- **Pros**: Fewer changes to `app.js`, simpler code mapping.
- **Cons**: Violates modular architecture guidelines. If the translator is used programmatically or if the slider's DOM ID changes in the future, it causes silent failures in `tts.js`.

**Recommendation**: Use the `window.tts.setRate` dynamic property model. It complies with the interface contracts defined in `PROJECT.md` and provides clean separation of DOM interaction from Web Speech API mechanics.
