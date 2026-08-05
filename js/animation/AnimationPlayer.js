// javascript/core/AnimationPlayer.js

class AnimationPlayer {
    constructor(visualization=null, prefix = '') {

        this.visualization = visualization;

        this.history = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        this.playInterval = null;
        
        // Vitesse de base de l'animation en ms (x1.0)
        this.baseSpeedMs = 800; 

        const p = prefix ? `${prefix}-` : '';

        // Récupération de tous les éléments du nouveau lecteur
        this.playerControls = document.getElementById(`${p}player-controls`);

        if (this.playerControls) {
            const stopPropagation = (e) => e.stopPropagation();
            this.playerControls.addEventListener('mousedown', stopPropagation);
            this.playerControls.addEventListener('mouseup', stopPropagation);
            this.playerControls.addEventListener('click', stopPropagation);
            this.playerControls.addEventListener('dblclick', stopPropagation);
        }

        this.btnPlay = document.getElementById(`${p}btn-play`);
        this.btnPrev = document.getElementById(`${p}btn-prev`);
        this.btnNext = document.getElementById(`${p}btn-next`);
        this.btnStop = document.getElementById(`${p}btn-stop`);
        this.btnReset = document.getElementById(`${p}btn-reset`);
        
        this.timelineSlider = document.getElementById(`${p}timeline-slider`);
        this.speedSlider = document.getElementById(`${p}speed-slider`);
        
        this.stepCounter = document.getElementById(`${p}step-counter`);
        this.speedLabel = document.getElementById(`${p}speed-val`);

        this.bindEvents();
    }

