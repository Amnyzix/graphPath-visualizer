import { GraphEditor } from "./GraphEditor.js";

export class GraphQuizEditor extends GraphEditor {
  constructor(svgId) {
    super(svgId);

    // État de la mission
    this.missionData = null;
    this.missionType = "node-click"; // Par défaut
    this.currentPhase = 0; // Pour les missions multi-parties
    this.currentIndex = 0; // Pour le suivi de la séquence
    this.correctSequence = [];

    this.initQuizLocks();
  }

  initQuizLocks() {
    // 1. Bloque le double-clic et le clic droit
    this.svg.addEventListener("dblclick", (e) => e.stopPropagation(), true);
    this.svg.addEventListener(
      "contextmenu",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      true
    );

    // 2. Intercepte l'enfoncement du clic (mousedown) pour bloquer le drag et gérer les réponses
    this.svg.addEventListener(
      "mousedown",
      (e) => {
        // Bloque l'action de drag par défaut de CanvasEngine
        e.stopPropagation();

        if (e.button !== 0) return; // Clic gauche uniquement

        // Détermine le type de mission actif (prend en charge les multi-phases)
        const activeType =
          this.missionType === "multi-part"
            ? this.missionData.solutionPhases[this.currentPhase].type
            : this.missionType;

        // A. Cas d'une mission orientée NŒUDS
        if (activeType === "node-click") {
          const nodeGroup = e.target.closest("g");
          if (nodeGroup) {
            const circle = nodeGroup.querySelector("circle[data-id]");
            if (circle) this.handleNodeClick(circle.getAttribute("data-id"));
          }
        }

        // B. Cas d'une mission orientée ARÊTES (Kruskal, etc.)
        else if (activeType === "edge-click") {
          const edgeTarget = e.target.closest("path, line");
          // On cherche les arêtes (Nécessite que ton GraphEditor mette des attributs data-from et data-to)
          if (edgeTarget && edgeTarget.hasAttribute("data-from")) {
            const from = edgeTarget.getAttribute("data-from");
            const to = edgeTarget.getAttribute("data-to");
            this.handleEdgeClick(`${from}-${to}`);
          }
        }
      },
      true
    );

    // 3. Intercepte le relâchement du clic (mouseup) pour TUER la création d'arêtes manuelles
    this.svg.addEventListener(
      "mouseup",
      (e) => {
        e.stopPropagation();
      },
      true
    );
  }

  // Désactive les méthodes de modification manuelle
  createNode() {
    return;
  }
  deleteSelected() {
    return;
  }
  promptEdgeParams() {
    return Promise.resolve(null);
  }

  centerGraphViewBox() {
    // On attend un court instant (50ms) pour que le SVG finisse de s'afficher dans le DOM
    setTimeout(() => {
      try {
        // getBBox() calcule la vraie boîte englobante de TOUS les éléments (nœuds, arêtes, textes)
        const bbox = this.svg.getBBox();

        // Si le graphe est vide, on annule
        if (bbox.width === 0 && bbox.height === 0) return;

        // On ajoute un padding global autour du dessin complet
        const padding = 100;
        const minX = bbox.x - padding;
        const minY = bbox.y - padding;
        const width = bbox.width + padding * 2;
        const height = bbox.height + padding * 2;

        // On applique les vraies dimensions
        this.svg.setAttribute("viewBox", `${minX} ${minY} ${width} ${height}`);
        this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      } catch (error) {
        console.warn("Impossible de centrer le graphe automatiquement :", error);
      }
    }, 50);
  }

  async loadMissionFromJson(missionId) {
    try {
      const response = await fetch(`missions/${missionId}.json`);
      if (!response.ok) throw new Error("Mission file not found");

      this.missionData = await response.json();
      this.missionType = this.missionData.meta.type || "node-click";
      this.currentErrorMessage =
        this.missionData.meta.errorMessage || "Incorrect action. Try again!";
      this.currentPhase = 0;

      // Map to the new UI structure
      document.getElementById("quiz-title").innerText = this.missionData.meta.title;
      // Use description for context, fallback to empty string
      document.getElementById("quiz-context").innerText = this.missionData.meta.description || "";

      this.setGraphData(this.missionData.graphData);
      this.centerGraphViewBox();
      this.setupCurrentPhase();
    } catch (error) {
      console.error("Failed to load mission:", error);
    }
  }

