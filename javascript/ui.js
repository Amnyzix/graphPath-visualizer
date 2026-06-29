// --- THEME TOGGLE ---
const themeToggle = document.getElementById('theme-toggle');

themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    
    if (isDark) {
        themeToggle.innerHTML = '<i class="fa-solid fa-sun" style="margin-right: 6px;"></i>Light Mode';
    } else {
        themeToggle.innerHTML = '<i class="fa-solid fa-moon" style="margin-right: 6px;"></i>Dark Mode';
    }

    if (typeof editor !== 'undefined') {
        editor.setOption("theme", isDark ? "dracula" : "default"); // Modifie "dracula" si tu as choisi un autre thème !
    }
});

// --- MENUS CONTEXTUELS ---
let contextNodeId = null;
let contextEdge = null; 

document.addEventListener('click', () => {
    document.getElementById('context-menu').style.display = 'none';
    document.getElementById('edge-context-menu').style.display = 'none';
});

function renameNode() {
    if (!contextNodeId) return;
    const node = nodes.find(n => n.id == contextNodeId);
    if (!node) return;
    const newId = prompt('Enter new node name:', node.id);
    if (newId && newId != node.id) {
        if (nodes.some(n => n.id == newId)) {
            alert('This name already exists!');
            return;
        }
        saveState();
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
        if (selectedNodes.has(contextNodeId) && selectedNodes.size > 1) {
            deleteNodes(selectedNodes);
        } else {
            deleteNodes(new Set([contextNodeId]));
        }
    }
    document.getElementById('context-menu').style.display = 'none';
}

function deleteEdgeFromMenu() {
    if (contextEdge) {
        edges = edges.filter(e => e !== contextEdge);
        contextEdge = null;
        saveState();
        render(); 
    }
}

function editEdge() {
    if (!contextEdge) return;
    document.getElementById('edge-context-menu').style.display = 'none';

    const modal = document.getElementById('edge-form-modal');
    const weightInput = document.getElementById('edge-weight-input');
    const directedInput = document.getElementById('edge-directed-input');
    const btnSubmit = document.getElementById('edge-form-submit');
    const btnCancel = document.getElementById('edge-form-cancel');

    weightInput.value = contextEdge.weight !== null ? contextEdge.weight : "";
    directedInput.checked = contextEdge.directed;

    modal.style.display = 'block';
    modal.style.left = (window.innerWidth / 2 - 100) + 'px';
    modal.style.top = (window.innerHeight / 2 - 80) + 'px';

    const submitHandler = () => {
        modal.style.display = 'none';
        cleanup();
        const wVal = weightInput.value;
        contextEdge.weight = (wVal === "" || isNaN(parseInt(wVal, 10))) ? null : parseInt(wVal, 10);
        contextEdge.directed = directedInput.checked;
        contextEdge = null;
        saveState();
        render();
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

// --- KEYBOARD SHORTCUTS ---
let copiedNodes = [];
let copiedEdges = [];

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
            case 'z':
                e.preventDefault();
                undo();
                break;
            case 'y':
                e.preventDefault(); 
                redo();
                break;

            case 'x':
                e.preventDefault();
                if (selectedNodes.size > 0) {
                    // 1. On copie en mémoire
                    copiedNodes = nodes.filter(n => selectedNodes.has(n.id));
                    copiedEdges = edges.filter(e => selectedNodes.has(e.from) && selectedNodes.has(e.to));
                    
                    // 2. On supprime (en sauvegardant l'état pour le Undo)
                    saveState();
                    nodes = nodes.filter(n => !selectedNodes.has(n.id));
                    edges = edges.filter(e => !selectedNodes.has(e.from) && !selectedNodes.has(e.to));
                    selectedNodes.clear();
                    render();
                }
                break;

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
                    saveState();
                }
                break;
        }
    } else {
        switch (e.key) {
            case 'Delete':
            case 'Backspace':
                if (selectedNodes.size > 0) deleteNodes(selectedNodes);
                break;
            case 'r':
                resetGraph();
                break;
        }
    }
});




// --- SÉPARATEUR REDIMENSIONNABLE (PANEL SPLITTER) ---
const splitter = document.getElementById('splitter');
const leftPanel = document.getElementById('left-panel');
const rightPanel = document.getElementById('right-panel');

let isResizing = false;

if (splitter && leftPanel && rightPanel) {
    splitter.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.classList.add('is-resizing');
        
        // Prevent text selection while dragging
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        // Calculate new width for the left panel based on mouse X position
        const leftPanelOffsetLeft = leftPanel.getBoundingClientRect().left;
        const newWidth = e.clientX - leftPanelOffsetLeft;

        // Enforce min and max constraints (250px to 600px)
        if (newWidth >= 250 && newWidth <= 600) {
            leftPanel.style.width = `${newWidth}px`;
            rightPanel.style.width = `calc(100% - ${newWidth}px)`;
            
            // Trigger CodeMirror resize refresh so the editor fits smoothly
            if (typeof galEditor !== 'undefined') {
                galEditor.refresh();
            }
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.classList.remove('is-resizing');
        }
    });
}


// --- MENU DÉROULANT AU CLIC ---
function toggleDropdown(menuId) {
    const menu = document.getElementById(menuId);
    if (!menu) return;

    // Si le menu est déjà affiché, on le cache. Sinon, on l'affiche.
    if (menu.style.display === 'block') {
        menu.removeAttribute('style'); 
    } else {
        closeAllDropdowns();
        menu.style.display = 'block';
    }
}

function closeAllDropdowns() {
    const contents = document.querySelectorAll('.dropdown-content');
    contents.forEach(content => {
        content.removeAttribute('style');
    });
}

// Ferme les menus si on clique en dehors
window.onclick = function(event) {
    if (!event.target.matches('.dropbtn') && !event.target.closest('.dropbtn')) {
        closeAllDropdowns();
    }
}


// --- GESTION DES ONGLETS DU PANNEAU GAUCHE ---
function switchTab(tabName) {
    // 1. Désactive tous les contenus et boutons
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    // 2. Active l'onglet demandé
    if (tabName === 'script') {
        document.getElementById('tab-script').classList.add('active');
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        
        // Rafraîchissement forcé de CodeMirror pour éviter les bugs d'affichage
        // après un retour depuis display: none
        if (typeof galEditor !== 'undefined') {
            setTimeout(() => galEditor.refresh(), 10);
        }
    } else if (tabName === 'data') {
        document.getElementById('tab-data').classList.add('active');
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
    }
}