    bindEvents() {
        if (this.btnPlay) {
            this.btnPlay.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.togglePlay();
            });
        }
        
        if (this.btnPrev) {
            this.btnPrev.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.pause();
                this.stepBackward();
            });
        }
        
        if (this.btnNext) {
            this.btnNext.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.pause();
                this.stepForward();
            });
        }

        if (this.btnStop) {
            this.btnStop.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hide();

                if (this.visualization) {
                    this.visualization.clear();
                }
            });
        }

        if (this.btnReset) {
            this.btnReset.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.pause();
                this.goToStep(-1);

                if (this.visualization) {
                    this.visualization.clear();
                }
            });
        }

        if (this.timelineSlider) {
            this.timelineSlider.addEventListener('input', (e) => {
                e.stopPropagation();
                this.pause();
                this.goToStep(parseInt(e.target.value, 10));
            });
        }

        if (this.speedSlider) {
            this.speedSlider.addEventListener('input', (e) => {
                e.stopPropagation();
                this.updateSpeed(parseFloat(e.target.value));
            });
        }
    }


    load(history,algoName="bfs") {
        this.history = history;
        this.currentIndex = -1;
        this.pause();

        if (this.timelineSlider) {
            this.timelineSlider.max = Math.max(0, this.history.length - 1);
            this.timelineSlider.value = -1;
        }

        if (this.playerControls) {
            this.playerControls.style.display = 'flex'; // On affiche le nouveau bloc
        }

        initAlgoTracker(algoName);

        this.updateUI();
        this.renderCurrentState();
    }

    togglePlay() {
        if (this.isPlaying) this.pause();
        else this.play();
    }

    play() {
        if (this.history.length === 0 || this.currentIndex >= this.history.length - 1) {
            // Si on est à la fin, on recommence au début
            if (this.currentIndex >= this.history.length - 1) {
                this.currentIndex = -1;
            } else {
                return;
            }
        }
        
        this.isPlaying = true;
        
        // Icône Pause
        if (this.btnPlay) this.btnPlay.innerHTML = '<i class="fa-solid fa-pause"></i>';

        // Rendu immédiat de la première frame si on démarre
        if (this.currentIndex === -1 && this.history.length > 0) {
            this.stepForward();
        }

        const currentMultiplier = this.speedSlider ? parseFloat(this.speedSlider.value) : 1;
        const currentIntervalMs = this.baseSpeedMs / currentMultiplier;

        this.playInterval = setInterval(() => {
            if (this.currentIndex >= this.history.length - 1) {
                this.pause();
            } else {
                this.stepForward();
            }
        }, currentIntervalMs);
    }

    pause() {
        this.isPlaying = false;
        // Icône Play
        if (this.btnPlay) this.btnPlay.innerHTML = '<i class="fa-solid fa-play"></i>';
        
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }
    }

    stepForward() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            this.updateUI();
            this.renderCurrentState();
        }
    }

    stepBackward() {
        if (this.currentIndex > -1) {
            this.currentIndex--;
            this.updateUI();
            this.renderCurrentState();
        }
    }

    goToStep(index) {
        if (index >= -1 && index < this.history.length) {
            this.currentIndex = index;
            this.updateUI();
            this.renderCurrentState();
        }

        const frame = this.history[index];

        console.log(frame);
        
        // --- CORRECTION : Nettoyage si on est au reset (-1) ---
        if (!frame) {
            document.querySelectorAll('.algo-line').forEach(el => el.classList.remove('active'));
            document.getElementById('algo-variables-container').innerHTML = '';
            return;
        }

        // 1. GESTION DU CODE SURBIGNÉ
        document.querySelectorAll('.algo-line').forEach(el => el.classList.remove('active'));
        if (frame.line_id) {
            const activeLine = document.getElementById(`code-line-${frame.line_id}`);
            if (activeLine) activeLine.classList.add('active');
        }

        // 2. GESTION DES VARIABLES
        const variablesContainer = document.getElementById('algo-variables-container');
        console.log(frame.variables)
        if (frame.variables) {
            variablesContainer.innerHTML = ''; 
            for (const [key, value] of Object.entries(frame.variables)) {
                const row = document.createElement('div');
                row.className = 'var-row';
                row.innerHTML = `<span class="var-name">${key}</span><span class="var-value">${value}</span>`;
                variablesContainer.appendChild(row);
            }
        }
    }

    updateSpeed(multiplier) {
        if (this.speedLabel) {
            this.speedLabel.textContent = `x${multiplier.toFixed(2)}`;
        }
        // Si on est en train de lire, on relance avec la nouvelle vitesse dynamiquement
        if (this.isPlaying && this.currentIndex < this.history.length - 1) {
            this.pause();
            this.play();
        }
    }

    updateUI() {
        // Mise à jour de la timeline
        if (this.timelineSlider) this.timelineSlider.value = this.currentIndex;
        
        // Mise à jour du texte Step X / Y
        if (this.stepCounter) {
            this.stepCounter.textContent = `${this.currentIndex + 1} / ${this.history.length}`;
        }

        // Désactivation des boutons si on est aux extrémités
        if (this.btnPrev) {
            this.btnPrev.disabled = (this.currentIndex <= -1);
            this.btnPrev.style.opacity = this.btnPrev.disabled ? "0.5" : "1";
        }
        if (this.btnNext) {
            this.btnNext.disabled = (this.currentIndex >= this.history.length - 1);
            this.btnNext.style.opacity = this.btnNext.disabled ? "0.5" : "1";
        }
    }

    renderCurrentState() {
        if (this.visualization) {
            this.visualization.applyFrame(null, this.history, this.currentIndex);
        }
    }
    
    hide() {
        this.pause();
        this.goToStep(-1); // On remet le canvas à zéro
        if (this.playerControls) {
            this.playerControls.style.display = 'none';
        }
    }
}

function initAlgoTracker(algoName) {
    const hud = document.getElementById('algo-tracker-hud');
    const codeContainer = document.getElementById('algo-code-container');
    const variablesContainer = document.getElementById('algo-variables-container');
    
    // Nettoyer
    codeContainer.innerHTML = '';
    variablesContainer.innerHTML = '';
    
    if (ALGO_LIBRARY[algoName]) {
        hud.style.display = 'flex';
        
        // Créer les lignes de code
        ALGO_LIBRARY[algoName].forEach(line => {
            const div = document.createElement('div');
            div.className = 'algo-line';
            div.id = `code-line-${line.id}`;
            div.textContent = line.text;
            codeContainer.appendChild(div);
        });
    } else {
        hud.style.display = 'none'; // Cacher si l'algo n'est pas dans le dictionnaire
    }
}