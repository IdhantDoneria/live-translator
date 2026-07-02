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
});
