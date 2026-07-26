// =========================================
// core/CanvasEngine.js
// =========================================

class CanvasEngine {
    constructor(svgId) {
        this.svg = document.getElementById(svgId);
        
        // Réutiliser un <g id="viewport"> existant si présent (compatibilité avec l'ancien HTML),
        // sinon créer un conteneur global qui subira le zoom/pan
        const existingViewport = this.svg ? this.svg.querySelector('#viewport') : null;
        if (existingViewport) {
            this.container = existingViewport;
        } else {
            this.container = document.createElementNS("http://www.w3.org/2000/svg", "g");
            if (this.svg) this.svg.appendChild(this.container);
        }

        // Données communes
        this.nodes = [];
        this.edges = [];
        this.nodeCounter = 0;

        // Caméra
        this.zoomLevel = 1;
        this.panX = 0;
        this.panY = 0;

        // États d'interaction
        this.isPanning = false;
        this.draggingNode = null;
        this.pendingDrag = null; // { node, startClientPos, ids }
        this.isDrawingEdge = false;
        this.startNode = null;
        this.tempEdge = null; // Ligne pointillée pendant le dessin
        this.isEdgeModalOpen = false; // When true, freeze tempEdge visuals
        this.isSelectingRect = false; // right-drag selection active
        this.selectionStart = null; // {x,y} in svg coords
        this.selectionRect = null; // SVG rect element
        this._justSelectedAt = null; // timestamp when a selection rectangle was just applied
        this._draggingStarted = false; // interne : indique qu'un drag visuel a commencé

        // Historique
        this.undoStack = [];
        this.redoStack = [];

        this.initEvents();
    }

