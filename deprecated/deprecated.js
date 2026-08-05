// --- GESTION DU THÈME ---
const themeToggle = document.getElementById('theme-toggle');

themeToggle.addEventListener('click', () => {
    // 1. On bascule la classe sur le HTML pour ton interface générale
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    
    // 2. On met à jour le texte du bouton (en anglais, comme convenu !)
    themeToggle.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    
    // 3. NOUVEAU : On applique le thème à CodeMirror
    // (Assure-toi que "galEditor" est bien le nom de ta variable CodeMirror)
    if (isDark) {
        themeToggle.innerHTML = '<i class="fa-solid fa-sun" style="margin-right: 6px;"></i>Light Mode';
    } else {
        themeToggle.innerHTML = '<i class="fa-solid fa-moon" style="margin-right: 6px;"></i>Dark Mode';
    }

    if (typeof galEditor !== 'undefined') {
        galEditor.setOption("theme", isDark ? "dracula" : "default");
    }
});

// --- GRAPH ENGINE (CORE) ---
const svg = document.getElementById('canvas');
const logDisplay = document.getElementById('log-display');
let nodes = [];
let edges = [];
let nodeIdCounter = 1;
let selectedNodes = new Set();
let draggingNode = null;
let isDragging = false;
let contextNodeId = null;
let copiedNodes = [];
let copiedEdges = [];
let selectionRect = null;
let startX, startY;
let dragStartX, dragStartY;
let initialClickX, initialClickY;
let preventNodeCreation = false;
let tempSelectedId = null;

// Hide context menu on click outside
document.addEventListener('click', () => {
    document.getElementById('context-menu').style.display = 'none';
});

// Mouse Events
svg.addEventListener('mousedown', (e) => {
    if (e.target === svg) {

        if (selectedNodes.size > 0 || tempSelectedId !== null) {
            preventNodeCreation = true;
        } else {
            preventNodeCreation = false;
        }

        startX = e.offsetX;
        startY = e.offsetY;
        selectionRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        selectionRect.setAttribute('fill', 'rgba(0,123,255,0.2)');
        selectionRect.setAttribute('stroke', 'blue');
        svg.appendChild(selectionRect);
    }
});
// Mouse Events
svg.addEventListener('mousemove', (e) => {
    // Cas 1 : On tient un nœud (draggingNode est défini)
    if (draggingNode) {
        
        if (!isDragging) {
            // On calcule si on a bougé de plus de 5 pixels depuis le clic initial
            const moveDist = Math.hypot(e.clientX - initialClickX, e.clientY - initialClickY);
            
            if (moveDist > 5) {
                isDragging = true; // C'est OFFICIELLEMENT un drag maintenant !

                // Si on commence à draguer un nœud qui n'était pas sélectionné,
                // on le sélectionne maintenant (et on désélectionne les autres sauf si Shift)
                if (!selectedNodes.has(draggingNode.id) && !e.shiftKey) {
                    selectedNodes.clear();
                    selectedNodes.add(draggingNode.id);
                    render();
                }
            }
        }

        // Cas 2 : Si le mode Drag est activé (donc on a dépassé les 5px)
        if (isDragging) {
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;

            // Mise à jour référence
            dragStartX = e.clientX;
            dragStartY = e.clientY;

            // Déplacement de tout le groupe
            nodes.forEach(n => {
                if (selectedNodes.has(n.id)) {
                    n.x += dx;
                    n.y += dy;
                }
            });
            render();
        }

    } else if (selectionRect) {
        // (Code du rectangle bleu inchangé)
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
        
        // --- MODIFICATION ICI ---
        if (preventNodeCreation) {
            // Si on avait prévu d'empêcher la création (car on vient de désélectionner)
            // On s'assure que tout est propre et on ARRÊTE là.
            selectedNodes.clear();
            tempSelectedId = null;
            preventNodeCreation = false; // Reset pour le prochain clic
            render();
            return; // <-- On quitte, donc pas de addNode()
        }

        // Sinon, comportement normal : création de nœud
        const rect = svg.getBoundingClientRect();
        addNode(e.clientX - rect.left, e.clientY - rect.top);
        render();
    }
    
});

