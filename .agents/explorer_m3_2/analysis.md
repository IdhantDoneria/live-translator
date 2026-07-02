# Save / Favorite Phrases (R2) Design Analysis and Recommendations

## 1. Summary of Proposed Design

To implement the **Save / Favorite Phrases (R2)** feature, we propose the following changes:
- **Save Favorite Button (`#save-favorite-btn`)**: Integrated into standard mode's translation quick-action buttons panel (`.quick-actions`). It allows users to bookmark/favorite the currently translated text.
- **Drawer Menu Toggle (`#menu-btn`)**: Placed in the application header top bar next to the mode toggler to open the favorites drawer.
- **Sliding Drawer Container (`#favorites-drawer`)**: Placed at the body root level to overlay on top of the main container, containing a header, close button (`#close-drawer-btn`), and list container (`#favorites-list`).
- **`localStorage` Synchronization**: Saved phrases are stored as an array of JSON objects under key `'live_translator_favorites'`.
- **Text-to-Speech (TTS) Integration**: In the drawer list, clicking a favorite item triggers immediate TTS audio playback of the translation using the helper function `window.tts.play(translation, toLang)`.

---

## 2. HTML Structure Modifications (`public/index.html`)

### 2.1. Menu/Saved Toggler (`#menu-btn`)
Add a new drawer trigger button to the `.header-top` section:

```html
<!-- BEFORE (Lines 29-39) -->
<div class="header-top">
  <h1>Live Translator</h1>
  <div class="mode-toggle-container">
    ...
  </div>
</div>

<!-- AFTER -->
<div class="header-top">
  <button id="menu-btn" class="icon-btn menu-btn" title="Saved Phrases">⭐ Saved Phrases</button>
  <h1>Live Translator</h1>
  <div class="mode-toggle-container">
    ...
  </div>
</div>
```

### 2.2. Save Button (`#save-favorite-btn`)
Add the star save button inside the `.quick-actions` div of the translation results card:

```html
<!-- BEFORE (Lines 121-126) -->
<div class="quick-actions">
  <button id="copy-btn" class="icon-btn" title="Copy to Clipboard">📋 Copy</button>
  <button id="share-btn" class="icon-btn" title="Share">🔗 Share</button>
</div>

<!-- AFTER -->
<div class="quick-actions">
  <button id="save-favorite-btn" class="icon-btn" title="Save to Favorites" disabled>⭐ Save</button>
  <button id="copy-btn" class="icon-btn" title="Copy to Clipboard">📋 Copy</button>
  <button id="share-btn" class="icon-btn" title="Share">🔗 Share</button>
</div>
```

### 2.3. Drawer Markup & Overlay
Insert the side-drawer markup directly inside the `<body>` (e.g., right before the first script tag at line 164) to ensure absolute overlay positioning is untruncated by parents:

```html
<!-- Favorites Drawer Structure (R2) -->
<div id="drawer-overlay" class="drawer-overlay"></div>
<div id="favorites-drawer" class="drawer">
  <div class="drawer-header">
    <h2>Saved Phrases</h2>
    <button id="close-drawer-btn" class="close-btn" aria-label="Close saved phrases drawer">&times;</button>
  </div>
  <div class="drawer-content">
    <ul id="favorites-list">
      <!-- Dynamically generated list items go here -->
    </ul>
  </div>
</div>
```

---

## 3. Styling Specifications (`public/css/style.css`)

The following CSS should be appended to `public/css/style.css` to govern the look, position, and transition animations of the sliding drawer and overlay:

```css
/* Drawer overlay background */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 99;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.drawer-overlay.active {
  opacity: 1;
  pointer-events: auto;
}

/* Side drawer layout and sliding */
.drawer {
  position: fixed;
  top: 0;
  right: -400px;
  width: 400px;
  height: 100vh;
  background: rgba(11, 15, 25, 0.95);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border-left: 1px solid var(--glass-border);
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
  z-index: 100;
  transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}
.drawer.open {
  right: 0;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--glass-border);
}
.drawer-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  background: linear-gradient(to right, #a855f7, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
  transition: color 0.2s ease;
}
.close-btn:hover {
  color: var(--danger);
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
#favorites-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Favorite List Card Styling */
.favorite-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.favorite-item:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-1px);
}
.favorite-original {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-style: italic;
}
.favorite-translation {
  font-size: 1.1rem;
  color: white;
  font-weight: 600;
}
.favorite-langs {
  font-size: 0.75rem;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.delete-fav-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1.1rem;
  transition: color 0.2s ease;
}
.delete-fav-btn:hover {
  color: var(--danger);
}

/* Menu Button and Save Button layout compatibility */
.menu-btn {
  align-self: flex-start;
}
.icon-btn.active-favorite {
  background: rgba(139, 92, 246, 0.2);
  border-color: var(--primary);
  color: #fbbf24; /* Warm Gold Star */
}

/* Responsive Drawer width */
@media (max-width: 480px) {
  .drawer {
    width: 100%;
    right: -100%;
  }
}
```