    // --- SAUVEGARDE & HISTORIQUE ---
    saveState() {
        // Sauvegarde profonde (deep copy) des nœuds et arêtes
        const state = JSON.stringify({ nodes: this.nodes, edges: this.edges, counter: this.nodeCounter });
        this.undoStack.push(state);
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length > 0) {
            this.redoStack.push(JSON.stringify({ nodes: this.nodes, edges: this.edges, counter: this.nodeCounter }));
            const state = JSON.parse(this.undoStack.pop());
            this.nodes = state.nodes;
            this.edges = state.edges;
            this.nodeCounter = state.counter;
            this.render();
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            this.undoStack.push(JSON.stringify({ nodes: this.nodes, edges: this.edges, counter: this.nodeCounter }));
            const state = JSON.parse(this.redoStack.pop());
            this.nodes = state.nodes;
            this.edges = state.edges;
            this.nodeCounter = state.counter;
            this.render();
        }
    }

    // --- MATHÉMATIQUES & SOURIS ---
    getMouseCoords(e) {
        const rect = this.svg.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - this.panX) / this.zoomLevel,
            y: (e.clientY - rect.top - this.panY) / this.zoomLevel
        };
    }

    // --- ÉVÉNEMENTS GLOBAUX ---
    initEvents() {
        // Bloquer le clic droit par défaut
        // Si l'utilisateur fait un clic droit pendant la création d'une arête,
        // annuler la création et supprimer la prévisualisation.
        this.svg.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            try {
                // If we're currently doing a right-drag selection, don't cancel edge creation here
                if (this.isSelectingRect) return;
                if (this.startNode || this.tempEdge || this.isDrawingEdge) {
                    this.startNode = null;
                    this.tempEdge = null;
                    this.isDrawingEdge = false;
                    this.render();
                }
            } catch (err) { }
        });

        this.svg.addEventListener('mousedown', (e) => {
            if (e.target.tagName.toLowerCase() === 'svg' || e.target === this.container) {
                // PANNING with middle button or right button
                if (e.button === 1 || e.button === 2) {
                    this.isPanning = true;
                    this.panStartX = e.clientX - this.panX;
                    this.panStartY = e.clientY - this.panY;
                    this.svg.style.cursor = 'grabbing';
                }
                // Left button in empty area: defer node creation to mouseup
                else if (e.button === 0) {
                    this.emptyMouseDown = true;
                    this.emptyMouseDownPos = { x: e.clientX, y: e.clientY };
                    this.emptyMouseDownWorldPos = this.getMouseCoords(e);
                    this.emptyMoved = false;
                    this.selectionRect = null;
                }
            }
        });

        this.svg.addEventListener('mousemove', (e) => {
            const pos = this.getMouseCoords(e);

            // Si un drag est en attente (mousedown sur un nœud), démarrer le drag si on dépasse le threshold
            if (this.pendingDrag) {
                const dx = e.clientX - this.pendingDrag.startClientPos.x;
                const dy = e.clientY - this.pendingDrag.startClientPos.y;
                if (Math.hypot(dx, dy) > 6) {
                    // Démarrer le drag : groupe ou nœud unique selon pendingDrag.ids
                    if (this.pendingDrag.ids && this.pendingDrag.ids.length > 1) {
                        this.draggingNode = { __group: true, ids: this.pendingDrag.ids.slice(), lastPos: pos };
                    } else {
                        this.draggingNode = this.pendingDrag.node;
                    }
                    // Visuel : indiquer que nous sommes en train de déplacer (pour le curseur)
                    try { if (this.svg && this.svg.classList) this.svg.classList.add('dragging'); } catch (e) {}
                    // Indiquer qu'un drag a effectivement commencé (utile pour ignorer le click)
                    this._draggingStarted = true;
                    this.pendingDrag = null;
                }
                return;
            }

            // If the user pressed left button on empty area and moved, start a selection rectangle
            if (this.emptyMouseDown && !this.isSelectingRect) {
                const dx = e.clientX - (this.emptyMouseDownPos ? this.emptyMouseDownPos.x : 0);
                const dy = e.clientY - (this.emptyMouseDownPos ? this.emptyMouseDownPos.y : 0);
                if (Math.hypot(dx, dy) > 6) {
                    this.isSelectingRect = true;
                    this.selectionStart = this.emptyMouseDownWorldPos || pos;
                    const svgNS = 'http://www.w3.org/2000/svg';
                    this.selectionRect = document.createElementNS(svgNS, 'rect');
                    this.selectionRect.setAttribute('x', this.selectionStart.x);
                    this.selectionRect.setAttribute('y', this.selectionStart.y);
                    this.selectionRect.setAttribute('width', 0);
                    this.selectionRect.setAttribute('height', 0);
                    this.selectionRect.setAttribute('fill', 'rgba(100,150,240,0.08)');
                    this.selectionRect.setAttribute('stroke', 'rgba(100,150,240,0.9)');
                    this.selectionRect.setAttribute('stroke-dasharray', '4');
                    this.selectionRect.setAttribute('pointer-events', 'none');
                    this.container.appendChild(this.selectionRect);
                }
            }

            if (this.isPanning) {
                this.panX = e.clientX - this.panStartX;
                this.panY = e.clientY - this.panStartY;
                this.render();
            } else if (this.draggingNode) {
                if (this.draggingNode.__group) {
                    const last = this.draggingNode.lastPos || pos;
                    const dx = pos.x - last.x;
                    const dy = pos.y - last.y;
                    this.draggingNode.ids.forEach(id => {
                        const n = this.nodes.find(n => n.id === id);
                        if (n) {
                            n.x += dx;
                            n.y += dy;
                        }
                    });
                    this.draggingNode.lastPos = pos;
                } else {
                    this.draggingNode.x = pos.x;
                    this.draggingNode.y = pos.y;
                }
                this.render();
            } else if (this.startNode && !this.isPanning && !this.emptyMouseDown && !this.isEdgeModalOpen) {
                // Afficher une arête temporaire lorsque l'utilisateur a cliqué un nœud de départ
                this.tempEdge = {
                    x1: this.startNode.x,
                    y1: this.startNode.y,
                    x2: pos.x,
                    y2: pos.y
                };
                this.render();
            } else if (this.isSelectingRect) {
                // Update selection rectangle visuals
                const sx = this.selectionStart.x;
                const sy = this.selectionStart.y;
                const x = Math.min(sx, pos.x);
                const y = Math.min(sy, pos.y);
                const w = Math.abs(pos.x - sx);
                const h = Math.abs(pos.y - sy);
                if (this.selectionRect) {
                    this.selectionRect.setAttribute('x', x);
                    this.selectionRect.setAttribute('y', y);
                    this.selectionRect.setAttribute('width', w);
                    this.selectionRect.setAttribute('height', h);
                }
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (this.draggingNode) this.saveState();
            // clear pendingDrag if mouseup
            this.pendingDrag = null;

            // Réinitialiser le flag de drag commencé
            this._draggingStarted = false;

            // If we were doing a right-drag rectangle selection, finalize it
            if (this.isSelectingRect) {
                try {
                    if (this.selectionRect) {
                        const x = parseFloat(this.selectionRect.getAttribute('x'));
                        const y = parseFloat(this.selectionRect.getAttribute('y'));
                        const w = parseFloat(this.selectionRect.getAttribute('width'));
                        const h = parseFloat(this.selectionRect.getAttribute('height'));
                        if (typeof this.onSelectRect === 'function') this.onSelectRect(x, y, w, h);
                        this.selectionRect.remove();
                        this.selectionRect = null;
                    }
                } catch (err) {}
                this.isSelectingRect = false;
                // Prevent the following emptyMouseDown handler from creating a node
                this.emptyMouseDown = false;
                this.emptyMoved = true;
                // remember that a selection was just created so the subsequent click event
                // doesn't immediately clear it
                try { this._justSelectedAt = Date.now(); } catch (e) { this._justSelectedAt = null; }
            }

            // Si on avait commencé un clic vide
            if (this.emptyMouseDown) {
                const pos = this.getMouseCoords(e);
                if (this.selectionRect) {
                    const x = parseFloat(this.selectionRect.getAttribute('x'));
                    const y = parseFloat(this.selectionRect.getAttribute('y'));
                    const w = parseFloat(this.selectionRect.getAttribute('width'));
                    const h = parseFloat(this.selectionRect.getAttribute('height'));
                    if (typeof this.onSelectRect === 'function') this.onSelectRect(x, y, w, h);
                    this.selectionRect.remove();
                    this.selectionRect = null;
                } else if (!this.emptyMoved) {
                    // Clic simple : si une sélection existait auparavant, la supprimer
                    // au lieu de créer un nœud. Sinon créer un nœud.
                    if (this.selectedNodes && this.selectedNodes.size > 0) {
                        this.selectedNodes.clear();
                        if (this.selectedNodeId) this.selectedNodeId = null;
                        this.render();
                    } else {
                        this.saveState();
                        this.createNode(pos.x, pos.y);
                    }
                }
            }

            this.emptyMouseDown = false;
            this.emptyMoved = false;
            this.emptyMouseDownPos = null;

            const needsRender = this.isPanning || this.draggingNode || this.tempEdge || this.isDrawingEdge;

            this.isPanning = false;
            this.draggingNode = null;
            try { if (this.svg && this.svg.classList) this.svg.classList.remove('dragging'); } catch (e) {}
            this.isDrawingEdge = false;
            this.tempEdge = null;
            this.svg.style.cursor = 'crosshair';

            if (needsRender){
                this.render();
            }
        });

        this.svg.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomAmount = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoomLevel = Math.max(0.2, Math.min(5, this.zoomLevel * zoomAmount));
            this.render();
        }, { passive: false });

        // Clear temporary edge preview when user clicks anywhere outside node elements
        // or when clicking the svg viewport background — ensures visual temp edge
        // disappears even if other handlers didn't reset it.
        window.addEventListener('click', (e) => {
            try {
                const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
                // If click is not on common graph element (circle/text/group/edge),
                // or if click is directly on the svg viewport/container, clear preview.
                const graphElementTags = new Set(['circle', 'text', 'g', 'path', 'line', 'rect']);
                const clickedOnContainer = (e.target === this.svg || e.target === this.container);
                if (clickedOnContainer || !graphElementTags.has(tag)) {
                    if (this.tempEdge || this.startNode) {
                        this.startNode = null;
                        this.tempEdge = null;
                        this.render();
                    }
                    // Clear any current selection when clicking the background
                    try {
                        const now = Date.now();
                        if (this._justSelectedAt && (now - this._justSelectedAt) < 250) {
                            // ignore the immediate click that follows a rectangle selection
                            this._justSelectedAt = null;
                        } else if (typeof this.onClearSelection === 'function') {
                            this.onClearSelection();
                        } else if (this.selectedNodes && typeof this.selectedNodes.clear === 'function') {
                            this.selectedNodes.clear();
                            if (this.selectedNodeId) this.selectedNodeId = null;
                            this.render();
                        }
                    } catch (err) { }
                }
            } catch (err) {
                // swallow errors from unexpected environments
            }
        });
    }

    // --- MÉTHODES À SURCHARGER (Polymorphisme) ---
    // Ces fonctions seront définies différemment par les Graphes et les Automates
    createNode(x, y) { console.warn("createNode() doit être implémenté"); }
    render() { console.warn("render() doit être implémenté"); }

    // --- UI HELPERS ---
    // Ouvre la modale d'arête présente dans le HTML et retourne une Promise
    promptEdgeParams(fromId, toId) {
        const modal = document.getElementById('edge-form-modal');
        const weightInput = document.getElementById('edge-weight-input');
        const directedInput = document.getElementById('edge-directed-input');
        const btnSubmit = document.getElementById('edge-form-submit');
        const btnCancel = document.getElementById('edge-form-cancel');

        if (!modal || !weightInput || !directedInput) {
            return Promise.resolve({ weight: null, isDirected: false });
        }

        // Préparer la modale
        weightInput.value = "";
        directedInput.checked = false;
        directedInput.disabled = false;

        // Si une arête inverse existe, forcer orienté
        const hasReverse = this.edges.some(e => e.from === toId && e.to === fromId);
        if (hasReverse) {
            directedInput.checked = true;
            directedInput.disabled = true;
        }

        // Indicate that an edge param modal is open so tempEdge visuals can be frozen
        this.isEdgeModalOpen = true;
        // hide live tempEdge while modal is visible to avoid visual motion behind modal
        this.tempEdge = null;
        this.render();
        modal.style.display = 'block';
        modal.style.left = (window.innerWidth / 2 - 100) + 'px';
        modal.style.top = (window.innerHeight / 2 - 80) + 'px';

        return new Promise((resolve) => {
            const submitHandler = () => {
                modal.style.display = 'none';
                cleanup();
                const wVal = weightInput.value;
                const weight = (wVal === "" || isNaN(parseInt(wVal, 10))) ? null : parseInt(wVal, 10);
                resolve({ weight, isDirected: directedInput.checked });
            };
            const cancelHandler = () => {
                modal.style.display = 'none';
                cleanup();
                resolve(null);
            };
            function cleanup() {
                // modal closed — allow tempEdge visuals again
                try { thisRef.isEdgeModalOpen = false; } catch (e) {}
                btnSubmit.removeEventListener('click', submitHandler);
                btnCancel.removeEventListener('click', cancelHandler);
            }
            // keep a reference to `this` for cleanup closure
            const thisRef = this;
            btnSubmit.addEventListener('click', submitHandler);
            btnCancel.addEventListener('click', cancelHandler);
        });
    }

    // Hook appelé quand un rectangle de sélection a été dessiné (override dans les sous-classes)
    onSelectRect(x, y, w, h) {
        // Par défaut ne fait rien. Les éditeurs (GraphEditor) peuvent override.
    }
}