import { CanvasEngine } from "../../core/CanvasEngine.js";

export class KNNEditor extends CanvasEngine {
  constructor(svgId) {
    super(svgId);
    this.type = "knn";
    this.points = [];
    this.targetPoint = null;

    this.traces = [];
    this.currentStep = 0;
    this.isPlaying = false;
  }

  clearCanvas() {
    this.traces = [];
    this.points = [];
    this.targetPoint = null;
    this.resetAnimation();
    this.render();
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getDistance(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  generateTrainingData(count = 60) {
    this.clearCanvas();
    const width = this.svg.clientWidth || 800;
    const height = this.svg.clientHeight || 600;

    for (let i = 0; i < count; i++) {
      const isClassA = Math.random() > 0.5;
      const centerX = isClassA ? width * 0.3 : width * 0.7;

      this.points.push({
        id: i,
        x: centerX + (Math.random() - 0.5) * (width * 0.5),
        y: 50 + Math.random() * (height - 100),
        category: isClassA ? "A" : "B",
      });
    }
    this.render();
  }

  spawnTargetPoint() {
    const width = this.svg.clientWidth || 800;
    const height = this.svg.clientHeight || 600;

    this.targetPoint = {
      x: 100 + Math.random() * (width - 200),
      y: 100 + Math.random() * (height - 200),
      category: "UNKNOWN",
    };

    this.traces = [];
    this.render();
  }

  runKNN() {
    if (this.points.length === 0 || !this.targetPoint) {
      alert("Please scatter training data and add a target point first.");
      return;
    }

    const kSlider =
      document.getElementById("knn-k-slider") || document.getElementById("ai-depth-slider");
    const K = kSlider ? parseInt(kSlider.value, 10) : 3;

    this.traces = [];
    this.currentStep = 0;

    this.targetPoint.category = "UNKNOWN";
    this.kNearest = [];

    this.captureTrace("<b>Initial State:</b> The target point (grey) needs to be classified.", []);

    let distances = this.points.map((p) => {
      return {
        point: p,
        distance: this.getDistance(this.targetPoint, p),
      };
    });

    this.captureTrace(
      "<b>Distance Calculation:</b> Measuring the Euclidean distance to all training points.",
      []
    );

    distances.sort((a, b) => a.distance - b.distance);
    const topK = distances.slice(0, K);

    const nearestPoints = topK.map((d) => d.point);

    this.captureTrace(
      `<b>Finding Neighbors:</b> Identifying the ${K} closest neighbors.`,
      nearestPoints
    );

    let counts = {};
    nearestPoints.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });

    let winningCategory = null;
    let maxVotes = -1;

    for (let cat in counts) {
      if (counts[cat] > maxVotes) {
        maxVotes = counts[cat];
        winningCategory = cat;
      }
    }

    this.targetPoint.category = winningCategory;

    this.captureTrace(
      `<b>Classification:</b> The majority vote is '${winningCategory}' (${maxVotes}/${K} votes). Target is classified!`,
      nearestPoints
    );

    document.getElementById("ai-playback-controls").style.display = "flex";
    this.isPlaying = true;
    this.updatePlayPauseBtn();
    this.playLoop();
  }

  render() {
    Array.from(this.container.children).forEach((c) => {
      if (c.tagName !== "defs") this.container.removeChild(c);
    });

    this.container.setAttribute(
      "transform",
      `translate(${this.panX || 0}, ${this.panY || 0}) scale(${this.zoomLevel || 1})`
    );
    const svgNS = "http://www.w3.org/2000/svg";

    if (this.targetPoint && this.kNearest && this.kNearest.length > 0) {
      this.kNearest.forEach((neighbor) => {
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", this.targetPoint.x);
        line.setAttribute("y1", this.targetPoint.y);
        line.setAttribute("x2", neighbor.x);
        line.setAttribute("y2", neighbor.y);

        line.style.stroke = "#475569";
        line.style.strokeWidth = "2px";
        line.style.strokeDasharray = "5, 5";
        line.style.opacity = "0.6";
        line.style.transition = "all 0.3s ease";

        this.container.appendChild(line);
      });
    }

    this.points.forEach((p) => {
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", p.x);
      circle.setAttribute("cy", p.y);
      circle.setAttribute("r", 6);

      circle.style.fill = p.category === "A" ? "#3B82F6" : "#F97316";
      circle.style.stroke = "#FFFFFF";
      circle.style.strokeWidth = "1.5px";

      this.container.appendChild(circle);
    });

    if (this.targetPoint) {
      const circle = document.createElementNS(svgNS, "circle");

      circle.setAttribute("id", "knn-target-node");

      circle.setAttribute("cx", this.targetPoint.x);
      circle.setAttribute("cy", this.targetPoint.y);
      circle.setAttribute("r", 10);

      if (this.targetPoint.category === "UNKNOWN") {
        circle.style.fill = "#94A3B8";
      } else {
        circle.style.fill = this.targetPoint.category === "A" ? "#3B82F6" : "#F97316";
      }

      circle.style.stroke = "#1E293B";
      circle.style.strokeWidth = "3px";
      circle.style.transition = "fill 0.3s ease";

      circle.style.cursor = "grab";
      circle.addEventListener("mousedown", (e) => this.startDragTarget(e));

      this.container.appendChild(circle);
    }
  }

