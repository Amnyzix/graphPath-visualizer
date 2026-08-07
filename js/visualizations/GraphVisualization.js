import { Visualization } from "./Visualization.js";

export class GraphVisualization extends Visualization {
  // --- NETTOYAGE VISUEL ---
  resetAllStyles() {
    if (!this.svg) return;

    // Nettoyer les cercles
    this.svg.querySelectorAll("circle").forEach((c) => {
      c.classList.remove("visited", "current", "selected");
      c.style.fill = "";
      c.style.stroke = "";
      c.style.strokeWidth = "";
    });

    // Nettoyer les arêtes
    this.svg.querySelectorAll("path.edge, line.edge-line, line.edge, .edge-hit").forEach((e) => {
      try {
        e.style.stroke = "";
        e.style.strokeWidth = "";
        e.style.strokeLinecap = "";
        e.style.color = "";
      } catch {
        // Ignorer les erreurs si l'élément a été supprimé du DOM
      }
    });

    // Cacher les logs par défaut
    const logDisplay = document.getElementById("log-display");
    if (logDisplay) {
      logDisplay.style.opacity = 0;
      logDisplay.textContent = "";
    }
  }

  // --- COLORATION DES NOEUDS ---
  highlightNode(nodeId, actionType = "current", customColor = null, message = null) {
    const circle = this.svg.querySelector(`circle[data-id="${nodeId}"]`);
    if (!circle) return;

    // Retirer les anciens styles de survol par sécurité
    if (actionType === "visit" || actionType === "select") {
      circle.style.fill = "";
      circle.style.stroke = "";
    }

    // Ajouter la classe (qui va appeler ton CSS: orange, vert, etc.)
    if (actionType === "select") circle.classList.add("selected");
    else if (actionType === "visit" || actionType === "current") circle.classList.add("visited");

    // Gérer une couleur forcée par Python (ex: color_node)
    if (customColor) {
      circle.style.fill = customColor;
      circle.style.stroke = `color-mix(in srgb, ${customColor}, black 30%)`;
      circle.style.strokeWidth = "3.5px";
    }

    // Gérer le texte du log
    if (message) {
      const logDisplay = document.getElementById("log-display");
      if (logDisplay) {
        logDisplay.textContent = message;
        logDisplay.style.opacity = 1;
      }
    }
  }

  // --- COLORATION DES ARÊTES ---
  highlightEdge(from, to, color = "#3498db") {
    const selector = [
      `line.edge[data-from="${from}"][data-to="${to}"]`,
      `line.edge-line[data-from="${from}"][data-to="${to}"]`,
      `path.edge[data-from="${from}"][data-to="${to}"]`,
      `line.edge[data-from="${to}"][data-to="${from}"]`,
      `line.edge-line[data-from="${to}"][data-to="${from}"]`,
      `path.edge[data-from="${to}"][data-to="${from}"]`,
    ].join(", ");

    const edgePaths = Array.from(this.svg.querySelectorAll(selector));
    edgePaths.forEach((edgePath) => {
      edgePath.style.stroke = color;
      edgePath.style.strokeWidth = "4px";
      edgePath.style.strokeLinecap = "round";
      edgePath.style.color = color;
    });
  }

  clear() {
    this.resetAllStyles();
  }
}