function addNode(x, y) { nodes.push({ id: String(nodeIdCounter++), x, y }); }
function addEdge(id1, id2) {
    if (id1 === id2) return;

    const exists = edges.some(e => (e.from === id1 && e.to === id2) || (e.from === id2 && e.to === id1));
    if (exists) return;

    // Récupération des éléments du DOM
    const modal = document.getElementById('edge-form-modal');
    const weightInput = document.getElementById('edge-weight-input');
    const directedInput = document.getElementById('edge-directed-input');
    const btnSubmit = document.getElementById('edge-form-submit');
    const btnCancel = document.getElementById('edge-form-cancel');

    // Réinitialisation des champs par défaut
    weightInput.value = "";
    directedInput.checked = false;

    // Affichage du formulaire (centré par rapport à la fenêtre ou à la souris)
    modal.style.display = 'block';
    modal.style.left = (window.innerWidth / 2 - 100) + 'px';
    modal.style.top = (window.innerHeight / 2 - 80) + 'px';

    // On gère la validation ou l'annulation via une Promise
    return new Promise((resolve) => {
        // Nettoyage des anciens écouteurs pour éviter les doublons
        const submitHandler = () => {
            modal.style.display = 'none';
            cleanup();
            
            const wVal = weightInput.value;
            // On garde null si c'est vide, sinon on parse l'entier
            const weight = (wVal === "" || isNaN(parseInt(wVal, 10))) ? null : parseInt(wVal, 10);
            const isDirected = directedInput.checked;

            resolve({ weight, isDirected });
        };

        const cancelHandler = () => {
            modal.style.display = 'none';
            cleanup();
            resolve(null); // Annule l'ajout
        };

        function cleanup() {
            btnSubmit.removeEventListener('click', submitHandler);
            btnCancel.removeEventListener('click', cancelHandler);
        }

        btnSubmit.addEventListener('click', submitHandler);
        btnCancel.addEventListener('click', cancelHandler);

    }).then((result) => {
        if (result) {
            // Si l'utilisateur a validé, on pousse l'arête
            edges.push({ 
                from: id1, 
                to: id2, 
                weight: result.weight, 
                directed: result.isDirected 
            });
            render(); // On redessine le graphe
        }
    });
}

function deleteNode(id) {
    deleteNodes(new Set([id]));
}

function deleteNodes(ids) {
    if (!confirm('Supprimer les nœuds sélectionnés ?')) return;
    nodes = nodes.filter(n => !ids.has(n.id));
    edges = edges.filter(e => !ids.has(e.from) && !ids.has(e.to));
    selectedNodes.clear();
    render();
}

function renameNode() {
    if (!contextNodeId) return;
    const node = nodes.find(n => n.id == contextNodeId);
    if (!node) return;
    const newId = prompt('Enter new name:', node.id);
    if (newId && newId != node.id) {
        // Check if newId already exists
        if (nodes.some(n => n.id == newId)) {
            alert('Name already exists!');
            return;
        }
        // Update edges
        edges.forEach(e => {
            if (e.from == node.id) e.from = newId;
            if (e.to == node.id) e.to = newId;
        });
        node.id = newId;
        render();
    }
    document.getElementById('context-menu').style.display = 'none';
}

function deleteNodeFromMenu() {
    if (contextNodeId) {
        deleteNode(contextNodeId);
    }
    document.getElementById('context-menu').style.display = 'none';
}