  captureTrace(message = "", kNearest = []) {
    this.traces.push({
      points: JSON.parse(JSON.stringify(this.points)),
      targetPoint: JSON.parse(JSON.stringify(this.targetPoint)),
      kNearest: JSON.parse(JSON.stringify(kNearest)),
      message: message,
    });
  }

  applyTrace(index) {
    const trace = this.traces[index];
    if (!trace) return;

    this.points = JSON.parse(JSON.stringify(trace.points));
    this.targetPoint = JSON.parse(JSON.stringify(trace.targetPoint));
    this.kNearest = JSON.parse(JSON.stringify(trace.kNearest || []));

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

  async playLoop() {
    while (this.isPlaying && this.currentStep < this.traces.length - 1) {
      const speedSlider = document.getElementById("ai-speed-slider");
      const speedMultiplier = speedSlider ? parseFloat(speedSlider.value) : 1;

      const delay = 1000 / speedMultiplier;
      await this.sleep(delay);

      if (!this.isPlaying) break;
      this.stepForward();
    }

    if (this.currentStep >= this.traces.length - 1) {
      this.isPlaying = false;
      this.updatePlayPauseBtn();
    }
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
      if (this.currentStep >= this.traces.length - 1) this.currentStep = 0;
      this.playLoop();
    }
  }

  stopAnimation() {
    this.isPlaying = false;
    this.currentStep = 0;
    this.updatePlayPauseBtn();

    this.traces = [];

    if (this.points) {
      this.points.forEach((p) => (p.cluster = null));
    }

    this.centroids = [];

    this.render();

    const controls = document.getElementById("ai-playback-controls");
    if (controls) controls.style.display = "none";

    const explanationBox = document.getElementById("ai-explanation-box");
    if (explanationBox) explanationBox.style.display = "none";
  }

  resetAnimation() {
    this.isPlaying = false;
    this.currentStep = 0;
    this.updatePlayPauseBtn();

    if (this.points) {
      this.points.forEach((p) => (p.cluster = null));
    }

    this.centroids = [];

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

  startDragTarget(e) {
    e.preventDefault();
    e.stopPropagation();

    if (this.isPlaying) {
      this.stopAnimation();
    }

    this.isDraggingTarget = true;

    this._dragMove = this.handleDragMove.bind(this);
    this._dragEnd = this.handleDragEnd.bind(this);

    document.addEventListener("mousemove", this._dragMove);
    document.addEventListener("mouseup", this._dragEnd);
  }

  handleDragMove(e) {
    if (!this.isDraggingTarget || !this.targetPoint) return;

    const rect = this.svg.getBoundingClientRect();

    const x = (e.clientX - rect.left - (this.panX || 0)) / (this.zoomLevel || 1);
    const y = (e.clientY - rect.top - (this.panY || 0)) / (this.zoomLevel || 1);

    this.targetPoint.x = x;
    this.targetPoint.y = y;

    this.targetPoint.category = "UNKNOWN";
    this.traces = [];
    this.kNearest = [];

    const targetNode = document.getElementById("knn-target-node");
    if (targetNode) {
      targetNode.setAttribute("cx", x);
      targetNode.setAttribute("cy", y);

      targetNode.style.fill = "#94A3B8";
    }
  }

  handleDragEnd() {
    this.isDraggingTarget = false;

    document.removeEventListener("mousemove", this._dragMove);
    document.removeEventListener("mouseup", this._dragEnd);
  }
}
