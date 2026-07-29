// javascript/ui/bst-app.js

let bstEditor = null;
let bstVisualization = null;
let bstPlayer = null;

window.addEventListener('DOMContentLoaded', () => {
    // 1. Initialisation de l'éditeur et du document
    bstEditor = {
        document: new BSTDocument()
    };
    
    bstVisualization = new BSTVisualization(bstEditor);
    
    // Le lecteur est définitivement lié au BST
    bstPlayer = new AnimationPlayer(bstVisualization,'bst');
    console.log(bstPlayer)

    // 3. (Optionnel) Générer un arbre par défaut
    generateRandomBST();
});

// --- ACTIONS UI ---


async function insertNode() {
    const input = document.getElementById('ds-value-input');
    const val = parseInt(input.value);
    if (!isNaN(val)) {
        window.activeVisualization = bstVisualization;
        const history = BSTAlgorithms.insert(bstEditor.document.root, val);
        bstPlayer.load(history);
        bstPlayer.play();
        input.value = '';
    }
}

async function searchNode() {
    const input = document.getElementById('ds-value-input');
    const val = parseInt(input.value);
    if (!isNaN(val)) {
        window.activeVisualization = bstVisualization;
        const history = BSTAlgorithms.search(bstEditor.document.root, val);
        bstPlayer.load(history);
        bstPlayer.play();
    }
}

async function deleteNode() {
    const input = document.getElementById('ds-value-input');
    const val = parseInt(input.value);
    if (!isNaN(val)) {
        window.activeVisualization = bstVisualization;
        const history = BSTAlgorithms.delete(bstEditor.document.root, val);
        bstPlayer.load(history);
        bstPlayer.play();
        input.value = '';
    }
}

function findBSTMin() {
    window.activeVisualization = bstVisualization;
    const history = BSTAlgorithms.findMin(bstEditor.document.root);
    bstPlayer.load(history);
    bstPlayer.play();
}

function findBSTMax() {
    window.activeVisualization = bstVisualization;
    const history = BSTAlgorithms.findMax(bstEditor.document.root);
    bstPlayer.load(history);
    bstPlayer.play();
}

function traverseBST(type) {
    window.activeVisualization = bstVisualization;
    const history = BSTAlgorithms.traverse(bstEditor.document.root, type);
    bstPlayer.load(history);
    bstPlayer.play();
}

function generateRandomBST() {
    window.activeVisualization = bstVisualization;
    bstEditor.document.clear();
    const count = 7;
    const uniqueValues = new Set();
    while (uniqueValues.size < count) {
        uniqueValues.add(Math.floor(Math.random() * 99) + 1);
    }
    const valuesArray = Array.from(uniqueValues);
    
    // Insertion silencieuse dans le document
    for (let value of valuesArray) {
        // Logique d'insertion simple pour construire l'arbre initial sans animation
        if (!bstEditor.document.root) {
            bstEditor.document.root = { value, left: null, right: null, x:0, y:0 };
        } else {
            let current = bstEditor.document.root;
            while (true) {
                if (value < current.value) {
                    if (!current.left) { current.left = { value, left: null, right: null, x:0, y:0 }; break; }
                    current = current.left;
                } else {
                    if (!current.right) { current.right = { value, left: null, right: null, x:0, y:0 }; break; }
                    current = current.right;
                }
            }
        }
    }
    
    // Mise à jour visuelle
    bstVisualization.render();
    bstPlayer.hide(); // S'assure que le lecteur est masqué ou réinitialisé
}

function clearDataStructure() {
    bstEditor.document.clear();
    bstVisualization.render();
    const infoPanel = document.getElementById('ds-info-panel');
    if (infoPanel) infoPanel.innerHTML = '';
}