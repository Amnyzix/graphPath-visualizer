// javascript/ui/heap-app.js

let heapEditor = null;
let heapVisualization = null;
let heapPlayer = null;

window.addEventListener('DOMContentLoaded', () => {
    heapEditor = { document: new HeapDocument('max') };
    heapVisualization = new HeapVisualization(heapEditor);
    
    // On réutilise les contrôles 'bst' car les Heaps et les BST partagent le même espace UI/SVG
    heapPlayer = new AnimationPlayer(heapVisualization, 'bst'); 
});

function setupHeapDisplay() {
    window.activeVisualization = heapVisualization;
    document.getElementById('ds-svg-canvas').style.display = 'block';
    document.getElementById('ds-dom-canvas').style.display = 'none';
    document.getElementById('ds-placeholder-text').style.display = 'none';
    document.getElementById('floating-hud').style.display = 'block';
}

function toggleHeapType(type) {
    heapEditor.document.type = type;
    document.getElementById('btn-heap-max').classList.toggle('active', type === 'max');
    document.getElementById('btn-heap-min').classList.toggle('active', type === 'min');
    
    // On vide le tas actuel lors d'un changement de mode
    clearHeapDataStructure();
}

async function insertHeapNode() {
    setupHeapDisplay();
    const input = document.getElementById('ds-value-input');
    const val = parseInt(input.value);
    
    if (!isNaN(val)) {
        const history = HeapAlgorithms.insert(heapEditor.document.heap, heapEditor.document.type, val);
        heapPlayer.load(history);
        heapPlayer.play();
        input.value = '';
    }
}

async function extractHeapRoot() {
    setupHeapDisplay();
    const history = HeapAlgorithms.extractRoot(heapEditor.document.heap, heapEditor.document.type);
    heapPlayer.load(history);
    heapPlayer.play();
}

function generateRandomHeap() {
    setupHeapDisplay();
    heapEditor.document.clear();
    
    const count = 7;
    const uniqueValues = new Set();
    while (uniqueValues.size < count) {
        uniqueValues.add(Math.floor(Math.random() * 99) + 1);
    }
    const valuesArray = Array.from(uniqueValues);
    
    // Insertion silencieuse (sans animation)
    for (let value of valuesArray) {
        heapEditor.document.heap.push(value);
        let curr = heapEditor.document.heap.length - 1;
        while (curr > 0) {
            let parent = Math.floor((curr - 1) / 2);
            if (HeapAlgorithms.compare(heapEditor.document.heap[curr], heapEditor.document.heap[parent], heapEditor.document.type)) {
                let temp = heapEditor.document.heap[curr];
                heapEditor.document.heap[curr] = heapEditor.document.heap[parent];
                heapEditor.document.heap[parent] = temp;
                curr = parent;
            } else {
                break;
            }
        }
    }
    
    heapVisualization.render(heapEditor.document.heap);
    heapPlayer.hide(); 
}

function clearHeapDataStructure() {
    setupHeapDisplay();
    heapEditor.document.clear();
    heapVisualization.render(heapEditor.document.heap);
    
    const infoPanel = document.getElementById('ds-info-panel');
    if (infoPanel) infoPanel.innerHTML = '';
}