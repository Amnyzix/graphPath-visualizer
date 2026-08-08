// ==========================================
// GESTION UI DES STRUCTURES DE DONNÉES
// ==========================================

import {
  insertNode,
  deleteNode,
  clearDataStructure,
  searchNode,
  generateRandomBST,
  findBSTMin,
  findBSTMax,
  traverseBST,
} from "../features/datastructures/bst.js";
import {
  insertHeapNode,
  deleteHeapNode,
  searchHeapNode,
  generateRandomHeap,
  toggleHeapType as heapToggleType,
  clearHeapDataStructure,
} from "../features/datastructures/heap.js";
import {
  appendLLNode,
  deleteLLNode,
  clearLLDataStructure,
} from "../features/datastructures/linkedlist.js";
import {
  appendDLLNode,
  deleteDLLNode,
  clearDLLDataStructure,
} from "../features/datastructures/doublylinkedlist.js";
import { generateRandomArray } from "../features/datastructures/array.js";

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
    theory: "bst",
  },
  heap: {
    insert: async () => await insertHeapNode(),
    delete: async () => await deleteHeapNode(),
    clear: async () => await clearHeapDataStructure(),
    search: async () => await searchHeapNode(),
    bulk: async () => await generateRandomHeap(),
    theory: "heap",
  },
  ll: {
    insert: async () => await appendLLNode(),
    delete: async () => await deleteLLNode(),
    clear: async () => await clearLLDataStructure(),
    search: async () => console.log("Search not yet implemented for Linked List"),
    theory: "linkedlist",
  },
  dll: {
    insert: async () => await appendDLLNode(),
    delete: async () => await deleteDLLNode(),
    clear: async () => await clearDLLDataStructure(),
    theory: "linkedlist",
  },
  array: {
    //clear: async () => await clearArrayDataStructure(),
    bulk: async () => await generateRandomArray(),
    theory: "array",
  },
};

document.getElementById("ds-selector").addEventListener("change", function (e) {
  const type = e.target.value;
  const isArray = type === "array";

  const controls = document.getElementById("ds-dynamic-controls");
  const theoryBtn = document.getElementById("btn-ds-theory");
  const floatingHud = document.getElementById("floating-hud");
  const svgCanvas = document.getElementById("ds-svg-canvas");
  const domCanvas = document.getElementById("ds-dom-canvas");
  const placeholder = document.getElementById("ds-placeholder-text");

  const panels = {
    explore: document.getElementById("ds-explore-controls"),
    traversal: document.getElementById("ds-traversal-controls"),
    heap: document.getElementById("heap-mode-controls"),
    sorting: document.getElementById("ds-sorting-controls"),
    playback: document.getElementById("ds-playback-controls"),
  };

  if (!type) {
    controls.style.display = "none";
    theoryBtn.style.display = "none";
    if (floatingHud) floatingHud.style.display = "none";
    svgCanvas.style.display = "none";
    domCanvas.style.display = "none";
    placeholder.style.display = "block";
    Object.values(panels).forEach((p) => {
      if (p) p.style.display = "none";
    });
    return;
  }

  controls.style.display = "flex";
  theoryBtn.style.display = "inline-flex";
  if (floatingHud) floatingHud.style.display = "flex";

  svgCanvas.style.display = isArray ? "none" : "block";
  domCanvas.style.display = isArray ? "block" : "none";
  placeholder.style.display = "none";

  if (panels.explore) panels.explore.style.display = type === "bst" ? "flex" : "none";
  if (panels.traversal) panels.traversal.style.display = type === "bst" ? "flex" : "none";
  if (panels.heap) panels.heap.style.display = type === "heap" ? "flex" : "none";
  if (panels.sorting) panels.sorting.style.display = isArray ? "flex" : "none";
  if (panels.playback) panels.playback.style.display = isArray ? "flex" : "none";

  if (isArray) {
    setTimeout(() => handleDynamicBulkInsert(), 100);
  }
});

export function toggleHeapType(type) {
  heapToggleType(type);

  const isMax = type === "max";
  document.getElementById("btn-heap-max").classList.toggle("active", isMax);
  document.getElementById("btn-heap-min").classList.toggle("active", !isMax);
}

// expose for inline handlers
window.toggleHeapType = toggleHeapType;

// --- DISPATCHERS ---

async function executeDSAction(actionName, ...args) {
  const ds = document.getElementById("ds-selector").value;
  if (DS_ACTIONS[ds] && DS_ACTIONS[ds][actionName]) {
    await DS_ACTIONS[ds][actionName](...args);
  }
}

export async function handleDynamicInsert() {
  await executeDSAction("insert");
}
export async function handleDynamicDelete() {
  await executeDSAction("delete");
}
export async function handleDynamicClear() {
  await executeDSAction("clear");
}
export async function handleDynamicSearch() {
  await executeDSAction("search");
}
export async function handleDynamicBulkInsert() {
  await executeDSAction("bulk");
}
export async function handleDynamicFindMin() {
  await executeDSAction("min");
}
export async function handleDynamicFindMax() {
  await executeDSAction("max");
}
export async function handleDynamicTraverse(type) {
  await executeDSAction("traverse", type);
}

export function openDSTheory() {
  const ds = document.getElementById("ds-selector").value;
  if (DS_ACTIONS[ds] && DS_ACTIONS[ds].theory) {
    window.openTheory(DS_ACTIONS[ds].theory);
  }
}

window.toggleHeapType = toggleHeapType;
window.handleDynamicInsert = handleDynamicInsert;
window.handleDynamicDelete = handleDynamicDelete;
window.handleDynamicClear = handleDynamicClear;
window.handleDynamicSearch = handleDynamicSearch;
window.handleDynamicBulkInsert = handleDynamicBulkInsert;
window.handleDynamicFindMin = handleDynamicFindMin;
window.handleDynamicFindMax = handleDynamicFindMax;
window.handleDynamicTraverse = handleDynamicTraverse;
window.openDSTheory = openDSTheory;
