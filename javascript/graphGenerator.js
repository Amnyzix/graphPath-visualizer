
// =========================================
//   GÉNÉRATEURS DE GRAPHES
// =========================================

function clearForGeneration() {
    if (nodes.length > 0) {
        if (!confirm("Clear current graph to generate a new one?")) return false;
    }
    saveState(); // Permet de faire Ctrl+Z pour annuler la génération
    nodes = [];
    edges = [];
    nodeIdCounter = 1;
    selectedNodes.clear();
    return true;
}



// 1. Graphe Complet (Disposition en cercle)
function generateCompleteGraph(n = 5) {
    if (!clearForGeneration()) return;
    
    // On récupère la taille du canvas pour centrer le dessin
    const cx = svg.clientWidth / 2;
    const cy = svg.clientHeight / 2;
    const r = Math.min(cx, cy) - 60; // Le rayon s'adapte à l'écran
    
    // Création des nœuds en cercle
    for (let i = 0; i < n; i++) {
        const angle = (i * 2 * Math.PI) / n - Math.PI / 2; // -PI/2 pour avoir une pointe en haut
        nodes.push({ 
            id: String(nodeIdCounter++), 
            x: cx + r * Math.cos(angle), 
            y: cy + r * Math.sin(angle) 
        });
    }
    
    // Création des arêtes (tout le monde est relié à tout le monde)
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            edges.push({ from: nodes[i].id, to: nodes[j].id, weight: null, directed: false });
        }
    }
    render();
}

// 2. Arbre Binaire (Disposition pyramidale)
function generateBinaryTree(levels = 3) {
    if (!clearForGeneration()) return;
    
    const width = svg.clientWidth;
    const levelHeight = 80; // Espace vertical entre les niveaux
    const startY = 60;      // Marge en haut
    
    // On utilise une file (queue) pour construire l'arbre niveau par niveau (BFS)
    let queue = [{ 
        id: String(nodeIdCounter++), x: width / 2, y: startY, 
        level: 0, leftBound: 0, rightBound: width 
    }];
    nodes.push(queue[0]);
    
    let head = 0;
    while(head < queue.length) {
        let curr = queue[head++];
        if (curr.level < levels - 1) {
            let y = curr.y + levelHeight;
            
            // Enfant Gauche
            let lx = (curr.leftBound + curr.x) / 2;
            let lNode = { id: String(nodeIdCounter++), x: lx, y: y, level: curr.level + 1, leftBound: curr.leftBound, rightBound: curr.x };
            nodes.push(lNode);
            edges.push({ from: curr.id, to: lNode.id, weight: null, directed: true }); // Arbres généralement orientés vers le bas
            queue.push(lNode);
            
            // Enfant Droit
            let rx = (curr.x + curr.rightBound) / 2;
            let rNode = { id: String(nodeIdCounter++), x: rx, y: y, level: curr.level + 1, leftBound: curr.x, rightBound: curr.rightBound };
            nodes.push(rNode);
            edges.push({ from: curr.id, to: rNode.id, weight: null, directed: true });
            queue.push(rNode);
        }
    }
    render();
}

// 3. Grille (Disposition en matrice)
function generateGridGraph(rows = 3, cols = 3) {
    if (!clearForGeneration()) return;
    
    const spacing = 100;
    const startX = svg.clientWidth / 2 - ((cols - 1) * spacing) / 2;
    const startY = svg.clientHeight / 2 - ((rows - 1) * spacing) / 2;
    
    let grid = [];
    for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) {
            let node = { id: String(nodeIdCounter++), x: startX + c * spacing, y: startY + r * spacing };
            nodes.push(node);
            grid[r][c] = node;

            if (c > 0) edges.push({ from: grid[r][c-1].id, to: node.id, weight: null, directed: false });
            if (r > 0) edges.push({ from: grid[r-1][c].id, to: node.id, weight: null, directed: false });
        }
    }
    render();
}


// 4. Random Graph (Nodes placed randomly with random edges)
function generateRandomGraph(numNodes = 6, numEdges = 8) {
    if (!clearForGeneration()) return;
    
    const width = svg.clientWidth - 100;
    const height = svg.clientHeight - 100;
    const margin = 50;

    // Generate random nodes
    for (let i = 0; i < numNodes; i++) {
        nodes.push({
            id: String(nodeIdCounter++),
            x: margin + Math.random() * width,
            y: margin + Math.random() * height
        });
    }

    // Generate random edges avoiding duplicates
    const maxPossibleEdges = (numNodes * (numNodes - 1)) / 2;
    const actualMaxEdges = Math.min(numEdges, maxPossibleEdges);
    
    while (edges.length < actualMaxEdges) {
        const u = Math.floor(Math.random() * numNodes);
        const v = Math.floor(Math.random() * numNodes);
        
        if (u !== v) {
            const id1 = nodes[u].id;
            const id2 = nodes[v].id;
            
            const exists = edges.some(e => 
                (e.from === id1 && e.to === id2) || (e.from === id2 && e.to === id1)
            );
            
            if (!exists) {
                edges.push({ from: id1, to: id2, weight: null, directed: false });
            }
        }
    }
    render();
}

