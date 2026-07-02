# Save / Favorite Phrases (R2) Design Analysis and Recommendations

This document outlines the architectural design and code changes required to implement the Save / Favorite Phrases (R2) feature for the Live Translator application.

---

## 1. Star Icon / Save Button (#save-favorite-btn)

### Recommended Location
In `public/index.html`, inside the standard mode's translation card highlight area (specifically within the `<div class="quick-actions">` block on line 122). Placing the save button here groups it with existing actions like "Copy" and "Share", offering a clean, cohesive user experience.

```html
<!-- Inside public/index.html (approx line 122) -->
<div class="quick-actions">
  <button id="save-favorite-btn" class="icon-btn" title="Save Favorite">⭐ Save</button>
  <button id="copy-btn" class="icon-btn" title="Copy to Clipboard">📋 Copy</button>
  <button id="share-btn" class="icon-btn" title="Share">🔗 Share</button>
</div>
```

### CSS Styling & Visual States
In `public/css/style.css`, we can leverage the existing `.icon-btn` styles and add visual states for active/saved phrases:
```css
/* Save button styling and saved state */
#save-favorite-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

#save-favorite-btn.saved {
  color: #fbbf24; /* Amber-400 (Gold) color */
  border-color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.2);
}
```

### JavaScript Behavior & Logic
In `public/js/app.js`, the button state should be updated dynamically:
1. **Initial state**: Disabled or styled as inactive if there is no translated text yet.
2. **On translation**: When `doTranslation` resolves and renders a new translation, check if the current phrase (source + translation + languages) is already in `localStorage`. If so, add the `.saved` class and update the label to `⭐ Saved`. If not, reset it to `⭐ Save`.
3. **On interaction**:
   - If the current phrase is not saved: add it to favorites, add `.saved` class, update label to `⭐ Saved`.
   - Optional Toggle Behavior: If already saved, clicking it again can remove it from favorites and revert the button state.

---

## 2. LocalStorage Persistence

Favorites will be stored in `localStorage` under the key `'live_translator_favorites'`.

### Data Schema
Each favorite item is saved as a JSON object with the following structure:
```typescript
interface FavoritePhrase {
  id: string;          // Timestamp or unique hash (e.g. Date.now().toString())
  text: string;        // Original transcript text (sourceText)
  translation: string; // Translated text
  fromLang: string;    // Source language code (e.g., 'en-US')
  toLang: string;      // Target language code (e.g., 'es-ES')
}
```

### Helper Functions for Storage
```javascript
// Retrieve favorites array
function getFavorites() {
  try {
    const data = localStorage.getItem('live_translator_favorites');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading from localStorage', e);
    return [];
  }
}

// Write favorites array
function saveFavorites(favorites) {
  try {
    localStorage.setItem('live_translator_favorites', JSON.stringify(favorites));
  } catch (e) {
    console.error('Error writing to localStorage', e);
  }
}

// Check if a translation is already favorited
function isAlreadyFavorited(text, translation, fromLang, toLang) {
  const favorites = getFavorites();
  return favorites.some(fav => 
    fav.text.trim() === text.trim() && 
    fav.translation.trim() === translation.trim() && 
    fav.fromLang === fromLang && 
    fav.toLang === toLang
  );
}
```

---

## 3. Side-Drawer UI Structure

A dedicated slide-out panel is proposed to house the saved phrases list. This drawer can be toggled by a menu button (`#menu-btn`) and closed either by a close button (`#close-drawer-btn`) or by clicking outside the panel.

### HTML Structure
Insert the drawer directly into the root level of `<body>` (e.g., right before the script tags in `public/index.html` at line 163) to ensure it stays outside the main `.app-container` layout boundary.

```html
<!-- Toggle Menu Button (Inside app-header or fixed to top-right) -->
<button id="menu-btn" class="icon-btn menu-btn" title="View Saved Favorites">
  ⭐ Favorites
</button>

<!-- Slide-Out Drawer Panel -->
<div id="favorites-drawer" class="favorites-drawer">
  <div class="drawer-header">
    <h2>Saved Phrases</h2>
    <button id="close-drawer-btn" class="close-btn" title="Close Drawer">&times;</button>
  </div>
  <div class="drawer-content">
    <ul id="favorites-list">
      <!-- Dynamically rendered favorite items go here -->
    </ul>
    <p id="no-favorites-msg" class="placeholder-text" style="display: none; text-align: center; margin-top: 20px;">
      No saved phrases yet.
    </p>
  </div>
</div>

<!-- Optional: Backdrop overlay for closing the drawer on outside click -->
<div id="drawer-overlay" class="drawer-overlay"></div>
```

