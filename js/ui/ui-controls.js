const themeToggle = document.getElementById('theme-toggle');

themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    
    // On met à jour l'éditeur et le terminal !
    if (typeof updateEditorThemes === 'function') {
        updateEditorThemes(isDark);
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
    // 1. On ignore les frappes si l'utilisateur écrit dans un champ de texte
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

    // 2. On récupère l'éditeur actuellement actif
    const editor = window.activeEditor;

    // --- COMMANDES AVEC CTRL ---
    if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
            case 'z':
                e.preventDefault();
                if (editor && typeof editor.undo === 'function') editor.undo();
                else if (typeof undo === 'function') undo(); // Fallback Legacy
                break;
                
            case 'y':
                e.preventDefault();
                if (editor && typeof editor.redo === 'function') editor.redo();
                else if (typeof redo === 'function') redo(); // Fallback Legacy
                break;
                
            case 'x':
                e.preventDefault();
                // cut: à implémenter dans tes classes Editor si besoin
                break;
                
            case 'c':
                e.preventDefault();
                if (editor && typeof editor.copySelected === 'function') editor.copySelected();
                break;
                
            case 'v':
                e.preventDefault();
                if (editor && typeof editor.pasteClipboard === 'function') editor.pasteClipboard();
                break;
        }
    } 
    // --- COMMANDES SANS CTRL ---
    else {
        switch (e.key) {
            case 'Delete':
            case 'Backspace':
                if (editor && typeof editor.deleteSelected === 'function') {
                    editor.deleteSelected();
                } else if (typeof selectedNodes !== 'undefined' && selectedNodes.size > 0 && typeof deleteNodes === 'function') {
                    // Fallback Legacy
                    deleteNodes(selectedNodes);
                }
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


function switchAiAlgorithm(algo) {
    // 1. Stopper et nettoyer l'éditeur actuel avant de changer
    if (window.aiApp) {
        window.aiApp.stopAnimation();
        window.aiApp.clearCanvas();
    }

    // 2. Basculer le pointeur vers le bon éditeur via le Registre !
    window.aiApp = window.AppRegistry.get(algo);

    // 3. Cacher toutes les sections (Ajout des sections K-NN)
    document.getElementById('ai-minimax-controls').style.display = 'none';
    document.getElementById('ai-kmeans-controls').style.display = 'none';
    document.getElementById('ai-knn-controls').style.display = 'none'; 

    document.getElementById('ai-minimax-guide').style.display = 'none';
    document.getElementById('ai-kmeans-guide').style.display = 'none';
    document.getElementById('ai-knn-guide').style.display = 'none'; 
    
    const paramLabel = document.getElementById('ai-param-label');
    const paramSlider = document.getElementById('ai-depth-slider');
    
    // Réinitialiser le "step" du slider à 1 par défaut (pour Minimax et K-Means)
    paramSlider.step = 1; 
    
    // 4. Afficher selon la sélection
    if (algo === 'minimax') {
        document.getElementById('ai-minimax-controls').style.display = 'flex';
        document.getElementById('ai-minimax-guide').style.display = 'block';
        
        paramLabel.innerHTML = `Depth: <span id="ai-param-val">${paramSlider.value}</span>`;
        paramSlider.min = 2;
        paramSlider.max = 6;
        paramSlider.onchange = function() { window.aiApp.generateTree(this.value); };
        
    } else if (algo === 'kmeans') {
        document.getElementById('ai-kmeans-controls').style.display = 'flex';
        document.getElementById('ai-kmeans-guide').style.display = 'block';
        
        paramLabel.innerHTML = `Clusters (K): <span id="ai-param-val">${paramSlider.value}</span>`;
        paramSlider.min = 2;
        paramSlider.max = 10;
        paramSlider.onchange = function() { /* K-Means lira cette valeur au clic sur Run */ };
        
    } else if (algo === 'knn') {
        document.getElementById('ai-knn-controls').style.display = 'flex';
        document.getElementById('ai-knn-guide').style.display = 'block';
        
        // Configuration spécifique pour K-NN (nombres impairs recommandés)
        paramLabel.innerHTML = `K (Neighbors): <span id="ai-param-val">${paramSlider.value}</span>`;
        paramSlider.min = 1;
        paramSlider.max = 15;
        paramSlider.step = 2; // Avance de 2 en 2 (1, 3, 5, 7...)
        paramSlider.onchange = function() { /* K-NN lira cette valeur au clic sur Run */ };
    }
}
