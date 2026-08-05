// =========================================
// AUTOMATA-UI.JS (Interactions & Rendu SVG)
// =========================================

const autoCanvasDiv = document.getElementById('automata-canvas');
let autoSvgElement;
let autoContainer;

// Variables d'interaction
let autoZoomLevel = 1;
let autoPanX = 0, autoPanY = 0;
let autoIsPanning = false;
let autoPanStartX = 0, autoPanStartY = 0;

let autoDraggingNode = null;
let autoIsDrawingEdge = false;
let autoStartNode = null;
let autoTempEdge = null;
let autoSelectedNode = null;
let autoSelectedEdgeIndex = -1;

// Variables pour les Modales
let editingAutoNodeId = null;
let editingAutoEdgeIndex = -1;

// --- 1. INITIALISATION DU CANVAS SVG ---
function initAutoSVG() {
    // Création du vrai SVG avec ses balises <defs> pour les têtes de flèches
    autoCanvasDiv.innerHTML = `
        <svg id="auto-svg-main" style="width: 100%; height: 100%; display: block;">
            <defs>
                <marker id="auto-arrowhead" markerWidth="10" markerHeight="7" refX="22" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="var(--circle-stroke)" />
                </marker>
                <marker id="auto-arrowhead-active" markerWidth="10" markerHeight="7" refX="22" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="var(--brand-main)" />
                </marker>
            </defs>
            <g id="auto-container"></g>
        </svg>
    `;
    autoSvgElement = document.getElementById('auto-svg-main');
    autoContainer = document.getElementById('auto-container');


    // Attacher les événements globaux
    autoSvgElement.addEventListener('mousedown', handleAutoMouseDown);
    autoSvgElement.addEventListener('mousemove', handleAutoMouseMove);
    window.addEventListener('mouseup', handleAutoMouseUp);
    autoSvgElement.addEventListener('wheel', handleAutoWheel, { passive: false });
}

// --- 2. GESTION DES CLICS SUR LE FOND (CREATION & PAN) ---
function handleAutoMouseDown(e) {
    // Si on clique dans le vide (c'est-à-dire sur la balise <svg> elle-même)
    if (e.target.tagName.toLowerCase() === 'svg' || e.target.id === 'auto-container') {
        
        // A) PANNING : Clic Droit (2) ou Molette (1)
        if (e.button === 2 || e.button === 1) { 
            autoIsPanning = true;
            const rect = autoSvgElement.getBoundingClientRect();
            autoPanStartX = e.clientX - rect.left - autoPanX;
            autoPanStartY = e.clientY - rect.top - autoPanY;
            autoSvgElement.style.cursor = 'grabbing';
            e.preventDefault();
            return;
        }

        // B) CRÉATION D'ÉTAT : Clic Gauche (0)
        if (e.button === 0) {
            saveAutoState(); // Sauvegarde pour le Ctrl+Z
            const rect = autoSvgElement.getBoundingClientRect();
            const x = (e.clientX - rect.left - autoPanX) / autoZoomLevel;
            const y = (e.clientY - rect.top - autoPanY) / autoZoomLevel;
            
            autoNodes.push({ 
                id: "q" + autoNodeIdCounter++, 
                x, 
                y, 
                isInitial: autoNodes.length === 0, // Le 1er est initial par défaut
                isFinal: false 
            });
        }
        
        // Clic dans le vide désélectionne tout
        autoSelectedNode = null;
        autoSelectedEdgeIndex = -1;
        renderAutomata();
    }
}

// --- 3. GESTION DES MOUVEMENTS (DRAG & DESSIN) ---
function handleAutoMouseMove(e) {
    const rect = autoSvgElement.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - autoPanX) / autoZoomLevel;
    const mouseY = (e.clientY - rect.top - autoPanY) / autoZoomLevel;

    if (autoIsPanning) {
        autoPanX = (e.clientX - rect.left) - autoPanStartX;
        autoPanY = (e.clientY - rect.top) - autoPanStartY;
        renderAutomata();
    } else if (autoDraggingNode) {
        autoDraggingNode.x = mouseX;
        autoDraggingNode.y = mouseY;
        renderAutomata();
    } else if (autoIsDrawingEdge && autoTempEdge) {
        autoTempEdge.x2 = mouseX;
        autoTempEdge.y2 = mouseY;
        renderAutomata();
    }
}

// --- 4. RELÂCHEMENT DE LA SOURIS ---
function handleAutoMouseUp() {
    if (autoDraggingNode) saveAutoState(); // Sauvegarde après déplacement
    
    autoIsPanning = false;
    autoDraggingNode = null;
    autoIsDrawingEdge = false;
    autoTempEdge = null;
    if (autoSvgElement) autoSvgElement.style.cursor = 'crosshair';
    
    renderAutomata();
}

// --- 5. GESTION DU ZOOM (MOLETTE) ---
function handleAutoWheel(e) {
    e.preventDefault();
    const zoomAmount = e.deltaY > 0 ? 0.9 : 1.1;
    autoZoomLevel = Math.max(0.2, Math.min(5, autoZoomLevel * zoomAmount));
    renderAutomata();
}

