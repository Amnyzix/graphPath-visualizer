class ArrayVisualization extends Visualization {
    constructor(editor) {
        super(editor);
        this.container = document.getElementById('ds-dom-canvas');
        this.infoPanel = document.getElementById('ds-info-panel');
        this.maxVal = 100;
        this.arrayLength = 0;
    }

    /**
     * Initialise le DOM avec le tableau de départ.
     */
    init(initialArray) {
        // CORRECTION : On vide le DOM directement ici pour éviter la récursion infinie avec clear()
        if (this.container) this.container.innerHTML = '';
        if (this.infoPanel) this.infoPanel.innerHTML = '';

        if (!initialArray || initialArray.length === 0) return;

        this.arrayLength = initialArray.length;
        this.maxVal = Math.max(...initialArray, 100);

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'flex-end';
        wrapper.style.justifyContent = 'center';
        wrapper.style.gap = this.arrayLength > 50 ? '2px' : '6px';
        wrapper.style.width = '100%';
        wrapper.style.height = '350px'; 
        wrapper.style.paddingBottom = '20px';
        wrapper.id = 'array-wrapper';

        for (let i = 0; i < this.arrayLength; i++) {
            const barWrapper = document.createElement('div');
            barWrapper.style.display = 'flex';
            barWrapper.style.flexDirection = 'column';
            barWrapper.style.justifyContent = 'flex-end';
            barWrapper.style.alignItems = 'center';
            barWrapper.style.gap = '8px';
            barWrapper.style.flex = '1';
            barWrapper.style.maxWidth = '45px';
            barWrapper.style.height = '100%';

            const bar = document.createElement('div');
            bar.id = `array-bar-${i}`;
            const heightPercent = (initialArray[i] / this.maxVal) * 90;
            bar.style.height = `${heightPercent}%`;
            bar.style.width = '100%';
            bar.style.backgroundColor = 'var(--brand-main)';
            bar.style.borderRadius = '4px 4px 0 0';
            
            bar.style.transition = 'height var(--array-anim-speed, 0.3s) cubic-bezier(0.4, 0, 0.2, 1), background-color var(--array-anim-speed, 0.2s) ease, transform 0.1s ease';
            bar.style.transformOrigin = 'bottom';

            if (this.arrayLength <= 40) {
                const label = document.createElement('span');
                label.id = `array-label-${i}`;
                label.innerText = initialArray[i];
                label.style.fontFamily = 'Nunito';
                label.style.fontWeight = '800';
                label.style.fontSize = this.arrayLength > 25 ? '0.7rem' : '0.9rem';
                label.style.color = 'var(--text-primary)';
                barWrapper.appendChild(label);
            }

            barWrapper.appendChild(bar);
            wrapper.appendChild(barWrapper);
        }
        
        this.container.appendChild(wrapper);
    }

    /**
     * Applique une "frame" d'animation générée par l'algorithme.
     */
    applyFrame(frame, history, currentIndex) {
        const currentFrame = frame || (history ? history[currentIndex] : null);
        if (!currentFrame) return;

        // On récupère le message à la racine, et les données depuis le "payload"
        const message = currentFrame.message;
        const payload = currentFrame.payload || {};
        const array = payload.array;
        const colors = payload.colors;
        
        // Sécurité : si on n'a pas de tableau dans cette frame, on ne dessine rien
        if (!array) return;

        // 1. Mise à jour des barres (Hauteur et Couleur)
        for (let i = 0; i < this.arrayLength; i++) {
            const bar = document.getElementById(`array-bar-${i}`);
            const label = document.getElementById(`array-label-${i}`);
            
            if (bar) {
                const heightPercent = (array[i] / this.maxVal) * 90;
                bar.style.height = `${heightPercent}%`;
                bar.style.backgroundColor = colors && colors[i] ? colors[i] : 'var(--brand-main)';
            }
            
            if (label && this.arrayLength <= 40) {
                label.innerText = array[i];
            }
        }

        // 2. Mise à jour du journal (Logs)
        if (message && this.infoPanel) {
            this.infoPanel.innerHTML = '';
            const msgDiv = document.createElement('div');
            msgDiv.style.padding = '8px 12px';
            msgDiv.style.borderRadius = '6px';
            msgDiv.style.fontSize = '0.85rem';
            msgDiv.style.lineHeight = '1.4';
            msgDiv.style.color = 'var(--text-primary)';
            msgDiv.innerHTML = `<i class="fa-solid fa-arrow-right" style="color: var(--brand-main); margin-right: 8px;"></i> ${message}`;
            this.infoPanel.appendChild(msgDiv);
        }
    }

    /**
     * Nettoie et réinitialise l'interface visuelle à son état d'origine.
     * Cette méthode est appelée par les boutons Stop et Reset du lecteur.
     */
    clear() {
        if (this.editor && this.editor.document) {
            // Relance l'affichage avec les données brutes initiales (ce qui corrige les hauteurs et les couleurs)
            this.init(this.editor.document.getArray());
        }
    }
}