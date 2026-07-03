document.addEventListener('DOMContentLoaded', () => {
    // Standard Elements
    const sourceSelect = document.getElementById('source-lang');
    const targetSelect = document.getElementById('target-lang');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const transcriptBox = document.getElementById('transcript-box');
    const translatedBox = document.getElementById('translated-box');
    
    // Quick Actions
    const copyBtn = document.getElementById('copy-btn');
    const shareBtn = document.getElementById('share-btn');

    // Walkie Talkie Elements
    const wtContainer = document.getElementById('walkie-talkie-container');
    const stdContainer = document.getElementById('standard-mode-container');
    const modeToggle = document.getElementById('mode-toggle');
    const lblStandard = document.getElementById('label-standard');
    const lblWt = document.getElementById('label-wt');
    
    const wtNameA = document.getElementById('wt-name-a');
    const wtNameB = document.getElementById('wt-name-b');
    const wtStartA = document.getElementById('wt-start-a');
    const wtStartB = document.getElementById('wt-start-b');
    const wtTranscriptA = document.getElementById('wt-transcript-a');
    const wtTranscriptB = document.getElementById('wt-transcript-b');

    // Speed Control Elements (R1)
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');

    // Initialize TTS rate from the slider default
    if (speedSlider && window.tts && typeof window.tts.setRate === 'function') {
        window.tts.setRate(parseFloat(speedSlider.value));
    }

    // Bind input listener to update rate and label dynamically
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (speedValue) speedValue.textContent = `${val.toFixed(2)}x`;
            if (window.tts && typeof window.tts.setRate === 'function') {
                window.tts.setRate(val);
            }
        });
    }

    // 1. Populate Languages
    if (window.LANGUAGES) {
        const populateSelect = (selectElem) => {
            selectElem.innerHTML = '';
            let entries = Array.isArray(window.LANGUAGES) 
                ? window.LANGUAGES.map(lang => [lang.code, lang.name])
                : Object.entries(window.LANGUAGES);
            
            for (const [code, name] of entries) {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = name;
                selectElem.appendChild(option);
            }
        };

        if (sourceSelect) populateSelect(sourceSelect);
        if (targetSelect) populateSelect(targetSelect);

        const setEnglishDefault = (selectElem) => {
            if (!selectElem) return;
            const options = Array.from(selectElem.options);
            const enOption = options.find(opt => opt.value === 'en-US' || opt.value === 'en');
            if (enOption) selectElem.value = enOption.value;
        };

        setEnglishDefault(sourceSelect);
        if (targetSelect) {
            const esOption = Array.from(targetSelect.options).find(o => o.value === 'es-ES');
            targetSelect.value = esOption ? esOption.value : targetSelect.options[0].value;
        }
        
        updateWtNames();
    }

    // Update Walkie-Talkie names based on select
    sourceSelect.addEventListener('change', updateWtNames);
    targetSelect.addEventListener('change', updateWtNames);

    // Language Swap Logic
    const swapIcon = document.querySelector('.icon-swap');
    if (swapIcon) {
        swapIcon.style.cursor = 'pointer'; // Ensure it's visually clickable
        swapIcon.addEventListener('click', () => {
            const temp = sourceSelect.value;
            sourceSelect.value = targetSelect.value;
            targetSelect.value = temp;
            
            sourceSelect.dispatchEvent(new Event('change'));
            targetSelect.dispatchEvent(new Event('change'));
        });
    }

    function updateWtNames() {
        const aName = sourceSelect.options[sourceSelect.selectedIndex].text;
        const bName = targetSelect.options[targetSelect.selectedIndex].text;
        if(wtNameA) wtNameA.textContent = `Person A (${aName})`;
        if(wtNameB) wtNameB.textContent = `Person B (${bName})`;
    }

    // 2. Mode Switching Logic
    modeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            stdContainer.style.display = 'none';
            wtContainer.style.display = 'block';
            lblWt.classList.add('active');
            lblStandard.classList.remove('active');
        } else {
            stdContainer.style.display = 'block';
            wtContainer.style.display = 'none';
            lblStandard.classList.add('active');
            lblWt.classList.remove('active');
        }
    });

    // Helper: Translate & Speak
    async function doTranslation(text, srcCode, tgtCode, resultBox) {
        if (!text || !text.trim()) return;
        try {
            let fromCode = 'auto', toCode = 'en';
            if (Array.isArray(window.LANGUAGES)) {
                const srcObj = window.LANGUAGES.find(l => l.code === srcCode);
                if (srcObj && srcObj.translateCode) fromCode = srcObj.translateCode;
                const tgtObj = window.LANGUAGES.find(l => l.code === tgtCode);
                if (tgtObj && tgtObj.translateCode) toCode = tgtObj.translateCode;
            }

            const response = await fetch('/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, from: fromCode, to: toCode })
            });
            
            if (response.ok) {
                const data = await response.json();
                const translatedText = data.translatedText || data.translation || data.text || data.result;
                
                if (resultBox) resultBox.textContent = translatedText;
                
                if (window.tts && typeof window.tts.play === 'function' && translatedText) {
                    window.tts.play(translatedText, tgtCode);
                }
            } else {
                if (resultBox) resultBox.textContent = 'Translation error.';
            }
        } catch (error) {
            console.error(error);
            if (resultBox) resultBox.textContent = 'Network error.';
        }
    }

    // 3. Standard Mode STT Logic
    if (startBtn && stopBtn) {
        startBtn.addEventListener('click', () => {
            const srcCode = sourceSelect.value;
            const tgtCode = targetSelect.value;
            
            startBtn.disabled = true;
            stopBtn.disabled = false;
            startBtn.classList.add('listening');
            if (window.visualizer) window.visualizer.start();
            
            window.stt.start(srcCode, 
                (text) => { if (transcriptBox) transcriptBox.textContent = text; },
                async (text) => {
                    if (transcriptBox) transcriptBox.textContent = text;
                    await doTranslation(text, srcCode, tgtCode, translatedBox);
                }
            );
        });

        stopBtn.addEventListener('click', () => {
            startBtn.disabled = false;
            stopBtn.disabled = true;
            startBtn.classList.remove('listening');
            window.stt.stop();
            if (window.visualizer) window.visualizer.stop();
        });
    }

    // 4. Walkie-Talkie STT Logic (Hold to Speak)
    function setupWtButton(btn, isPersonA) {
        if (!btn) return;
        
        const startListening = () => {
            const srcCode = isPersonA ? sourceSelect.value : targetSelect.value;
            const tgtCode = isPersonA ? targetSelect.value : sourceSelect.value;
            const transcriptElem = isPersonA ? wtTranscriptA : wtTranscriptB;
            const translateElem = isPersonA ? wtTranscriptB : wtTranscriptA;
            
            btn.classList.add('listening');
            if (window.visualizer) window.visualizer.start();
            
            window.stt.start(srcCode,
                (text) => { transcriptElem.textContent = text; translateElem.textContent = 'Translating...'; },
                async (text) => {
                    transcriptElem.textContent = text;
                    await doTranslation(text, srcCode, tgtCode, translateElem);
                }
            );
        };

        const stopListening = () => {
            btn.classList.remove('listening');
            window.stt.stop();
            if (window.visualizer) window.visualizer.stop();
        };

        btn.addEventListener('mousedown', startListening);
        btn.addEventListener('mouseup', stopListening);
        btn.addEventListener('mouseleave', stopListening);
        
        // Touch support
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); startListening(); });
        btn.addEventListener('touchend', stopListening);
    }

    setupWtButton(wtStartA, true);
    setupWtButton(wtStartB, false);

    // 5. Quick Actions Logic
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            const text = translatedBox.textContent;
            if (text && text !== 'Translation will appear here...') {
                try {
                    await navigator.clipboard.writeText(text);
                    const original = copyBtn.innerHTML;
                    copyBtn.innerHTML = '✅ Copied!';
                    setTimeout(() => copyBtn.innerHTML = original, 2000);
                } catch (err) {
                    console.error('Failed to copy', err);
                }
            }
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const text = translatedBox.textContent;
            if (text && text !== 'Translation will appear here...') {
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: 'Live Translation',
                            text: text,
                        });
                    } catch (err) {
                        console.error('Error sharing', err);
                    }
                } else {
                    // Fallback to copy
                    copyBtn.click();
                }
            }
        });
    }

    // ==========================================
    // Save / Favorite Phrases (R2) Integration
    // ==========================================

    // Favorites Elements
    const menuBtn = document.getElementById('menu-btn');
    const openDrawerBtn = document.getElementById('open-drawer-btn');
    const closeDrawerBtn = document.getElementById('close-drawer-btn');
    const favoritesDrawer = document.getElementById('favorites-drawer');
    const drawerOverlay = document.getElementById('drawer-overlay');
    const favoritesList = document.getElementById('favorites-list');
    const saveFavoriteBtn = document.getElementById('save-favorite-btn');

    // LocalStorage Operations
    function getFavorites() {
        try {
            const stored = localStorage.getItem('live_translator_favorites');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Failed to parse favorites from localStorage", e);
            return [];
        }
    }

    function saveFavorite(text, translation, fromLang, toLang) {
        if (!text || text === 'Listening will appear here...' || 
            !translation || translation === 'Translation will appear here...' ||
            text === 'Waiting...' || translation === 'Translating...') {
            return false;
        }

        const favorites = getFavorites();

        // Prevent duplicate entries
        const isDuplicate = favorites.some(fav => 
            fav.text.trim() === text.trim() && 
            fav.fromLang === fromLang && 
            fav.toLang === toLang
        );
        if (isDuplicate) return false;

        const newFavorite = {
            id: Date.now().toString(),
            text: text.trim(),
            translation: translation.trim(),
            fromLang,
            toLang
        };

        favorites.push(newFavorite);
        localStorage.setItem('live_translator_favorites', JSON.stringify(favorites));
        return true;
    }

    function deleteFavorite(id) {
        let favorites = getFavorites();
        favorites = favorites.filter(fav => fav.id !== id);
        localStorage.setItem('live_translator_favorites', JSON.stringify(favorites));
    }

    // Dynamic Render Function
    function renderFavorites() {
        if (!favoritesList) return;
        
        const favorites = getFavorites();
        favoritesList.innerHTML = '';
        
        if (favorites.length === 0) {
            const emptyLi = document.createElement('li');
            emptyLi.className = 'empty-state';
            emptyLi.textContent = 'No saved phrases';
            favoritesList.appendChild(emptyLi);
            return;
        }
        
        favorites.forEach(fav => {
            const li = document.createElement('li');
            li.className = 'favorite-item';
            li.setAttribute('role', 'button');
            li.setAttribute('tabindex', '0');
            li.setAttribute('aria-label', `Play translation: ${fav.translation}`);
            
            const fromBase = fav.fromLang.split('-')[0].toUpperCase();
            const toBase = fav.toLang.split('-')[0].toUpperCase();
            
            li.innerHTML = `
                <div class="fav-text-container">
                    <span class="fav-translation">${fav.translation}</span>
                    <span class="fav-original">${fav.text}</span>
                    <span class="fav-langs">${fromBase} &rarr; ${toBase}</span>
                </div>
                <div class="fav-actions">
                    <button class="play-btn icon-btn" title="Play TTS" aria-label="Play translation">🔊 Play</button>
                    <button class="delete-fav-btn" title="Delete Saved Phrase" aria-label="Delete saved phrase">&times;</button>
                </div>
            `;
            
            // TTS Playback
            const playTranslation = () => {
                if (window.tts && typeof window.tts.play === 'function') {
                    window.tts.play(fav.translation, fav.toLang);
                }
            };
            
            // Clicking list item body triggers TTS
            li.addEventListener('click', playTranslation);
            
            // Keyboard accessibility: Enter or Space to play
            li.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    playTranslation();
                }
            });
            
            // Play button click (stop propagation)
            const playBtn = li.querySelector('.play-btn');
            if (playBtn) {
                playBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    playTranslation();
                });
            }
            
            // Delete button click (stop propagation)
            const deleteBtn = li.querySelector('.delete-fav-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteFavorite(fav.id);
                    renderFavorites();
                });
            }
            
            favoritesList.appendChild(li);
        });
    }

    // Toggle Drawer Visibility
    function toggleDrawer(isOpen) {
        if (favoritesDrawer) {
            favoritesDrawer.classList.toggle('open', isOpen);
            favoritesDrawer.setAttribute('aria-hidden', !isOpen);
        }
        if (drawerOverlay) {
            drawerOverlay.classList.toggle('open', isOpen);
            drawerOverlay.setAttribute('aria-hidden', !isOpen);
        }
        if (menuBtn) {
            menuBtn.setAttribute('aria-expanded', isOpen);
        }
        
        if (isOpen) {
            renderFavorites();
            if (closeDrawerBtn) {
                closeDrawerBtn.focus();
            }
        } else {
            if (menuBtn) {
                menuBtn.focus();
            }
        }
    }

    // Event Handlers for Toggle Controls
    if (menuBtn) {
        menuBtn.addEventListener('click', () => toggleDrawer(true));
    }
    if (openDrawerBtn) {
        openDrawerBtn.addEventListener('click', () => toggleDrawer(true));
    }
    if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener('click', () => toggleDrawer(false));
    }
    if (drawerOverlay) {
        drawerOverlay.addEventListener('click', () => toggleDrawer(false));
    }

    // Escape key to close drawer
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && favoritesDrawer && favoritesDrawer.classList.contains('open')) {
            toggleDrawer(false);
        }
    });

    // Wire Save Button Event Handler
    if (saveFavoriteBtn) {
        saveFavoriteBtn.addEventListener('click', () => {
            const text = transcriptBox.textContent.trim();
            const translation = translatedBox.textContent.trim();
            const fromLang = sourceSelect.value;
            const toLang = targetSelect.value;
            
            const success = saveFavorite(text, translation, fromLang, toLang);
            if (success) {
                // Visual Feedback
                const originalText = saveFavoriteBtn.innerHTML;
                saveFavoriteBtn.innerHTML = '⭐ Saved!';
                saveFavoriteBtn.classList.add('active');
                setTimeout(() => {
                    saveFavoriteBtn.innerHTML = originalText;
                    saveFavoriteBtn.classList.remove('active');
                }, 2000);
                
                // Refresh Drawer if open
                if (favoritesDrawer && favoritesDrawer.classList.contains('open')) {
                    renderFavorites();
                }
            }
        });
    }
    // ==========================================
    // Drawer Tabs (R3) - Switch between Favorites & Phrasebook
    // ==========================================
    const drawerTabs = document.querySelectorAll('.drawer-tab');
    const tabPanels = document.querySelectorAll('.tab-panel');

    drawerTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            drawerTabs.forEach(t => t.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            const panel = document.getElementById(`tab-${targetTab}`);
            if (panel) panel.classList.add('active');

            if (targetTab === 'phrasebook') {
                renderPhrasebook();
            } else {
                renderFavorites();
            }
        });
    });

    // ==========================================
    // Emergency / Travel Phrasebook (R3)
    // ==========================================
    const phrasebookContainer = document.getElementById('phrasebook-categories');

    function renderPhrasebook() {
        if (!phrasebookContainer || !window.PHRASEBOOK) return;

        phrasebookContainer.innerHTML = '';
        const targetLang = targetSelect.value;

        window.PHRASEBOOK.forEach(cat => {
            const section = document.createElement('div');
            section.className = 'phrasebook-category';

            const header = document.createElement('button');
            header.className = 'phrasebook-category-header';
            header.innerHTML = `<span>${cat.category}</span><span class="chevron">▸</span>`;
            header.setAttribute('aria-expanded', 'false');

            const list = document.createElement('ul');
            list.className = 'phrasebook-list collapsed';

            header.addEventListener('click', () => {
                const isExpanded = !list.classList.contains('collapsed');
                list.classList.toggle('collapsed');
                header.setAttribute('aria-expanded', !isExpanded);
                header.querySelector('.chevron').textContent = isExpanded ? '▸' : '▾';
            });

            cat.phrases.forEach(phrase => {
                const li = document.createElement('li');
                li.className = 'phrasebook-item';
                li.innerHTML = `
                    <span class="phrase-text">${phrase}</span>
                    <span class="phrase-status"></span>
                `;
                li.setAttribute('role', 'button');
                li.setAttribute('tabindex', '0');

                const handleClick = async () => {
                    const status = li.querySelector('.phrase-status');
                    status.textContent = '⏳';
                    li.classList.add('loading');

                    try {
                        let toCode = 'en';
                        if (Array.isArray(window.LANGUAGES)) {
                            const tgtObj = window.LANGUAGES.find(l => l.code === targetLang);
                            if (tgtObj && tgtObj.translateCode) toCode = tgtObj.translateCode;
                        }

                        const response = await fetch('/translate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: phrase, from: 'en', to: toCode })
                        });

                        if (response.ok) {
                            const data = await response.json();
                            const translated = data.translatedText || data.translation || data.text || data.result;
                            status.textContent = '🔊';
                            li.classList.remove('loading');

                            if (window.tts && typeof window.tts.play === 'function' && translated) {
                                window.tts.play(translated, targetLang);
                            }
                        } else {
                            status.textContent = '❌';
                            li.classList.remove('loading');
                        }
                    } catch (e) {
                        console.error('Phrasebook translation error:', e);
                        status.textContent = '❌';
                        li.classList.remove('loading');
                    }
                };

                li.addEventListener('click', handleClick);
                li.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClick();
                    }
                });

                list.appendChild(li);
            });

            section.appendChild(header);
            section.appendChild(list);
            phrasebookContainer.appendChild(section);
        });
    }
});
