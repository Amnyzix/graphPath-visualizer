// javascript/core/AnimationPlayer.js

class AnimationPlayer {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        this.playInterval = null;
        
        // Vitesse de base de l'animation en ms (x1.0)
        this.baseSpeedMs = 800; 

        // Récupération de tous les éléments du nouveau lecteur
        this.playerControls = document.getElementById('player-controls');

        if (this.playerControls) {
            const stopPropagation = (e) => e.stopPropagation();
            this.playerControls.addEventListener('mousedown', stopPropagation);
            this.playerControls.addEventListener('mouseup', stopPropagation);
            this.playerControls.addEventListener('click', stopPropagation);
            this.playerControls.addEventListener('dblclick', stopPropagation);
        }

        this.btnPlay = document.getElementById('btn-play');
        this.btnPrev = document.getElementById('btn-prev');
        this.btnNext = document.getElementById('btn-next');
        this.btnStop = document.getElementById('btn-stop');
        this.btnReset = document.getElementById('btn-reset');
        
        this.timelineSlider = document.getElementById('timeline-slider');
        this.speedSlider = document.getElementById('speed-slider');
        
        this.stepCounter = document.getElementById('step-counter');
        this.speedLabel = document.getElementById('speed-val');

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
            });
        }

        if (this.btnReset) {
            this.btnReset.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.pause();
                this.goToStep(-1);
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

    load(history) {
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
        if (window.activeVisualization) {
            window.activeVisualization.applyFrame(null, this.history, this.currentIndex);
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