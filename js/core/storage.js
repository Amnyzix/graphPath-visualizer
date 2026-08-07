function getActiveGraphEditor() {
  if (window.AppRegistry) return window.AppRegistry.get("graphs");
  if (window.graphsApp) return window.graphsApp;
  return null;
}

function getCurrentGraphState() {
  const app = getActiveGraphEditor();
  if (app) {
    return app.getGraphData();
  }
  // Fallback pour le code legacy
  return {
    nodes: window.nodes || [],
    edges: window.edges || [],
    nodeIdCounter: window.nodeIdCounter || 1,
  };
}

export function saveGraph() {
  const graphData = getCurrentGraphState();
  localStorage.setItem("graphData", JSON.stringify(graphData));
  alert("Graph saved to browser storage!");
}

export function loadGraph() {
  const data = localStorage.getItem("graphData");
  if (data) {
    const graphData = JSON.parse(data);
    const app = getActiveGraphEditor();

    if (app) {
      // Si le nouvel éditeur est actif, on utilise sa méthode dédiée
      app.setGraphData({
        nodes: (graphData.nodes || []).map((n) => ({ ...n, id: String(n.id) })),
        edges: (graphData.edges || []).map((e) => ({
          ...e,
          from: String(e.from),
          to: String(e.to),
        })),
        nodeIdCounter: parseInt(graphData.nodeIdCounter) || 1,
      });
    } else {
      // Fallback pour l'ancien système
      window.nodes = (graphData.nodes || []).map((n) => ({ ...n, id: String(n.id) }));
      window.edges = (graphData.edges || []).map((e) => ({
        ...e,
        from: String(e.from),
        to: String(e.to),
      }));
      window.nodeIdCounter = parseInt(graphData.nodeIdCounter) || 1;
      if (typeof selectedNodes !== "undefined") window.selectedNodes.clear();
      if (typeof tempSelectedId !== "undefined") window.tempSelectedId = null;
      if (typeof draggingNode !== "undefined") window.draggingNode = null;
      if (typeof render === "function") window.render();
    }
    alert("Graph loaded from browser storage!");
  } else {
    alert("No saved graph found.");
  }
}

export function exportGraph() {
  const graphData = getCurrentGraphState();
  const dataStr = JSON.stringify(graphData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "graph.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importGraph() {
  document.getElementById("import-file").click();
}

export function handleFileImport(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const graphData = JSON.parse(e.target.result);
        const app = getActiveGraphEditor();

        if (app) {
          // On envoie les données au document propre
          app.setGraphData({
            nodes: (graphData.nodes || []).map((n) => ({ ...n, id: String(n.id) })),
            edges: (graphData.edges || []).map((e) => ({
              ...e,
              from: String(e.from),
              to: String(e.to),
            })),
            nodeIdCounter: parseInt(graphData.nodeIdCounter) || 1,
          });
          // Note : app.setGraphData appelle déjà this.render() en interne
        } else {
          // Fallback
          window.nodes = (graphData.nodes || []).map((n) => ({ ...n, id: String(n.id) }));
          window.edges = (graphData.edges || []).map((e) => ({
            ...e,
            from: String(e.from),
            to: String(e.to),
          }));
          window.nodeIdCounter = parseInt(graphData.nodeIdCounter) || 1;
          if (typeof selectedNodes !== "undefined") window.selectedNodes.clear();
          if (typeof tempSelectedId !== "undefined") window.tempSelectedId = null;
          if (typeof draggingNode !== "undefined") window.draggingNode = null;
          if (typeof render === "function") window.render();
        }
        alert("Graph imported successfully!");
      } catch {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  }
}

window.saveGraph = saveGraph;
window.loadGraph = loadGraph;
window.exportGraph = exportGraph;
window.importGraph = importGraph;