// =========================================
// RENDU DU CANVAS (RENDER SVG)
// =========================================

document.addEventListener('DOMContentLoaded', () => {
    const autoSvgElement = document.getElementById('auto-svg-main');
    
    if (autoSvgElement) {
        autoSvgElement.addEventListener('contextmenu', e => e.preventDefault());
    } else {
        console.error("L'élément avec l'ID 'auto-svg-main' est introuvable.");
    }
});

function renderAutomata() {
    // Nettoyer les éléments, sauf les <defs>
    Array.from(autoContainer.children).forEach(c => autoContainer.removeChild(c));
    autoContainer.setAttribute('transform', `translate(${autoPanX}, ${autoPanY}) scale(${autoZoomLevel})`);
    
    const svgNS = "http://www.w3.org/2000/svg";

    // 1. DESSINER LES ARÊTES
    autoEdges.forEach((edge, index) => {
        const fromNode = autoNodes.find(n => n.id === edge.from);
        const toNode = autoNodes.find(n => n.id === edge.to);
        if (!fromNode || !toNode) return;

        const isSelected = (index === autoSelectedEdgeIndex);
        let pathD = "";
        let textX, textY;

        // Si boucle sur lui-même
        if (fromNode.id === toNode.id) {
            pathD = `M ${fromNode.x - 10} ${fromNode.y - 15} C ${fromNode.x - 40} ${fromNode.y - 70}, ${fromNode.x + 40} ${fromNode.y - 70}, ${fromNode.x + 10} ${fromNode.y - 15}`;
            textX = fromNode.x;
            textY = fromNode.y - 65;
        } else {
            // Ligne classique
            pathD = `M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`;
            textX = (fromNode.x + toNode.x) / 2;
            textY = (fromNode.y + toNode.y) / 2 - 10;
        }

        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", pathD);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", isSelected ? "var(--brand-main)" : "var(--circle-stroke)");
        path.setAttribute("stroke-width", isSelected ? "4" : "3");
        path.setAttribute("marker-end", isSelected ? "url(#auto-arrowhead-active)" : "url(#auto-arrowhead)");
        path.style.cursor = "pointer";
        
        path.addEventListener('dblclick', (e) => { e.stopPropagation(); openAutoEdgeModal(index); });
        
        const text = document.createElementNS(svgNS, "text");
        text.setAttribute("x", textX);
        text.setAttribute("y", textY);
        text.textContent = edge.label;
        text.style.fill = isSelected ? "var(--brand-main)" : "var(--text-primary)";
        text.style.cursor = "pointer";
        text.addEventListener('dblclick', (e) => { e.stopPropagation(); openAutoEdgeModal(index); });


        const editEdge = (e) => {
            e.stopPropagation();
            openAutoEdgeModal(index);
        };
        path.addEventListener('contextmenu', editEdge);
        text.addEventListener('contextmenu', editEdge);
        
        autoContainer.appendChild(path);
        autoContainer.appendChild(text);

    });

    // 2. ARÊTE TEMPORAIRE (Dessin en cours)
    if (autoTempEdge) {
        const tempPath = document.createElementNS(svgNS, "line");
        tempPath.setAttribute("x1", autoTempEdge.x1);
        tempPath.setAttribute("y1", autoTempEdge.y1);
        tempPath.setAttribute("x2", autoTempEdge.x2);
        tempPath.setAttribute("y2", autoTempEdge.y2);
        tempPath.setAttribute("stroke", "var(--brand-main)");
        tempPath.setAttribute("stroke-width", "3");
        tempPath.setAttribute("stroke-dasharray", "5,5");
        tempPath.setAttribute("marker-end", "url(#auto-arrowhead-active)");
        autoContainer.appendChild(tempPath);
    }

    // 3. DESSINER LES NŒUDS
    autoNodes.forEach(node => {
        const group = document.createElementNS(svgNS, "g");
        
        // Flèche entrante pour l'état Initial
        if (node.isInitial) {
            const initArrow = document.createElementNS(svgNS, "path");
            initArrow.setAttribute("d", `M ${node.x - 45} ${node.y} L ${node.x - 22} ${node.y}`);
            initArrow.setAttribute("stroke", "var(--circle-stroke)");
            initArrow.setAttribute("stroke-width", "3");
            initArrow.setAttribute("marker-end", "url(#auto-arrowhead)");
            group.appendChild(initArrow);
        }

        // Double cercle pour état Final
        if (node.isFinal) {
            const outer = document.createElementNS(svgNS, "circle");
            outer.setAttribute("cx", node.x);
            outer.setAttribute("cy", node.y);
            outer.setAttribute("r", 26);
            outer.classList.add('accepting-outer');
            group.appendChild(outer);
        }

        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("cx", node.x);
        circle.setAttribute("cy", node.y);
        circle.setAttribute("r", 20);
        circle.setAttribute("data-id", node.id);
        if (autoSelectedNode === node) circle.classList.add('selected');

        const text = document.createElementNS(svgNS, "text");
        text.setAttribute("x", node.x);
        text.setAttribute("y", node.y);
        text.textContent = node.id;

        group.appendChild(circle);
        group.appendChild(text);

        // INTERACTION SUR LE NOEUD
        group.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            
            // Clic Gauche : Préparer une transition
            if (e.button === 0) {
                autoIsDrawingEdge = true;
                autoStartNode = node;
                autoTempEdge = { x1: node.x, y1: node.y, x2: node.x, y2: node.y };
            }
            // Clic Droit : Ouvrir modale config nœud
            else if (e.button === 2) {
                openAutoNodeModal(node.id);
            }
        });

        group.addEventListener('mouseup', (e) => {
            if (autoIsDrawingEdge && autoStartNode && autoStartNode !== node) {
                // Terminer la transition
                saveAutoState();
                autoEdges.push({ from: autoStartNode.id, to: node.id, label: "a" });
                openAutoEdgeModal(autoEdges.length - 1);
            }
            autoIsDrawingEdge = false;
            autoStartNode = null;
            autoTempEdge = null;
            renderAutomata();
        });

        autoContainer.appendChild(group);
    });
}

