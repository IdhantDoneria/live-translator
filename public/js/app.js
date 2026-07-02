document.addEventListener('DOMContentLoaded', () => {
    const sourceSelect = document.getElementById('source-lang');
    const targetSelect = document.getElementById('target-lang');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const transcriptBox = document.getElementById('transcript-box');
    const translatedBox = document.getElementById('translated-box');

    // 2. Populate #source-lang and #target-lang from window.LANGUAGES
    if (window.LANGUAGES) {
        const populateSelect = (selectElem) => {
            selectElem.innerHTML = '';
            
            let entries = [];
            if (Array.isArray(window.LANGUAGES)) {
                entries = window.LANGUAGES.map(lang => {
                    if (typeof lang === 'object') return [lang.code, lang.name];
                    return [lang, lang];
                });
            } else {
                entries = Object.entries(window.LANGUAGES);
            }
            
            for (const [code, name] of entries) {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = name;
                selectElem.appendChild(option);
            }
        };

        if (sourceSelect) populateSelect(sourceSelect);
        if (targetSelect) populateSelect(targetSelect);

        // Set default value to English
        const setEnglishDefault = (selectElem) => {
            if (!selectElem) return;
            const options = Array.from(selectElem.options);
            const enOption = options.find(opt => 
                opt.value === 'en' || 
                opt.value === 'en-US' || 
                opt.textContent.toLowerCase().includes('english')
            );
            if (enOption) {
                selectElem.value = enOption.value;
            } else if (options.length > 0) {
                selectElem.value = options[0].value;
            }
        };

        setEnglishDefault(sourceSelect);
        setEnglishDefault(targetSelect);
    }

    // 3. Attach click handlers to #start-btn and #stop-btn
    if (startBtn && stopBtn) {
        startBtn.addEventListener('click', () => {
            const sourceLangCode = sourceSelect ? sourceSelect.value : 'en-US';
            const targetLangCode = targetSelect ? targetSelect.value : 'es-ES';
            
            let sourceTranslateCode = 'auto';
            let targetTranslateCode = 'en';
            if (Array.isArray(window.LANGUAGES)) {
                const srcObj = window.LANGUAGES.find(l => l.code === sourceLangCode);
                if (srcObj && srcObj.translateCode) sourceTranslateCode = srcObj.translateCode;
                const tgtObj = window.LANGUAGES.find(l => l.code === targetLangCode);
                if (tgtObj && tgtObj.translateCode) targetTranslateCode = tgtObj.translateCode;
            }

            // 4. On Start, disable Start button, enable Stop button.
            startBtn.disabled = true;
            stopBtn.disabled = false;
            startBtn.classList.add('listening');
            
            // 5. interimCallback updates #transcript-box with partial text
            const interimCallback = (text) => {
                if (transcriptBox) transcriptBox.textContent = text;
            };
            
            // 6. finalCallback
            const finalCallback = async (text) => {
                // a. Update #transcript-box with the final text
                if (transcriptBox) transcriptBox.textContent = text;
                
                if (!text || !text.trim()) return;
                
                try {
                    // b. Make a fetch('/translate', ...) call to translate the text.
                    const response = await fetch('/translate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            text: text,
                            from: sourceTranslateCode,
                            to: targetTranslateCode
                        })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        // Handle multiple common response formats gracefully
                        const translatedText = data.translatedText || data.translation || data.text || data.result;
                        
                        // c. Update #translated-box with the result.
                        if (translatedBox) translatedBox.textContent = translatedText;
                        
                        // d. Call window.tts.play(translatedText, targetLangCode).
                        if (window.tts && typeof window.tts.play === 'function' && translatedText) {
                            window.tts.play(translatedText, targetLangCode);
                        }
                    } else {
                        console.error('Translation error:', response.statusText);
                        if (translatedBox) translatedBox.textContent = 'Translation error.';
                    }
                } catch (error) {
                    console.error('Fetch error during translation:', error);
                    if (translatedBox) translatedBox.textContent = 'Network error.';
                }
            };
            
            // 4. Call window.stt.start(...)
            if (window.stt && typeof window.stt.start === 'function') {
                window.stt.start(sourceLangCode, interimCallback, finalCallback);
            }
        });

        stopBtn.addEventListener('click', () => {
            // Restore button states
            startBtn.disabled = false;
            stopBtn.disabled = true;
            startBtn.classList.remove('listening');
            
            if (window.stt && typeof window.stt.stop === 'function') {
                window.stt.stop();
            }
        });
    }
});