// 5. Bipartite Graph (Two distinct sets, all left nodes connect to all right nodes)
function generateBipartiteGraph(setSize1 = 3, setSize2 = 3) {
    if (!clearForGeneration()) return;

    const startX1 = 100;
    const startX2 = svg.clientWidth - 100;
    const startY = 150;
    const spacing = 100;

    const set1 = [];
    const set2 = [];

    // Create Set 1 (Left partition)
    for (let i = 0; i < setSize1; i++) {
        const node = { id: String(nodeIdCounter++), x: startX1, y: startY + i * spacing };
        nodes.push(node);
        set1.push(node);
    }

    // Create Set 2 (Right partition)
    for (let i = 0; i < setSize2; i++) {
        const node = { id: String(nodeIdCounter++), x: startX2, y: startY + i * spacing };
        nodes.push(node);
        set2.push(node);
    }

    // Connect every node in Set 1 to every node in Set 2
    for (const n1 of set1) {
        for (const n2 of set2) {
            edges.push({ from: n1.id, to: n2.id, weight: null, directed: false });
        }
    }
    render();
}

// 6. Path Chain (Linear sequence of nodes)
function generatePathChain(numNodes = 5) {
    if (!clearForGeneration()) return;

    const startX = 80;
    const endX = svg.clientWidth - 80;
    const y = svg.clientHeight / 2;
    const step = (endX - startX) / (numNodes - 1 || 1);

    for (let i = 0; i < numNodes; i++) {
        nodes.push({
            id: String(nodeIdCounter++),
            x: startX + i * step,
            y: y
        });
    }

    for (let i = 0; i < numNodes - 1; i++) {
        edges.push({
            from: nodes[i].id,
            to: nodes[i + 1].id,
            weight: null,
            directed: false
        });
    }
    render();
}


// =========================================
//   GÉNÉRATEURS DE GRAPHES AVANCÉS
// =========================================

let activeGeneratorType = null;

function openGeneratorModal(type) {
    activeGeneratorType = type;
    const modal = document.getElementById('generator-modal');
    const title = document.getElementById('generator-title');
    const nodeField = document.getElementById('gen-param-nodes');
    
    if (!modal) return;

    // Adapte le titre et les champs visibles selon la sélection
    if (type === 'complete') {
        title.textContent = 'Generate Complete Graph';
        nodeField.style.display = 'block';
    } else if (type === 'random') {
        title.textContent = 'Generate Random Graph';
        nodeField.style.display = 'block';
    } else if (type === 'bipartite') {
        title.textContent = 'Generate Bipartite Graph';
        nodeField.style.display = 'block';
    } else if (type === 'grid') {
        title.textContent = 'Generate Grid Graph (NxN)';
        nodeField.style.display = 'block';
    } else if (type === 'tree') {
        title.textContent = 'Generate Binary Tree';
        nodeField.style.display = 'block';
    }
    else if (type === 'path') {
        title.textContent = 'Generate Simple Path Chain';
        nodeField.style.display = 'block';
    }

    modal.style.display = 'flex';
}

// Gestionnaires d'événements pour la modale
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('generator-modal');
    const btnClose = document.getElementById('btn-close-generator');
    const btnCancel = document.getElementById('btn-cancel-gen');
    const btnSubmit = document.getElementById('btn-submit-gen');

    if (btnClose) btnClose.addEventListener('click', () => modal.style.display = 'none');
    if (btnCancel) btnCancel.addEventListener('click', () => modal.style.display = 'none');
    
    if (btnSubmit) {
        btnSubmit.addEventListener('click', () => {
            const numNodes = parseInt(document.getElementById('gen-input-nodes').value, 10) || 5;
            const isWeighted = document.getElementById('gen-input-weighted').checked;
            const isDirected = document.getElementById('gen-input-directed').checked;

            modal.style.display = 'none';
            
            // Lancement de la génération géométrique choisie
            executeGeneration(activeGeneratorType, numNodes, isWeighted, isDirected);
        });
    }
    
    // Fermeture clic en dehors
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }
});

function getWeightValue(isWeighted) {
    // Si l'option "Weighted" est cochée, on assigne une valeur de poids aléatoire entre 1 et 10, sinon null.
    return isWeighted ? Math.floor(Math.random() * 10) + 1 : null;
}