### CSS Transition and Layout (`public/css/style.css`)
```css
/* Drawer Container */
.favorites-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: rgba(11, 15, 25, 0.95);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border-left: 1px solid var(--glass-border);
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.favorites-drawer.open {
  transform: translateX(0);
}

/* Close & Header styles */
.drawer-header {
  padding: 24px;
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--danger);
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* Backdrop Overlay */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  z-index: 999;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.drawer-overlay.active {
  opacity: 1;
  pointer-events: auto;
}

/* Responsive constraints for smaller viewports */
@media (max-width: 480px) {
  .favorites-drawer {
    width: 100%;
  }
}
```

---

## 4. Rendering and TTS Playing Behavior

### List Item DOM Design
Each item inside `#favorites-list` will contain metadata in data attributes: `data-translation`, `data-tolang`, and `data-id`.

```html
<li class="favorite-item" data-id="1719923456000" data-translation="Hola, ¿cómo estás?" data-tolang="es-ES">
  <div class="favorite-meta">
    <span class="lang-tag">EN ➔ ES</span>
  </div>
  <div class="favorite-body">
    <div class="fav-original">Hello, how are you?</div>
    <div class="fav-translation">Hola, ¿cómo estás?</div>
  </div>
  <div class="favorite-actions">
    <button class="fav-play-btn" title="Speak translation">🔊 Play</button>
    <button class="fav-delete-btn" title="Remove">🗑️</button>
  </div>
</li>
```

### Event Delegation & TTS Call
To keep memory usage minimal and avoid binding listeners for every item, a single event listener will be attached to `#favorites-list` to capture play and delete clicks.

```javascript
// Bind click listener on favorites-list container
const favoritesList = document.getElementById('favorites-list');

favoritesList.addEventListener('click', (e) => {
  const item = e.target.closest('.favorite-item');
  if (!item) return;

  // 1. Check if user clicked Play button or Card Body (for instant play)
  if (e.target.closest('.fav-play-btn') || e.target.closest('.favorite-body')) {
    const translation = item.dataset.translation;
    const toLang = item.dataset.tolang;
    
    // Trigger window.tts.play using system-provided speech engine
    if (window.tts && typeof window.tts.play === 'function') {
      window.tts.play(translation, toLang);
    } else {
      console.error('TTS engine is not initialized.');
    }
    return;
  }

  // 2. Check if user clicked Delete button
  if (e.target.closest('.fav-delete-btn')) {
    const id = item.dataset.id;
    removeFavoriteById(id);
    return;
  }
});
```

### Removing Favorites & Synchronizing UI State
```javascript
function removeFavoriteById(id) {
  let favorites = getFavorites();
  favorites = favorites.filter(fav => fav.id !== id);
  saveFavorites(favorites);
  renderFavorites();
  
  // Re-verify the current standard translation box to reset the star button state if needed
  updateSaveButtonState();
}

function renderFavorites() {
  const favorites = getFavorites();
  const listElement = document.getElementById('favorites-list');
  const noFavsMsg = document.getElementById('no-favorites-msg');
  
  if (!listElement) return;
  
  listElement.innerHTML = '';
  
  if (favorites.length === 0) {
    if (noFavsMsg) noFavsMsg.style.display = 'block';
    return;
  }
  
  if (noFavsMsg) noFavsMsg.style.display = 'none';
  
  favorites.forEach(fav => {
    // Format helper to display brief clean language tags (e.g. EN ➔ ES)
    const srcShort = fav.fromLang.split('-')[0].toUpperCase();
    const tgtShort = fav.toLang.split('-')[0].toUpperCase();
    
    const li = document.createElement('li');
    li.className = 'favorite-item';
    li.setAttribute('data-id', fav.id);
    li.setAttribute('data-translation', fav.translation);
    li.setAttribute('data-tolang', fav.toLang);
    
    li.innerHTML = `
      <div class="favorite-meta">
        <span class="lang-tag">${srcShort} ➔ ${tgtShort}</span>
      </div>
      <div class="favorite-body">
        <div class="fav-original">${escapeHtml(fav.text)}</div>
        <div class="fav-translation">${escapeHtml(fav.translation)}</div>
      </div>
      <div class="favorite-actions">
        <button class="fav-play-btn icon-btn" title="Speak translation">🔊 Play</button>
        <button class="fav-delete-btn icon-btn" title="Remove">🗑️</button>
      </div>
    `;
    listElement.appendChild(li);
  });
}

// Utility function to avoid HTML injections
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}
```

---

## 5. Integration Plan Summary

1. **HTML Updates**: Modify `public/index.html` to add the `#save-favorite-btn` within standard mode translation `.quick-actions`, place the toggle `#menu-btn` near the header, and add the `#favorites-drawer` container before script imports.
2. **CSS Styling**: Add styles for `.favorites-drawer`, `.drawer-overlay`, `.favorite-item` card layouts, and active status highlights for `#save-favorite-btn.saved` inside `public/css/style.css`.
3. **App Logic Updates**: Append DOM node selections, event listeners (for menu open, close, overlay click, save button toggle), and render loops to `public/js/app.js`.
4. **TTS Integration**: Hook the list card play button directly into `window.tts.play` to respect the custom playback rate configured by the Speech Speed control slider (R1).
