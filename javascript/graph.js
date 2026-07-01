// --- VARIABLES GLOBALES (ÉTAT DU GRAPHE) ---
const svg = document.getElementById('canvas');
const logDisplay = document.getElementById('log-display');

let nodes = [];
let edges = [];
let nodeIdCounter = 1;
let selectedNodes = new Set();
let draggingNode = null;
let isDragging = false;
let selectionRect = null;
let startX, startY;
let dragStartX, dragStartY;
let initialClickX, initialClickY;
let preventNodeCreation = false;
let tempSelectedId = null;

let undoStack = [];
let redoStack = [];

// --- GESTION DES ÉVÉNEMENTS SOURIS ---
svg.addEventListener('mousedown', (e) => {
    if (e.target === svg) {
        preventNodeCreation = (selectedNodes.size > 0 || tempSelectedId !== null);
        startX = e.offsetX;
        startY = e.offsetY;
        selectionRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        selectionRect.setAttribute('fill', 'rgba(0,123,255,0.2)');
        selectionRect.setAttribute('stroke', 'blue');
        svg.appendChild(selectionRect);
    }
});

svg.addEventListener('mousemove', (e) => {
    if (draggingNode) {
        if (!isDragging) {
            const moveDist = Math.hypot(e.clientX - initialClickX, e.clientY - initialClickY);
            if (moveDist > 5) {
                saveState();
                isDragging = true;
                if (!selectedNodes.has(draggingNode.id) && !e.shiftKey) {
                    selectedNodes.clear();
                    selectedNodes.add(draggingNode.id);
                    render();
                }
            }
        }
        if (isDragging) {
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            nodes.forEach(n => {
                if (selectedNodes.has(n.id)) {
                    n.x += dx;
                    n.y += dy;
                }
            });
            render();
        }
    } else if (selectionRect) {
        const x = Math.min(startX, e.offsetX);
        const y = Math.min(startY, e.offsetY);
        const w = Math.abs(e.offsetX - startX);
        const h = Math.abs(e.offsetY - startY);
        selectionRect.setAttribute('x', x);
        selectionRect.setAttribute('y', y);
        selectionRect.setAttribute('width', w);
        selectionRect.setAttribute('height', h);
    }
});

svg.addEventListener('mouseup', () => { 
    if (selectionRect) {
        const x = parseFloat(selectionRect.getAttribute('x'));
        const y = parseFloat(selectionRect.getAttribute('y'));
        const w = parseFloat(selectionRect.getAttribute('width'));
        const h = parseFloat(selectionRect.getAttribute('height'));
        selectedNodes.clear();
        nodes.forEach(n => {
            if (n.x >= x && n.x <= x + w && n.y >= y && n.y <= y + h) {
                selectedNodes.add(n.id);
            }
        });
        tempSelectedId = null;
        svg.removeChild(selectionRect);
        selectionRect = null;
        render();
    }
    draggingNode = null; 
    setTimeout(() => isDragging = false, 0); 
});

svg.addEventListener('click', (e) => {
    if (e.target.id === 'canvas' && !isDragging && !selectionRect) {
        if (preventNodeCreation) {
            selectedNodes.clear();
            tempSelectedId = null;
            preventNodeCreation = false;
            render();
            return;
        }
        const rect = svg.getBoundingClientRect();

        addNode(e.clientX - rect.left, e.clientY - rect.top);
        render();
    }
});


// --- UNDO / REDO LOGIC ---
function saveState() {
    // Deep copy the current nodes and edges
    const state = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        nodeIdCounter: nodeIdCounter
    };
    undoStack.push(state);
    
    // Limit history to 50 steps to save memory
    if (undoStack.length > 50) {
        undoStack.shift();
    }
    // Clear redo stack whenever a new action is performed
    redoStack = []; 
}

function undo() {
    if (undoStack.length === 0) return;
    
    // Save current state to redo stack
    redoStack.push({
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        nodeIdCounter: nodeIdCounter
    });
    
    // Restore previous state
    const previousState = undoStack.pop();
    nodes = previousState.nodes;
    edges = previousState.edges;
    nodeIdCounter = previousState.nodeIdCounter;
    
    selectedNodes.clear();
    render();
}

