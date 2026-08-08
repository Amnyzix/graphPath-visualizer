import { CanvasEngine } from "../../core/CanvasEngine.js";

export class MinimaxEditor extends CanvasEngine {
  constructor(svgId) {
    super(svgId);
    this.type = "ai";
    this.nodeCounter = 1;
    this.nodes = [];
    this.edges = [];
    this.leafValues = [];

    this.zoomLevel = this.zoomLevel || 1;
    this.panX = this.panX || 0;
    this.panY = this.panY || 0;

    this.initEvents();
  }

  initEvents() {
    if (super.initEvents) super.initEvents();

    this.svg.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomSensitivity = 0.1;
      const delta = e.deltaY > 0 ? -1 : 1;
      const oldZoom = this.zoomLevel;

      this.zoomLevel *= 1 + delta * zoomSensitivity;
      this.zoomLevel = Math.max(0.1, Math.min(this.zoomLevel, 5));

      const rect = this.svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      this.panX = mouseX - (mouseX - this.panX) * (this.zoomLevel / oldZoom);
      this.panY = mouseY - (mouseY - this.panY) * (this.zoomLevel / oldZoom);

      this.render();
    });

    let isPanning = false;
    let startPanX = 0;
    let startPanY = 0;

    this.svg.addEventListener("mousedown", (e) => {
      if (e.target === this.svg || e.target.id === this.svg.id) {
        if (e.button === 0 || e.button === 1) {
          isPanning = true;
          startPanX = e.clientX - this.panX;
          startPanY = e.clientY - this.panY;
          this.svg.style.cursor = "grabbing";
        }
      }
    });

    window.addEventListener("mousemove", (e) => {
      if (!isPanning) return;
      this.panX = e.clientX - startPanX;
      this.panY = e.clientY - startPanY;
      this.render();
    });

    window.addEventListener("mouseup", () => {
      if (isPanning) {
        isPanning = false;
        this.svg.style.cursor = "default";
      }
    });
  }

  getExportData() {
    return { nodes: this.nodes, edges: this.edges, type: this.type };
  }

  clearCanvas() {
    this.saveState();
    this.nodes = [];
    this.edges = [];
    this.nodeCounter = 1;
    this.render();
  }

  generateTree(depth = 3) {
    const d = parseInt(depth, 10);

    this.clearCanvas();
    this.saveState();

    const startX = this.svg.clientWidth / 2;
    const startY = 50;

    const horizontalSpacing = d > 4 ? 40 : 80;
    const verticalSpacing = d > 4 ? 70 : 100;

    const buildNode = (currentDepth, x, y, isMaxNode, parentId) => {
      const nodeId = String(this.nodeCounter++);

      const isLeaf = currentDepth === d;
      const value = isLeaf ? Math.floor(Math.random() * 21) - 10 : null;

      this.nodes.push({
        id: nodeId,
        x: x,
        y: y,
        isMax: isMaxNode,
        isLeaf: isLeaf,
        value: value,
        computedValue: null,
      });

      if (parentId) {
        this.edges.push({ from: parentId, to: nodeId, directed: true });
      }

      if (!isLeaf) {
        const offset = horizontalSpacing * Math.pow(2, d - currentDepth - 1);
        buildNode(currentDepth + 1, x - offset, y + verticalSpacing, !isMaxNode, nodeId);
        buildNode(currentDepth + 1, x + offset, y + verticalSpacing, !isMaxNode, nodeId);
      }
    };

    buildNode(0, startX, startY, true, null);
    this.render();
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getChildren(nodeId) {
    const childEdges = this.edges.filter((e) => e.from === nodeId);
    const children = childEdges.map((e) => this.nodes.find((n) => n.id === e.to));

    return children.sort((a, b) => a.x - b.x);
  }

  captureTrace(message = "") {
    const newNodes = JSON.parse(JSON.stringify(this.nodes));
    const newEdges = JSON.parse(JSON.stringify(this.edges));

    if (this.traces.length > 0) {
      const lastTrace = this.traces[this.traces.length - 1];
      if (
        JSON.stringify(lastTrace.nodes) === JSON.stringify(newNodes) &&
        JSON.stringify(lastTrace.edges) === JSON.stringify(newEdges) &&
        lastTrace.activeNodeId === this.activeNodeId &&
        lastTrace.message === message
      ) {
        return;
      }
    }

    this.traces.push({
      nodes: newNodes,
      edges: newEdges,
      activeNodeId: this.activeNodeId,
      message: message,
    });
  }

  runMinimax(useAlphaBeta) {
    if (this.nodes.length === 0) {
      alert("Please generate a tree first.");
      return;
    }

    this.nodes.forEach((n) => {
      if (!n.isLeaf) n.computedValue = null;
      n.isPruned = false;
      n.isEvaluating = false;
    });
    this.edges.forEach((e) => (e.isPruned = false));

    this.activeNodeId = null;
    this.traces = [];
    this.currentStep = 0;
    this.captureTrace();

    const root = this.nodes.find((n) => n.id === "1");
    if (root) {
      this.evaluateNode(root, useAlphaBeta, -Infinity, Infinity);
    }

    document.getElementById("ai-playback-controls").style.display = "flex";
    this.isPlaying = true;
    this.updatePlayPauseBtn();
    this.playLoop();
  }

  evaluateNode(node, useAlphaBeta, alpha, beta) {
    node.isEvaluating = true;
    this.activeNodeId = node.id;

    if (useAlphaBeta) {
      node.alpha = alpha;
      node.beta = beta;
    }

    const nodeType = node.isMax ? "MAX" : "MIN";
    this.captureTrace(`Exploring <b>${nodeType}</b> node <b>${node.id}</b>.`);

    if (node.isLeaf) {
      node.isEvaluating = false;
      this.activeNodeId = null;
      this.captureTrace(
        `Reached leaf node <b>${node.id}</b>. Returning its score: <b>${node.value}</b>.`
      );
      return node.value;
    }

    let children = this.getChildren(node.id);
    let bestValue = node.isMax ? -Infinity : Infinity;

    for (let i = 0; i < children.length; i++) {
      let child = children[i];
      if (child.isPruned) continue;

      let childValue = this.evaluateNode(child, useAlphaBeta, alpha, beta);

      this.activeNodeId = node.id;

      if (node.isMax) {
        if (childValue > bestValue) {
          bestValue = childValue;
          node.computedValue = bestValue;
          this.captureTrace(
            `<b>${nodeType}</b> node <b>${node.id}</b> updates its value to <b>${bestValue}</b> (found a higher score).`
          );
        }

        if (useAlphaBeta) {
          if (bestValue > alpha) {
            alpha = bestValue;
            node.alpha = alpha;
            this.captureTrace(
              `Updated <b>Alpha (α)</b> to <b>${alpha}</b> at node <b>${node.id}</b>.`
            );
          }
        }
      } else {
        if (childValue < bestValue) {
          bestValue = childValue;
          node.computedValue = bestValue;
          this.captureTrace(
            `<b>${nodeType}</b> node <b>${node.id}</b> updates its value to <b>${bestValue}</b> (found a lower score).`
          );
        }

        if (useAlphaBeta) {
          if (bestValue < beta) {
            beta = bestValue;
            node.beta = beta;
            this.captureTrace(
              `Updated <b>Beta (β)</b> to <b>${beta}</b> at node <b>${node.id}</b>.`
            );
          }
        }
      }

      if (useAlphaBeta && beta <= alpha) {
        this.captureTrace(
          `<span style="color: #EF4444; font-weight: bold;">Pruning triggered!</span> Beta (${beta}) is ≤ Alpha (${alpha}). No need to explore further.`
        );

        for (let j = i + 1; j < children.length; j++) {
          this.pruneBranch(children[j]);
        }

        this.captureTrace(`Remaining branches under node <b>${node.id}</b> are pruned.`);
        break;
      }
    }

    node.isEvaluating = false;
    this.activeNodeId = null;
    this.captureTrace(
      `Finished evaluating <b>${nodeType}</b> node <b>${node.id}</b>. Final choice: <b>${bestValue}</b>.`
    );

    return bestValue;
  }

  pruneBranch(node) {
    node.isPruned = true;
    const edgeToNode = this.edges.find((e) => e.to === node.id);
    if (edgeToNode) edgeToNode.isPruned = true;

    const children = this.getChildren(node.id);
    children.forEach((child) => this.pruneBranch(child));
  }

  async playLoop() {
    console.log("Starting playback...");

    while (this.isPlaying && this.currentStep < this.traces.length - 1) {
      const speedSlider = document.getElementById("ai-speed-slider");
      const speedMultiplier = speedSlider ? parseFloat(speedSlider.value) : 1;

      const baseDelay = 1000;
      const delay = baseDelay / speedMultiplier;

      await this.sleep(delay);

      if (!this.isPlaying) break;

      this.stepForward();
    }

    if (this.currentStep >= this.traces.length - 1) {
      this.isPlaying = false;
      this.updatePlayPauseBtn();
    }
  }

  applyTrace(index) {
    const trace = this.traces[index];
    if (!trace) return;

    this.nodes = JSON.parse(JSON.stringify(trace.nodes));
    this.edges = JSON.parse(JSON.stringify(trace.edges));
    this.activeNodeId = trace.activeNodeId;

    const explanationBox = document.getElementById("ai-explanation-box");
    const stepText = document.getElementById("ai-step-text");

    if (explanationBox && stepText) {
      if (trace.message) {
        explanationBox.style.display = "block";
        stepText.innerHTML = trace.message;
      } else {
        explanationBox.style.display = "none";
      }
    }

    this.render();
  }

  stepForward() {
    if (this.currentStep < this.traces.length - 1) {
      this.currentStep++;
      this.applyTrace(this.currentStep);
    }
  }

  stepBackward() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.applyTrace(this.currentStep);
    }
  }

  togglePlayPause() {
    this.isPlaying = !this.isPlaying;
    this.updatePlayPauseBtn();
    if (this.isPlaying) {
      if (this.currentStep >= this.traces.length - 1) {
        this.currentStep = 0;
      }
      this.playLoop();
    }
  }

  stopAnimation() {
    this.isPlaying = false;
    this.currentStep = 0;
    this.updatePlayPauseBtn();

    if (this.traces && this.traces.length > 0) {
      this.applyTrace(0);
    }

    const controls = document.getElementById("ai-playback-controls");
    if (controls) controls.style.display = "none";
  }

  resetAnimation() {
    this.isPlaying = false;
    this.updatePlayPauseBtn();

    if (this.traces && this.traces.length > 0) {
      this.currentStep = 0;
      this.applyTrace(0);
    }

    this.activeNodeId = null;

    const explanationBox = document.getElementById("ai-explanation-box");
    if (explanationBox) {
      explanationBox.style.display = "none";
    }

    this.render();
  }

  updatePlayPauseBtn() {
    const btn = document.getElementById("btn-ai-playpause");
    if (btn) {
      if (this.isPlaying) {
        btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        btn.style.background = "#FEF3C7";
        btn.style.color = "#D97706";
        btn.style.borderColor = "#FCD34D";
      } else {
        btn.innerHTML = '<i class="fa-solid fa-play"></i>';
        btn.style.background = "#D1FAE5";
        btn.style.color = "#059669";
        btn.style.borderColor = "#A7F3D0";
      }
    }
  }

  render() {
    Array.from(this.container.children).forEach((c) => {
      if (c.tagName !== "defs") this.container.removeChild(c);
    });

    this.container.setAttribute(
      "transform",
      `translate(${this.panX}, ${this.panY}) scale(${this.zoomLevel})`
    );

    const svgNS = "http://www.w3.org/2000/svg";

    this.edges.forEach((edge) => {
      const fromNode = this.nodes.find((n) => n.id === edge.from);
      const toNode = this.nodes.find((n) => n.id === edge.to);
      if (!fromNode || !toNode) return;

      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", fromNode.x);
      line.setAttribute("y1", fromNode.y);
      line.setAttribute("x2", toNode.x);
      line.setAttribute("y2", toNode.y);

      line.style.transition = "all 0.2s ease";

      if (edge.isPruned) {
        line.style.stroke = "#cbd5e1";
        line.setAttribute("stroke-dasharray", "5,5");
        line.style.strokeWidth = "2px";
      } else if (toNode.id === this.activeNodeId) {
        line.style.stroke = "#F59E0B";
        line.style.strokeWidth = "4px";
        line.removeAttribute("stroke-dasharray");
      } else if (toNode.isEvaluating) {
        line.style.stroke = "#FCD34D";
        line.style.strokeWidth = "3px";
        line.removeAttribute("stroke-dasharray");
      } else {
        line.style.stroke = "#94a3b8";
        line.style.strokeWidth = "2px";
        line.removeAttribute("stroke-dasharray");
      }

      this.container.appendChild(line);
    });

    this.nodes.forEach((node) => {
      const group = document.createElementNS(svgNS, "g");

      const shape = document.createElementNS(svgNS, node.isMax ? "rect" : "circle");

      if (node.isMax) {
        shape.setAttribute("x", node.x - 20);
        shape.setAttribute("y", node.y - 20);
        shape.setAttribute("width", 40);
        shape.setAttribute("height", 40);
      } else {
        shape.setAttribute("cx", node.x);
        shape.setAttribute("cy", node.y);
        shape.setAttribute("r", 20);
      }

      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", node.x);
      text.setAttribute("y", node.y);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");

      let fillColor = "var(--canvas-bg)";
      let strokeColor = node.isMax ? "#e74c3c" : "#3498db";
      let strokeWidth = "2";

      if (node.id === this.activeNodeId) {
        fillColor = "#FCD34D";
        strokeColor = "#F59E0B";
        strokeWidth = "4";
      } else if (node.isEvaluating) {
        fillColor = "#FEF3C7";
      } else if (node.isPruned) {
        fillColor = "#f8fafc";
        strokeColor = "#cbd5e1";
        shape.setAttribute("stroke-dasharray", "4,4");
      } else {
        shape.removeAttribute("stroke-dasharray");
      }

      shape.style.fill = fillColor;
      shape.style.stroke = strokeColor;
      shape.style.strokeWidth = strokeWidth + "px";
      shape.style.transition = "all 0.2s ease";

      if (node.isLeaf) {
        text.textContent = node.value;
      } else if (node.computedValue !== null) {
        text.textContent = node.computedValue;
      } else {
        text.textContent = "?";
      }
      text.style.fill = "var(--text-color)";

      group.appendChild(shape);
      group.appendChild(text);
      this.container.appendChild(group);

      if (node.alpha !== undefined && node.beta !== undefined && !node.isLeaf) {
        const abText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        abText.setAttribute("x", node.x);
        abText.setAttribute("y", node.y - 30);
        abText.setAttribute("text-anchor", "middle");
        abText.setAttribute("font-size", "14px");
        abText.setAttribute("font-weight", "600");
        abText.setAttribute("fill", "#EF4444");

        const aStr = node.alpha === -Infinity ? "-∞" : node.alpha === Infinity ? "∞" : node.alpha;
        const bStr = node.beta === -Infinity ? "-∞" : node.beta === Infinity ? "∞" : node.beta;

        abText.textContent = `α:${aStr} β:${bStr}`;
        group.appendChild(abText);
      }
    });
  }
}