function render() {
    svg.innerHTML = '';
    // 1. DÉFINITION DES MARQUEURS DE FLÈCHE (uniquement s'il y a des arêtes orientées)
    // On ajoute un élément <defs> pour les flèches en SVG
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrow');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '30'); // Recule la flèche pour qu'elle touche le bord du cercle (rayon 25 + un peu d'espace)
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '6');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('orient', 'auto-start-reverse');
    
    const arrowhead = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrowhead.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    arrowhead.setAttribute('fill', '#6b7280'); // Couleur assortie à tes lignes
    
    marker.appendChild(arrowhead);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // 2. GESTION DES EDGES
    edges.forEach(edge => {
        const n1 = nodes.find(n => n.id === edge.from);
        const n2 = nodes.find(n => n.id === edge.to);
        if (!n1 || !n2) return;

        const edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        edgeGroup.style.cursor = 'pointer';

        const hitbox = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hitbox.setAttribute('x1', n1.x); hitbox.setAttribute('y1', n1.y);
        hitbox.setAttribute('x2', n2.x); hitbox.setAttribute('y2', n2.y);
        hitbox.setAttribute('stroke', 'rgba(0,0,0,0.01)'); // Légèrement coloré pour le moteur de rendu
        hitbox.setAttribute('stroke-width', '25'); // Un peu plus large, c'est plus confortable
        hitbox.style.pointerEvents = 'all'; // La ligne magique pour capter les clics
        edgeGroup.appendChild(hitbox);
        

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', n1.x); 
        line.setAttribute('y1', n1.y);
        line.setAttribute('x2', n2.x); 
        line.setAttribute('y2', n2.y);
        line.classList.add('edge');

        if (edge.directed) {
            line.setAttribute('marker-end', 'url(#arrow)');
        }
        
        edgeGroup.appendChild(line);

        // AFFICHAGE CONDITIONNEL DU POIDS
        // On l'affiche seulement si edge.weight est défini (différent de null/undefined)
        if (edge.weight !== null && edge.weight !== undefined) {
            const midX = (n1.x + n2.x) / 2;
            const midY = (n1.y + n2.y) / 2;

            const weightText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            weightText.setAttribute('x', midX - 7*(1+ String(edge.weight).length)); // Ajustement pour centrer le texte
            weightText.setAttribute('y', midY - 7);
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
            contextEdge = edge; // On stocke l'arête ciblée (voir étape 3)
            
            // On cache l'autre menu s'il était ouvert
            document.getElementById('context-menu').style.display = 'none'; 
            
            const menu = document.getElementById('edge-context-menu');
            menu.style.display = 'block';
            menu.style.left = e.clientX + 'px';
            menu.style.top = e.clientY + 'px';
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

        // FIX: Check both multi-selection (selectedNodes) AND edge creation (tempSelectedId)
        // and apply the CSS class instead of hardcoding attributes.
        if (selectedNodes.has(node.id) || tempSelectedId === node.id) {
            circle.classList.add('selected');
        }

        circle.addEventListener('mousedown', (e) => { 
            e.stopPropagation(); 

            // On initialise juste les variables, ON NE TOUCHE PAS À LA SÉLECTION ICI
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
                    menu.style.top = (rect.top + node.y -5) + 'px';
                });        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.x); text.setAttribute('y', node.y + 1);
        text.textContent = node.id;

        group.appendChild(circle); group.appendChild(text); svg.appendChild(group);
    });
}

function resetGraph() {
    document.querySelectorAll('circle').forEach(c => c.classList.remove('visited', 'current'));
    document.querySelectorAll('.order-badge').forEach(b => b.remove());
    logDisplay.style.opacity = 0;
}

function saveGraph() {
    const graphData = {
        nodes: nodes,
        edges: edges,
        nodeIdCounter: nodeIdCounter
    };
    localStorage.setItem('graphData', JSON.stringify(graphData));
    alert('Graph saved to browser storage!');
}

function loadGraph() {
    const data = localStorage.getItem('graphData');
    if (data) {
        const graphData = JSON.parse(data);
        nodes = (graphData.nodes || []).map(n => ({ ...n, id: String(n.id) }));
        edges = (graphData.edges || []).map(e => ({ ...e, from: String(e.from), to: String(e.to) }));
        nodeIdCounter = parseInt(graphData.nodeIdCounter) || 1;
        selectedNodes.clear();
        tempSelectedId = null;
        draggingNode = null;
        render();
        alert('Graph loaded from browser storage!');
    } else {
        alert('No saved graph found.');
    }
}

