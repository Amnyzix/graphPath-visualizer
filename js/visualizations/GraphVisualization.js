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

    // Nettoyer les arêtes (On retire volontairement .edge-hit pour ne pas le toucher)
    this.svg.querySelectorAll("path.edge, line.edge-line, line.edge").forEach((e) => {
      try {
        e.style.stroke = "";
        e.style.strokeWidth = "";
        e.style.strokeLinecap = "";
        e.style.color = "";

        // On remet la flèche par défaut de ton graphe
        if (e.hasAttribute("marker-end") && e.getAttribute("marker-end").includes("active")) {
          e.setAttribute("marker-end", "url(#graph-arrow)");
        }
      } catch {
        // Ignorer les erreurs si l'élément a été supprimé
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

    if (actionType === "visit" || actionType === "select") {
      circle.style.fill = "";
      circle.style.stroke = "";
    }

    if (actionType === "select") circle.classList.add("selected");
    else if (actionType === "visit" || actionType === "current") circle.classList.add("visited");

    if (customColor) {
      circle.style.fill = customColor;
      circle.style.stroke = `color-mix(in srgb, ${customColor}, black 30%)`;
      circle.style.strokeWidth = "3.5px";
    }

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
      edgePath.style.strokeWidth = "5px"; // Ligne plus épaisse
      edgePath.style.strokeLinecap = "round";
      edgePath.style.color = color;

      // Appliquer la flèche active correspondant au graphe
      if (edgePath.hasAttribute("marker-end")) {
        edgePath.setAttribute("marker-end", "url(#graph-arrow-active)");
      }
    });

    // Sécurité supplémentaire : s'assurer via JS que le hitPath ne prend aucune couleur
    const hitSelector = `line.edge-hit[data-from="${from}"][data-to="${to}"], line.edge-hit[data-from="${to}"][data-to="${from}"]`;
    this.svg.querySelectorAll(hitSelector).forEach((hit) => {
      hit.style.stroke = "transparent";
    });
  }

  clear() {
    this.resetAllStyles();
  }
}
