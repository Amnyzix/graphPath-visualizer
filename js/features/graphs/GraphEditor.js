// =========================================
// javascript/graphs/GraphEditor.js
// =========================================

import { CanvasEngine } from "../../core/CanvasEngine.js";
import { GraphDocument } from "../../core/Documents/GraphDocuments.js";
import { GraphLayout } from "../../core/GraphLayout.js";

export class GraphEditor extends CanvasEngine {
  constructor(svgId) {
    super(svgId);

    // Node counter starts at 1
    this.nodeCounter = 1;

    // Arrowhead definitions for directed edges
    this.svg.insertAdjacentHTML(
      "afterbegin",
      `
            <defs>
                <marker id="graph-arrow" markerUnits="userSpaceOnUse" viewBox="0 -5 10 10" refX="22" refY="0" markerWidth="14" markerHeight="14" orient="auto">
                    <path d="M 0,-4 L 8,0 L 0,4 Z" fill="context-stroke" />
                </marker>
            </defs>
        `
    );

    // Selection and clipboard
    this.selectedNodeId = null;
    this.selectedNodes = new Set();
    this.clipboard = { nodes: [], edges: [] };

    // The Single Source of Truth
    this.document = new GraphDocument();

    // Undo / Redo history
    this.undoStack = [];
    this.redoStack = [];
  }

  // =========================================
  //   STATE MANAGEMENT (UNDO / REDO)
  // =========================================