function exportGraph() {
    const graphData = {
        nodes: nodes,
        edges: edges,
        nodeIdCounter: nodeIdCounter
    };
    const dataStr = JSON.stringify(graphData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importGraph() {
    document.getElementById('import-file').click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const graphData = JSON.parse(e.target.result);
                nodes = (graphData.nodes || []).map(n => ({ ...n, id: String(n.id) }));
                edges = (graphData.edges || []).map(e => ({ ...e, from: String(e.from), to: String(e.to) }));
                nodeIdCounter = parseInt(graphData.nodeIdCounter) || 1;
                selectedNodes.clear();
                tempSelectedId = null;
                draggingNode = null;
                render();
                alert('Graph imported successfully!');
            } catch (error) {
                alert('Invalid JSON file.');
            }
        };
        reader.readAsText(file);
    }
}

// --- SCRIPT PARSER ---
// Ajout du paramètre onComplete ici !
function runScript(onComplete) {
    const text = document.getElementById('script-input').value;
    
    // On parse le texte
    const lines = text.split('\n');
    const customHistory = [];
    
    lines.forEach(line => {
        const cleanLine = line.split('//')[0].trim();
        if (!cleanLine) return;

        const messageMatch = cleanLine.match(/"([^"]+)"/);
        const message = messageMatch ? messageMatch[1] : null;
        const ids = cleanLine.match(/\w+/g);
        
        if (ids) {
            ids.forEach((idStr, index) => {
                const id = idStr;
                // On vérifie que le nœud existe avant de l'ajouter
                if (nodes.find(n => n.id === id)) {
                     const msg = (index === ids.length - 1) ? message : null;
                     customHistory.push({ id: id, message: msg });
                }
            });
        }
    });

    if (customHistory.length === 0) {
        if (onComplete) onComplete(); // Si rien à jouer, on finit tout de suite pour ne pas bloquer le recorder
        return alert("Script vide ou nœuds invalides !");
    }
    
    resetGraph();
    // On passe le onComplete à l'animation
    animateHistory(customHistory, onComplete);
}

// --- MOTEUR D'ANIMATION ---
function animateHistory(history, onComplete) {
    let step = 0;
    const interval = setInterval(() => {
        if (step >= history.length) {
            clearInterval(interval);
            const lastItem = history[step-1];
            const lastId = typeof lastItem === 'object' ? lastItem.id : lastItem;
            const lastNode = document.querySelector(`circle[data-id="${lastId}"]`);
            if(lastNode) lastNode.classList.remove('current');
            
            // Fin propre
            logDisplay.style.opacity = 0;
            if (onComplete) onComplete();
            return;
        }

        const item = history[step];
        const nodeId = typeof item === 'object' ? item.id : item;
        const message = typeof item === 'object' ? item.message : null;

        const circle = document.querySelector(`circle[data-id="${nodeId}"]`);
        
        if (circle) {
            if (step > 0) {
                const prevItem = history[step - 1];
                const prevId = typeof prevItem === 'object' ? prevItem.id : prevItem;
                const prevCircle = document.querySelector(`circle[data-id="${prevId}"]`);
                if (prevCircle) {
                    prevCircle.classList.remove('current');
                    prevCircle.classList.add('visited');
                }
            }
            
            showOrderBadge(nodeId, step + 1);
            const action = typeof item === 'object' ? item.action : null;
            if (action === 'select') {
                circle.classList.add('selected'); // Bleu (ajout dans la file par exemple)
            } else {
                circle.classList.add('current');  // Orange (visite standard)
            }

            if (message) {
                logDisplay.textContent = message;
                logDisplay.style.opacity = 1;
            }
        }
        step++;
    }, 800);
}

