class KMeansEditor extends CanvasEngine {
    constructor(svgId) {
        super(svgId);
        this.type = 'kmeans';
        this.points = [];
        this.centroids = [];
        
        this.traces = [];
        this.currentStep = 0;
        this.isPlaying = false;

        this.clusterColors = [
            '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', 
            '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1'
        ];

        if (this.initEvents) this.initEvents();
    }

    clearCanvas() {
        this.traces = []; 
        
        this.points = [];
        this.centroids = [];
        
        this.resetAnimation();
        this.render();
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateRandomPoints(count = 150) {
        this.clearCanvas();
        const width = this.svg.clientWidth || 800;
        const height = this.svg.clientHeight || 600;

        for (let i = 0; i < count; i++) {
            this.points.push({
                id: i,
                x: 50 + Math.random() * (width - 100),
                y: 50 + Math.random() * (height - 100),
                cluster: null
            });
        }
        this.render();
    }

    getDistance(p1, p2) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }


    runKMeans() {
        if (this.points.length === 0) {
            alert("Please scatter random points first.");
            return;
        }

        this.traces = [];
        this.points.forEach(p => p.cluster = null);
        this.centroids = [];

        this.captureTrace("<b>Initial State:</b> Raw data points before any clustering begins.");

        const kSlider = document.getElementById('ai-depth-slider');
        const K = kSlider ? parseInt(kSlider.value, 10) : 3;

        this.currentStep = 0;
        
        this.centroids = [];
        let shuffled = [...this.points].sort(() => 0.5 - Math.random());
        for (let i = 0; i < K; i++) {
            this.centroids.push({
                id: `c${i}`,
                x: shuffled[i].x,
                y: shuffled[i].y,
                cluster: i
            });
        }
        
        this.captureTrace("<b>Initialization Step:</b> K centroids are randomly placed on the canvas.");

        let hasChanged = true;
        let iterations = 0;
        const maxIterations = 20;

        while (hasChanged && iterations < maxIterations) {
            hasChanged = false;

            this.points.forEach(p => {
                let minDist = Infinity;
                let bestCluster = null;

                this.centroids.forEach(c => {
                    let d = this.getDistance(p, c);
                    if (d < minDist) {
                        minDist = d;
                        bestCluster = c.cluster;
                    }
                });

                if (p.cluster !== bestCluster) {
                    p.cluster = bestCluster;
                    hasChanged = true;
                }
            });
            
            this.captureTrace("<b>Assignment Step:</b> Each point is linked to its nearest centroid based on Euclidean distance.");

            this.centroids.forEach(c => {
                const clusterPoints = this.points.filter(p => p.cluster === c.cluster);
                if (clusterPoints.length > 0) {
                    const sumX = clusterPoints.reduce((acc, p) => acc + p.x, 0);
                    const sumY = clusterPoints.reduce((acc, p) => acc + p.y, 0);
                    c.x = sumX / clusterPoints.length;
                    c.y = sumY / clusterPoints.length;
                }
            });

            if (hasChanged) {
                this.captureTrace("<b>Update Step:</b> Centroids move to the exact average center (mean) of all points currently assigned to them.");
            }

            iterations++;
        }

        this.captureTrace("<b>Convergence:</b> Centroids no longer move. The K-Means algorithm is complete!");

        document.getElementById('ai-playback-controls').style.display = 'flex';
        this.isPlaying = true;
        this.updatePlayPauseBtn();
        this.playLoop();
    }

    captureTrace(message = "") {
        const currentPoints = JSON.parse(JSON.stringify(this.points));
        const currentCentroids = JSON.parse(JSON.stringify(this.centroids));

        if (this.traces.length > 0) {
            const lastTrace = this.traces[this.traces.length - 1];
            if (JSON.stringify(lastTrace.points) === JSON.stringify(currentPoints) &&
                JSON.stringify(lastTrace.centroids) === JSON.stringify(currentCentroids) &&
                lastTrace.message === message) {
                return;
            }
        }

        this.traces.push({
            points: currentPoints,
            centroids: currentCentroids,
            message: message
        });
    }