function redo() {
    if (redoStack.length === 0) return;
    
    // Save current state back to undo stack
    undoStack.push({
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        nodeIdCounter: nodeIdCounter
    });
    
    // Restore next state
    const nextState = redoStack.pop();
    nodes = nextState.nodes;
    edges = nextState.edges;
    nodeIdCounter = nextState.nodeIdCounter;
    
    selectedNodes.clear();
    render();
}

// --- LOGIQUE MÉTIER ---
function addNode(x, y) { 
    saveState();
    nodes.push({ id: String(nodeIdCounter++), x, y }); 
}

function addEdge(id1, id2) {
    if (id1 === id2) return;
    const exists = edges.some(e => (e.from === id1 && e.to === id2) || (e.from === id2 && e.to === id1));
    if (exists) return;

    const modal = document.getElementById('edge-form-modal');
    const weightInput = document.getElementById('edge-weight-input');
    const directedInput = document.getElementById('edge-directed-input');
    const btnSubmit = document.getElementById('edge-form-submit');
    const btnCancel = document.getElementById('edge-form-cancel');

    weightInput.value = "";
    directedInput.checked = false;

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
            btnSubmit.removeEventListener('click', submitHandler);
            btnCancel.removeEventListener('click', cancelHandler);
        }
        btnSubmit.addEventListener('click', submitHandler);
        btnCancel.addEventListener('click', cancelHandler);
    }).then((result) => {
        if (result) {
            saveState();
            edges.push({ from: id1, to: id2, weight: result.weight, directed: result.isDirected });
            render();
        }
    });
}

function deleteNodes(ids) {
    saveState();
    nodes = nodes.filter(n => !ids.has(n.id));
    edges = edges.filter(e => !ids.has(e.from) && !ids.has(e.to));
    selectedNodes.clear();
    render();
}

function resetGraph() {
    document.querySelectorAll('circle').forEach(c => {
        c.classList.remove('visited', 'current', 'selected');
        c.style.fill = '';
        c.style.stroke = '';
    });
    
    document.querySelectorAll('path.edge').forEach(p => {
        p.style.stroke = '';
        p.style.strokeWidth = '';
    });

    logDisplay.style.opacity = 0;
}

function showOrderBadge(nodeId, number) {
    const nodeData = nodes.find(n => n.id === nodeId);
    if (!nodeData) return;
    const badgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    badgeGroup.setAttribute('class', 'order-badge');
    
    const badgeCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    badgeCircle.setAttribute('cx', nodeData.x + 20); 
    badgeCircle.setAttribute('cy', nodeData.y - 20);
    badgeCircle.setAttribute('r', 10); 
    badgeCircle.setAttribute('fill', '#e74c3c');
    
    const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    badgeText.setAttribute('x', nodeData.x + 20); 
    badgeText.setAttribute('y', nodeData.y - 19);
    badgeText.setAttribute('fill', 'white'); 
    badgeText.setAttribute('font-size', '10px');
    badgeText.setAttribute('font-weight', 'bold'); 
    badgeText.textContent = number;
    
    badgeGroup.appendChild(badgeCircle); 
    badgeGroup.appendChild(badgeText); 
    svg.appendChild(badgeGroup);
}


let zoomLevel = 1;
let panX = 0;
let panY = 0;

function applyTransform() {
    const viewport = document.getElementById('viewport');
    if (viewport) {
        viewport.setAttribute('transform', `translate(${panX}, ${panY}) scale(${zoomLevel})`);
    }
}