// --- DFS AUTO ---
function startDFS(onComplete) {
    if (nodes.length === 0) return alert("Ajoutez des nœuds !");
    resetGraph();
    const adjacencyList = {};
    nodes.forEach(n => adjacencyList[n.id] = []);
    edges.forEach(e => { adjacencyList[e.from].push(e.to); adjacencyList[e.to].push(e.from); });
    
    const visited = new Set();
    const history = [];
    function dfs(nodeId) {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        history.push(nodeId);
        const neighbors = adjacencyList[nodeId];
        neighbors.sort((a, b) => String(a).localeCompare(String(b))); 
        for (const neighborId of neighbors) dfs(neighborId);
    }
    dfs(nodes[0].id);
    animateHistory(history, onComplete);
}

function startBFS(onComplete) {
    if (nodes.length === 0) return alert("Ajoutez des nœuds !");
    resetGraph();
    const adjacencyList = {};
    nodes.forEach(n => adjacencyList[n.id] = []);
    edges.forEach(e => { adjacencyList[e.from].push(e.to); adjacencyList[e.to].push(e.from); });
    
    const visited = new Set();
    const history = [];
    const queue = [];
    queue.push(nodes[0].id);
    visited.add(nodes[0].id);
    history.push(nodes[0].id);
    
    while (queue.length > 0) {
        const nodeId = queue.shift();
        const neighbors = adjacencyList[nodeId];
        neighbors.sort((a, b) => String(a).localeCompare(String(b)));
        for (const neighborId of neighbors) {
            if (!visited.has(neighborId)) {
                visited.add(neighborId);
                queue.push(neighborId);
                history.push(neighborId);
            }
        }
    }
    animateHistory(history, onComplete);
}

function showOrderBadge(nodeId, number) {
    const nodeData = nodes.find(n => n.id === nodeId);
    if (!nodeData) return;
    const badgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    badgeGroup.setAttribute('class', 'order-badge');
    const badgeCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    badgeCircle.setAttribute('cx', nodeData.x + 20); badgeCircle.setAttribute('cy', nodeData.y - 20);
    badgeCircle.setAttribute('r', 10); badgeCircle.setAttribute('fill', '#e74c3c');
    const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    badgeText.setAttribute('x', nodeData.x + 20); badgeText.setAttribute('y', nodeData.y - 19);
    badgeText.setAttribute('fill', 'white'); badgeText.setAttribute('font-size', '10px');
    badgeText.setAttribute('font-weight', 'bold'); badgeText.textContent = number;
    badgeGroup.appendChild(badgeCircle); badgeGroup.appendChild(badgeText); svg.appendChild(badgeGroup);
}

// --- ENREGISTREMENT VIDÉO (NETTOYÉ) ---
let recordingInterval = null;

async function recordAndPlay() {
    // SÉCURITÉ : Si un enregistrement tournait déjà (plantage précédent), on le tue.
    if (recordingInterval) clearInterval(recordingInterval);

    const hiddenCanvas = document.getElementById('recorder-canvas');
    const ctx = hiddenCanvas.getContext('2d');
    const scaleFactor = 2;
    const svgRect = svg.getBoundingClientRect();
    
    hiddenCanvas.width = svgRect.width * scaleFactor; 
    hiddenCanvas.height = svgRect.height * scaleFactor;
    ctx.scale(scaleFactor, scaleFactor);
    
    const stream = hiddenCanvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 4000000 });
    const chunks = [];
    
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    
    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); 
        a.href = url; 
        a.download = "algo-story.webm";
        document.body.appendChild(a); 
        a.click(); 
        document.body.removeChild(a);
        
        // Nettoyage final
        if (recordingInterval) clearInterval(recordingInterval);
        svg.classList.remove('dark');
    };
    
    const cssStyle = document.getElementById('main-style').innerText;
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) svg.classList.add('dark');
    
    // Démarrage
    recorder.start();

    // Boucle de copie Canvas
    recordingInterval = setInterval(() => {
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgWithStyle = svgData.replace('>', `><style>${cssStyle}</style>`);
        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgWithStyle);
        img.onload = () => {
            ctx.fillStyle = isDark ? "#2c3e50" : "white";
            ctx.fillRect(0, 0, hiddenCanvas.width/scaleFactor, hiddenCanvas.height/scaleFactor);
            ctx.drawImage(img, 0, 0);
            
            if (logDisplay.style.opacity == 1) {
                ctx.fillStyle = "rgba(0,0,0,0.7)";
                ctx.roundRect(svgRect.width/2 - 100, svgRect.height - 50, 200, 30, 15);
                ctx.fill();
                ctx.fillStyle = "white";
                ctx.font = "14px Arial";
                ctx.textAlign = "center";
                ctx.fillText(logDisplay.textContent, svgRect.width/2, svgRect.height - 30);
            }
        };
    }, 33);

    // LOGIQUE DE LANCEMENT UNIFIÉE
    // Callback qui sera appelé quand l'animation (DFS ou Script) sera finie
    const onAnimationComplete = () => {
        setTimeout(() => {
            if(recorder.state === "recording") {
                recorder.stop();
            }
        }, 1000); // 1 seconde de pause à la fin pour voir le résultat
    };

    const scriptContent = document.getElementById('script-input').value;
    // Si le script contient des chiffres, on suppose que c'est un script manuel
    if (/\d+/.test(scriptContent)) {
        runScript(onAnimationComplete); // On passe le callback proprement
    } else {
        startDFS(onAnimationComplete); // On passe le callback proprement
    }
}

