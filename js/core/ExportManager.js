// javascript/core/ExportManager.js

class ExportManager {
    
    // Détecte le SVG actuellement affiché à l'écran
    static getActiveSvg() {
        // Cherche tous les SVG dans les sections actives
        const svgs = document.querySelectorAll('svg');
        for (let svg of svgs) {
            // Vérifie si le SVG est visible dans le DOM
            if (svg.offsetParent !== null) {
                return svg;
            }
        }
        return null;
    }

    static async exportPNG() {
        const svg = this.getActiveSvg();
        if (!svg) return;

        // 1. Cloner le SVG
        const svgClone = svg.cloneNode(true);

        // 2. Injecter TOUS les styles CSS dans le clone (pour qu'il soit autonome)
        const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
        let cssContent = "";
        for (let sheet of document.styleSheets) {
            try {
                for (let rule of sheet.cssRules) {
                    cssContent += rule.cssText + "\n";
                }
            } catch (e) {
                // Ignore les feuilles de style externes non accessibles
            }
        }
        style.textContent = cssContent;
        svgClone.prepend(style);

        // 3. Supprimer la grille manuellement sur le clone
        svgClone.style.backgroundImage = 'none';

        // 4. Sérialiser ce clone "autosuffisant"
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svgClone);
        
        // 5. Créer l'image
        const blob = new Blob([source], {type: "image/svg+xml;charset=utf-8"});
        const url = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = svg.clientWidth * 2; 
            canvas.height = svg.clientHeight * 2;
            const ctx = canvas.getContext("2d");
            
            // Fond blanc
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Téléchargement
            const pngUrl = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = pngUrl;
            link.download = "algoquest-export.png";
            link.click();
            
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }

    static exportSVG() {
        const svg = this.getActiveSvg();
        if (!svg) return;

        // 1. Cloner le SVG pour ne pas modifier celui qui est affiché à l'écran
        const svgClone = svg.cloneNode(true);

        svgClone.style.backgroundImage = 'none'; // Supprime la grille
        svgClone.style.backgroundColor = 'white';

        // 2. Créer une balise <style> qui contiendra tout le CSS nécessaire
        const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
        let cssContent = "";

        // 3. Récupérer toutes les règles CSS de la page
        // On parcourt les feuilles de style pour extraire les règles
        for (let sheet of document.styleSheets) {
            try {
                for (let rule of sheet.cssRules) {
                    cssContent += rule.cssText + "\n";
                }
            } catch (e) {
                // On ignore les feuilles de style externes (ex: Google Fonts) qui peuvent bloquer
            }
        }
        
        style.textContent = cssContent;
        
        // 4. Injecter les styles tout en haut du SVG
        svgClone.prepend(style);

        // 5. Sérialiser le clone "stylé"
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svgClone);
        const blob = new Blob([source], {type: "image/svg+xml;charset=utf-8"});
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "algoquest-export.svg";
        link.click();
        URL.revokeObjectURL(url);
    }

    // --- NOUVELLE FONCTION UTILITAIRE MANQUANTE ---
    static async drawSvgToCanvas(svgElement, ctx, width, height) {
        return new Promise((resolve, reject) => {
            const svgClone = svgElement.cloneNode(true);
            svgClone.style.backgroundImage = 'none'; // Enlève la grille
            
            // Injecter le CSS
            const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
            let cssContent = "";
            for (let sheet of document.styleSheets) {
                try {
                    for (let rule of sheet.cssRules) { cssContent += rule.cssText + "\n"; }
                } catch (e) {}
            }
            style.textContent = cssContent;
            svgClone.prepend(style);

            // Transformer en image
            const serializer = new XMLSerializer();
            const source = serializer.serializeToString(svgClone);
            const blob = new Blob([source], {type: "image/svg+xml;charset=utf-8"});
            const url = URL.createObjectURL(blob);

            const img = new Image();
            img.onload = () => {
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                URL.revokeObjectURL(url);
                resolve(); // On indique que le dessin est terminé
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    // --- MISE À JOUR DE LA VIDÉO ---
    static async exportVideo(player) {
        const btn = document.getElementById('btn-export-mp4');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Recording...';

        const svg = this.getActiveSvg();
        if (!svg) return;

        const canvas = document.createElement("canvas");
        canvas.width = svg.clientWidth;
        canvas.height = svg.clientHeight;
        const ctx = canvas.getContext("2d");

        // Utilisation de 30 FPS
        const stream = canvas.captureStream(30); 
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "algoquest-animation.webm"; // Note: le navigateur exporte en webm nativement
            link.click();
            URL.revokeObjectURL(url);
            btn.innerHTML = originalHtml; // Restaurer le bouton
        };

        recorder.start();

        // Parcourir l'historique
        for (let i = 0; i < player.history.length; i++) {
            player.goToStep(i);
            
            // On laisse le temps au DOM de se mettre à jour
            await new Promise(resolve => setTimeout(resolve, 50)); 
            
            // On dessine la frame sur le canvas
            await this.drawSvgToCanvas(svg, ctx, canvas.width, canvas.height);
            
            // Durée de la frame sur la vidéo (par exemple 800ms)
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        recorder.stop();
    }

    // --- MISE À JOUR DU GIF ---
    // --- MISE À JOUR DU GIF (Correction CORS Worker) ---
    static async exportGIF(player) {
        console.log("to gif");
        const btn = document.getElementById('btn-export-gif');
        const originalHtml = btn ? btn.innerHTML : 'Export to GIF';
        if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';

        try {
            const svgElement = this.getActiveSvg();
            if (!svgElement) {
                alert("Aucun canvas visible pour l'export.");
                if (btn) btn.innerHTML = originalHtml;
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = svgElement.clientWidth;
            canvas.height = svgElement.clientHeight;
            const ctx = canvas.getContext('2d');

            // --- ASTUCE ANTI-CORS POUR LE WORKER ---
            // On télécharge le code du worker et on crée une URL locale virtuelle
            const workerCode = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js').then(res => res.text());
            const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(workerBlob);

            const gif = new GIF({
                workers: 2,
                quality: 10,
                width: canvas.width,
                height: canvas.height,
                workerScript: workerUrl, // Utilisation de l'URL virtuelle locale
                background: '#ffffff'
            });

            for (let i = 0; i < player.history.length; i++) {
                player.goToStep(i);
                await new Promise(resolve => setTimeout(resolve, 50));
                
                await this.drawSvgToCanvas(svgElement, ctx, canvas.width, canvas.height);
                
                gif.addFrame(canvas, { copy: true, delay: 800 });
            }

            gif.on('finished', function(blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'algoquest-animation.gif';
                link.click();
                URL.revokeObjectURL(url);
                
                // Nettoyage de l'URL du worker
                URL.revokeObjectURL(workerUrl);
                
                if (btn) btn.innerHTML = originalHtml; 
            });

            gif.render();

        } catch (error) {
            console.error("Erreur lors de l'export GIF:", error);
            if (btn) btn.innerHTML = originalHtml;
            alert("Une erreur est survenue lors de la création du GIF. Consultez la console (F12) pour plus de détails.");
        }
    }
}