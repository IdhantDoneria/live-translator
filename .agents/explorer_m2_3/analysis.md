# Speech Speed Slider (R1) - Synthesis and Design Report

This report presents the synthesized design and implementation recommendations for the **Speech Speed Slider (R1)** feature for the Live Translator application. The design allows users to dynamically adjust the Text-to-Speech (TTS) playback rate between 0.5x and 2.0x, with a default value of 0.85x.

---

## Synthesis of Peer Analyses

We have cataloged and synthesized findings from investigations performed by `explorer_m2_1` and `explorer_m2_2`.

### 1. Consensus
- **Feature Scope**: Add a range slider (`#speed-slider`) with a range of `0.5` to `2.0` and a default value of `0.85`.
- **Granularity (Step)**: The slider step size must be set to `0.05` (e.g., `step="0.05"`). This is mathematically required to target the exact default value of `0.85` (as `0.5 + 7 * 0.05 = 0.85`).
- **Insertion Point**: The slider must be inserted in `public/index.html` under the `shared-controls` section, directly below the `.lang-selectors` container. This ensures the speed control is persistent and applicable to both Standard and Walkie-Talkie translation modes.
- **Styling Aesthetics**: The container and range input should respect the existing glassmorphic theme, utilizing a translucent background (`rgba(0, 0, 0, 0.2)`), glass-border (`var(--glass-border)`), and a gradient thumb matching the primary buttons (`linear-gradient(135deg, var(--primary), #ec4899)`).
- **Core JS Architecture**: We recommend a decoupled approach (Option A) where `tts.js` exposes a dynamic `rate` property and updates its playback logic, while `app.js` handles DOM events, updates the UI display, and invokes the TTS rate updater.

### 2. Resolved Conflicts & Enhancements
- **HTML Element Structure**: 
  - *Conflict*: `explorer_m2_1` suggested nesting the `#speed-value` inside the `<label>`, whereas `explorer_m2_2` recommended a dedicated `.speed-control-header` container containing the `<label>` and `<span>` as siblings.
  - *Resolution*: The sibling layout inside `.speed-control-header` is preferred. Nesting interactive/display elements inside `<label>` can trigger unintended browser focus behaviors, and separating them makes the header flexbox styling cleaner and cleaner to align.
- **Defensive JS Code**: 
  - We adopt `explorer_m2_1`'s suggestion to include defensive range validation in the `setRate(newRate)` function inside `tts.js` (ensuring it is a valid float between 0.5 and 2.0) before assigning it.
- **Hover Transitions**:
  - We recommend scaling the slider thumb to `1.2x` on hover and transitioning it smoothly (`transition: transform 0.1s ease`).

---

## Detailed Feature Design Recommendations

### 1. HTML Integration (`public/index.html`)

Insert the Speech Speed Slider markup directly after the language selectors wrapper inside `<section class="shared-controls">`:

#### Proposed Change:
```html
    <!-- Language Selectors (Shared between modes) -->
    <section class="shared-controls">
      <div class="lang-selectors">
        <!-- ... existing selector content ... -->
      </div>
      
      <!-- Speech Speed Slider Container (R1) -->
      <div class="speed-control-container">
        <div class="speed-control-header">
          <label for="speed-slider">Speech Speed</label>
          <span id="speed-value" class="speed-value-display">0.85x</span>
        </div>
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

### 2. CSS Styling (`public/css/style.css`)

Append the following styles to the bottom of the style sheet under the `NEW FEATURES CSS` section (around line 508):

#### Proposed Change:
```css
/* Speech Speed Slider Container & UI Elements */
.speed-control-container {
  margin-top: 20px;
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

.speed-value-display {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary);
}

/* Range Input Customization */
#speed-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  outline: none;
  border: none;
  cursor: pointer;
}

/* Chrome, Safari, Opera, Edge Track & Thumb */
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
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), #ec4899);
  cursor: pointer;
  margin-top: -6px; /* Vertical centering on track */
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
  transition: transform 0.15s ease;
}

#speed-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

/* Firefox Track & Thumb */
#speed-slider::-moz-range-track {
  width: 100%;
  height: 6px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

#speed-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), #ec4899);
  cursor: pointer;
  border: none;
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
  transition: transform 0.15s ease;
}

#speed-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}
```

---

### 3. JavaScript Bindings (`public/js/tts.js` & `public/js/app.js`)

We recommend implementing the **Decoupled Architecture (Option A)**.

#### A. Modifications in `public/js/tts.js`
Update the `window.tts` object definition to declare a configurable property, validate incoming updates, and read from it in `play()`.

```javascript
window.tts = {
  rate: 0.85, // Default speech speed rate

  // Validation wrapper for updating speed rate
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
    // ... no changes ...
  },

  play: function(text, lang) {
    // ... initial checks ...
    try {
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang || 'en-US';
      
      // Update from hardcoded 0.85 to dynamic property
      utterance.rate = this.rate;
      
      // ... voice selection & play logic ...
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
```

#### B. Modifications in `public/js/app.js`
Inside the DOMContentLoaded event listener, add slider event wiring to synchronize UI state and call the TTS controller.

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // ... existing variable definitions ...

    // Speed Control Elements (R1)
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');

    if (speedSlider) {
        // Sync the controller's initial rate with the slider's default DOM state
        if (window.tts) {
            window.tts.setRate(speedSlider.value);
        }
        if (speedValue) {
            speedValue.textContent = `${parseFloat(speedSlider.value).toFixed(2)}x`;
        }

        // Bind input event to update rate and text display in real-time
        speedSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (speedValue) {
                speedValue.textContent = `${val.toFixed(2)}x`;
            }
            if (window.tts && typeof window.tts.setRate === 'function') {
                window.tts.setRate(val);
            }
        });
    }

    // ... rest of DOMContentLoaded listener ...
});
```

---

## Verification Plan

To verify the correct behavior of the Speech Speed Slider feature, perform the following:

1. **Verify Markup & Default Attributes**:
   - Inspect the element `#speed-slider` inside the browser DevTools.
   - Confirm attributes: `min="0.5"`, `max="2.0"`, `step="0.05"`, and `value="0.85"`.
2. **Verify Dynamic Text Binding**:
   - Slide the control. Confirm that the span element `#speed-value` updates in real-time to match the exact slider value (e.g. `1.05x`, `1.40x`).
3. **Verify Audio Output Rate (TTS Validation)**:
   - Perform a translation in **Standard Mode** or **Walkie-Talkie Mode**.
   - With the slider set to `0.5x`, trigger the translation speaker. Confirm speech playback is distinctively slow.
   - With the slider set to `2.0x`, trigger the translation speaker. Confirm speech playback is distinctively fast.