function playImportedAnimation(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const history = JSON.parse(e.target.result);
                    resetGraph();
                    // On lance l'animation avec notre JSON généré par OCaml !
                    animateHistory(history);
                } catch (error) {
                    alert('Erreur lors de la lecture du fichier JSON.');
                }
            };
            reader.readAsText(file);
        }
        }


// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return; // Ignore if typing in input
    if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
            case 'c':
                copiedNodes = nodes.filter(n => selectedNodes.has(n.id));
                copiedEdges = edges.filter(e => selectedNodes.has(e.from) && selectedNodes.has(e.to));
                break;
            case 'v':
                if (copiedNodes.length > 0) {
                    const offsetX = 50, offsetY = 50;
                    const idMap = new Map();
                    copiedNodes.forEach(n => {
                        const newId = String(nodeIdCounter++);
                        idMap.set(n.id, newId);
                        nodes.push({ ...n, id: newId, x: n.x + offsetX, y: n.y + offsetY });
                    });
                    copiedEdges.forEach(e => {
                        edges.push({ from: idMap.get(e.from), to: idMap.get(e.to) });
                    });
                    selectedNodes.clear();
                    idMap.forEach(id => selectedNodes.add(id));
                    render();
                }
                break;
        }
    } else {
        switch (e.key) {
            case 'Delete':
            case 'Backspace':
                if (selectedNodes.size > 0) {
                    deleteNodes(selectedNodes);
                }
                break;
            case 'r':
                resetGraph();
                break;
            case 'd':
                startDFS();
                break;
            case 'b':
                startBFS();
                break;
        }
    }
});

let galEditor;

window.onload = function() {
    const textArea = document.getElementById('script-input'); // Ton textarea d'origine
    galEditor = CodeMirror.fromTextArea(textArea, {
        lineNumbers: true,
        mode: "javascript",
        theme: "default"
    });
    galEditor.setSize("100%", "400px");
};

function getGraphData() {
    return {
        nodes: nodes,
        edges: edges,
        nodeIdCounter: nodeIdCounter
    };
}

async function runScript() {
    const code = galEditor.getValue();
    const graph = getGraphData(); // Assure-toi que cette fonction exporte bien ton objet JSON {nodes, edges}

    try {
        const response = await fetch('http://localhost:3000/compile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code, graph: graph })
        });

        const data = await response.json();

        if (data.success) {
            //resetGraph(); 
            //animateHistory(data.animation); 
            loadPlayer(data.animation); // On charge l'animation dans le lecteur
        } else {
            alert("❌ Erreur de compilation :\n" + data.error);
        }
    } catch (err) {
        alert("❌ Erreur de connexion au serveur. Assure-toi que 'node server.js' tourne dans le terminal.");
    }
}



