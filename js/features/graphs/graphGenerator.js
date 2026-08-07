// =========================================
// javascript/graphs/graphGenerator.js
// =========================================

class GraphGenerator {
  /**
   * Prepares the editor for a new generated graph by clearing it if necessary.
   */
  static clearForGeneration(editor) {
    if (!editor) return false;

    if (editor.document.nodes.length > 0) {
      if (!confirm("Clear current graph to generate a new one?")) return false;
    }

    editor.saveState();
    editor.document.clear();
    editor.nodeCounter = 1;
    editor.selectedNodes.clear();

    return true;
  }

  static getWeightValue(isWeighted) {
    return isWeighted ? Math.floor(Math.random() * 10) + 1 : null;
  }

  /**
   * Main entry point for generating graphs.
   */
  static executeGeneration(editor, type, count, isWeighted, isDirected) {
    if (!this.clearForGeneration(editor)) return;

    const nodes = editor.document.nodes;
    const edges = editor.document.edges;

    // Ensure we have fallback dimensions if the SVG isn't perfectly loaded
    const width = editor.svg.clientWidth || 800;
    const height = editor.svg.clientHeight || 600;

    switch (type) {
      case "complete":
        this._generateComplete(editor, nodes, edges, width, height, count, isWeighted, isDirected);
        break;
      case "random":
        this._generateRandom(editor, nodes, edges, width, height, count, isWeighted, isDirected);
        break;
      case "bipartite":
        this._generateBipartite(editor, nodes, edges, width, count, isWeighted, isDirected);
        break;
      case "grid":
        this._generateGrid(editor, nodes, edges, width, height, count, isWeighted, isDirected);
        break;
      case "tree":
        this._generateTree(editor, nodes, edges, width, count, isWeighted, isDirected);
        break;
      case "path":
        this._generatePath(editor, nodes, edges, width, height, count, isWeighted, isDirected);
        break;
      default:
        console.warn(`Unknown graph generation type: ${type}`);
    }

    editor.render();
  }

  // =========================================
  //   PRIVATE GENERATION METHODS
  // =========================================

  static _generateComplete(editor, nodes, edges, width, height, count, isWeighted, isDirected) {
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(cx, cy) - 60;

    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
      nodes.push({
        id: String(editor.nodeCounter++),
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      });
    }

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        edges.push({
          from: nodes[i].id,
          to: nodes[j].id,
          weight: this.getWeightValue(isWeighted),
          directed: isDirected,
        });
      }
    }
  }

  static _generateRandom(editor, nodes, edges, width, height, count, isWeighted, isDirected) {
    const margin = 50;
    const w = width - 100;
    const h = height - 100;

    for (let i = 0; i < count; i++) {
      nodes.push({
        id: String(editor.nodeCounter++),
        x: margin + Math.random() * w,
        y: margin + Math.random() * h,
      });
    }

    const maxPossibleEdges = (count * (count - 1)) / 2;
    const edgesToCreate = Math.min(count * 1.5, maxPossibleEdges);

    while (edges.length < edgesToCreate) {
      const u = Math.floor(Math.random() * count);
      const v = Math.floor(Math.random() * count);

      if (u !== v) {
        const id1 = nodes[u].id;
        const id2 = nodes[v].id;

        const exists = edges.some(
          (e) => (e.from === id1 && e.to === id2) || (e.from === id2 && e.to === id1)
        );

        if (!exists) {
          edges.push({
            from: id1,
            to: id2,
            weight: this.getWeightValue(isWeighted),
            directed: isDirected,
          });
        }
      }
    }
  }

  static _generateBipartite(editor, nodes, edges, width, count, isWeighted, isDirected) {
    const setSize1 = Math.ceil(count / 2);
    const setSize2 = Math.floor(count / 2);

    const startX1 = 100;
    const startX2 = width - 100;
    const startY = 150;
    const spacing = 100;

    const set1 = [];
    const set2 = [];

    for (let i = 0; i < setSize1; i++) {
      const node = { id: String(editor.nodeCounter++), x: startX1, y: startY + i * spacing };
      nodes.push(node);
      set1.push(node);
    }

    for (let i = 0; i < setSize2; i++) {
      const node = { id: String(editor.nodeCounter++), x: startX2, y: startY + i * spacing };
      nodes.push(node);
      set2.push(node);
    }

    for (const n1 of set1) {
      for (const n2 of set2) {
        edges.push({
          from: n1.id,
          to: n2.id,
          weight: this.getWeightValue(isWeighted),
          directed: isDirected,
        });
      }
    }
  }

  static _generateGrid(editor, nodes, edges, width, height, count, isWeighted, isDirected) {
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const spacing = 100;

    const startX = width / 2 - ((cols - 1) * spacing) / 2;
    const startY = height / 2 - ((rows - 1) * spacing) / 2;

    let grid = [];
    let created = 0;

    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        if (created >= count) break;

        let node = {
          id: String(editor.nodeCounter++),
          x: startX + c * spacing,
          y: startY + r * spacing,
        };
        nodes.push(node);
        grid[r][c] = node;
        created++;

        if (c > 0)
          edges.push({
            from: grid[r][c - 1].id,
            to: node.id,
            weight: this.getWeightValue(isWeighted),
            directed: isDirected,
          });
        if (r > 0)
          edges.push({
            from: grid[r - 1][c].id,
            to: node.id,
            weight: this.getWeightValue(isWeighted),
            directed: isDirected,
          });
      }
    }
  }

  static _generateTree(editor, nodes, edges, width, count, isWeighted, isDirected) {
    const levelHeight = 80;
    const startY = 60;

    let queue = [
      {
        id: String(editor.nodeCounter++),
        x: width / 2,
        y: startY,
        level: 0,
        leftBound: 0,
        rightBound: width,
      },
    ];

    if (queue[0]) nodes.push(queue[0]);

    let head = 0;
    while (head < queue.length && nodes.length < count) {
      let curr = queue[head++];
      let y = curr.y + levelHeight;

      // Left Child
      if (nodes.length < count) {
        let lx = (curr.leftBound + curr.x) / 2;
        let lNode = {
          id: String(editor.nodeCounter++),
          x: lx,
          y: y,
          level: curr.level + 1,
          leftBound: curr.leftBound,
          rightBound: curr.x,
        };
        nodes.push(lNode);
        edges.push({
          from: curr.id,
          to: lNode.id,
          weight: this.getWeightValue(isWeighted),
          directed: isDirected,
        });
        queue.push(lNode);
      }

      // Right Child
      if (nodes.length < count) {
        let rx = (curr.x + curr.rightBound) / 2;
        let rNode = {
          id: String(editor.nodeCounter++),
          x: rx,
          y: y,
          level: curr.level + 1,
          leftBound: curr.x,
          rightBound: curr.rightBound,
        };
        nodes.push(rNode);
        edges.push({
          from: curr.id,
          to: rNode.id,
          weight: this.getWeightValue(isWeighted),
          directed: isDirected,
        });
        queue.push(rNode);
      }
    }
  }

  static _generatePath(editor, nodes, edges, width, height, count, isWeighted, isDirected) {
    const startX = 80;
    const endX = width - 80;
    const y = height / 2;
    const step = (endX - startX) / (count - 1 || 1);

    for (let i = 0; i < count; i++) {
      nodes.push({
        id: String(editor.nodeCounter++),
        x: startX + i * step,
        y: y,
      });
    }

    for (let i = 0; i < count - 1; i++) {
      edges.push({
        from: nodes[i].id,
        to: nodes[i + 1].id,
        weight: this.getWeightValue(isWeighted),
        directed: isDirected,
      });
    }
  }
}

