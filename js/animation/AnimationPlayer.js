export class AnimationPlayer {
  constructor(visualization = null, prefix = "") {
    this.visualization = visualization;

    this.history = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.playInterval = null;

    // Vitesse de base de l'animation en ms (x1.0)
    this.baseSpeedMs = 800;

    const p = prefix ? `${prefix}-` : "";

    // Récupération de tous les éléments du nouveau lecteur
    console.log("${p}player-controls");
    this.playerControls = document.getElementById(`${p}player-controls`);
    console.log(this.playerControls);

    if (this.playerControls) {
      const stopPropagation = (e) => e.stopPropagation();
      this.playerControls.addEventListener("mousedown", stopPropagation);
      this.playerControls.addEventListener("mouseup", stopPropagation);
      this.playerControls.addEventListener("click", stopPropagation);
      this.playerControls.addEventListener("dblclick", stopPropagation);
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
      this.btnPlay.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.togglePlay();
      });
    }

    if (this.btnPrev) {
      this.btnPrev.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.pause();
        this.stepBackward();
      });
    }

    if (this.btnNext) {
      this.btnNext.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.pause();
        this.stepForward();
      });
    }

    if (this.btnStop) {
      this.btnStop.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hide();

        if (this.visualization) {
          this.visualization.clear();
        }
      });
    }

    if (this.btnReset) {
      this.btnReset.addEventListener("click", (e) => {
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
      this.timelineSlider.addEventListener("input", (e) => {
        e.stopPropagation();
        this.pause();
        this.goToStep(parseInt(e.target.value, 10));
      });
    }

    if (this.speedSlider) {
      this.speedSlider.addEventListener("input", (e) => {
        e.stopPropagation();
        this.updateSpeed(parseFloat(e.target.value));
      });
    }
  }

  load(animation) {
    this.animation = animation;
    this.currentIndex = -1;
    this.pause();

    // 1. Mise à jour de la timeline avec la nouvelle propriété .length
    if (this.timelineSlider && this.animation) {
      this.timelineSlider.max = Math.max(0, this.animation.length - 1);
      this.timelineSlider.value = -1;
    }

    // 2. Affichage des contrôles
    if (this.playerControls) {
      this.playerControls.style.display = "flex";
    }

    // 4. On appelle TA méthode (et non _setupTimeline)
    this.updateUI();
    this.renderCurrentState();
  }

  togglePlay() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  play() {
    // Sécurité : on vérifie que l'animation existe
    if (!this.animation || this.animation.length === 0) return;

    // Si on est à la fin, on recommence au début
    if (this.currentIndex >= this.animation.length - 1) {
      this.currentIndex = -1;
    }

    this.isPlaying = true;

    // Icône Pause
    if (this.btnPlay) this.btnPlay.innerHTML = '<i class="fa-solid fa-pause"></i>';

    // Rendu immédiat de la première frame si on démarre
    if (this.currentIndex === -1 && this.animation.length > 0) {
      this.stepForward();
    }

    const currentMultiplier = this.speedSlider ? parseFloat(this.speedSlider.value) : 1;
    const currentIntervalMs = this.baseSpeedMs / currentMultiplier;

    this.playInterval = setInterval(() => {
      // On utilise bien this.animation.length ici
      if (this.currentIndex >= this.animation.length - 1) {
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
    // On vérifie par rapport à la taille de l'animation
    if (this.animation && this.currentIndex < this.animation.length - 1) {
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
    // 1. Sécurité : a-t-on une animation chargée ?
    if (!this.animation || this.animation.length === 0) return;

    if (index === -1) {
      this.currentIndex = -1;
      this.updateUI();
      this.renderCurrentState();
    }

    if (index < 0 || index >= this.animation.length) return;

    this.currentIndex = index;

    // On récupère la frame
    const frame = this.animation.getFrame(index);

    this.updateUI();
    this.renderCurrentState();

    if (!frame) return;
  }

  updateSpeed(multiplier) {
    if (this.speedLabel) {
      this.speedLabel.textContent = `x${multiplier.toFixed(2)}`;
    }
    // Si on est en train de lire, on relance avec la nouvelle vitesse dynamiquement
    if (this.isPlaying && this.animation && this.currentIndex < this.animation.length - 1) {
      this.pause();
      this.play();
    }
  }

  updateUI() {
    // Sécurité
    if (!this.animation) return;

    // Mise à jour de la timeline
    if (this.timelineSlider) this.timelineSlider.value = this.currentIndex;

    // Mise à jour du texte Step X / Y
    if (this.stepCounter) {
      this.stepCounter.textContent = `${this.currentIndex + 1} / ${this.animation.length}`;
    }

    // Désactivation des boutons si on est aux extrémités
    if (this.btnPrev) {
      this.btnPrev.disabled = this.currentIndex <= -1;
      this.btnPrev.style.opacity = this.btnPrev.disabled ? "0.5" : "1";
    }
    if (this.btnNext) {
      this.btnNext.disabled = this.currentIndex >= this.animation.length - 1;
      this.btnNext.style.opacity = this.btnNext.disabled ? "0.5" : "1";
    }
  }

  renderCurrentState() {
    if (!this.visualization || !this.animation) return;

    // Si on est au tout début (reset), on nettoie juste
    if (this.currentIndex === -1) {
      this.visualization.clear();
      return;
    }

    // On récupère la frame pure
    const currentFrame = this.animation.getFrame(this.currentIndex);

    if (currentFrame) {
      // On donne la frame au visualiseur
      // Attention: verify que ton PythonTraceVisualization attend bien (frame, currentIndex)
      this.visualization.applyFrame(currentFrame, this.animation.frames, this.currentIndex);
    }
  }

  hide() {
    this.pause();
    this.goToStep(-1); // On remet le canvas à zéro
    if (this.playerControls) {
      this.playerControls.style.display = "none";
    }
  }
}
