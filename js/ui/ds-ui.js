// ==========================================
// GESTION UI DES STRUCTURES DE DONNÉES
// ==========================================

const DS_ACTIONS = {
    bst: {
        insert: async () => await insertNode(),
        delete: async () => await deleteNode(),
        clear: async () => await clearDataStructure(),
        search: async () => await searchNode(),
        bulk: async () => await generateRandomBST(),
        min: async () => await findBSTMin(),
        max: async () => await findBSTMax(),
        traverse: async (type) => await traverseBST(type),
        theory: 'bst'
    },
    heap: {
        insert: async () => await insertHeapNode(),
        delete: async () => await deleteHeapNode(),
        clear: async () => await clearHeapDataStructure(),
        search: async () => await searchHeapNode(),
        bulk: async () => await generateRandomHeap(),
        theory: 'heap'
    },
    ll: {
        insert: async () => await appendLLNode(),
        delete: async () => await deleteLLNode(),
        clear: async () => await clearLLDataStructure(),
        search: async () => console.log("Search not yet implemented for Linked List"),
        theory: 'linkedlist'
    },
    dll: {
        insert: async () => await appendDLLNode(),
        delete: async () => await deleteDLLNode(),
        clear: async () => await clearDLLDataStructure(),
        theory: 'linkedlist'
    },
    array: {
        clear: async () => await clearArrayDataStructure(),
        bulk: async () => await generateRandomArray(),
        theory: 'array'
    }
};

document.getElementById('ds-selector').addEventListener('change', function(e) {
    const type = e.target.value;
    const isArray = type === 'array';
    
    const controls = document.getElementById('ds-dynamic-controls');
    const theoryBtn = document.getElementById('btn-ds-theory');
    const floatingHud = document.getElementById('floating-hud');
    const svgCanvas = document.getElementById('ds-svg-canvas');
    const domCanvas = document.getElementById('ds-dom-canvas');
    const placeholder = document.getElementById('ds-placeholder-text');
    
    const panels = {
        explore: document.getElementById('ds-explore-controls'),
        traversal: document.getElementById('ds-traversal-controls'),
        heap: document.getElementById('heap-mode-controls'),
        sorting: document.getElementById('ds-sorting-controls'),
        playback: document.getElementById('ds-playback-controls')
    };

    if (!type) {
        controls.style.display = 'none';
        theoryBtn.style.display = 'none';
        if (floatingHud) floatingHud.style.display = 'none';
        svgCanvas.style.display = 'none';
        domCanvas.style.display = 'none';
        placeholder.style.display = 'block';
        Object.values(panels).forEach(p => { if (p) p.style.display = 'none'; });
        return;
    }

    controls.style.display = 'flex';
    theoryBtn.style.display = 'inline-flex';
    if (floatingHud) floatingHud.style.display = 'flex';
    
    svgCanvas.style.display = isArray ? 'none' : 'block';
    domCanvas.style.display = isArray ? 'block' : 'none';
    placeholder.style.display = 'none';

    if (panels.explore) panels.explore.style.display = type === 'bst' ? 'flex' : 'none';
    if (panels.traversal) panels.traversal.style.display = type === 'bst' ? 'flex' : 'none';
    if (panels.heap) panels.heap.style.display = type === 'heap' ? 'flex' : 'none';
    if (panels.sorting) panels.sorting.style.display = isArray ? 'flex' : 'none';
    if (panels.playback) panels.playback.style.display = isArray ? 'flex' : 'none';

    if (isArray) {
        setTimeout(() => handleDynamicBulkInsert(), 100);
    }
});

function toggleHeapType(type) {
    if (heapEngine && heapEngine.isAnimating) return;
    heapEngine.setType(type);
    
    const isMax = type === 'max';
    document.getElementById('btn-heap-max').classList.toggle('active', isMax);
    document.getElementById('btn-heap-min').classList.toggle('active', !isMax);
}

// --- DISPATCHERS ---

async function executeDSAction(actionName, ...args) {
    const ds = document.getElementById('ds-selector').value;
    if (DS_ACTIONS[ds] && DS_ACTIONS[ds][actionName]) {
        await DS_ACTIONS[ds][actionName](...args);
    }
}

async function handleDynamicInsert() { await executeDSAction('insert'); }
async function handleDynamicDelete() { await executeDSAction('delete'); }
async function handleDynamicClear() { await executeDSAction('clear'); }
async function handleDynamicSearch() { await executeDSAction('search'); }
async function handleDynamicBulkInsert() { await executeDSAction('bulk'); }
async function handleDynamicFindMin() { await executeDSAction('min'); }
async function handleDynamicFindMax() { await executeDSAction('max'); }
async function handleDynamicTraverse(type) { await executeDSAction('traverse', type); }

function openDSTheory() {
    const ds = document.getElementById('ds-selector').value;
    if (DS_ACTIONS[ds] && DS_ACTIONS[ds].theory) {
        openTheory(DS_ACTIONS[ds].theory);
    }
}