// =========================================
//   UI INTERACTION (MODAL)
// =========================================

// Keep the active generator type globally for the UI
window.activeGeneratorType = null;

function openGeneratorModal(type) {
  window.activeGeneratorType = type;
  const modal = document.getElementById("generator-modal");
  const title = document.getElementById("generator-title");
  const nodeField = document.getElementById("gen-param-nodes");

  if (!modal) return;

  if (type === "complete") {
    title.textContent = "Generate Complete Graph";
    nodeField.style.display = "block";
  } else if (type === "random") {
    title.textContent = "Generate Random Graph";
    nodeField.style.display = "block";
  } else if (type === "bipartite") {
    title.textContent = "Generate Bipartite Graph";
    nodeField.style.display = "block";
  } else if (type === "grid") {
    title.textContent = "Generate Grid Graph (NxN)";
    nodeField.style.display = "block";
  } else if (type === "tree") {
    title.textContent = "Generate Binary Tree";
    nodeField.style.display = "block";
  } else if (type === "path") {
    title.textContent = "Generate Simple Path Chain";
    nodeField.style.display = "block";
  }

  modal.style.display = "flex";
}

window.openGeneratorModal = openGeneratorModal;

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("generator-modal");
  const btnClose = document.getElementById("btn-close-generator");
  const btnCancel = document.getElementById("btn-cancel-gen");
  const btnSubmit = document.getElementById("btn-submit-gen");

  if (btnClose) btnClose.addEventListener("click", () => (modal.style.display = "none"));
  if (btnCancel) btnCancel.addEventListener("click", () => (modal.style.display = "none"));

  if (btnSubmit) {
    btnSubmit.addEventListener("click", () => {
      const numNodes = parseInt(document.getElementById("gen-input-nodes").value, 10) || 5;
      const isWeighted = document.getElementById("gen-input-weighted").checked;
      const isDirected = document.getElementById("gen-input-directed").checked;

      if (modal) modal.style.display = "none";

      // Use AppRegistry to get the editor instance and pass it to the Generator
      if (window.AppRegistry) {
        const editor = window.AppRegistry.get("graphs");
        if (editor) {
          GraphGenerator.executeGeneration(
            editor,
            window.activeGeneratorType,
            numNodes,
            isWeighted,
            isDirected
          );
        } else {
          console.warn("Editor not found in AppRegistry.");
        }
      } else {
        console.warn("AppRegistry is not available.");
      }
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });
  }
});
