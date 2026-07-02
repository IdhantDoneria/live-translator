(function() {
  let audioContext;
  let analyser;
  let microphone;
  let animationId;
  let canvas;
  let canvasCtx;

  window.visualizer = {
    start: async function() {
      canvas = document.getElementById('audio-visualizer');
      if (!canvas) return;
      canvasCtx = canvas.getContext('2d');
      
      // Handle canvas resize
      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = 300;
      };
      window.addEventListener('resize', resize);
      resize();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        
        this.draw();
      } catch (err) {
        console.error("Visualizer microphone access denied:", err);
      }
    },
    
    draw: function() {
      if (!analyser || !canvasCtx) return;
      
      animationId = requestAnimationFrame(this.draw.bind(this));
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);
      
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];
        
        // Dynamic gradient based on frequency
        const r = barHeight + (25 * (i / bufferLength));
        const g = 100 * (i / bufferLength);
        const b = 255;
        
        canvasCtx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.7)`;
        
        // Draw centered from bottom
        const y = canvas.height - barHeight;
        
        // Draw bars symmetrically
        canvasCtx.fillRect(canvas.width/2 + x, y, barWidth, barHeight);
        canvasCtx.fillRect(canvas.width/2 - x, y, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    },
    
    stop: function() {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (audioContext) {
        audioContext.close();
      }
      if (canvasCtx && canvas) {
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };
})();