function executeGeneration(type, count, isWeighted, isDirected) {
    if (!clearForGeneration()) return;

    if (type === 'complete') {
        const cx = svg.clientWidth / 2;
        const cy = svg.clientHeight / 2;
        const r = Math.min(cx, cy) - 60;
        
        for (let i = 0; i < count; i++) {
            const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
            nodes.push({ 
                id: String(nodeIdCounter++), 
                x: cx + r * Math.cos(angle), 
                y: cy + r * Math.sin(angle) 
            });
        }
        
        for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
                edges.push({ 
                    from: nodes[i].id, 
                    to: nodes[j].id, 
                    weight: getWeightValue(isWeighted), 
                    directed: isDirected 
                });
            }
        }
    } 
    else if (type === 'random') {
        const width = svg.clientWidth - 100;
        const height = svg.clientHeight - 100;
        const margin = 50;

        for (let i = 0; i < count; i++) {
            nodes.push({
                id: String(nodeIdCounter++),
                x: margin + Math.random() * width,
                y: margin + Math.random() * height
            });
        }

        const maxPossibleEdges = (count * (count - 1)) / 2;
        const edgesToCreate = Math.min(count * 1.5, maxPossibleEdges); // Densité proportionnelle
        
        while (edges.length < edgesToCreate) {
            const u = Math.floor(Math.random() * count);
            const v = Math.floor(Math.random() * count);
            
            if (u !== v) {
                const id1 = nodes[u].id;
                const id2 = nodes[v].id;
                
                const exists = edges.some(e => 
                    (e.from === id1 && e.to === id2) || (e.from === id2 && e.to === id1)
                );
                
                if (!exists) {
                    edges.push({ 
                        from: id1, 
                        to: id2, 
                        weight: getWeightValue(isWeighted), 
                        directed: isDirected 
                    });
                }
            }
        }
    }
    else if (type === 'bipartite') {
        // Partition équitable en deux (ou séparation arbitraire)
        const setSize1 = Math.ceil(count / 2);
        const setSize2 = Math.floor(count / 2);
        
        const startX1 = 100;
        const startX2 = svg.clientWidth - 100;
        const startY = 150;
        const spacing = 100;

        const set1 = [];
        const set2 = [];

        for (let i = 0; i < setSize1; i++) {
            const node = { id: String(nodeIdCounter++), x: startX1, y: startY + i * spacing };
            nodes.push(node);
            set1.push(node);
        }

        for (let i = 0; i < setSize2; i++) {
            const node = { id: String(nodeIdCounter++), x: startX2, y: startY + i * spacing };
            nodes.push(node);
            set2.push(node);
        }

        for (const n1 of set1) {
            for (const n2 of set2) {
                edges.push({ 
                    from: n1.id, 
                    to: n2.id, 
                    weight: getWeightValue(isWeighted), 
                    directed: isDirected 
                });
            }
        }
    }
    else if (type === 'grid') {
        // Traitement de base d'une grille carrée approximative (ex: √count)
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        const spacing = 100;
        
        const startX = svg.clientWidth / 2 - ((cols - 1) * spacing) / 2;
        const startY = svg.clientHeight / 2 - ((rows - 1) * spacing) / 2;
        
        let grid = [];
        let created = 0;
        for (let r = 0; r < rows; r++) {
            grid[r] = [];
            for (let c = 0; c < cols; c++) {
                if (created >= count) break;
                let node = { id: String(nodeIdCounter++), x: startX + c * spacing, y: startY + r * spacing };
                nodes.push(node);
                grid[r][c] = node;
                created++;
                
                if (c > 0) edges.push({ from: grid[r][c-1].id, to: node.id, weight: getWeightValue(isWeighted), directed: isDirected });
                if (r > 0) edges.push({ from: grid[r-1][c].id, to: node.id, weight: getWeightValue(isWeighted), directed: isDirected });
            }
        }
    }
    else if (type === 'tree') {
        // Génération d'arbre binaire standard
        const width = svg.clientWidth;
        const levelHeight = 80;
        const startY = 60;
        
        let queue = [{ 
            id: String(nodeIdCounter++), x: width / 2, y: startY, 
            level: 0, leftBound: 0, rightBound: width 
        }];
        if (queue[0]) nodes.push(queue[0]);
        
        let head = 0;
        while(head < queue.length && nodes.length < count) {
            let curr = queue[head++];
            
            let y = curr.y + levelHeight;
            
            // Enfant Gauche
            if (nodes.length < count) {
                let lx = (curr.leftBound + curr.x) / 2;
                let lNode = { id: String(nodeIdCounter++), x: lx, y: y, level: curr.level + 1, leftBound: curr.leftBound, rightBound: curr.x };
                nodes.push(lNode);
                edges.push({ from: curr.id, to: lNode.id, weight: getWeightValue(isWeighted), directed: isDirected });
                queue.push(lNode);
            }
            
            // Enfant Droit
            if (nodes.length < count) {
                let rx = (curr.x + curr.rightBound) / 2;
                let rNode = { id: String(nodeIdCounter++), x: rx, y: y, level: curr.level + 1, leftBound: curr.x, rightBound: curr.rightBound };
                nodes.push(rNode);
                edges.push({ from: curr.id, to: rNode.id, weight: getWeightValue(isWeighted), directed: isDirected });
                queue.push(rNode);
            }
        }
    }
    else if (type === 'path') {
        const startX = 80;
        const endX = svg.clientWidth - 80;
        const y = svg.clientHeight / 2;
        const step = (endX - startX) / (count - 1 || 1);

        for (let i = 0; i < count; i++) {
            nodes.push({
                id: String(nodeIdCounter++),
                x: startX + i * step,
                y: y
            });
        }

        for (let i = 0; i < count - 1; i++) {
            edges.push({
                from: nodes[i].id,
                to: nodes[i + 1].id,
                weight: getWeightValue(isWeighted),
                directed: isDirected
            });
        }
    }

    render();
}