  setupCurrentPhase() {
    const isMultiPart = this.missionType === "multi-part";
    const phaseData = isMultiPart ? this.missionData.solutionPhases[this.currentPhase] : null;
    const activeType = phaseData ? phaseData.type : this.missionType;

    // 1. Update the BIG Task Card
    const currentInstruction =
      phaseData && phaseData.instruction
        ? phaseData.instruction
        : this.missionData.meta.instruction;

    document.getElementById("current-objective").innerText = currentInstruction;

    const badge = document.getElementById("task-phase-badge");
    if (isMultiPart) {
      badge.innerHTML = `<i class="fa-solid fa-list-check"></i> Phase ${this.currentPhase + 1}/${this.missionData.solutionPhases.length}`;
    } else {
      badge.innerHTML = `<i class="fa-solid fa-crosshairs"></i> Current Objective`;
    }

    // 2. Clean previous inputs
    const dynamicContainer = document.getElementById("quiz-dynamic-inputs");
    dynamicContainer.innerHTML = "";

    // 3. Configuration de l'interaction
    const progressContainer = document.getElementById("progress-container");

    if (activeType === "node-click" || activeType === "edge-click") {
      // Affiche la barre de progression pour les clics
      if (progressContainer) progressContainer.style.display = "block";

      this.correctSequence = isMultiPart ? phaseData.sequence : this.missionData.solutionSequence;
      this.currentIndex = 0;
      document.getElementById("score-total").innerText = this.correctSequence.length;

      // Réinitialise la barre visuellement
      this.updateProgress();
    } else if (activeType === "text-sequence" || activeType === "text-input") {
      // Cache la barre de progression pour les champs textes
      if (progressContainer) progressContainer.style.display = "none";

      const expectedAnswer = isMultiPart ? phaseData.answer : this.missionData.solutionSequence;
      this.correctSequence = [expectedAnswer];

      // Inject text input below the task card dynamically
      dynamicContainer.innerHTML = `
        <div style="margin-top: 15px;">
          <input type="text" id="quiz-text-answer" placeholder="e.g. 1,2,4,3" style="padding: 12px; width: 100%; box-sizing: border-box; border-radius: 8px; border: 2px solid #cbd5e1; outline: none; margin-bottom: 10px; font-family: monospace; font-size: 1rem;">
          <button id="quiz-text-submit" style="width: 100%; padding: 12px; border: none; border-radius: 8px; background: #6366f1; color: white; font-weight: bold; cursor: pointer;">Submit Answer</button>
        </div>
      `;

      document.getElementById("quiz-text-submit").onclick = () => {
        const userAnswer = document
          .getElementById("quiz-text-answer")
          .value.trim()
          .replace(/\s+/g, "");
        if (userAnswer === expectedAnswer) {
          this.advancePhaseOrWin();
        } else {
          this.handleError();
        }
      };
    }
  }

  // Gère les clics sur les nœuds
  handleNodeClick(nodeId) {
    if (nodeId === this.correctSequence[this.currentIndex]) {
      this.handleSuccess(nodeId);
    } else {
      this.handleError(nodeId);
    }
  }

  // Gère les clics sur les arêtes (Kruskal / Prim)
  handleEdgeClick(edgeId) {
    // Vérifie si l'arête (ex: "1-2" ou "2-1") est la bonne
    const reverseId = edgeId.split("-").reverse().join("-");

    if (
      edgeId === this.correctSequence[this.currentIndex] ||
      reverseId === this.correctSequence[this.currentIndex]
    ) {
      this.currentIndex++;

      // Illumination de l'arête SVG
      const edgeElem =
        this.svg.querySelector(
          `[data-from="${edgeId.split("-")[0]}"][data-to="${edgeId.split("-")[1]}"]`
        ) ||
        this.svg.querySelector(
          `[data-from="${reverseId.split("-")[0]}"][data-to="${reverseId.split("-")[1]}"]`
        );

      if (edgeElem) {
        edgeElem.style.stroke = "#10b981"; // Vert de validation
        edgeElem.style.strokeWidth = "5px";
      }

      this.updateProgress();

      if (this.currentIndex === this.correctSequence.length) {
        this.advancePhaseOrWin();
      }
    } else {
      this.handleError();
    }
  }