function render() {
    svg.innerHTML = '';

    if (nodes.length === 0) {
        const placeholder = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        placeholder.setAttribute('x', '50%');
        placeholder.setAttribute('y', '50%');
        placeholder.setAttribute('text-anchor', 'middle');
        placeholder.setAttribute('dominant-baseline', 'middle');
        placeholder.setAttribute('fill', '#94a3b8'); // A nice, subtle slate gray
        placeholder.style.fontSize = '18px';
        placeholder.style.fontStyle = 'italic';
        placeholder.style.pointerEvents = 'none'; // Ensures clicks pass through to the canvas
        placeholder.style.userSelect = 'none';
        
        // As requested, keeping the UI text in English!
        placeholder.textContent = 'Click anywhere to create a node';
        
        svg.appendChild(placeholder);
    }
    
    // Markers (Arrowheads)
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrow');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '30');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '6');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('orient', 'auto-start-reverse');
    
    const arrowhead = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrowhead.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    arrowhead.setAttribute('fill', '#6b7280');
    marker.appendChild(arrowhead);
    defs.appendChild(marker);
    svg.appendChild(defs);


    // Edges
    edges.forEach(edge => {
        const n1 = nodes.find(n => n.id === edge.from);
        const n2 = nodes.find(n => n.id === edge.to);
        if (!n1 || !n2) return;

        const edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        edgeGroup.style.cursor = 'pointer';

        const hasReverse = edges.some(e => e.from === edge.to && e.to === edge.from);

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const midX = (n1.x + n2.x) / 2;
        const midY = (n1.y + n2.y) / 2;

        let pathD = '';
        let textX = midX;
        let textY = midY;

        if (edge.directed && hasReverse) {
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = -dy / len;
            const ny = dx / len;
            const curveOffset = 30;

            const cx = midX + nx * curveOffset;
            const cy = midY + ny * curveOffset;

            pathD = `M ${n1.x} ${n1.y} Q ${cx} ${cy} ${n2.x} ${n2.y}`;

            textX = 0.25 * n1.x + 0.5 * cx + 0.25 * n2.x;
            textY = 0.25 * n1.y + 0.5 * cy + 0.25 * n2.y;
        } else {
            pathD = `M ${n1.x} ${n1.y} L ${n2.x} ${n2.y}`;
        }


        const hitbox = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hitbox.setAttribute('d', pathD);
        hitbox.setAttribute('fill', 'none');
        hitbox.setAttribute('stroke', 'white');
        hitbox.setAttribute('stroke-opacity', '0');
        hitbox.setAttribute('stroke-width', '25');
        hitbox.style.pointerEvents = 'stroke';
        edgeGroup.appendChild(hitbox);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathD);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#95a5a6');
        path.setAttribute('stroke-width', '2');
        path.style.pointerEvents = 'none';
        path.classList.add('edge');

        if (edge.directed) path.setAttribute('marker-end', 'url(#arrow)'); 

        path.setAttribute('data-from', edge.from);
        path.setAttribute('data-to', edge.to);

        edgeGroup.appendChild(path);

        if (edge.directed) path.setAttribute('marker-end', 'url(#arrow)'); 
        edgeGroup.appendChild(path);


        if (edge.weight !== null && edge.weight !== undefined) {
            const weightText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            
            weightText.setAttribute('x', textX);
            weightText.setAttribute('y', textY - 7);
            weightText.setAttribute('text-anchor', 'middle');
            weightText.setAttribute('fill', '#374151');
            weightText.style.fontSize = '12px';
            weightText.style.fontWeight = 'bold';
            weightText.textContent = edge.weight;
            edgeGroup.appendChild(weightText);
        }

        edgeGroup.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            contextEdge = edge; 
            document.getElementById('context-menu').style.display = 'none'; 
            const menu = document.getElementById('edge-context-menu');
            if (menu) {
                menu.style.display = 'block';
                menu.style.left = e.clientX + 'px';
                menu.style.top = e.clientY + 'px';
            }
        });
        
        svg.appendChild(edgeGroup);
    });

    // Nodes
    nodes.forEach(node => {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('data-id', node.id);
        circle.setAttribute('cx', node.x); circle.setAttribute('cy', node.y);
        circle.setAttribute('r', 25);

        if (selectedNodes.has(node.id) || tempSelectedId === node.id) {
            circle.classList.add('selected');
        }

        circle.addEventListener('mousedown', (e) => { 
            e.stopPropagation(); 
            draggingNode = node; 
            isDragging = false; 
            initialClickX = e.clientX;
            initialClickY = e.clientY;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
        });

        circle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isDragging) return;
            if (e.shiftKey) {
                if (selectedNodes.has(node.id)) selectedNodes.delete(node.id);
                else selectedNodes.add(node.id);
                tempSelectedId = null;
            } else {
                if (tempSelectedId === null) {
                    tempSelectedId = node.id;
                    selectedNodes.clear();
                    selectedNodes.add(node.id);
                } else if (tempSelectedId !== node.id) {
                    addEdge(tempSelectedId, node.id);
                    tempSelectedId = null;
                    selectedNodes.clear();
                }
            }
            render();
        });

        circle.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            contextNodeId = node.id;
            const menu = document.getElementById('context-menu');
            const rect = svg.getBoundingClientRect();
            menu.style.display = 'block';
            menu.style.left = (rect.left + node.x - 415) + 'px';
            menu.style.top = (rect.top + node.y - 5) + 'px';
        });        

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.x); text.setAttribute('y', node.y + 1);
        text.textContent = node.id;

        group.appendChild(circle); group.appendChild(text); svg.appendChild(group);
    });
    updateGraphDataText();
}


