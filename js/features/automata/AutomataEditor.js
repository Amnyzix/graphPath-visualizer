import { CanvasEngine } from "../../core/CanvasEngine.js";
import { NFASimulator } from "./NFASimulator.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class AutomataEditor extends CanvasEngine {
  constructor(svgId) {
    super(svgId);
    this.nodeCounter = 0;

    this.selectedStateForEdge = null;
    this.draggingNodeId = null;
    this.isDraggingNode = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.selectedEdgeIndex = null;

    this.svg.insertAdjacentHTML(
      "afterbegin",
      `
            <defs>
                <!-- Marqueur classique (lignes droites) -->
                <marker id="auto-arrow" markerUnits="userSpaceOnUse" viewBox="0 -5 10 10" refX="22" refY="0" markerWidth="14" markerHeight="14" orient="auto">
                    <path d="M 0,-4 L 8,0 L 0,4 Z" fill="context-stroke" />
                </marker>
                <marker id="auto-arrow-active" markerUnits="userSpaceOnUse" viewBox="0 -5 10 10" refX="22" refY="0" markerWidth="14" markerHeight="14" orient="auto">
                    <path d="M 0,-4 L 8,0 L 0,4 Z" fill="#F59E0B" />
                </marker>
                
                <!-- Nouveaux marqueurs pour les boucles (courbes) -->
                <marker id="auto-arrow-loop" markerUnits="userSpaceOnUse" viewBox="0 -5 10 10" refX="8" refY="0" markerWidth="14" markerHeight="14" orient="auto">
                    <path d="M 0,-4 L 8,0 L 0,4 Z" fill="context-stroke" />
                </marker>
                <marker id="auto-arrow-loop-active" markerUnits="userSpaceOnUse" viewBox="0 -5 10 10" refX="8" refY="0" markerWidth="14" markerHeight="14" orient="auto">
                    <path d="M 0,-4 L 8,0 L 0,4 Z" fill="#F59E0B" />
                </marker>
            </defs>
        `
    );

    this.svg.addEventListener("contextmenu", (e) => e.preventDefault());

    this.svg.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.svg.addEventListener("mouseup", this.onMouseUp.bind(this));
    window.addEventListener("keydown", this.onKeyDown.bind(this));

    this.svg.addEventListener("click", (e) => {
      if (
        (e.target === this.svg || e.target.id === this.svg.id) &&
        this.selectedStateForEdge !== null
      ) {
        this.selectedStateForEdge = null;
        this.selectedEdgeIndex = null;
        this.render();
      }
    });

    this.svg.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      const isBackgroundClick =
        e.target === this.svg || e.target === this.container || e.target.id === this.svg.id;

      if (isBackgroundClick) {
        const hadSelection = this.selectedStateForEdge !== null || this.selectedEdgeIndex !== null;

        this.selectedStateForEdge = null;
        this.selectedEdgeIndex = null;

        if (this.startNode || this.tempEdge) {
          this.startNode = null;
          this.tempEdge = null;
          this.isDrawingEdge = false;
        }

        if (hadSelection || this.tempEdge) {
          this.render();
        }
      }
    });
  }

  getExportData() {
    return { nodes: this.nodes, edges: this.edges };
  }

  // --- 1. GESTION DU DÉPLACEMENT (DRAG & DROP) ---

  onMouseMove(e) {
    if (this.draggingNodeId) {
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;

      if (Math.hypot(dx, dy) > 3) {
        this.isDraggingNode = true;
      }

      if (this.isDraggingNode) {
        const node = this.nodes.find((n) => n.id === this.draggingNodeId);
        if (node) {
          node.x += dx / this.zoomLevel;
          node.y += dy / this.zoomLevel;
          this.render();
        }
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
      }
    }
  }

  onMouseUp() {
    if (this.draggingNodeId) {
      if (!this.isDraggingNode) {
        // CLIC SIMPLE
        const nodeId = this.draggingNodeId;
        this.selectedEdgeIndex = null;

        if (this.selectedStateForEdge === null) {
          // 1er Clic : Sélection pour le départ
          this.selectedStateForEdge = nodeId;
        } else {
          // 2ème Clic : Création de la transition
          const fromId = this.selectedStateForEdge;
          this.selectedStateForEdge = null;
          this.createEdge(fromId, nodeId);
        }
        this.render();
      } else {
        // GLISSER-DÉPLACER TERMINÉ
        this.saveState();
      }

      this.draggingNodeId = null;
      this.isDraggingNode = false;
    }
  }

  // --- 2. GESTION DES NŒUDS ---

  createNode(x, y) {
    this.saveState();
    this.nodes.push({
      id: "q" + this.nodeCounter++,
      x: x,
      y: y,
      isInitial: this.nodes.length === 0,
      isFinal: false,
    });
    this.render();
  }

  toggleFinalState(nodeId) {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (node) {
      this.saveState();
      node.isFinal = !node.isFinal;
      this.render();
    }
  }

  setInitialState(nodeId) {
    this.saveState();
    this.nodes.forEach((n) => (n.isInitial = false));
    const node = this.nodes.find((n) => n.id === nodeId);
    if (node) node.isInitial = true;
    this.render();
  }

  // --- 3. GESTION DES TRANSITIONS ---
  // --- WRAPPER DE LA MODALE EN PROMISE ---
  async openLabelModal(defaultValue = "a", defaultSequence = false) {
    return new Promise((resolve) => {
      const modal = document.getElementById("edge-label-modal");
      const input = document.getElementById("edge-label-input");
      const sequenceToggle = document.getElementById("edge-sequence-toggle");
      const btnSave = document.getElementById("btn-save-edge");
      const btnCancel = document.getElementById("btn-cancel-edge");
      const btnClose = document.getElementById("btn-close-edge");

      let errorMsg = document.getElementById("edge-error-msg");
      if (!errorMsg) {
        errorMsg = document.createElement("div");
        errorMsg.id = "edge-error-msg";
        errorMsg.style.color = "#ef4444";
        errorMsg.style.fontSize = "12px";
        errorMsg.style.marginTop = "6px";
        errorMsg.style.display = "none";
        input.parentNode.appendChild(errorMsg);
      }

      // Afficher et préparer l'input
      modal.style.display = "flex"; // flex pour bien centrer via tes styles modal-overlay
      input.value = defaultValue;
      sequenceToggle.checked = defaultSequence;
      input.focus();
      input.select(); // Surligne le texte pour l'effacer facilement

      const validateInput = () => {
        const val = input.value.trim();
        if (!sequenceToggle.checked && val !== "") {
          const parts = val.split(",");
          const hasSequence = parts.some((p) => p.trim().length > 1);

          if (hasSequence) {
            input.style.borderColor = "#ef4444";
            errorMsg.textContent =
              "Multi-character symbols require 'Parse as Sequence' to be enabled.";
            errorMsg.style.display = "block";
            btnSave.disabled = true;
            btnSave.style.opacity = "0.5";
            btnSave.style.cursor = "not-allowed";
            return false;
          }
        }

        // Réinitialisation si valide
        input.style.borderColor = "var(--canvas-border, #cbd5e1)";
        errorMsg.style.display = "none";
        btnSave.disabled = false;
        btnSave.style.opacity = "1";
        btnSave.style.cursor = "pointer";
        return true;
      };

      input.oninput = validateInput;
      sequenceToggle.onchange = validateInput;
      validateInput();

      // Fonction de nettoyage
      const cleanup = () => {
        modal.style.display = "none";
        btnSave.onclick = null;
        btnCancel.onclick = null;
        btnClose.onclick = null;
        input.onkeydown = null;
        input.oninput = null;
        sequenceToggle.onchange = null;
        modal.onmousedown = null;
      };

      // Validation
      const confirm = () => {
        if (!validateInput()) return; // Bloque la validation clavier (Enter) si invalide
        cleanup();
        resolve({
          label: input.value || "ε",
          isSequence: sequenceToggle.checked,
        });
      };

      // Annulation
      const cancel = () => {
        cleanup();
        resolve(null);
      };

      // Branchement des clics sur les boutons
      btnSave.onclick = confirm;
      btnCancel.onclick = cancel;
      btnClose.onclick = cancel;

      modal.onmousedown = (e) => {
        if (e.target === modal) {
          // S'assure qu'on a cliqué sur l'overlay sombre, pas sur la modale elle-même
          cancel();
        }
      };

      // Raccourcis clavier
      input.onkeydown = (e) => {
        if (e.key === "Enter") confirm();
        if (e.key === "Escape") cancel();
      };
    });
  }

  // --- 3. GESTION DES TRANSITIONS (Modifiées pour être async) ---

  async createEdge(fromId, toId) {
    const result = await this.openLabelModal("a", false);

    if (result !== null) {
      this.saveState();
      const trimmedLabel = result.label.trim() || "ε";

      const existingEdge = this.edges.find((e) => e.from === fromId && e.to === toId);

      if (existingEdge) {
        // Fusionne systématiquement le texte dans l'arête existante
        const currentLabels = existingEdge.label.split(",").map((s) => s.trim());
        if (!currentLabels.includes(trimmedLabel)) {
          existingEdge.label = existingEdge.label
            ? `${existingEdge.label}, ${trimmedLabel}`
            : trimmedLabel;
        }

        // Si la nouvelle transition nécessite le mode séquence, on l'active pour toute l'arête
        if (result.isSequence) {
          existingEdge.isSequence = true;
        }
      } else {
        // Création d'une nouvelle arête s'il n'y en a aucune
        this.edges.push({
          from: fromId,
          to: toId,
          label: trimmedLabel,
          isSequence: result.isSequence,
        });
      }
      this.render();
    }
  }

  async editEdgeLabel(edgeIndex) {
    const edge = this.edges[edgeIndex];
    if (!edge) return;

    const result = await this.openLabelModal(edge.label, edge.isSequence || false);

    if (result === null) return;

    this.saveState();
    if (result.label.trim() === "") {
      this.edges.splice(edgeIndex, 1);
    } else {
      edge.label = result.label.trim();
      edge.isSequence = result.isSequence;
    }
    this.render();
  }

  getExpandedGraph() {
    let expandedNodes = JSON.parse(JSON.stringify(this.nodes));
    let expandedEdges = [];
    let hiddenIdCounter = 0;

    this.edges.forEach((edge) => {
      // 1. Découpage initial par virgule
      const parts = edge.label
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");

      parts.forEach((part) => {
        // 2. Si c'est une séquence de plusieurs caractères
        if (edge.isSequence && part.length > 1 && part !== "ε") {
          const chars = part.split("");
          let currentFrom = edge.from;

          for (let i = 0; i < chars.length; i++) {
            let nextTo;
            if (i === chars.length - 1) {
              nextTo = edge.to;
            } else {
              nextTo = `hidden_${edge.from}_${edge.to}_${hiddenIdCounter++}`;
              expandedNodes.push({ id: nextTo, isInitial: false, isFinal: false, isHidden: true });
            }

            expandedEdges.push({ from: currentFrom, to: nextTo, label: chars[i] });
            currentFrom = nextTo;
          }
        } else {
          // 3. Transition classique (1 caractère ou epsilon)
          expandedEdges.push({ from: edge.from, to: edge.to, label: part });
        }
      });
    });

    return { nodes: expandedNodes, edges: expandedEdges };
  }

  // --- 4. RENDU VISUEL ---

  render() {
    this.container.innerHTML = "";
    this.container.setAttribute(
      "transform",
      `translate(${this.panX}, ${this.panY}) scale(${this.zoomLevel})`
    );

    // A. DESSINER LES TRANSITIONS
    this.edges.forEach((edge, index) => {
      const fromNode = this.nodes.find((n) => n.id === edge.from);
      const toNode = this.nodes.find((n) => n.id === edge.to);
      if (!fromNode || !toNode) return;

      // 1. CALCULER D D'ABORD !
      let dAttr;
      let textX, textY;

      const hasReverseEdge = this.edges.some((e) => e.from === edge.to && e.to === edge.from);

      if (edge.from === edge.to) {
        const r = 20;
        // Angles d'ancrage sur le cercle (-135° et -45°)
        const angleStart = -Math.PI * 0.75;
        const angleEnd = -Math.PI * 0.25;

        // Calcul des points exacts sur le périmètre
        const startX = fromNode.x + r * Math.cos(angleStart);
        const startY = fromNode.y + r * Math.sin(angleStart);
        const endX = fromNode.x + r * Math.cos(angleEnd);
        const endY = fromNode.y + r * Math.sin(angleEnd);

        // Tirage des points de contrôle de la courbe de Bézier
        const cpX1 = fromNode.x - 35;
        const cpY1 = fromNode.y - 85;
        const cpX2 = fromNode.x + 35;
        const cpY2 = fromNode.y - 85;

        dAttr = `M ${startX},${startY} C ${cpX1},${cpY1} ${cpX2},${cpY2} ${endX},${endY}`;
        textX = fromNode.x;
        textY = fromNode.y - 75;
      } else if (hasReverseEdge) {
        // 2. Arête bidirectionnelle (On dessine une courbe)
        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const dist = Math.hypot(dx, dy);

        // Vecteur normal (perpendiculaire à la ligne droite)
        const nx = -dy / dist;
        const ny = dx / dist;

        // Puissance de la courbure (distance du point de contrôle)
        const curveOffset = 35;

        const mx = (fromNode.x + toNode.x) / 2;
        const my = (fromNode.y + toNode.y) / 2;

        const cx = mx + nx * curveOffset;
        const cy = my + ny * curveOffset;

        dAttr = `M ${fromNode.x},${fromNode.y} Q ${cx},${cy} ${toNode.x},${toNode.y}`;

        // CALCUL CORRIGÉ : L'apex de la courbe est à mi-chemin du point de contrôle
        const apexX = mx + nx * (curveOffset / 2);
        const apexY = my + ny * (curveOffset / 2);

        // On place le texte légèrement à l'extérieur de l'apex en suivant la normale
        const textMargin = 15;
        textX = apexX + nx * textMargin;
        textY = apexY + ny * textMargin;
      } else {
        // 3. Ligne droite classique (Unidirectionnelle)
        dAttr = `M ${fromNode.x},${fromNode.y} L ${toNode.x},${toNode.y}`;
        textX = (fromNode.x + toNode.x) / 2;
        textY = (fromNode.y + toNode.y) / 2 - 12;
      }

      // 2. CRÉER LES ÉLÉMENTS AVEC LE D DÉJÀ CALCULÉ
      const edgeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      edgeGroup.setAttribute("class", "edge-group");
      edgeGroup.dataset.index = index;
      edgeGroup.style.cursor = "pointer";

      const hitPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      hitPath.setAttribute("d", dAttr); // Maintenant dAttr est rempli
      hitPath.setAttribute("stroke", "transparent");
      hitPath.setAttribute("stroke-width", "20");
      hitPath.setAttribute("fill", "none");
      hitPath.style.pointerEvents = "stroke"; // Important pour que le clic fonctionne sur le "hit area"

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("id", `edge-path-${index}`);
      path.setAttribute("stroke", "var(--circle-stroke, #334155)");
      path.setAttribute("stroke-width", "3");
      path.setAttribute("fill", "none");
      path.setAttribute("marker-end", "url(#auto-arrow)");
      path.setAttribute("d", dAttr); // Maintenant dAttr est rempli
      path.style.pointerEvents = "none";

      const isSelected = this.selectedEdgeIndex === index;
      const isLoop = edge.from === edge.to;

      let markerUrl;
      if (isLoop) {
        markerUrl = isSelected ? "url(#auto-arrow-loop-active)" : "url(#auto-arrow-loop)";
      } else {
        markerUrl = isSelected ? "url(#auto-arrow-active)" : "url(#auto-arrow)";
      }

      path.setAttribute("stroke", isSelected ? "#F59E0B" : "var(--circle-stroke, #334155)");
      path.setAttribute("stroke-width", isSelected ? "5" : "3");
      path.setAttribute("marker-end", markerUrl);

      // 3. TEXTE
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", textX);
      text.setAttribute("y", textY);
      text.setAttribute("dominant-baseline", "central");
      text.setAttribute("fill", "var(--brand-main, #6366F1)");
      text.setAttribute("font-weight", "800");
      text.setAttribute("font-size", "16px");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("paint-order", "stroke");
      text.setAttribute("stroke", "var(--container-bg, #FFFFFF)");
      text.setAttribute("stroke-width", "4");
      text.textContent = edge.label || "ε";

      edgeGroup.appendChild(hitPath);
      edgeGroup.appendChild(path);
      edgeGroup.appendChild(text);
      this.container.appendChild(edgeGroup);

      // 1. CLIC GAUCHE : Ouvre la modale d'édition
      hitPath.addEventListener("click", (e) => {
        e.stopPropagation();
        this.editEdgeLabel(index);
      });

      // 2. CLIC DROIT : Sélectionne l'arête (pour la supprimer)
      hitPath.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();

        this.selectedEdgeIndex = index;
        this.selectedStateForEdge = null;
        this.render();
      });

      this.container.appendChild(edgeGroup);
    });

    // B. DESSINER LES ÉTATS (NŒUDS)
    this.nodes.forEach((node) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("class", "node-group");
      group.setAttribute("transform", `translate(${node.x}, ${node.y})`);
      group.dataset.id = node.id;
      group.style.cursor = "grab";

      if (node.isInitial) {
        const initArrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
        initArrow.setAttribute("d", `M -50,0 L -23,0`);
        initArrow.setAttribute("stroke", "var(--circle-stroke, #334155)");
        initArrow.setAttribute("stroke-width", "3");
        initArrow.setAttribute("marker-end", "url(#auto-arrow)");
        group.appendChild(initArrow);
      }

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("r", "20");
      circle.setAttribute("id", `auto-node-${node.id}`);

      if (this.selectedStateForEdge === node.id) {
        circle.classList.add("selected-state");
        circle.style.fill = "#FEF3C7";
        circle.style.stroke = "#F59E0B";
        circle.style.strokeWidth = "5px";
      } else {
        circle.style.fill = "var(--container-bg, #FFFFFF)";
        circle.style.stroke = "var(--circle-stroke, #334155)";
        circle.style.strokeWidth = "3px";
      }

      group.appendChild(circle);

      if (node.isFinal) {
        const innerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        innerCircle.setAttribute("r", "14");
        innerCircle.setAttribute("fill", "none");
        innerCircle.setAttribute("id", `auto-node-inner-${node.id}`);
        innerCircle.style.stroke =
          this.selectedStateForEdge === node.id ? "#F59E0B" : "var(--circle-stroke, #334155)";
        innerCircle.style.strokeWidth = "2px";
        group.appendChild(innerCircle);
      }

      // Nom du nœud (q0, q1...)
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", "0");
      text.setAttribute("y", "0");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "central");
      text.setAttribute("font-weight", "700");
      text.setAttribute("fill", "var(--text-primary, #334155)");
      text.style.pointerEvents = "none";
      text.textContent = node.id;
      group.appendChild(text);

      group.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();

        this.draggingNodeId = node.id;
        this.isDraggingNode = false;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
      });

      group.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          this.setInitialState(node.id);
        } else {
          this.toggleFinalState(node.id);
        }
      });

      this.container.appendChild(group);
    });
  }

  deleteNode(nodeId) {
    this.saveState();
    // 1. Supprimer le nœud
    this.nodes = this.nodes.filter((n) => n.id !== nodeId);
    // 2. Supprimer les arêtes entrantes et sortantes
    this.edges = this.edges.filter((e) => e.from !== nodeId && e.to !== nodeId);

    this.selectedStateForEdge = null;

    // Sécurité : Si on a supprimé l'état initial, on donne le rôle au premier venu
    if (this.nodes.length > 0 && !this.nodes.some((n) => n.isInitial)) {
      this.nodes[0].isInitial = true;
    }

    this.render();
  }

  // Supprimer une arête
  deleteEdge(edgeIndex) {
    this.saveState();
    this.edges.splice(edgeIndex, 1);
    this.selectedEdgeIndex = null;
    this.render();
  }

  // Écouteur global pour le clavier
  onKeyDown(e) {
    // Sécurité vitale : Ne rien faire si l'utilisateur est en train de taper dans un champ texte (Regex, Tester, Modale...)
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;

    // Touches Suppr (Delete) ou Retour Arrière (Backspace)
    if (e.key === "Delete" || e.key === "Backspace") {
      if (this.selectedStateForEdge !== null) {
        this.deleteNode(this.selectedStateForEdge);
      } else if (this.selectedEdgeIndex !== null && this.selectedEdgeIndex !== undefined) {
        this.deleteEdge(this.selectedEdgeIndex);
      }
    }
  }

  // --- 5. ANIMATION TEST DE MOT (VIA LE MOTEUR NFA) ---

  // Petite fonction utilitaire pour tout remettre en blanc
  resetAllColors() {
    this.nodes.forEach((n) => {
      const el = document.getElementById(`auto-node-${n.id}`);
      if (el) {
        el.className.baseVal = "";
        el.style.fill = "var(--container-bg, #FFFFFF)";
        el.style.stroke = "var(--circle-stroke, #334155)";
        el.style.strokeWidth = "3px";
      }
      const inner = document.getElementById(`auto-node-inner-${n.id}`);
      if (inner) inner.style.stroke = "var(--circle-stroke, #334155)";
    });
  }

  // Allume plusieurs nœuds simultanément (Magie du NFA !)
  async highlightMultipleNodes(nodeIds, className, fallbackFill, fallbackStroke) {
    nodeIds.forEach((nodeId) => {
      const circle = document.getElementById(`auto-node-${nodeId}`);
      if (circle) {
        circle.className.baseVal = className;
        circle.style.fill = fallbackFill;
        circle.style.stroke = fallbackStroke;
        circle.style.strokeWidth = "4px";

        const inner = document.getElementById(`auto-node-inner-${nodeId}`);
        if (inner) inner.style.stroke = fallbackStroke;
      }
    });
  }

  async testWord(word) {
    this.resetAllColors();

    // 1. Initialiser le simulateur NFA avec les données actuelles
    const expandedGraph = this.getExpandedGraph();
    const simulator = new NFASimulator(expandedGraph.nodes, expandedGraph.edges);
    const result = simulator.simulateStepByStep(word);

    if (result.trace.length === 0) {
      return { accepted: false, error: result.error };
    }

    // 2. Jouer l'animation pas à pas à partir de la trace générée
    for (let i = 0; i < result.trace.length; i++) {
      const step = result.trace[i];

      // Allumer tous les états actifs à cette étape
      await this.highlightMultipleNodes(step.activeStates, "state-active", "#FEF3C7", "#F59E0B");

      await sleep(500); // Temps de pause

      // On efface les couleurs avant le prochain pas (sauf si c'est la fin)
      if (i < result.trace.length - 1) {
        this.resetAllColors();
      }
    }

    // 3. Affichage visuel du résultat final
    const finalActiveStates = result.finalActiveStates || [];

    if (result.accepted) {
      // Surligner en VERT uniquement les états actifs qui sont FINAUX
      const winningStates = finalActiveStates.filter(
        (id) => this.nodes.find((n) => n.id === id).isFinal
      );
      await this.highlightMultipleNodes(winningStates, "state-success", "#D1FAE5", "#10B981");
      return { accepted: true, message: result.message };
    } else {
      // Surligner en ROUGE les états où on a échoué
      const failedStates = result.trace[result.trace.length - 1].activeStates;
      await this.highlightMultipleNodes(failedStates, "state-error", "#FECACA", "#EF4444");
      return { accepted: false, error: result.error || result.message };
    }
  }
}