// --- VARIABLES GLOBALES DU LECTEUR ---
let animationHistory = [];
let currentStepIndex = -1; // -1 = Avant la première étape
let playInterval = null;

// 1. Fonction appelée par runScript() pour charger l'animation
function loadPlayer(history) {
    pauseAnimation();
    
    animationHistory = history;
    currentStepIndex = -1;
    
    // Affiche le lecteur
    document.getElementById('player-controls').style.display = 'block';
    
    resetGraph(); // On s'assure que le graphe est gris
    updatePlayerUI();
}

// 2. Moteur de rendu : recalcule l'état exact du graphe à l'étape actuelle
function renderStateAtCurrentStep() {
    resetGraph(); // On remet tout à zéro (couleurs, badges, log)

    if (currentStepIndex === -1) {
        logDisplay.style.opacity = 0;
        return;
    }

    // On rejoue l'historique très vite jusqu'à l'étape voulue
    for (let i = 0; i <= currentStepIndex; i++) {
        const item = animationHistory[i];
        const nodeId = typeof item === 'object' ? item.id : item;
        const message = typeof item === 'object' ? item.message : null;
        const action = typeof item === 'object' ? item.action : null;
        
        const circle = document.querySelector(`circle[data-id="${nodeId}"]`);
        if (!circle) continue;

        // On affiche le badge de l'ordre d'arrivée
        showOrderBadge(nodeId, i + 1);

        if (i === currentStepIndex) {
            // --- NOEUD ACTUEL (CELUI QU'ON REGARDE MAINTENANT) ---
            if (action === 'select') {
                circle.classList.add('selected'); // Bleu
            } else {
                circle.classList.add('current');  // Orange
            }
            
            // Affichage du message s'il y en a un
            if (message) {
                logDisplay.textContent = message;
                logDisplay.style.opacity = 1;
            } else {
                logDisplay.style.opacity = 0;
            }
        } else {
            // --- NOEUDS PRÉCÉDENTS (DÉJÀ PASSÉS) ---
            if (action === 'select') {
                circle.classList.add('selected'); // Reste bleu si c'était une sélection
            } else {
                circle.classList.add('visited');  // Devient gris foncé/visité
            }
        }
    }
}

function playAnimation() {
    if (currentStepIndex >= animationHistory.length - 1) {
        currentStepIndex = -1;
    }
    
    const playBtn = document.getElementById('btn-play');
    if (playBtn) {
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    }
    
    playInterval = setInterval(() => {
        if (currentStepIndex < animationHistory.length - 1) {
            currentStepIndex++;
            renderStateAtCurrentStep();
            updatePlayerUI();
        } else {
            pauseAnimation();
        }
    }, 800);
}

function pauseAnimation() {
    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
    }
    const playBtn = document.getElementById('btn-play');
    if (playBtn) {
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i> Play';
    }
}

// L'événement au clic sur ton nouveau bouton
document.getElementById('btn-play').addEventListener('click', () => {
    if (playInterval) {
        pauseAnimation(); // S'il joue, on le coupe
    } else {
        playAnimation();  // Sinon, on le lance
    }
});

// 3. Actions des boutons
document.getElementById('btn-next').addEventListener('click', () => {
    pauseAnimation();
    if (currentStepIndex < animationHistory.length - 1) {
        currentStepIndex++;
        renderStateAtCurrentStep();
        updatePlayerUI();
    }
});

document.getElementById('btn-prev').addEventListener('click', () => {
    pauseAnimation();
    if (currentStepIndex > -1) {
        currentStepIndex--;
        renderStateAtCurrentStep();
        updatePlayerUI();
    }
});

// 4. Mise à jour des textes et des boutons
function updatePlayerUI() {
    const counter = document.getElementById('step-counter');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');

    // On affiche l'étape (ex: 1 / 5)
    counter.textContent = `Step ${currentStepIndex + 1} / ${animationHistory.length}`;

    // On grise les boutons si on est au début ou à la fin
    btnPrev.disabled = (currentStepIndex === -1);
    btnNext.disabled = (currentStepIndex >= animationHistory.length - 1);
    
    // Petit style visuel pour les boutons désactivés
    btnPrev.style.opacity = btnPrev.disabled ? 0.5 : 1;
    btnNext.style.opacity = btnNext.disabled ? 0.5 : 1;
}


