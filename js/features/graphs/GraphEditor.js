// =========================================
// javascript/graphs/GraphEditor.js
// =========================================

class GraphEditor extends CanvasEngine {
    constructor(svgId) {
        super(svgId);
        
        // On commence le compteur de nœuds à 1 (standard pour les graphes)
        this.nodeCounter = 1;

        // Définition des têtes de flèches pour les arêtes orientées (Directed)
        this.svg.insertAdjacentHTML('afterbegin', `
            <defs>
                <!-- markerUnits="userSpaceOnUse" prevents the arrow from shifting when stroke-width changes -->
                <marker id="graph-arrow" markerUnits="userSpaceOnUse" viewBox="0 -5 10 10" refX="22" refY="0" markerWidth="14" markerHeight="14" orient="auto">
                    <path d="M 0,-4 L 8,0 L 0,4 Z" fill="context-stroke" />
                </marker>
            </defs>
        `);

        // Selection et presse-papiers basique
        this.selectedNodeId = null;
        this.selectedNodes = new Set();
        this.clipboard = { nodes: [], edges: [] };

        this.document = new GraphDocument();
    }

    getExportData() {
        return { nodes: this.document.nodes, edges: this.document.edges };
    }

    createNode(x, y) {
        this.document.addNode({
            id: String(this.nodeCounter++),
            x: x,
            y: y
        });
    }