function clearCanvas() {
    if (nodes.length === 0 && edges.length === 0) return;
    
    saveState();
    
    nodes = [];
    edges = [];
    nodeIdCounter = 1;
    selectedNodes.clear();
    tempSelectedId = null;
    
    const playerControls = document.getElementById('player-controls');
    if (playerControls) {
        playerControls.style.display = 'none';
    }
    
    render();
}




function clear_no_alert() {
    saveState(); // Permet de faire Ctrl+Z pour annuler la génération
    nodes = [];
    edges = [];
    nodeIdCounter = 1;
    selectedNodes.clear();
    return true;
}



// =========================================
//   SNAP TO GRID LOGIC
// =========================================

function snapAllNodesToGrid() {
    // Grid size must match the background-size defined in style.css (#canvas background-size: 25px)
    const gridSize = 25; 
    
    if (nodes.length === 0) return;

    // Save state so the user can easily undo the snap if they prefer their custom layout
    saveState();

    nodes.forEach(node => {
        // Math.round snaps to the nearest grid intersection
        node.x = Math.round(node.x / gridSize) * gridSize;
        node.y = Math.round(node.y / gridSize) * gridSize;
    });

    render();
}

// =========================================
//   TEXT-BASED GRAPH PARSER
// =========================================

function parseGraphData() {
    const textInput = document.getElementById('data-input').value;
    const format = document.getElementById('data-format').value;
    const isDirected = document.getElementById('data-directed').checked;
    
    if (!textInput.trim()) return;

    // Demande confirmation et vide le canvas
    clear_no_alert();

    const lines = textInput.split('\n');
    const uniqueNodeIds = new Set();
    const parsedEdges = [];

    // 1. ANALYSE SELON LE FORMAT CHOISI
    
    // --- FORMAT A : Edge List (1 2 5) ---
    if (format === 'edge_list') {
        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) return;
            
            const tokens = trimmed.split(/\s+/);

            if (tokens.length === 1) {
                uniqueNodeIds.add(tokens[0]);
            }
            else if (tokens.length>=2){
                const u = tokens[0];
                const v = tokens[1];
                let weight = tokens.length >= 3 ? parseInt(tokens[2], 10) : null;
                
                uniqueNodeIds.add(u);
                uniqueNodeIds.add(v);
                parsedEdges.push({ from: u, to: v, weight: isNaN(weight) ? null : weight, directed: isDirected });
            }
        });
    } 
    
    // --- FORMAT B : Adjacency List (1: 2(5), 3) ---
    else if (format === 'adj_list') {
        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) return;
            
            const parts = trimmed.split(':');
            if (parts.length !== 2) return;
            
            const u = parts[0].trim();
            uniqueNodeIds.add(u);
            
            // Cherche les motifs comme "2" ou "2(5)"
            const targets = parts[1].trim().match(/([a-zA-Z0-9_]+)(?:\(([-0-9]+)\))?/g);
            if (targets) {
                targets.forEach(t => {
                    const match = t.match(/([a-zA-Z0-9_]+)(?:\(([-0-9]+)\))?/);
                    if (match) {
                        const v = match[1];
                        const weightStr = match[2];
                        let weight = weightStr ? parseInt(weightStr, 10) : null;
                        
                        uniqueNodeIds.add(v);
                        parsedEdges.push({ from: u, to: v, weight: isNaN(weight) ? null : weight, directed: isDirected });
                    }
                });
            }
        });
    }
    
    // --- FORMAT C : Adjacency Matrix (0 1 5 ...) ---
    else if (format === 'adj_matrix') {
        let rowIdx = 1; // On nomme les nœuds 1, 2, 3... par défaut
        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) return;
            
            // Sépare par des espaces ou des virgules
            const values = trimmed.split(/[\s,]+/);
            const u = String(rowIdx);
            uniqueNodeIds.add(u);
            
            values.forEach((valStr, colIdx) => {
                const val = parseInt(valStr, 10);
                const v = String(colIdx + 1); // La colonne définit le nœud cible
                
                // Si la valeur est un nombre valide et différent de zéro (0 = pas d'arête)
                if (!isNaN(val) && val !== 0) {
                    uniqueNodeIds.add(v);
                    parsedEdges.push({ from: u, to: v, weight: val, directed: isDirected });
                }
            });
            rowIdx++;
        });
    }

    if (uniqueNodeIds.size === 0) return;

    // 2. POSITIONNEMENT AUTOMATIQUE (Circle Layout)
    const nodeArray = Array.from(uniqueNodeIds);
    const cx = svg.clientWidth / 2;
    const cy = svg.clientHeight / 2;
    const radius = Math.min(cx, cy) - 70;
    
    nodeArray.forEach((id, index) => {
        const angle = (index * 2 * Math.PI) / nodeArray.length - Math.PI / 2;
        nodes.push({
            id: id,
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle)
        });
        
        const numericId = parseInt(id, 10);
        if (!isNaN(numericId) && numericId >= nodeIdCounter) {
            nodeIdCounter = numericId + 1;
        }
    });

    // 3. MISE À JOUR DU GRAPH
    edges = parsedEdges;
    render();
}