let contextEdge = null; // Va stocker l'arête sur laquelle on a fait un clic droit

// Fermer les menus si on clique n'importe où sur l'écran
document.addEventListener('click', () => {
    document.getElementById('context-menu').style.display = 'none';
    document.getElementById('edge-context-menu').style.display = 'none';
});

// Supprimer l'arête
function deleteEdgeFromMenu() {
    if (contextEdge) {
        // On filtre le tableau pour garder toutes les arêtes SAUF celle ciblée
        edges = edges.filter(e => e !== contextEdge);
        contextEdge = null;
        render(); // On redessine
    }
}

// Modifier l'arête (réutilise ton formulaire de création)
function editEdge() {
    if (!contextEdge) return;
    document.getElementById('edge-context-menu').style.display = 'none';

    const modal = document.getElementById('edge-form-modal');
    const weightInput = document.getElementById('edge-weight-input');
    const directedInput = document.getElementById('edge-directed-input');
    const btnSubmit = document.getElementById('edge-form-submit');
    const btnCancel = document.getElementById('edge-form-cancel');

    // On pré-remplit le formulaire avec les valeurs actuelles de l'arête
    weightInput.value = contextEdge.weight !== null ? contextEdge.weight : "";
    directedInput.checked = contextEdge.directed;

    modal.style.display = 'block';
    modal.style.left = (window.innerWidth / 2 - 100) + 'px';
    modal.style.top = (window.innerHeight / 2 - 80) + 'px';

    const submitHandler = () => {
        modal.style.display = 'none';
        cleanup();
        
        const wVal = weightInput.value;
        // On met à jour directement l'objet de l'arête
        contextEdge.weight = (wVal === "" || isNaN(parseInt(wVal, 10))) ? null : parseInt(wVal, 10);
        contextEdge.directed = directedInput.checked;
        
        contextEdge = null;
        render(); // On redessine le graphe avec les nouvelles infos
    };

    const cancelHandler = () => {
        modal.style.display = 'none';
        cleanup();
        contextEdge = null;
    };

    function cleanup() {
        btnSubmit.removeEventListener('click', submitHandler);
        btnCancel.removeEventListener('click', cancelHandler);
    }

    btnSubmit.addEventListener('click', submitHandler);
    btnCancel.addEventListener('click', cancelHandler);
}


async function runScriptGAL() {
    const code = editor.getValue();
    const graph = getGraphData();

    const compileBtn = document.querySelector('.btn-compile');
    if (compileBtn) compileBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Compiling...';

    try {
        const response = await fetch('http://localhost:3000/compile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code, graph: graph })
        });

        const data = await response.json();

        if (data.success) {
            loadPlayer(data.animation); 
        } else {
            alert("❌ Compilation Error:\n" + data.error);
        }
    } catch (err) {
        alert("❌ Server Connection Error. Ensure 'node server.js' is running in the terminal.");
    } finally {
        if (compileBtn) compileBtn.innerHTML = '<i class="fa-solid fa-gear fa-spin-hover"></i> Compile the script';
    }
}



// --- DOCUMENTATION MODAL ---
const docsModal = document.getElementById('docs-modal');
const btnOpenDocs = document.getElementById('btn-open-docs');
const btnCloseDocs = document.getElementById('btn-close-docs');

if (btnOpenDocs && docsModal && btnCloseDocs) {
    btnOpenDocs.addEventListener('click', () => {
        docsModal.style.display = 'flex'; // Use flex to center it
    });

    btnCloseDocs.addEventListener('click', () => {
        docsModal.style.display = 'none';
    });

    // Close when clicking outside the modal content
    docsModal.addEventListener('click', (e) => {
        if (e.target === docsModal) {
            docsModal.style.display = 'none';
        }
    });
}