---

## 4. Application Logic & Script Changes (`public/js/app.js`)

We will place the logic inside the main `DOMContentLoaded` callback in `public/js/app.js`.

### 4.1. DOM Elements Selection
Select the newly added elements:
```javascript
const saveFavoriteBtn = document.getElementById('save-favorite-btn');
const menuBtn = document.getElementById('menu-btn');
const favoritesDrawer = document.getElementById('favorites-drawer');
const closeDrawerBtn = document.getElementById('close-drawer-btn');
const favoritesList = document.getElementById('favorites-list');
const drawerOverlay = document.getElementById('drawer-overlay');
```

### 4.2. LocalStorage Helpers
Maintain helper functions for serialization and deserialization:
```javascript
const LOCAL_STORAGE_KEY = 'live_translator_favorites';

function getFavorites() {
    try {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Failed to parse favorites from localStorage', e);
        return [];
    }
}

function saveFavorites(favorites) {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
        console.error('Failed to write favorites to localStorage', e);
    }
}
```

### 4.3. UI Render & Favorite Card Playback Click Handlers
Generate card elements dynamically and bind TTS play events on mouse clicks:
```javascript
function renderFavorites() {
    if (!favoritesList) return;
    const favorites = getFavorites();
    favoritesList.innerHTML = '';

    if (favorites.length === 0) {
        favoritesList.innerHTML = `
            <li class="placeholder-text" style="text-align: center; margin-top: 20px; color: var(--text-muted); font-style: italic;">
                No saved phrases yet.
            </li>
        `;
        return;
    }

    favorites.forEach(fav => {
        const li = document.createElement('li');
        li.className = 'favorite-item';
        li.dataset.id = fav.id;

        // Display labels showing translated language transformation
        const fromShort = fav.fromLang.split('-')[0].toUpperCase();
        const toShort = fav.toLang.split('-')[0].toUpperCase();

        li.innerHTML = `
            <div class="favorite-langs">${fromShort} &rarr; ${toShort}</div>
            <div class="favorite-original">${escapeHtml(fav.text)}</div>
            <div class="favorite-translation">${escapeHtml(fav.translation)}</div>
            <button class="delete-fav-btn" title="Delete Saved Phrase">&times;</button>
        `;

        // 4. Bind a click listener that plays the translation aloud instantly
        li.addEventListener('click', (e) => {
            // Exclude clicks targeting the delete button
            if (e.target.classList.contains('delete-fav-btn')) {
                return;
            }
            if (window.tts && typeof window.tts.play === 'function') {
                window.tts.play(fav.translation, fav.toLang);
            }
        });

        // Bind delete action handler
        const deleteBtn = li.querySelector('.delete-fav-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent playing TTS
            removeFavorite(fav.id);
        });

        favoritesList.appendChild(li);
    });
}

function removeFavorite(id) {
    let favorites = getFavorites();
    favorites = favorites.filter(fav => fav.id !== id);
    saveFavorites(favorites);
    renderFavorites();
    updateSaveButtonState();
}

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
```

### 4.4. State-Updating & Button Toggling
Disable the save button if translation boxes hold empty/placeholder values. Toggle star styling depending on if current phrase is already saved:
```javascript
function updateSaveButtonState() {
    if (!saveFavoriteBtn) return;

    const text = transcriptBox ? transcriptBox.textContent.trim() : '';
    const translation = translatedBox ? translatedBox.textContent.trim() : '';
    const fromLang = sourceSelect ? sourceSelect.value : '';
    const toLang = targetSelect ? targetSelect.value : '';

    const hasPlaceholder = 
        !text || text === 'Listening will appear here...' || 
        !translation || translation === 'Translation will appear here...';

    if (hasPlaceholder) {
        saveFavoriteBtn.disabled = true;
        saveFavoriteBtn.innerHTML = '⭐ Save';
        saveFavoriteBtn.classList.remove('active-favorite');
        return;
    }

    saveFavoriteBtn.disabled = false;
    const favorites = getFavorites();
    const isSaved = favorites.some(fav => 
        fav.text === text && 
        fav.translation === translation && 
        fav.fromLang === fromLang && 
        fav.toLang === toLang
    );

    if (isSaved) {
        saveFavoriteBtn.innerHTML = '★ Saved';
        saveFavoriteBtn.classList.add('active-favorite');
    } else {
        saveFavoriteBtn.innerHTML = '⭐ Save';
        saveFavoriteBtn.classList.remove('active-favorite');
    }
}
```