// =========================================
// GESTION DES MODALES
// =========================================
function openAutoNodeModal(nodeId) {
    editingAutoNodeId = nodeId;
    const node = autoNodes.find(n => n.id === nodeId);
    document.getElementById('auto-is-initial').checked = node.isInitial;
    document.getElementById('auto-is-final').checked = node.isFinal;
    document.getElementById('auto-node-modal').style.display = 'flex';
}

function saveAutoNodeConfig() {
    saveAutoState();
    const node = autoNodes.find(n => n.id === editingAutoNodeId);
    if (document.getElementById('auto-is-initial').checked) {
        autoNodes.forEach(n => n.isInitial = false);
        node.isInitial = true;
    } else {
        node.isInitial = false;
    }
    node.isFinal = document.getElementById('auto-is-final').checked;
    closeAutoModals();
    renderAutomata();
}

function deleteAutoNode() {
    saveAutoState();
    autoNodes = autoNodes.filter(n => n.id !== editingAutoNodeId);
    autoEdges = autoEdges.filter(e => e.from !== editingAutoNodeId && e.to !== editingAutoNodeId);
    closeAutoModals();
    renderAutomata();
}

function openAutoEdgeModal(edgeIndex) {
    editingAutoEdgeIndex = edgeIndex;
    document.getElementById('auto-edge-label').value = autoEdges[edgeIndex].label;
    document.getElementById('auto-edge-modal').style.display = 'flex';
    document.getElementById('auto-edge-label').focus();
}

function saveAutoEdgeConfig() {
    saveAutoState();
    const label = document.getElementById('auto-edge-label').value.trim();
    if (label) autoEdges[editingAutoEdgeIndex].label = label;
    closeAutoModals();
    renderAutomata();
}

function deleteAutoEdge() {
    saveAutoState();
    autoEdges.splice(editingAutoEdgeIndex, 1);
    closeAutoModals();
    renderAutomata();
}

function closeAutoModals() {
    document.getElementById('auto-node-modal').style.display = 'none';
    document.getElementById('auto-edge-modal').style.display = 'none';
}

function clearAutomata() {
    if (!confirm("Voulez-vous effacer cet automate ?")) return;
    clearAutomataData();
    autoPanX = 0; autoPanY = 0; autoZoomLevel = 1;
    document.getElementById('test-result-badge').style.display = 'none';
    renderAutomata();
}

// Raccourcis clavier (Ctrl+Z pour Undo)
document.addEventListener('keydown', (e) => {
    if (document.getElementById('view-automata').classList.contains('active-view')) {
        if (e.ctrlKey && e.key === 'z') undoAuto();
        if (e.ctrlKey && e.key === 'y') redoAuto();
    }
});

// ==========================================
// TEST DU MOT DE L'AUTOMATE
// ==========================================
function testAutomataWord() {
    const word = document.getElementById('automata-word-input').value.trim();
    const badge = document.getElementById('test-result-badge');

    if (autoNodes.length === 0) return alert("Dessinez d'abord un automate !");

    // evaluateWordDFA vient de automata-engine.js
    const result = evaluateWordDFA(word);

    badge.style.display = 'block';
    badge.className = 'result-badge ' + (result.accepted ? 'badge-accepted' : 'badge-rejected');
    badge.innerHTML = result.accepted 
        ? `<i class="fa-solid fa-check-circle"></i> ${result.message}`
        : `<i class="fa-solid fa-circle-xmark"></i> ${result.error}`;

    document.querySelectorAll('#auto-container circle').forEach(c => c.classList.remove('current', 'visited'));

    if (result.trace.length > 0) {
        const finalStateId = result.trace[result.trace.length - 1];
        const finalCircle = document.querySelector(`circle[data-id="${finalStateId}"]`);
        if (finalCircle) {
            finalCircle.classList.add(result.accepted ? 'visited' : 'current');
        }
    }
}

// Initialisation au démarrage
initAutoSVG();
renderAutomata();