    applyTrace(index) {
        const trace = this.traces[index];
        if (!trace) return;

        this.points = JSON.parse(JSON.stringify(trace.points));
        this.centroids = JSON.parse(JSON.stringify(trace.centroids));

        const explanationBox = document.getElementById('ai-explanation-box');
        const stepText = document.getElementById('ai-step-text');
        
        if (explanationBox && stepText) {
            if (trace.message) {
                explanationBox.style.display = 'block';
                stepText.innerHTML = trace.message;
            } else {
                explanationBox.style.display = 'none';
            }
        }

        this.render();
    }

    async playLoop() {
        while (this.isPlaying && this.currentStep < this.traces.length - 1) {
            const speedSlider = document.getElementById('ai-speed-slider');
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
            this.points.forEach(p => p.cluster = null);
        }
        
        this.centroids = [];
        
        this.render();
        
        const controls = document.getElementById('ai-playback-controls');
        if (controls) controls.style.display = 'none';
        
        const explanationBox = document.getElementById('ai-explanation-box');
        if (explanationBox) explanationBox.style.display = 'none';
    }

    resetAnimation() {
        this.isPlaying = false;
        this.currentStep = 0;
        this.updatePlayPauseBtn();
        
        if (this.points) {
            this.points.forEach(p => p.cluster = null);
        }
        
        this.centroids = [];
        
        this.render();
    }

    updatePlayPauseBtn() {
        const btn = document.getElementById('btn-ai-playpause');
        if (btn) {
            if (this.isPlaying) {
                btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                btn.style.background = '#FEF3C7';
                btn.style.color = '#D97706';
                btn.style.borderColor = '#FCD34D';
            } else {
                btn.innerHTML = '<i class="fa-solid fa-play"></i>';
                btn.style.background = '#D1FAE5'; 
                btn.style.color = '#059669';
                btn.style.borderColor = '#A7F3D0';
            }
        }
    }

    render() {
        Array.from(this.container.children).forEach(c => {
            if (c.tagName !== 'defs') this.container.removeChild(c);
        });

        this.container.setAttribute('transform', `translate(${this.panX || 0}, ${this.panY || 0}) scale(${this.zoomLevel || 1})`);

        const svgNS = 'http://www.w3.org/2000/svg';

        this.points.forEach(p => {
            if (p.cluster !== null) {
                const centroid = this.centroids.find(c => c.cluster === p.cluster);
                if (centroid) {
                    const line = document.createElementNS(svgNS, 'line');
                    line.setAttribute('x1', p.x);
                    line.setAttribute('y1', p.y);
                    line.setAttribute('x2', centroid.x);
                    line.setAttribute('y2', centroid.y);
                    
                    line.style.stroke = this.clusterColors[p.cluster % this.clusterColors.length];
                    line.style.strokeWidth = '1.5px';
                    line.style.opacity = '0.3';
                    line.style.transition = "all 0.3s ease";
                    
                    this.container.appendChild(line);
                }
            }
        });

        this.points.forEach(p => {
            const circle = document.createElementNS(svgNS, 'circle');
            circle.setAttribute('cx', p.x);
            circle.setAttribute('cy', p.y);
            circle.setAttribute('r', 6);
            
            const color = p.cluster !== null ? this.clusterColors[p.cluster % this.clusterColors.length] : '#94A3B8';
            
            circle.style.fill = color;
            circle.style.stroke = '#FFFFFF';
            circle.style.strokeWidth = '1.5px';
            circle.style.transition = "fill 0.3s ease";
            
            this.container.appendChild(circle);
        });

        this.centroids.forEach(c => {
            const rect = document.createElementNS(svgNS, 'rect');
            const size = 18;
            rect.setAttribute('x', c.x - size/2);
            rect.setAttribute('y', c.y - size/2);
            rect.setAttribute('width', size);
            rect.setAttribute('height', size);
            
            const color = this.clusterColors[c.cluster % this.clusterColors.length];
            
            rect.style.fill = color;
            rect.style.stroke = '#1E293B';
            rect.style.strokeWidth = '3px';
            rect.style.transition = "all 0.3s ease";
            
            this.container.appendChild(rect);
        });
    }
}
