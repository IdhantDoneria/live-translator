(function() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error("SpeechRecognition is not supported in this browser.");
    window.stt = {
      start: function() { console.error("Speech Recognition not supported."); },
      stop: function() {}
    };
    return;
  }

  let recognition = null;
  let isListening = false;

  window.stt = {
    start: function(lang, onInterim, onFinal) {
      if (isListening && recognition) {
        recognition.stop();
      }

      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang || 'en-US';

      recognition.onstart = function() {
        isListening = true;
      };

      recognition.onresult = function(event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (interimTranscript.trim().length > 0 && typeof onInterim === 'function') {
          onInterim(interimTranscript);
        }

        if (finalTranscript.trim().length > 0 && typeof onFinal === 'function') {
          onFinal(finalTranscript);
        }
      };

      recognition.onerror = function(event) {
        console.error("Speech recognition error:", event.error);
        isListening = false;
      };

      recognition.onend = function() {
        isListening = false;
      };

      try {
        recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        isListening = false;
      }
    },

    stop: function() {
      if (recognition && isListening) {
        recognition.stop();
        isListening = false;
      }
    }
  };
})();
