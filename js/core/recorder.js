let recordingInterval = null;

async function recordAndPlay() {
    if (animationHistory.length === 0) {
        return alert("Please compile a script first before recording!");
    }

    if (recordingInterval) clearInterval(recordingInterval);

    const hiddenCanvas = document.getElementById('recorder-canvas');
    const ctx = hiddenCanvas.getContext('2d');
    const scaleFactor = 2;
    const svgRect = svg.getBoundingClientRect();
    
    hiddenCanvas.width = svgRect.width * scaleFactor; 
    hiddenCanvas.height = svgRect.height * scaleFactor;
    ctx.scale(scaleFactor, scaleFactor);
    
    const stream = hiddenCanvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 4000000 });
    const chunks = [];
    
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    
    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); 
        a.href = url; 
        a.download = "algo-story.webm";
        document.body.appendChild(a); 
        a.click(); 
        document.body.removeChild(a);
        
        if (recordingInterval) clearInterval(recordingInterval);
        svg.classList.remove('dark');
    };
    

    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) svg.classList.add('dark');
    

    let fullCssText = '';
    for (const sheet of document.styleSheets) {
        try {
            for (const rule of sheet.cssRules) {
                fullCssText += rule.cssText;
            }
        } catch (e) {
            // Ignore silencieusement les erreurs de sécurité (CORS) pour les polices externes
        }
    }

    // Start Recording
    recorder.start();

    // Canvas drawing loop
    recordingInterval = setInterval(() => {
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgWithStyle = svgData.replace('>', `><style>${fullCssText}</style>`);
        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgWithStyle);
        img.onload = () => {
            ctx.fillStyle = isDark ? "#2c3e50" : "white";
            ctx.fillRect(0, 0, hiddenCanvas.width/scaleFactor, hiddenCanvas.height/scaleFactor);
            ctx.drawImage(img, 0, 0);
            
            if (logDisplay.style.opacity == 1) {
                ctx.fillStyle = "rgba(0,0,0,0.7)";
                ctx.roundRect(svgRect.width/2 - 100, svgRect.height - 50, 200, 30, 15);
                ctx.fill();
                ctx.fillStyle = "white";
                ctx.font = "14px Arial";
                ctx.textAlign = "center";
                ctx.fillText(logDisplay.textContent, svgRect.width/2, svgRect.height - 30);
            }
        };
    }, 33);

    // Reset to start and press play automatically
    currentStepIndex = -1;
    renderStateAtCurrentStep();
    playAnimation();

    // Check periodically if animation is done to stop recording
    const checkDone = setInterval(() => {
        if (currentStepIndex >= animationHistory.length - 1) {
            clearInterval(checkDone);
            setTimeout(() => {
                if(recorder.state === "recording") recorder.stop();
            }, 1000); 
        }
    }, 500);
}