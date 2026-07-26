class ArraySortEngine {
    constructor() {
        this.array = [];
        this.initialArray = [];
        this.isAnimating = false;
        
        // Variables de contrôle utilisateur
        this.speedMultiplier = 1.0;
        this.isPaused = false;
        this.resolveStep = null; // Utilisé pour débloquer l'animation (Mode Step)
        this.isCancelled = false;
        this.abortSleep = null;
    }

    async wait(baseMs) {
        if (this.isCancelled) throw new Error('ANIMATION_CANCELLED');

        const delay = baseMs / this.speedMultiplier;
        await new Promise(resolve => {
            const timer = setTimeout(resolve, delay);
            this.abortSleep = () => {
                clearTimeout(timer);
                resolve();
            };
        });
        this.abortSleep = null;

        if (this.isCancelled) throw new Error('ANIMATION_CANCELLED');

        if (this.isPaused) {
            await new Promise(resolve => {
                this.resolveStep = resolve;
            });
        }

        if (this.isCancelled) throw new Error('ANIMATION_CANCELLED');
    }

    // --- CONTRÔLES EXTERNES ---
    setSpeed(speed) {
        this.speedMultiplier = parseFloat(speed);
        // Mise à jour magique des transitions CSS globales pour ce module
        document.documentElement.style.setProperty('--array-anim-speed', `${0.3 / this.speedMultiplier}s`);
    }

    pause() {
        if (!this.isAnimating || this.isPaused) return;
        this.isPaused = true;
        this.updateStatus(`Animation Paused ⏸️`, 'normal');
        
        // Mise à jour visuelle du bouton (devient "Play" vert)
        const btn = document.getElementById('btn-array-playpause');
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-play"></i>';
            btn.style.background = '#D1FAE5';
            btn.style.color = '#059669';
            btn.style.borderColor = '#A7F3D0';
            btn.title = 'Play';
        }
    }

    play() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.updateStatus(`Animation Resumed ▶️`, 'success');
        
        // Mise à jour visuelle du bouton (redevient "Pause" orange)
        const btn = document.getElementById('btn-array-playpause');
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            btn.style.background = '#FEF3C7';
            btn.style.color = '#D97706';
            btn.style.borderColor = '#FCD34D';
            btn.title = 'Pause';
        }

        if (this.resolveStep) {
            this.resolveStep(); 
            this.resolveStep = null;
        }
    }

    togglePlayPause() {
        if (!this.isAnimating) return;
        if (this.isPaused) {
            this.play();
        } else {
            this.pause();
        }
    }

    step() {
        if (!this.isPaused) {
            this.pause(); 
            return;
        }
        if (this.resolveStep) {
            this.resolveStep();
        }
    }

    stepBackward() {
        this.updateStatus(`Step Backward requires pre-calculated states. Coming in a future update!`, 'error');
    }

    cancel() {
        if (!this.isAnimating) return;
        
        this.isCancelled = true;
        this.isPaused = false;
        
        // Si l'animation était en pause, on la débloque pour qu'elle puisse s'arrêter
        if (this.resolveStep) {
            this.resolveStep();
            this.resolveStep = null;
        }

        if (this.abortSleep) {
            this.abortSleep();
            this.abortSleep = null;
        }

        this.updateStatus(`Animation stopped and reset 🛑`, 'error');
        
        // On génère un nouveau tableau après un très court délai pour laisser le code s'arrêter
        setTimeout(() => {
            this.isAnimating = false;
            this.isCancelled = false;
            
            // Remet le bouton Play/Pause à son état initial
            const btn = document.getElementById('btn-array-playpause');
            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                btn.style.background = '#FEF3C7';
                btn.style.color = '#D97706';
                btn.style.borderColor = '#FCD34D';
                btn.title = 'Pause';
            }
        }, 100);
    }

    reset() {
        if (this.isAnimating) {
            this.cancel();
        }
        setTimeout(() => {
            this.isAnimating = false;
            this.isCancelled = false;
            this.restoreInitialState();
            this.updateStatus(`Array reset to its initial unsorted state 🔄`, 'normal');
        }, 50);
    }

    // --- GÉNÉRATION & RENDU ---
    async bulkInsert(count) {
        if (this.isAnimating) return;
        this.updateStatus(`Generated array with ${count} elements.`, 'header');
        
        this.array = [];
        for (let i = 0; i < count; i++) {
            this.array.push(Math.floor(Math.random() * 90) + 10);
        }

        this.initialArray = [...this.array];

        this.render();
    }

    render() {
        const domCanvas = document.getElementById('ds-dom-canvas');
        domCanvas.innerHTML = ''; 
        
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'flex-end';
        container.style.justifyContent = 'center';
        container.style.gap = this.array.length > 50 ? '2px' : '6px';
        container.style.width = '100%';
        container.style.height = '350px'; 
        container.style.paddingBottom = '20px';
        
        const maxVal = Math.max(...this.array, 100);

        for (let i = 0; i < this.array.length; i++) {
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
            const heightPercent = (this.array[i] / maxVal) * 90;
            bar.style.height = `${heightPercent}%`;
            bar.style.width = '100%';
            bar.style.backgroundColor = 'var(--brand-main)';
            bar.style.borderRadius = '4px 4px 0 0';
            
            // On utilise la variable CSS dynamique ici
            bar.style.transition = 'height var(--array-anim-speed, 0.3s) cubic-bezier(0.4, 0, 0.2, 1), background-color var(--array-anim-speed, 0.2s) ease, transform 0.1s ease';
            bar.style.transformOrigin = 'bottom';

            // Masquer le texte si le tableau est trop grand
            if (this.array.length <= 40) {
                const label = document.createElement('span');
                label.id = `array-label-${i}`;
                label.innerText = this.array[i];
                label.style.fontFamily = 'Nunito';
                label.style.fontWeight = '800';
                label.style.fontSize = this.array.length > 25 ? '0.7rem' : '0.9rem';
                label.style.color = 'var(--text-primary)';
                barWrapper.appendChild(label);
            }

            barWrapper.appendChild(bar);
            container.appendChild(barWrapper);
        }
        domCanvas.appendChild(container);
    }

    // --- ANIMATIONS ---
    setBarColor(index, color) {
        const bar = document.getElementById(`array-bar-${index}`);
        if (bar) bar.style.backgroundColor = color;
    }

    async swapVisual(i, j) {
        let temp = this.array[i];
        this.array[i] = this.array[j];
        this.array[j] = temp;

        const barI = document.getElementById(`array-bar-${i}`);
        const barJ = document.getElementById(`array-bar-${j}`);
        const maxVal = Math.max(...this.array, 100);
        
        if (barI && barJ) {
            barI.style.transform = 'scaleY(1.1)';
            barJ.style.transform = 'scaleY(1.1)';
            
            await this.wait(100); 

            barI.style.height = `${(this.array[i] / maxVal) * 90}%`;
            barJ.style.height = `${(this.array[j] / maxVal) * 90}%`;
            
            if (this.array.length <= 40) {
                document.getElementById(`array-label-${i}`).innerText = this.array[i];
                document.getElementById(`array-label-${j}`).innerText = this.array[j];
            }
            
            await this.wait(200);

            barI.style.transform = 'scaleY(1)';
            barJ.style.transform = 'scaleY(1)';
        }
    }

    // --- ALGORITHMES ---
    async bubbleSort() {
        if (this.isAnimating || this.array.length === 0) return;
        this.isAnimating = true;
        this.isCancelled = false; // On réinitialise au démarrage
        this.updateStatus(`Starting Bubble Sort...`, 'header');

        try {
            let n = this.array.length;
            for (let i = 0; i < n - 1; i++) {
                for (let j = 0; j < n - i - 1; j++) {
                    this.setBarColor(j, '#F59E0B'); 
                    this.setBarColor(j + 1, '#F59E0B');
                    await this.wait(150);

                    if (this.array[j] > this.array[j + 1]) {
                        this.setBarColor(j, '#EF4444');
                        this.setBarColor(j + 1, '#EF4444');
                        await this.wait(100);
                        await this.swapVisual(j, j + 1);
                    }

                    this.setBarColor(j, 'var(--brand-main)');
                    this.setBarColor(j + 1, 'var(--brand-main)');
                }
                this.setBarColor(n - i - 1, '#10B981');
            }
            this.setBarColor(0, '#10B981');
            this.updateStatus(`Bubble Sort complete!`, 'success');

        } catch (error) {
            // Si c'est notre annulation, on l'ignore silencieusement
            if (error.message === 'ANIMATION_CANCELLED') {
                console.log("Sort cancelled by user.");
                return;
            } else {
                throw error; // Vrai bug
            }
        } finally {
            this.isAnimating = false;
            this.isPaused = false;
        }
    }

    async quickSort() {
        if (this.isAnimating || this.array.length === 0) return;
        this.isAnimating = true;
        this.isCancelled = false; // On réinitialise au démarrage
        this.updateStatus(`Starting Quick Sort...`, 'header');

        try {
            await this.quickSortHelper(0, this.array.length - 1);

            for(let i=0; i<this.array.length; i++) {
                this.setBarColor(i, '#10B981');
                await this.wait(30);
            }
            this.updateStatus(`Quick Sort complete!`, 'success');

        } catch (error) {
            if (error.message === 'ANIMATION_CANCELLED') {
                console.log("Sort cancelled by user.");
                return;
            } else {
                throw error;
            }
        } finally {
            this.isAnimating = false;
            this.isPaused = false;
        }
    }

    async quickSortHelper(low, high) {
        if (low < high) {
            let pi = await this.partition(low, high);
            this.setBarColor(pi, '#10B981'); 
            await this.quickSortHelper(low, pi - 1);
            await this.quickSortHelper(pi + 1, high);
        } else if (low === high) {
            this.setBarColor(low, '#10B981');
        }
    }

    async partition(low, high) {
        let pivot = this.array[high];
        this.setBarColor(high, '#8B5CF6'); 
        await this.wait(300);

        let i = low - 1;

        for (let j = low; j <= high - 1; j++) {
            this.setBarColor(j, '#F59E0B');
            await this.wait(150);

            if (this.array[j] < pivot) {
                i++;
                this.setBarColor(i, '#EF4444');
                await this.swapVisual(i, j);
                this.setBarColor(i, 'var(--brand-main)');
            }
            this.setBarColor(j, 'var(--brand-main)');
        }
        await this.swapVisual(i + 1, high);
        return i + 1;
    }

    // --- INSERTION SORT ---
    async insertionSort() {
        if (this.isAnimating || this.array.length === 0) return;
        this.isAnimating = true;
        this.isCancelled = false;
        this.updateStatus(`Starting Insertion Sort...`, 'header');

        try {
            let n = this.array.length;
            this.setBarColor(0, '#10B981'); // Le premier élément est trivialement considéré trié

            for (let i = 1; i < n; i++) {
                let key = this.array[i];
                this.setBarColor(i, '#F59E0B'); // Élément à insérer
                this.updateStatus(`Inserting element ${key} into sorted portion...`);
                await this.wait(200);

                let j = i - 1;
                while (j >= 0 && this.array[j] > key) {
                    this.setBarColor(j, '#EF4444'); // Comparaison / Décalage
                    this.updateStatus(`${this.array[j]} > ${key}. Shifting ${this.array[j]} to the right.`);
                    await this.wait(120);

                    // Échange visuel adjacent pour glisser la barre vers la gauche
                    await this.swapVisual(j, j + 1);

                    this.setBarColor(j + 1, '#10B981');
                    j--;
                }

                this.array[j + 1] = key;
                this.setBarColor(j + 1, '#10B981');
                await this.wait(150);

                // Ré-harmonisation visuelle de la portion triée
                for (let k = 0; k <= i; k++) {
                    this.setBarColor(k, '#10B981');
                }
            }

            this.updateStatus(`Insertion Sort complete!`, 'success');

        } catch (error) {
            if (error.message === 'ANIMATION_CANCELLED') {
                console.log("Sort cancelled by user.");
                return;
            } else {
                throw error;
            }
        } finally {
            this.isAnimating = false;
            this.isPaused = false;
        }
    }

    // --- MERGE SORT ---
    async mergeSort() {
        if (this.isAnimating || this.array.length === 0) return;
        this.isAnimating = true;
        this.isCancelled = false;
        this.updateStatus(`Starting Merge Sort...`, 'header');

        try {
            await this.mergeSortHelper(0, this.array.length - 1);

            // Vague verte de confirmation finale
            for (let i = 0; i < this.array.length; i++) {
                this.setBarColor(i, '#10B981');
                await this.wait(25);
            }

            this.updateStatus(`Merge Sort complete!`, 'success');

        } catch (error) {
            if (error.message === 'ANIMATION_CANCELLED') {
                console.log("Sort cancelled by user.");
                return;
            } else {
                throw error;
            }
        } finally {
            this.isAnimating = false;
            this.isPaused = false;
        }
    }

    async mergeSortHelper(low, high) {
        if (low < high) {
            const mid = Math.floor((low + high) / 2);

            // Surligner la plage en cours de division (Violet)
            for (let i = low; i <= high; i++) {
                this.setBarColor(i, '#8B5CF6');
            }
            this.updateStatus(`Sub-array split: [${low}..${mid}] and [${mid + 1}..${high}]`);
            await this.wait(200);

            await this.mergeSortHelper(low, mid);
            await this.mergeSortHelper(mid + 1, high);
            await this.merge(low, mid, high);
        }
    }

    async merge(low, mid, high) {
        this.updateStatus(`Merging segments [${low}..${mid}] and [${mid + 1}..${high}]`);

        // Copies temporaires des sous-tableaux
        let left = this.array.slice(low, mid + 1);
        let right = this.array.slice(mid + 1, high + 1);

        let i = 0, j = 0, k = low;
        const maxVal = Math.max(...this.array, 100);

        while (i < left.length && j < right.length) {
            // Comparaison des deux éléments en tête
            this.setBarColor(low + i, '#F59E0B');
            this.setBarColor(mid + 1 + j, '#F59E0B');
            await this.wait(150);

            if (left[i] <= right[j]) {
                this.array[k] = left[i];
                i++;
            } else {
                this.array[k] = right[j];
                j++;
            }

            // Réécriture dynamique de la barre k
            const barK = document.getElementById(`array-bar-${k}`);
            const labelK = document.getElementById(`array-label-${k}`);
            if (barK) {
                barK.style.height = `${(this.array[k] / maxVal) * 90}%`;
                barK.style.backgroundColor = '#10B981'; // Fusionné
            }
            if (labelK && this.array.length <= 40) {
                labelK.innerText = this.array[k];
            }

            await this.wait(150);
            k++;
        }

        // Copier les éléments restants du sous-tableau gauche
        while (i < left.length) {
            this.array[k] = left[i];
            const barK = document.getElementById(`array-bar-${k}`);
            const labelK = document.getElementById(`array-label-${k}`);
            if (barK) {
                barK.style.height = `${(this.array[k] / maxVal) * 90}%`;
                barK.style.backgroundColor = '#10B981';
            }
            if (labelK && this.array.length <= 40) {
                labelK.innerText = this.array[k];
            }
            i++;
            k++;
            await this.wait(100);
        }

        // Copier les éléments restants du sous-tableau droit
        while (j < right.length) {
            this.array[k] = right[j];
            const barK = document.getElementById(`array-bar-${k}`);
            const labelK = document.getElementById(`array-label-${k}`);
            if (barK) {
                barK.style.height = `${(this.array[k] / maxVal) * 90}%`;
                barK.style.backgroundColor = '#10B981';
            }
            if (labelK && this.array.length <= 40) {
                labelK.innerText = this.array[k];
            }
            j++;
            k++;
            await this.wait(100);
        }
    }

    // --- LOGS & CLEAR ---
    updateStatus(message, type = 'normal') {
        const infoPanel = document.getElementById('ds-info-panel');
        if (infoPanel) {
            const msgDiv = document.createElement('div');
            msgDiv.style.padding = '8px 12px';
            msgDiv.style.borderRadius = '6px';
            msgDiv.style.fontSize = '0.85rem';
            msgDiv.style.lineHeight = '1.4';
            
            if (type === 'header') {
                msgDiv.style.background = 'var(--brand-main)';
                msgDiv.style.color = 'white';
                msgDiv.style.fontWeight = '800';
                msgDiv.innerHTML = `<i class="fa-solid fa-play" style="margin-right: 8px;"></i> ${message}`;
            } else if (type === 'success') {
                msgDiv.style.background = '#D1FAE5';
                msgDiv.style.color = '#065F46';
                msgDiv.innerHTML = `<i class="fa-solid fa-check" style="margin-right: 8px;"></i> ${message}`;
            } else {
                msgDiv.style.color = 'var(--text-primary)';
                msgDiv.innerHTML = `<i class="fa-solid fa-arrow-right" style="color: var(--brand-main); margin-right: 8px;"></i> ${message}`;
            }

            infoPanel.appendChild(msgDiv);
            infoPanel.scrollTop = infoPanel.scrollHeight;
        }
    }

    clear() {
        // En V2, on pourra ajouter une promesse d'annulation ici
        this.array = [];
        this.isAnimating = false;
        this.isPaused = false;
        document.getElementById('ds-dom-canvas').innerHTML = '';
        document.getElementById('ds-placeholder-text').style.display = 'block';
        const infoPanel = document.getElementById('ds-info-panel');
        if (infoPanel) infoPanel.innerHTML = '';
    }

    restoreInitialState() {
        this.array = [...this.initialArray];
        this.render();
    }
}

