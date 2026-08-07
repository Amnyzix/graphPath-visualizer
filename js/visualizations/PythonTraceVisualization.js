import { GraphVisualization } from "./GraphVisualization.js";

export class PythonTraceVisualization extends GraphVisualization {
  init() {
    this.clear();
  }

  applyFrame(currentFrame, fullHistory, currentIndex) {
    this.clear(); // On repart à zéro à chaque frame

    if (currentIndex === -1) return;

    // On rejoue l'historique jusqu'à l'étape actuelle pour garder les couleurs précédentes
    for (let i = 0; i <= currentIndex; i++) {
      const frame = fullHistory[i];

      if (!frame) continue;

      const action = frame.action;
      const payload = frame.payload || {}; // C'EST ICI LA MAGIE ! 🪄
      const message = frame.message;
      const isLastStep = i === currentIndex;

      // On extrait les variables du payload
      const nodeId = payload.id;
      const color = payload.color;
      const targetId = payload.target;
      const path = payload.path;

      // 1. Actions sur les noeuds
      if (nodeId && (action === "visit" || action === "select" || action === "color_node")) {
        // On affiche le message du log seulement si c'est la toute dernière étape
        const msgToShow = isLastStep ? message : null;
        this.highlightNode(nodeId, action, color, msgToShow);
      }

      // 2. Actions sur une arête
      if (action === "color_edge" && targetId) {
        this.highlightEdge(nodeId, targetId, color);
      }

      // 3. Dessin de chemin complet
      if (action === "draw_path" && path) {
        for (let j = 0; j < path.length - 1; j++) {
          const u = path[j];
          const v = path[j + 1];
          this.highlightEdge(u, v, color || "#e74c3c");
        }
      }
    }
  }
}
