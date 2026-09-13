import { GraphEditor } from "../graphs/GraphEditor.js";

export class CompressionEditor extends GraphEditor {
  constructor() {
    super("compression-svg-main");

    this.showEmptyStateHint = false;

    this.frames = [];
    this.currentStep = 0;
    this.timer = null;
    this.isPlaying = false;
    this.playbackSpeed = 1.0;
    this.baseIntervalMs = 1200;

    this.init();
  }

  init() {
    this.bindEvents();
    this.applyReadOnlyLocks();
  }

  applyReadOnlyLocks() {
    this.svg.addEventListener("dblclick", (e) => e.stopPropagation(), true);
    this.svg.addEventListener(
      "contextmenu",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      true
    );
  }

  createNode() {
    return;
  }
  deleteSelected() {
    return;
  }
  promptEdgeParams() {
    return Promise.resolve(null);
  }

  bindEvents() {
    // 1. Bouton Principal de génération
    document
      .getElementById("btn-run-compression")
      ?.addEventListener("click", () => this.runCompression());

    // 2. Boutons du Lecteur (Une seule affectation par bouton !)
    document.getElementById("comp-btn-play")?.addEventListener("click", () => this.togglePlay());
    document.getElementById("comp-btn-next")?.addEventListener("click", () => this.nextStep());
    document.getElementById("comp-btn-prev")?.addEventListener("click", () => this.prevStep());
    document.getElementById("comp-btn-stop")?.addEventListener("click", () => this.stop());
    document.getElementById("comp-btn-reset")?.addEventListener("click", () => this.goToStep(0));

    const tabDico = document.getElementById("comp-tab-dico");
    const tabStats = document.getElementById("comp-tab-stats");
    const contentDico = document.getElementById("comp-content-dico");
    const contentStats = document.getElementById("comp-content-stats");

    if (tabDico && tabStats) {
      tabDico.addEventListener("click", () => {
        // Afficher le dico
        contentDico.style.display = "block";
        contentStats.style.display = "none";

        // Styles du bouton actif
        tabDico.style.color = "var(--primary-blue)";
        tabDico.style.borderBottom = "2px solid var(--primary-blue)";

        // Styles du bouton inactif
        tabStats.style.color = "var(--text-muted)";
        tabStats.style.borderBottom = "2px solid transparent";
      });

      tabStats.addEventListener("click", () => {
        // Afficher les stats
        contentStats.style.display = "block";
        contentDico.style.display = "none";

        // Styles du bouton actif
        tabStats.style.color = "var(--primary-blue)";
        tabStats.style.borderBottom = "2px solid var(--primary-blue)";

        // Styles du bouton inactif
        tabDico.style.color = "var(--text-muted)";
        tabDico.style.borderBottom = "2px solid transparent";
      });
    }

    // 3. Timeline Slider
    const timeline = document.getElementById("comp-timeline-slider");
    if (timeline) {
      timeline.addEventListener("input", (e) => {
        this.pause(); // Mettre en pause si l'utilisateur scrub
        this.goToStep(parseInt(e.target.value));
      });
    }

    // 4. Speed Slider
    const speedSlider = document.getElementById("comp-speed-slider");
    if (speedSlider) {
      speedSlider.addEventListener("input", (e) => {
        this.playbackSpeed = parseFloat(e.target.value);
        const speedValEl = document.getElementById("comp-speed-val");
        if (speedValEl) speedValEl.innerText = `x${this.playbackSpeed.toFixed(1)}`;

        // Si on est en train de lire, on redémarre le timer avec la nouvelle vitesse
        if (this.isPlaying) {
          this.pause();
          this.play();
        }
      });
    }
  }

  async runCompression() {
    const textInput = document.getElementById("compression-text-input");
    if (!textInput || !textInput.value) return;

    try {
      window.pythonEngine.pyodide.globals.set("text_input", textInput.value);

      const response = await fetch("python_scripts/huffman.py");
      const scriptCode = await response.text();
      const resultJson = await window.pythonEngine.pyodide.runPythonAsync(scriptCode);
      const result = JSON.parse(resultJson);

      this.updateStats(result);
      this.buildFreqTable(result.frequencies, result.codes);

      this.frames = result.frames || [];
      this.currentStep = 0;

      const hud = document.getElementById("comp-player-controls");
      if (hud) hud.style.display = "block"; // Affiche le HUD !

      const slider = document.getElementById("comp-timeline-slider");
      if (slider) {
        slider.max = Math.max(0, this.frames.length - 1);
        slider.value = 0;
      }

      this.goToStep(0);
      this.play();
    } catch (error) {
      console.error("Erreur lors de l'animation Huffman :", error);
    }
  }

  goToStep(index) {
    if (!this.frames || this.frames.length === 0) return;
    this.currentStep = Math.max(0, Math.min(index, this.frames.length - 1));

    const frame = this.frames[this.currentStep];

    // Mise à jour du Glass HUD
    const logEl = document.getElementById("comp-log-display");
    if (logEl) logEl.textContent = frame.desc;

    const counterEl = document.getElementById("comp-step-counter");
    if (counterEl) counterEl.textContent = `${this.currentStep} / ${this.frames.length - 1}`;

    const slider = document.getElementById("comp-timeline-slider");
    if (slider) slider.value = this.currentStep;

    // Rendu visuel
    this.renderForest(frame.forest);
  }

  nextStep() {
    if (this.currentStep < this.frames.length - 1) {
      this.goToStep(this.currentStep + 1);
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.goToStep(this.currentStep - 1);
    }
  }