    render() {
        // Nettoyer les éléments (sauf defs)
        Array.from(this.container.children).forEach(c => {
            if (c.tagName !== 'defs') this.container.removeChild(c);
        });

        this.container.setAttribute('transform', `translate(${this.panX}, ${this.panY}) scale(${this.zoomLevel})`);
        const svgNS = 'http://www.w3.org/2000/svg';

        // A) DESSINER LES ARÊTES
        this.document.edges.forEach((edge, index) => {
            const fromNode = this.document.getNode(edge.from);
            const toNode = this.document.getNode(edge.to);
            if (!fromNode || !toNode) return;

            const path = document.createElementNS(svgNS, 'line');
            path.setAttribute('x1', fromNode.x);
            path.setAttribute('y1', fromNode.y);
            path.setAttribute('x2', toNode.x);
            path.setAttribute('y2', toNode.y);
            path.setAttribute('stroke-linecap', 'round');
            path.classList.add('edge-line');
            // Backwards-compatibility attributes used by the animation player
            path.setAttribute('data-from', edge.from);
            path.setAttribute('data-to', edge.to);
            path.classList.add('edge');
            if (edge.directed) {
                path.setAttribute('marker-end', 'url(#graph-arrow)');
            }
            path.style.cursor = 'pointer';

            const hitPath = document.createElementNS(svgNS, 'line');
            hitPath.setAttribute('x1', fromNode.x);
            hitPath.setAttribute('y1', fromNode.y);
            hitPath.setAttribute('x2', toNode.x);
            hitPath.setAttribute('y2', toNode.y);
            hitPath.setAttribute('stroke', 'transparent');
            hitPath.setAttribute('stroke-width', '18');
            hitPath.setAttribute('pointer-events', 'stroke');
            hitPath.style.cursor = 'pointer';
            hitPath.classList.add('edge-hit');
            hitPath.setAttribute('data-from', edge.from);
            hitPath.setAttribute('data-to', edge.to);
            hitPath.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                if (e.button === 0) {
                    this.promptEdgeParams(edge.from, edge.to).then(result => {
                        if (result) {
                            this.saveState();
                            edge.weight = result.weight;
                            edge.directed = result.isDirected;
                            this.render();
                        }
                    });
                } else if (e.button === 2) {
                    e.preventDefault();
                    if (confirm(`Supprimer l'arête ${edge.from} -> ${edge.to} ?`)) {
                        this.saveState();
                        this.document.removeEdge(edge.id || index);
                        this.render();
                    }
                }
            });

            // Append visible path first, then hitPath on top so it receives events
            this.container.appendChild(path);
            this.container.appendChild(hitPath);

            if (edge.weight !== null && edge.weight !== undefined && edge.weight !== 1) {
                const textX = (fromNode.x + toNode.x) / 2;
                const textY = (fromNode.y + toNode.y) / 2 - 10;
                const bg = document.createElementNS(svgNS, 'rect');
                bg.setAttribute('x', textX - 10);
                bg.setAttribute('y', textY - 12);
                bg.setAttribute('width', 20);
                bg.setAttribute('height', 16);
                bg.setAttribute('fill', 'var(--canvas-bg)');
                bg.setAttribute('rx', 4);
                this.container.appendChild(bg);

                const text = document.createElementNS(svgNS, 'text');
                text.setAttribute('x', textX);
                text.setAttribute('y', textY - 3);
                text.textContent = edge.weight;
                text.style.fontSize = '12px';
                text.style.fill = 'var(--brand-main)';
                text.style.cursor = 'pointer';
                text.classList.add('edge-weight');
                text.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    if (e.button === 0) {
                        this.promptEdgeParams(edge.from, edge.to).then(result => {
                            if (result) {
                                this.saveState();
                                edge.weight = result.weight;
                                edge.directed = result.isDirected;
                                this.render();
                            }
                        });
                    } else if (e.button === 2) {
                        e.preventDefault();
                        if (confirm(`Supprimer l'arête ${edge.from} -> ${edge.to} ?`)) {
                            this.saveState();
                            this.document.removeEdge(edge.id || index);
                            this.render();
                        }
                    }
                });
                this.container.appendChild(text);
            }
        });

        // B) DESSINER L'ARÊTE TEMPORAIRE
        if (this.tempEdge) {
            const tempPath = document.createElementNS(svgNS, 'line');
            tempPath.setAttribute('x1', this.tempEdge.x1);
            tempPath.setAttribute('y1', this.tempEdge.y1);
            tempPath.setAttribute('x2', this.tempEdge.x2);
            tempPath.setAttribute('y2', this.tempEdge.y2);
            tempPath.setAttribute('stroke', 'var(--brand-main)');
            tempPath.setAttribute('stroke-width', '3');
            tempPath.setAttribute('stroke-dasharray', '5,5');
            tempPath.setAttribute('marker-end', 'url(#graph-arrow-active)');
            tempPath.setAttribute('opacity', '0.9');
            tempPath.style.pointerEvents = 'none';
            this.container.appendChild(tempPath);
        }

        // C) DESSINER LES NŒUDS
        this.document.nodes.forEach(node => {
            const group = document.createElementNS(svgNS, 'g');
            const circle = document.createElementNS(svgNS, 'circle');
            circle.setAttribute('cx', node.x);
            circle.setAttribute('cy', node.y);
            circle.setAttribute('r', 20);
            if (this.selectedNodes.has(node.id) || this.selectedNodeId === node.id) circle.classList.add('selected');
            if (this.startNode && this.startNode.id === node.id) circle.classList.add('edge-start');
            circle.setAttribute('data-id', node.id);
            circle.setAttribute('data-from', node.id);
            circle.setAttribute('data-to', node.id);

            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('x', node.x);
            text.setAttribute('y', node.y);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.textContent = node.id;

            group.appendChild(circle);
            group.appendChild(text);

            group.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                if (e.button !== 0) return;

                if (e.ctrlKey || e.metaKey) {
                    if (this.selectedNodes.has(node.id)) this.selectedNodes.delete(node.id);
                    else this.selectedNodes.add(node.id);
                    this.selectedNodeId = node.id;
                } else {
                    if (!this.selectedNodes.has(node.id)) {
                        // Clicked a non-selected node: select only it
                        this.selectedNodes.clear();
                        this.selectedNodes.add(node.id);
                        this.selectedNodeId = node.id;
                    } else {
                        // Clicked a node that's already selected: keep the current multi-selection
                        this.selectedNodeId = node.id;
                    }
                }

                this.pendingDrag = {
                    node: node,
                    startClientPos: { x: e.clientX, y: e.clientY },
                    ids: Array.from(this.selectedNodes)
                };
            });

            group.addEventListener('mouseup', (e) => {
                if (this.edgeTimer) { clearTimeout(this.edgeTimer); this.edgeTimer = null; }
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
                        this.promptEdgeParams(fromId, toId).then(result => {
                            if (result && fromId && toId) {
                                this.saveState();
                                this.document.addEdge({ 
                                    from: fromId, 
                                    to: toId, 
                                    weight: result.weight, 
                                    directed: result.isDirected 
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

            group.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                const newId = prompt('Renommer le nœud :', node.id);
                if (newId && newId !== node.id && !this.document.nodes.some(n => n.id === newId)) {
                    this.saveState();
                    this.document.edges.forEach(edge => {
                        if (edge.from === node.id) edge.from = newId;
                        if (edge.to === node.id) edge.to = newId;
                    });
                    node.id = newId;
                    this.render();
                } else if (newId) {
                    alert('Ce nom de nœud existe déjà !');
                }
            });

            this.container.appendChild(group);
        });

        if (typeof window.renderStateAtCurrentStep === 'function') {
            window.renderStateAtCurrentStep();
        }
    }

    clearGraph() {
        if (confirm('Effacer tout le graphe ?')) {
            this.saveState();
            this.document.clear();
            this.nodeCounter = 1;
            // Ensure any temporary edge preview is removed
            this.startNode = null;
            this.tempEdge = null;
            this.render();
        }
    }

    resetGraph() {
        // Remove visual classes from any existing circle elements
        if (this.svg) {
            this.svg.querySelectorAll('circle').forEach(c => {
                c.classList.remove('visited', 'current', 'selected');
                c.style.fill = '';
            });
            // Reset any stroke styles on edge elements
            this.svg.querySelectorAll('path.edge, line.edge-line, line.edge, .edge-hit').forEach(e => {
                try { e.style.stroke = ''; e.style.strokeWidth = ''; } catch (err) {}
            });
        }
        const log = document.getElementById('log-display');
        if (log) log.style.opacity = 0;
        //this.render();
    }

    snapAllNodesToGrid() {
        const gridSize = 25;
        if (!this.document.nodes || this.document.nodes.length === 0) return;
        this.saveState();
        this.document.nodes.forEach(n => {
            n.x = Math.round(n.x / gridSize) * gridSize;
            n.y = Math.round(n.y / gridSize) * gridSize;
        });
        this.render();
    }

    clearCanvas() {
        if ((!this.document.nodes || this.document.nodes.length === 0) && (!this.document.edges || this.document.edges.length === 0)) return;
        this.saveState();
        this.document.clear();
        this.nodeCounter = 1;
        this.selectedNodes.clear();
        this.selectedNodeId = null;
        const playerControls = document.getElementById('player-controls');
        if (playerControls) playerControls.style.display = 'none';
        // Remove any temporary edge preview
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

    getGraphData() {
        return { nodes: this.document.nodes, edges: this.document.edges, nodeIdCounter: this.nodeCounter };
    }

    setGraphData(data) {
        this.saveState();
        this.document.nodes = data.nodes || [];
        this.document.edges = data.edges || [];
        this.nodeCounter = data.nodeIdCounter || this.document.nodes.length + 1;
        this.render();
    }

    deleteSelected() {
        if (this.selectedNodes.size > 0) {
            if (!confirm(`Supprimer ${this.selectedNodes.size} nœud(s) ?`)) return;
            this.saveState();
            
            this.selectedNodes.forEach(id => this.document.removeNode(id));

            this.selectedNodes.clear();
            this.selectedNodeId = null;
            // Clear any ongoing edge preview that referenced deleted nodes
            this.startNode = null;
            this.tempEdge = null;
            this.render();
            return;
        }
        if (!this.selectedNodeId) return;
        if (!confirm(`Supprimer le nœud ${this.selectedNodeId} ?`)) return;
        this.saveState();

        this.document.removeNode(this.selectedNodeId);
        
        this.selectedNodeId = null;

        // Clear any temporary edge preview that may reference the removed node
        this.startNode = null;
        this.tempEdge = null;
        this.render();
    }

    copySelected() {
        const nodesToCopy = this.selectedNodes.size > 0 ? Array.from(this.selectedNodes) : (this.selectedNodeId ? [this.selectedNodeId] : []);
        if (nodesToCopy.length === 0) return;
        this.clipboard.nodes = nodesToCopy.map(id => JSON.parse(JSON.stringify(this.document.nodes.find(n => n.id === id))));
        this.clipboard.edges = this.document.edges.filter(e => nodesToCopy.includes(e.from) && nodesToCopy.includes(e.to)).map(e => JSON.parse(JSON.stringify(e)));
    }

    pasteClipboard() {
        if (!this.clipboard || this.clipboard.nodes.length === 0) return;
        this.saveState();
        const idMap = new Map();
        this.clipboard.nodes.forEach(n => {
            const newId = String(this.nodeCounter++);
            idMap.set(n.id, newId);
            const newNode = { ...n, id: newId, x: n.x + 30, y: n.y + 30 };
            this.document.nodes.push(newNode);
            this.selectedNodeId = newId;
            this.selectedNodes.clear();
            this.selectedNodes.add(newId);
        });
        this.clipboard.edges.forEach(e => {
            const from = idMap.get(e.from);
            const to = idMap.get(e.to);
            if (from && to) {
                this.document.addEdge({ 
                    from, 
                    to, 
                    weight: e.weight || null, 
                    directed: e.directed || false 
                });
            }
        });
        this.render();
    }

    onSelectRect(x, y, w, h) {
        this.selectedNodes.clear();
        this.selectedNodeId = null;
        this.document.nodes.forEach(n => {
            if (n.x >= x && n.x <= x + w && n.y >= y && n.y <= y + h) {
                this.selectedNodes.add(n.id);
            }
        });
        this.render();
    }
}

let graphApp = null;
window.__legacyNodes = [];
window.__legacyEdges = [];
window.__legacyNodeIdCounter = 1;
window.__legacySelectedNodes = new Set();

function syncLegacyStateToGraphApp() {
    if (!graphApp) return;
    if (Array.isArray(window.__legacyNodes) && window.__legacyNodes.length > 0) {
        graphApp.nodes = window.__legacyNodes;
    }
    if (Array.isArray(window.__legacyEdges) && window.__legacyEdges.length > 0) {
        graphApp.edges = window.__legacyEdges;
    }
    if (typeof window.__legacyNodeIdCounter === 'number') {
        graphApp.nodeCounter = window.__legacyNodeIdCounter;
    }
    if (window.__legacySelectedNodes instanceof Set && window.__legacySelectedNodes.size > 0) {
        graphApp.selectedNodes = window.__legacySelectedNodes;
    }
}

function clearGraph() { if (graphApp) graphApp.clearGraph(); }

Object.defineProperty(window, 'nodes', {
    configurable: true,
    get: () => {
        return graphApp ? graphApp.document.nodes : window.__legacyNodes;
    },
    set: (v) => {
        if (graphApp) graphApp.document.nodes = v;
        else window.__legacyNodes = v;
    }
});

Object.defineProperty(window, 'edges', {
    configurable: true,
    get: () => {
        return graphApp ? graphApp.document.edges : window.__legacyNodes;
    },
    set: (v) => {
        if (graphApp) graphApp.document.edges = v;
        else window.__legacyNodes = v;
    }
});

/*function resetGraph() { 
    if (window.activeEditor && typeof window.activeEditor.resetGraph === 'function') {
        window.activeEditor.resetGraph(); 
    } 
}*/

function snapAllNodesToGrid() { 
    if (window.activeEditor && typeof window.activeEditor.snapAllNodesToGrid === 'function') {
        window.activeEditor.snapAllNodesToGrid(); 
    } 
}

function clearCanvas() { 
    if (window.activeEditor && typeof window.activeEditor.clearCanvas === 'function') {
        window.activeEditor.clearCanvas(); 
    } 
}

function clear_no_alert() { 
    if (window.activeEditor && typeof window.activeEditor.clear_no_alert === 'function') {
        return window.activeEditor.clear_no_alert(); 
    }
    return true; 
}

// Legacy global shims for older scripts (graphGenerator.js, graph.js, etc.)
window.saveState = function() { 
    if (window.activeEditor) window.activeEditor.saveState(); 
};

window.render = function() {
    if (window.activeEditor) window.activeEditor.render();
};
// svg element used by legacy code
window.svg = document.getElementById('canvas');

Object.defineProperty(window, 'nodeIdCounter', {
    get: function() { return graphApp ? graphApp.nodeCounter : window.__legacyNodeIdCounter; },
    set: function(v) { if (graphApp) graphApp.nodeCounter = v; else window.__legacyNodeIdCounter = v; }
});

Object.defineProperty(window, 'selectedNodes', {
    get: function() { return graphApp ? graphApp.selectedNodes : window.__legacySelectedNodes; }
});