// =========================================
//   CANVAS TO TEXT SYNCHRONIZATION
// =========================================

function updateGraphDataText() {
    const format = document.getElementById('data-format').value;
    const inputField = document.getElementById('data-input');
    
    // Sécurité : On ne met pas à jour le texte si l'étudiant est en train d'écrire dedans
    if (!inputField || document.activeElement === inputField) return;

    let text = "";

    // --- FORMAT 1 : Edge List ---
    if (format === 'edge_list') {
        edges.forEach(e => {
            text += `${e.from} ${e.to}`;
            if (e.weight !== null) text += ` ${e.weight}`;
            text += "\n";
        });
        // Inclusion des nœuds isolés (sans arêtes) pour ne pas les perdre
        nodes.forEach(n => {
            const hasEdge = edges.some(e => e.from === n.id || e.to === n.id);
            if (!hasEdge) {
                text += `${n.id}\n`;
            }
        });
    } 
    
    // --- FORMAT 2 : Adjacency List ---
    else if (format === 'adj_list') {
        nodes.forEach(n => {
            let neighborsLine = [];
            edges.forEach(e => {
                if (e.from === n.id) {
                    let edgeText = e.to;
                    if (e.weight !== null) edgeText += `(${e.weight})`;
                    neighborsLine.push(edgeText);
                } else if (!e.directed && e.to === n.id) {
                    // Pour un graphe non-orienté, l'arête apparaît des deux côtés
                    let edgeText = e.from;
                    if (e.weight !== null) edgeText += `(${e.weight})`;
                    neighborsLine.push(edgeText);
                }
            });
            text += `${n.id}: ${neighborsLine.join(', ')}\n`;
        });
    } 
    
    // --- FORMAT 3 : Adjacency Matrix ---
    else if (format === 'adj_matrix') {
        if (nodes.length === 0) {
            inputField.value = "";
            return;
        }

        // On trie les nœuds (numériquement ou alphabétiquement) pour garantir une matrice stable
        const sortedNodes = [...nodes].sort((a, b) => {
            const numA = parseInt(a.id, 10);
            const numB = parseInt(b.id, 10);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.id.localeCompare(b.id);
        });

        const n = sortedNodes.length;
        // Initialisation d'un tableau 2D rempli de 0
        let matrix = Array(n).fill(0).map(() => Array(n).fill(0));

        // Remplissage de la matrice avec les poids (ou 1 par défaut)
        edges.forEach(e => {
            const fromIdx = sortedNodes.findIndex(node => node.id === e.from);
            const toIdx = sortedNodes.findIndex(node => node.id === e.to);

            if (fromIdx !== -1 && toIdx !== -1) {
                const val = e.weight !== null ? e.weight : 1;
                matrix[fromIdx][toIdx] = val;
                if (!e.directed) {
                    matrix[toIdx][fromIdx] = val;
                }
            }
        });

        // Conversion du tableau 2D en chaînes textuelles lignes par lignes
        matrix.forEach(row => {
            text += row.join(" ") + "\n";
        });
    }

    inputField.value = text.trim();
}