  handleSuccess(nodeId, isStartNode = false) {
    this.currentIndex++;

    const nodeGroup = this.svg.querySelector(`circle[data-id="${nodeId}"]`)?.parentNode;
    if (nodeGroup) {
      // Applique la couleur verte
      nodeGroup.classList.add("node-flash-success");

      // Retire la classe après 1 seconde
      setTimeout(() => {
        nodeGroup.classList.remove("node-flash-success");
      }, 1000);
    }

    this.updateProgress();

    if (this.currentIndex === this.correctSequence.length && !isStartNode) {
      this.advancePhaseOrWin();
    }
  }

  updateProgress() {
    const progress = (this.currentIndex / this.correctSequence.length) * 100;
    document.getElementById("mission-progress").style.width = `${progress}%`;
    document.getElementById("score").innerText = this.currentIndex;
  }

  // Passe à la phase suivante ou valide la mission finale
  advancePhaseOrWin() {
    if (
      this.missionType === "multi-part" &&
      this.currentPhase < this.missionData.solutionPhases.length - 1
    ) {
      // 1. Mini-explosion de confettis (Dopamine hit concentré sur la zone UI gauche)
      if (typeof window.confetti === "function") {
        window.confetti({
          particleCount: 50,
          spread: 70,
          origin: { x: 0.15, y: 0.45 }, // Tire depuis le panneau de quête
          colors: ["#10b981", "#34d399", "#ffffff"],
          disableForReducedMotion: true,
        });
      }

      // 2. Récupère les éléments UI à animer
      const taskCard = document.querySelector(".task-card");
      const objectiveText = document.getElementById("current-objective");
      const badgeText = document.getElementById("task-phase-badge");

      // 3. Déclenche l'animation de succès (Pulse vert + disparition du texte)
      if (taskCard) taskCard.classList.add("success-pulse");
      if (objectiveText) objectiveText.classList.add("fade-out");
      if (badgeText) badgeText.classList.add("fade-out");

      // 4. Attend que le texte disparaisse, change les données, puis fait réapparaître
      setTimeout(() => {
        this.currentPhase++;

        // Charge silencieusement le texte de la phase 2 pendant qu'il est invisible
        this.setupCurrentPhase();

        // Retire les classes pour déclencher le Fade-in et le retour à la couleur normale
        if (taskCard) taskCard.classList.remove("success-pulse");

        // Petit délai supplémentaire pour s'assurer que le DOM est à jour avant le fade-in
        requestAnimationFrame(() => {
          if (objectiveText) objectiveText.classList.remove("fade-out");
          if (badgeText) badgeText.classList.remove("fade-out");
        });
      }, 800); // 800ms correspond au temps où la carte reste verte
    } else {
      this.triggerVictory();
    }
  }

  handleError(nodeId = null) {
    if (nodeId) {
      const nodeGroup = this.svg.querySelector(`circle[data-id="${nodeId}"]`)?.parentNode;
      if (nodeGroup) {
        nodeGroup.classList.add("node-flash-error");

        setTimeout(() => {
          nodeGroup.classList.remove("node-flash-error");
        }, 1000);
      }
    }

    const feedback = document.getElementById("feedback-message");
    feedback.style.display = "block";
    feedback.style.background = "#fee2e2";
    feedback.style.color = "#dc2626";
    feedback.innerText = this.currentErrorMessage;
    setTimeout(() => {
      feedback.style.display = "none";
    }, 3000);
  }

  triggerVictory() {
    if (typeof window.confetti === "function") {
      window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }

    const modal = document.getElementById("victory-modal");
    if (modal) modal.style.display = "flex";

    const urlParams = new URLSearchParams(window.location.search);
    const missionId = urlParams.get("mission") || "bfs-01";

    const missionLevels = {
      "basics-01": 1,
      "bfs-01": 2,
      "dfs-01": 3,
      "dijkstra-01": 4,
      "bellman-01": 5,
      "kruskal-01": 6,
      "cycle-01": 7,
      "topo-01": 8,
      "astar-01": 9,
      "boss-01": 10,
    };

    const currentLevel = missionLevels[missionId] || 2;
    localStorage.setItem(`algoquest_completed_${currentLevel}`, "true");

    const nextLevel = currentLevel + 1;
    const highestUnlocked = parseInt(localStorage.getItem("algoquest_unlocked")) || 1;
    if (nextLevel > highestUnlocked) {
      localStorage.setItem("algoquest_unlocked", nextLevel);
    }
  }
}