  togglePlay() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  play() {
    if (this.currentStep >= this.frames.length - 1) {
      this.goToStep(0); // Recommence à 0 si on était à la fin
    }

    this.isPlaying = true;
    const btn = document.getElementById("comp-btn-play");
    if (btn) btn.innerHTML = `<i class="fa-solid fa-pause"></i>`;

    const interval = this.baseIntervalMs / this.playbackSpeed;

    this.timer = setInterval(() => {
      if (this.currentStep >= this.frames.length - 1) {
        this.pause();
      } else {
        this.nextStep();
      }
    }, interval);
  }

  pause() {
    this.isPlaying = false;
    const btn = document.getElementById("comp-btn-play");
    if (btn) btn.innerHTML = `<i class="fa-solid fa-play"></i>`;
    if (this.timer) clearInterval(this.timer);
  }

  stop() {
    this.pause();
    this.goToStep(0);

    const hud = document.getElementById("comp-player-controls");
    if (hud) {
      hud.style.display = "none";
    }

    this.clearCanvas();
  }

  renderForest(forestTrees) {
    this.clear_no_alert();
    this.nodeCounter = 1;

    if (!forestTrees || forestTrees.length === 0) return;

    // Dimensions dynamiques du Canvas SVG
    const svgRect = this.svg.getBoundingClientRect();
    const width = svgRect.width > 0 ? svgRect.width : 900;
    const height = svgRect.height > 0 ? svgRect.height : 600;

    // 1. Calculer la profondeur max et le nombre total de feuilles
    const getDepth = (node) => {
      if (!node) return 0;
      if (!node.children || node.children.length === 0) return 1;
      return 1 + Math.max(...node.children.map(getDepth));
    };

    const getLeafCount = (node) => {
      if (!node) return 0;
      if (!node.children || node.children.length === 0) return 1;
      return node.children.reduce((sum, c) => sum + getLeafCount(c), 0);
    };

    const maxDepth = Math.max(...forestTrees.map(getDepth));
    const totalLeaves = forestTrees.reduce((sum, t) => sum + getLeafCount(t), 0);

    // Marges et espaces utiles
    const leftMargin = 70;
    const rightMargin = 70;
    const usableWidth = Math.max(200, width - leftMargin - rightMargin);

    const topMargin = 80;
    const bottomMargin = 100;
    const usableHeight = Math.max(200, height - topMargin - bottomMargin);

    // Espacement vertical ajusté selon la profondeur
    const levelHeight =
      maxDepth > 1 ? Math.min(110, Math.max(65, usableHeight / (maxDepth - 1))) : 80;

    // 2. Attribution des positions X/Y (In-Order Leaf Placement)
    let currentLeafIndex = 0;

    const computePositions = (node, depth) => {
      if (!node) return null;

      const y = topMargin + depth * levelHeight;

      // Si c'est une feuille : on lui attribue une colonne dédiée
      if (!node.children || node.children.length === 0) {
        let x;
        if (totalLeaves <= 1) {
          x = width / 2;
        } else {
          x = leftMargin + (currentLeafIndex / (totalLeaves - 1)) * usableWidth;
        }
        currentLeafIndex++;
        return { ...node, x, y };
      }

      // Nœud interne : calculer d'abord les positions des enfants
      const children = node.children.map((c) => computePositions(c, depth + 1)).filter(Boolean);

      // Centrer le parent exactement au-dessus du premier et du dernier enfant
      const firstX = children[0].x;
      const lastX = children[children.length - 1].x;
      const x = (firstX + lastX) / 2;

      return { ...node, x, y, children };
    };

    // Calculer les positions ajustées pour tous les sous-arbres
    const positionedForest = forestTrees.map((tree) => computePositions(tree, 0));

    // 3. Injecter les nœuds et les arêtes dans GraphDocument
    const addTreeToDocument = (node) => {
      if (!node) return null;

      const nodeId = String(this.nodeCounter++);

      this.document.addNode({
        id: nodeId,
        label: node.name,
        x: node.x,
        y: node.y,
      });

      if (node.children && node.children.length > 0) {
        if (node.children[0]) {
          const leftId = addTreeToDocument(node.children[0]);
          this.document.addEdge({ from: nodeId, to: leftId, weight: "0", directed: true });
        }
        if (node.children[1]) {
          const rightId = addTreeToDocument(node.children[1]);
          this.document.addEdge({ from: nodeId, to: rightId, weight: "1", directed: true });
        }
      }

      return nodeId;
    };

    positionedForest.forEach((tree) => addTreeToDocument(tree));

    // Rendu final via GraphEditor
    this.render();
  }

  buildFreqTable(frequencies, codes) {
    const tbody = document.getElementById("freq-table-body");
    if (!tbody) return;

    tbody.innerHTML = "";
    for (const [char, freq] of Object.entries(frequencies)) {
      const charDisplay = char === " " ? "ESP" : char;
      const code = codes[char] || "-";

      const tr = document.createElement("tr");
      tr.style.borderBottom = "1px solid var(--border-color)";
      tr.innerHTML = `
        <td style="padding: 4px; font-weight: bold; color: var(--primary-blue);">'${charDisplay}'</td>
        <td style="padding: 4px;">${freq}</td>
        <td style="padding: 4px; color: #10b981; font-weight: bold;">${code}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  updateStats(data) {
    document.getElementById("stat-original").innerText = `${data.original_size} bits`;
    document.getElementById("stat-compressed").innerText = `${data.compressed_size} bits`;
    document.getElementById("stat-ratio").innerText = `${data.ratio} %`;
  }
}