const arrayEngine = new ArraySortEngine();

// Fonctions globales attachées au HTML
async function generateRandomArray() {
    if (!arrayEngine.isAnimating) {
        const size = document.getElementById('slider-array-size').value;
        await arrayEngine.bulkInsert(parseInt(size)); 
    }
}
function togglePlayPauseArrayAnimation() { arrayEngine.togglePlayPause(); }
function stepArrayAnimation() { arrayEngine.step(); }
function stepBackwardArrayAnimation() { arrayEngine.stepBackward(); }

// Assure-toi de réinitialiser le bouton quand un nouveau tri démarre !
async function startBubbleSort() { 
    if (!arrayEngine.isAnimating) {
        resetPlayPauseButton();
        await arrayEngine.bubbleSort(); 
    }
}

async function startQuickSort() { 
    if (!arrayEngine.isAnimating) {
        resetPlayPauseButton();
        await arrayEngine.quickSort(); 
    }
}

async function startInsertionSort() {
    if (!arrayEngine.isAnimating) {
        resetPlayPauseButton();
        await arrayEngine.insertionSort();
    }
}

async function startMergeSort() {
    if (!arrayEngine.isAnimating) {
        resetPlayPauseButton();
        await arrayEngine.mergeSort();
    }
}

// Petite fonction utilitaire pour remettre le bouton sur "Pause" à chaque nouveau tri
function resetPlayPauseButton() {
    const btn = document.getElementById('btn-array-playpause');
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        btn.style.background = '#FEF3C7';
        btn.style.color = '#D97706';
        btn.style.borderColor = '#FCD34D';
        btn.title = 'Pause';
    }
}
function clearArrayDataStructure() { arrayEngine.clear(); }

// Nouvelles fonctions de contrôle
function updateArraySize(val) {
    document.getElementById('array-size-val').innerText = val;
    if (!arrayEngine.isAnimating) {
        arrayEngine.bulkInsert(parseInt(val)); // Régénère direct !
    }
}
function updateArraySpeed(val) {
    document.getElementById('array-speed-val').innerText = 'x' + val;
    arrayEngine.setSpeed(val);
}
function pauseArrayAnimation() { arrayEngine.pause(); }
function playArrayAnimation() { arrayEngine.play(); }
function stepArrayAnimation() { arrayEngine.step(); }

function stopArrayAnimation() { 
    arrayEngine.cancel(); 
}

function resetArrayAnimation() { 
    arrayEngine.reset(); 
}