  saveState() {
    const state = {
      nodes: JSON.parse(JSON.stringify(this.document.nodes)),
      edges: JSON.parse(JSON.stringify(this.document.edges)),
      nodeIdCounter: this.nodeCounter,
    };
    this.undoStack.push(state);

    // Limit history to 50 steps to save memory
    if (this.undoStack.length > 50) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo() {
    if (this.undoStack.length === 0) return;

    this.redoStack.push({
      nodes: JSON.parse(JSON.stringify(this.document.nodes)),
      edges: JSON.parse(JSON.stringify(this.document.edges)),
      nodeIdCounter: this.nodeCounter,
    });

    const previousState = this.undoStack.pop();
    this.document.nodes = previousState.nodes;
    this.document.edges = previousState.edges;
    this.nodeCounter = previousState.nodeIdCounter;

    this.selectedNodes.clear();
    this.render();
  }

  redo() {
    if (this.redoStack.length === 0) return;

    this.undoStack.push({
      nodes: JSON.parse(JSON.stringify(this.document.nodes)),
      edges: JSON.parse(JSON.stringify(this.document.edges)),
      nodeIdCounter: this.nodeCounter,
    });

    const nextState = this.redoStack.pop();
    this.document.nodes = nextState.nodes;
    this.document.edges = nextState.edges;
    this.nodeCounter = nextState.nodeIdCounter;

    this.selectedNodes.clear();
    this.render();
  }

  // =========================================
  //   DATA SYNCHRONIZATION
  // =========================================

  updateGraphDataText() {
    const formatSelect = document.getElementById("data-format");
    const inputField = document.getElementById("data-input");

    if (!inputField || document.activeElement === inputField || !formatSelect) return;

    const format = formatSelect.value;
    let text = "";

    // FORMAT 1: Edge List
    if (format === "edge_list") {
      this.document.edges.forEach((e) => {
        text += `${e.from} ${e.to}`;
        if (e.weight !== null && e.weight !== undefined) text += ` ${e.weight}`;
        text += "\n";
      });
      this.document.nodes.forEach((n) => {
        const hasEdge = this.document.edges.some((e) => e.from === n.id || e.to === n.id);
        if (!hasEdge) text += `${n.id}\n`;
      });
    }
    // FORMAT 2: Adjacency List
    else if (format === "adj_list") {
      this.document.nodes.forEach((n) => {
        let neighborsLine = [];
        this.document.edges.forEach((e) => {
          if (e.from === n.id) {
            let edgeText = e.to;
            if (e.weight !== null && e.weight !== undefined) edgeText += `(${e.weight})`;
            neighborsLine.push(edgeText);
          } else if (!e.directed && e.to === n.id) {
            let edgeText = e.from;
            if (e.weight !== null && e.weight !== undefined) edgeText += `(${e.weight})`;
            neighborsLine.push(edgeText);
          }
        });
        text += `${n.id}: ${neighborsLine.join(", ")}\n`;
      });
    }
    // FORMAT 3: Adjacency Matrix
    else if (format === "adj_matrix") {
      if (this.document.nodes.length === 0) {
        inputField.value = "";
        return;
      }

      const sortedNodes = [...this.document.nodes].sort((a, b) => {
        const numA = parseInt(a.id, 10);
        const numB = parseInt(b.id, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.id.localeCompare(b.id);
      });

      const n = sortedNodes.length;
      let matrix = Array(n)
        .fill(0)
        .map(() => Array(n).fill(0));

      this.document.edges.forEach((e) => {
        const fromIdx = sortedNodes.findIndex((node) => node.id === e.from);
        const toIdx = sortedNodes.findIndex((node) => node.id === e.to);

        if (fromIdx !== -1 && toIdx !== -1) {
          const val = e.weight !== null && e.weight !== undefined ? e.weight : 1;
          matrix[fromIdx][toIdx] = val;
          if (!e.directed) {
            matrix[toIdx][fromIdx] = val;
          }
        }
      });

      matrix.forEach((row) => {
        text += row.join(" ") + "\n";
      });
    }

    inputField.value = text.trim();
  }

  // =========================================
  //   CORE GRAPH LOGIC
  // =========================================

  getExportData() {
    return { nodes: this.document.nodes, edges: this.document.edges };
  }

  getGraphData() {
    return {
      nodes: this.document.nodes,
      edges: this.document.edges,
      nodeIdCounter: this.nodeCounter,
    };
  }

  setGraphData(data) {
    this.saveState();
    this.document.nodes = data.nodes || [];
    this.document.edges = data.edges || [];
    this.nodeCounter = data.nodeIdCounter || this.document.nodes.length + 1;
    this.render();
  }

  createNode(x, y) {
    this.saveState();
    this.document.addNode({
      id: String(this.nodeCounter++),
      x: x,
      y: y,
    });
    this.render();
  }

  clearGraph() {
    if (confirm("Clear the entire graph?")) {
      this.saveState();
      this.document.clear();
      this.nodeCounter = 1;
      this.startNode = null;
      this.tempEdge = null;
      this.render();
    }
  }

  resetGraph() {
    if (this.svg) {
      this.svg.querySelectorAll("circle").forEach((c) => {
        c.classList.remove("visited", "current", "selected");
        c.style.fill = "";
      });
      this.svg.querySelectorAll("path.edge, line.edge-line, line.edge, .edge-hit").forEach((e) => {
        try {
          e.style.stroke = "";
          e.style.strokeWidth = "";
        } catch {
          // Ignore errors for elements that might not support these styles
        }
      });
    }
    const log = document.getElementById("log-display");
    if (log) log.style.opacity = 0;
  }

  snapAllNodesToGrid() {
    const gridSize = 25;
    if (!this.document.nodes || this.document.nodes.length === 0) return;
    this.saveState();
    this.document.nodes.forEach((n) => {
      n.x = Math.round(n.x / gridSize) * gridSize;
      n.y = Math.round(n.y / gridSize) * gridSize;
    });
    this.render();
  }

  clearCanvas() {
    if (
      (!this.document.nodes || this.document.nodes.length === 0) &&
      (!this.document.edges || this.document.edges.length === 0)
    )
      return;
    this.saveState();
    this.document.clear();
    this.nodeCounter = 1;
    this.selectedNodes.clear();
    this.selectedNodeId = null;
    const playerControls = document.getElementById("player-controls");
    if (playerControls) playerControls.style.display = "none";
    this.startNode = null;
    this.tempEdge = null;
    this.render();
  }

  clear_no_alert() {
    this.saveState();
    this.document.clear();
    this.nodeCounter = 1;
    this.selectedNodes.clear();
    this.selectedNodeId = null;
    this.startNode = null;
    this.tempEdge = null;
    return true;
  }

  deleteSelected() {
    if (this.selectedNodes.size > 0) {
      if (!confirm(`Delete ${this.selectedNodes.size} node(s)?`)) return;
      this.saveState();
      this.selectedNodes.forEach((id) => this.document.removeNode(id));
      this.selectedNodes.clear();
      this.selectedNodeId = null;
      this.startNode = null;
      this.tempEdge = null;
      this.render();
      return;
    }
    if (!this.selectedNodeId) return;
    if (!confirm(`Delete node ${this.selectedNodeId}?`)) return;

    this.saveState();
    this.document.removeNode(this.selectedNodeId);
    this.selectedNodeId = null;
    this.startNode = null;
    this.tempEdge = null;
    this.render();
  }

  copySelected() {
    const nodesToCopy =
      this.selectedNodes.size > 0
        ? Array.from(this.selectedNodes)
        : this.selectedNodeId
          ? [this.selectedNodeId]
          : [];
    if (nodesToCopy.length === 0) return;
    this.clipboard.nodes = nodesToCopy.map((id) =>
      JSON.parse(JSON.stringify(this.document.nodes.find((n) => n.id === id)))
    );
    this.clipboard.edges = this.document.edges
      .filter((e) => nodesToCopy.includes(e.from) && nodesToCopy.includes(e.to))
      .map((e) => JSON.parse(JSON.stringify(e)));
  }

  pasteClipboard() {
    if (!this.clipboard || this.clipboard.nodes.length === 0) return;
    this.saveState();
    const idMap = new Map();

    this.clipboard.nodes.forEach((n) => {
      const newId = String(this.nodeCounter++);
      idMap.set(n.id, newId);
      const newNode = { ...n, id: newId, x: n.x + 30, y: n.y + 30 };
      this.document.addNode(newNode);
      this.selectedNodeId = newId;
      this.selectedNodes.clear();
      this.selectedNodes.add(newId);
    });

    this.clipboard.edges.forEach((e) => {
      const from = idMap.get(e.from);
      const to = idMap.get(e.to);
      if (from && to) {
        this.document.addEdge({
          from,
          to,
          weight: e.weight || null,
          directed: e.directed || false,
        });
      }
    });
    this.render();
  }

  onSelectRect(x, y, w, h) {
    this.selectedNodes.clear();
    this.selectedNodeId = null;
    this.document.nodes.forEach((n) => {
      if (n.x >= x && n.x <= x + w && n.y >= y && n.y <= y + h) {
        this.selectedNodes.add(n.id);
      }
    });
    this.render();
  }

  relayoutGraph() {
    if (this.document.nodes.length === 0) return;

    this.saveState();
    GraphLayout.applyLayout(this.document.nodes, this.document.edges);
    this.render();
  }

  // =========================================
  //   RENDERER
  // =========================================

  render() {
    Array.from(this.container.children).forEach((c) => {
      if (c.tagName !== "defs") this.container.removeChild(c);
    });

    this.container.setAttribute(
      "transform",
      `translate(${this.panX}, ${this.panY}) scale(${this.zoomLevel})`
    );
    const svgNS = "http://www.w3.org/2000/svg";

    // A) DRAW EDGES
    this.document.edges.forEach((edge, index) => {
      const fromNode = this.document.getNode(edge.from);
      const toNode = this.document.getNode(edge.to);
      if (!fromNode || !toNode) return;

      const path = document.createElementNS(svgNS, "line");
      path.setAttribute("x1", fromNode.x);
      path.setAttribute("y1", fromNode.y);
      path.setAttribute("x2", toNode.x);
      path.setAttribute("y2", toNode.y);
      path.setAttribute("stroke-linecap", "round");
      path.classList.add("edge-line");
      path.setAttribute("data-from", edge.from);
      path.setAttribute("data-to", edge.to);
      path.classList.add("edge");

      if (edge.directed) {
        path.setAttribute("marker-end", "url(#graph-arrow)");
      }
      path.style.cursor = "pointer";

      const hitPath = document.createElementNS(svgNS, "line");
      hitPath.setAttribute("x1", fromNode.x);
      hitPath.setAttribute("y1", fromNode.y);
      hitPath.setAttribute("x2", toNode.x);
      hitPath.setAttribute("y2", toNode.y);
      hitPath.setAttribute("stroke", "transparent");
      hitPath.setAttribute("stroke-width", "18");
      hitPath.setAttribute("pointer-events", "stroke");
      hitPath.style.cursor = "pointer";
      hitPath.classList.add("edge-hit");
      hitPath.setAttribute("data-from", edge.from);
      hitPath.setAttribute("data-to", edge.to);

      hitPath.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        if (e.button === 0) {
          this.promptEdgeParams(edge.from, edge.to).then((result) => {
            if (result) {
              this.saveState();
              edge.weight = result.weight;
              edge.directed = result.isDirected;
              this.render();
            }
          });
        } else if (e.button === 2) {
          e.preventDefault();
          if (confirm(`Delete edge ${edge.from} -> ${edge.to}?`)) {
            this.saveState();
            this.document.edges.splice(index, 1);
            this.render();
          }
        }
      });

      this.container.appendChild(path);
      this.container.appendChild(hitPath);

      if (edge.weight !== null && edge.weight !== undefined && edge.weight !== 1) {
        const textX = (fromNode.x + toNode.x) / 2;
        const textY = (fromNode.y + toNode.y) / 2 - 10;
        const bg = document.createElementNS(svgNS, "rect");
        bg.setAttribute("x", textX - 10);
        bg.setAttribute("y", textY - 12);
        bg.setAttribute("width", 20);
        bg.setAttribute("height", 16);
        bg.setAttribute("fill", "var(--canvas-bg)");
        bg.setAttribute("rx", 4);
        this.container.appendChild(bg);

        const text = document.createElementNS(svgNS, "text");
        text.setAttribute("x", textX);
        text.setAttribute("y", textY - 3);
        text.textContent = edge.weight;
        text.style.fontSize = "12px";
        text.style.fill = "var(--brand-main)";
        text.style.cursor = "pointer";
        text.classList.add("edge-weight");

        text.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          if (e.button === 0) {
            this.promptEdgeParams(edge.from, edge.to).then((result) => {
              if (result) {
                this.saveState();
                edge.weight = result.weight;
                edge.directed = result.isDirected;
                this.render();
              }
            });
          } else if (e.button === 2) {
            e.preventDefault();
            if (confirm(`Delete edge ${edge.from} -> ${edge.to}?`)) {
              this.saveState();
              this.document.edges.splice(index, 1);
              this.render();
            }
          }
        });
        this.container.appendChild(text);
      }
    });

    // B) DRAW TEMPORARY EDGE
    if (this.tempEdge) {
      const tempPath = document.createElementNS(svgNS, "line");
      tempPath.setAttribute("x1", this.tempEdge.x1);
      tempPath.setAttribute("y1", this.tempEdge.y1);
      tempPath.setAttribute("x2", this.tempEdge.x2);
      tempPath.setAttribute("y2", this.tempEdge.y2);
      tempPath.setAttribute("stroke", "var(--brand-main)");
      tempPath.setAttribute("stroke-width", "3");
      tempPath.setAttribute("stroke-dasharray", "5,5");
      tempPath.setAttribute("marker-end", "url(#graph-arrow-active)");
      tempPath.setAttribute("opacity", "0.9");
      tempPath.style.pointerEvents = "none";
      this.container.appendChild(tempPath);
    }

    // C) DRAW NODES
    this.document.nodes.forEach((node) => {
      const group = document.createElementNS(svgNS, "g");
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", node.x);
      circle.setAttribute("cy", node.y);
      circle.setAttribute("r", 20);

      if (this.selectedNodes.has(node.id) || this.selectedNodeId === node.id)
        circle.classList.add("selected");
      if (this.startNode && this.startNode.id === node.id) circle.classList.add("edge-start");

      circle.setAttribute("data-id", node.id);
      circle.setAttribute("data-from", node.id);
      circle.setAttribute("data-to", node.id);

      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", node.x);
      text.setAttribute("y", node.y);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.textContent = node.id;

      group.appendChild(circle);
      group.appendChild(text);

      group.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        if (e.button !== 0) return;

        if (e.ctrlKey || e.metaKey) {
          if (this.selectedNodes.has(node.id)) this.selectedNodes.delete(node.id);
          else this.selectedNodes.add(node.id);
          this.selectedNodeId = node.id;
        } else {
          if (!this.selectedNodes.has(node.id)) {
            this.selectedNodes.clear();
            this.selectedNodes.add(node.id);
            this.selectedNodeId = node.id;
          } else {
            this.selectedNodeId = node.id;
          }
        }

        this.pendingDrag = {
          node: node,
          startClientPos: { x: e.clientX, y: e.clientY },
          ids: Array.from(this.selectedNodes),
        };
      });

      group.addEventListener("mouseup", (e) => {
        if (this.edgeTimer) {
          clearTimeout(this.edgeTimer);
          this.edgeTimer = null;
        }
        if (this.pendingDrag) this.pendingDrag = null;

        if (e.button === 0 && !this._draggingStarted) {
          if (!this.startNode) {
            this.startNode = node;
            this.tempEdge = { x1: node.x, y1: node.y, x2: node.x, y2: node.y };
            this.render();
          } else if (this.startNode.id === node.id) {
            this.startNode = null;
            this.tempEdge = null;
            this.render();
          } else {
            const fromId = this.startNode.id;
            const toId = node.id;
            this.promptEdgeParams(fromId, toId).then((result) => {
              if (result && fromId && toId) {
                this.saveState();
                this.document.addEdge({
                  from: fromId,
                  to: toId,
                  weight: result.weight,
                  directed: result.isDirected,
                });
              }
              this.startNode = null;
              this.tempEdge = null;
              this.render();
            });
          }
        }

        this.mouseDownPos = null;
        this._draggingStarted = false;
      });

      group.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        const newId = prompt("Rename node:", node.id);
        if (newId && newId !== node.id && !this.document.nodes.some((n) => n.id === newId)) {
          this.saveState();
          this.document.edges.forEach((edge) => {
            if (edge.from === node.id) edge.from = newId;
            if (edge.to === node.id) edge.to = newId;
          });
          node.id = newId;
          this.render();
        } else if (newId) {
          alert("This node name already exists!");
        }
      });

      this.container.appendChild(group);
    });

    // Sync text box after render
    this.updateGraphDataText();

    // Restore animation overlay if present
    if (typeof window.renderStateAtCurrentStep === "function") {
      window.renderStateAtCurrentStep();
    }
  }
}
