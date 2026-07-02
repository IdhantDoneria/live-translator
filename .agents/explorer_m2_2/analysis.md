# Speech Speed Slider (R1) Feature Design

This analysis details the implementation strategy for the Speech Speed Slider (R1) feature. The design adds an interactive range slider allowing users to adjust the Text-to-Speech (TTS) speaking rate dynamically between 0.5x and 2.0x, with a default of 0.85x, matching the existing visual theme.

---

## 1. HTML Integration (`public/index.html`)

### Location
The slider should be placed in `public/index.html` within the `<section class="shared-controls">` container, directly below the language selectors (`.lang-selectors`). This is a shared control that applies to both Standard and Walkie-Talkie translation modes.

### Code Proposal
```html
    <!-- Language Selectors (Shared between modes) -->
    <section class="shared-controls">
      <div class="lang-selectors">
        <!-- ... existing selector groups ... -->
      </div>
      
      <!-- Speech Speed Slider Container (R1) -->
      <div class="speed-control-container">
        <div class="speed-control-header">
          <label for="speed-slider">Speech Speed</label>
          <span id="speed-value">0.85x</span>
        </div>
        <input type="range" id="speed-slider" min="0.5" max="2.0" step="0.05" value="0.85">
      </div>
    </section>
```

---

## 2. CSS Styling (`public/css/style.css`)

### Location
Append these styles to the bottom of `public/css/style.css` under the `NEW FEATURES CSS` section.

### Styling Strategy
- **Container**: Employs the existing translucent dark background (`rgba(0, 0, 0, 0.2)`), glassmorphism borders (`var(--glass-border)`), and rounded corners (`16px`) to match `.lang-selectors`.
- **Text & Label**: Styled with the font parameters used in other control headers, showing the speed value dynamically colored with the primary purple theme (`var(--primary)`).
- **Custom Range Slider**: Overrides default OS styling. The track uses a translucent white base, and the thumb features a gradient background (`linear-gradient(135deg, var(--primary), #ec4899)`) mimicking the main buttons. It scales up by 1.2x on hover for tactile visual feedback.

### Code Proposal
```css
/* Speech Speed Slider Styles */
.speed-control-container {
  margin-top: 16px;
  background: rgba(0, 0, 0, 0.2);
  padding: 16px 24px;
  border-radius: 16px;
  border: 1px solid var(--glass-border);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.speed-control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.speed-control-header label {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

#speed-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary);
}

#speed-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  outline: none;
  border: none;
  cursor: pointer;
}

#speed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), #ec4899);
  cursor: pointer;
  transition: transform 0.1s ease;
}

#speed-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

#speed-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), #ec4899);
  cursor: pointer;
  border: none;
  transition: transform 0.1s ease;
}

#speed-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}
```

---

## 3. JavaScript Bindings (`public/js/tts.js` & `public/js/app.js`)

To control the speech rate, two binding approaches can be used. **Option A (Decoupled Approach)** is recommended as it keeps the TTS synthesis logic independent of specific DOM structures.

### Option A: Decoupled via `setRate` interface (Recommended)

#### Changes to `public/js/tts.js`
Modify `window.tts` to declare a default `rate` property, a `setRate` method, and update `play()` to read the rate configuration:

```javascript
window.tts = {
  rate: 0.85, // 1. Added configurable rate property with default 0.85
  
  setRate: function(rate) { // 2. Added setter method
    this.rate = rate;
  },

  getBestVoice: function(lang) {
    // ... no changes ...
  },

  play: function(text, lang) {
    // ... initial checks ...
    try {
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang || 'en-US';
      
      // 3. Set dynamic rate instead of hardcoded 0.85
      utterance.rate = this.rate !== undefined ? this.rate : 0.85;
      
      // ... voice selection & speaking logic ...
    } catch (error) {
      console.error('TTS: Failed to play text.', error);
    }
  },
  
  // ... rest of tts.js ...
};
```

#### Changes to `public/js/app.js`
In the main app controller, bind event listeners under the `DOMContentLoaded` callback:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // ... existing elements ...
    
    // 1. Get Speed Control Elements
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    
    // 2. Initialize TTS rate from the slider default
    if (speedSlider && window.tts && typeof window.tts.setRate === 'function') {
        window.tts.setRate(parseFloat(speedSlider.value));
    }
    
    // 3. Bind input listener to update rate and label dynamically
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (speedValue) speedValue.textContent = `${val.toFixed(2)}x`;
            if (window.tts && typeof window.tts.setRate === 'function') {
                window.tts.setRate(val);
            }
        });
    }

    // ... rest of DOMContentLoaded logic ...
});
```

---

### Option B: Direct DOM Query inside `tts.js`

If direct script coupling is preferred, `public/js/tts.js` can retrieve the slider value on each playback:

#### Changes to `public/js/tts.js`
```javascript
  play: function(text, lang) {
    // ... initial checks ...
    try {
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang || 'en-US';
      
      // Query slider directly from the DOM, falling back to 0.85 if missing
      const speedSlider = document.getElementById('speed-slider');
      utterance.rate = speedSlider ? parseFloat(speedSlider.value) : 0.85;
      
      // ... rest of voice & synthesis logic ...
    } catch (error) {
      console.error('TTS: Failed to play text.', error);
    }
  }
```

#### Changes to `public/js/app.js`
Even with Option B, `app.js` must still listen to slider changes to keep the text display updated:
```javascript
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (speedValue) speedValue.textContent = `${val.toFixed(2)}x`;
        });
    }
```

---

## 4. Verification plan

1. **HTML Inspection**: Ensure `#speed-slider` is rendered with attributes `min="0.5"`, `max="2.0"`, `step="0.05"`, and `value="0.85"`.
2. **Dynamic UI Text**: Dragging the slider should dynamically update the label `#speed-value` to match the exact value followed by `x` (e.g. `1.15x`).
3. **TTS Speaking Rate Verification**:
   - Check that changing the slider updates the value passed to `SpeechSynthesisUtterance.rate`.
   - Play translation audio at `0.5x` (noticeably slow) and `2.0x` (noticeably fast) to confirm the speed changes audibly.