### 4.5. DOM Event Binding & Triggers
Bind actions when DOM loads, selections change, and text translation is resolved:
```javascript
// Toggle Drawer Open
if (menuBtn && favoritesDrawer) {
    menuBtn.addEventListener('click', () => {
        favoritesDrawer.classList.add('open');
        if (drawerOverlay) drawerOverlay.classList.add('active');
        renderFavorites();
    });
}

// Toggle Drawer Close
if (closeDrawerBtn && favoritesDrawer) {
    closeDrawerBtn.addEventListener('click', () => {
        favoritesDrawer.classList.remove('open');
        if (drawerOverlay) drawerOverlay.classList.remove('active');
    });
}

// Overlay dismisses drawer
if (drawerOverlay && favoritesDrawer) {
    drawerOverlay.addEventListener('click', () => {
        favoritesDrawer.classList.remove('open');
        drawerOverlay.classList.remove('active');
    });
}

// Save/Favorite Button Action Trigger
if (saveFavoriteBtn) {
    saveFavoriteBtn.addEventListener('click', () => {
        const text = transcriptBox.textContent.trim();
        const translation = translatedBox.textContent.trim();
        const fromLang = sourceSelect.value;
        const toLang = targetSelect.value;

        if (!text || text === 'Listening will appear here...' || !translation || translation === 'Translation will appear here...') {
            return;
        }

        let favorites = getFavorites();
        const index = favorites.findIndex(fav => 
            fav.text === text && 
            fav.translation === translation && 
            fav.fromLang === fromLang && 
            fav.toLang === toLang
        );

        if (index !== -1) {
            // Toggle off (remove from favorites)
            favorites.splice(index, 1);
        } else {
            // Toggle on (add to favorites)
            favorites.push({
                id: Date.now().toString(),
                text,
                translation,
                fromLang,
                toLang
            });
        }

        saveFavorites(favorites);
        updateSaveButtonState();
        if (favoritesDrawer.classList.contains('open')) {
            renderFavorites();
        }
    });
}

// Triggers for state updating on dynamic changes
if (sourceSelect) sourceSelect.addEventListener('change', updateSaveButtonState);
if (targetSelect) targetSelect.addEventListener('change', updateSaveButtonState);
```

#### Inside `doTranslation`:
Inside the translation completion logic (approx. line 135 in `app.js`):
```javascript
            if (response.ok) {
                const data = await response.json();
                const translatedText = data.translatedText || data.translation || data.text || data.result;
                
                if (resultBox) resultBox.textContent = translatedText;
                
                if (window.tts && typeof window.tts.play === 'function' && translatedText) {
                    window.tts.play(translatedText, tgtCode);
                }

                // Update standard mode favorites button state if translating to the main translation box
                if (resultBox === translatedBox) {
                    updateSaveButtonState();
                }
            }
```

---

## 5. Verification Method

Once implemented, the feature can be verified by the following sequence:
1. **Initial Load**: Check that the drawer is fully hidden (`right: -400px` on styling rule) and that `#save-favorite-btn` displays `⭐ Save` and is disabled (since fields contain placeholder transcripts).
2. **First Translation**: Input speech or text translation. Once translation displays, verify `#save-favorite-btn` enables.
3. **Adding to Favorites**: Click `#save-favorite-btn`. Confirm its class updates to `.active-favorite`, text toggles to `★ Saved`, and `localStorage.getItem('live_translator_favorites')` contains a single entry matching the correct data format structure `{ id, text, translation, fromLang, toLang }`.
4. **Side Drawer Toggle**: Click `#menu-btn`. The drawer should slide from the right, overlay activation dimming the main page. The list must show the newly added favorite item.
5. **TTS Playback**: Click the favorite item card inside the drawer. Verify that a spy on `window.tts.play` receives `(translation, toLang)` as arguments, and playback sounds.
6. **Deletion**: Click the `&times;` (`.delete-fav-btn`) on the item. Confirm that `localStorage` is updated, the item is removed from the drawer DOM, and `#save-favorite-btn` reverts to `⭐ Save` state if it was displaying the deleted phrase.
