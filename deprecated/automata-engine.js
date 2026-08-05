// ==========================================
// DONNÉES DE L'AUTOMATE
// ==========================================
let automataNodes = []; // ex: { id: "q0", x: 100, y: 100, isInitial: true, isFinal: false }
let automataEdges = []; // ex: { from: "q0", to: "q1", label: "a,b" }
let automataNodeCounter = 0;

// ==========================================
// FONCTIONS DE GESTION DES DONNÉES
// ==========================================
function addAutomataNode(x, y) {
    const id = "q" + automataNodeCounter++;
    // Le premier nœud créé est initial par défaut
    const isInitial = automataNodes.length === 0; 
    automataNodes.push({ id, x, y, isInitial, isFinal: false });
    return id;
}

function addAutomataEdge(from, to, label = "a") {
    // Évite les doublons stricts
    const existing = automataEdges.find(e => e.from === from && e.to === to);
    if (existing) {
        // Ajoute la nouvelle lettre si l'arête existe déjà
        if (!existing.label.split(',').includes(label)) {
            existing.label += "," + label;
        }
    } else {
        automataEdges.push({ from, to, label });
    }
}

function setInitialState(id) {
    // Un seul état initial autorisé pour un DFA
    automataNodes.forEach(n => n.isInitial = false);
    const node = automataNodes.find(n => n.id === id);
    if (node) node.isInitial = true;
}

function toggleFinalState(id) {
    const node = automataNodes.find(n => n.id === id);
    if (node) node.isFinal = !node.isFinal;
}

function clearAutomataData() {
    automataNodes = [];
    automataEdges = [];
    automataNodeCounter = 0;
}

// ==========================================
// MOTEUR D'ÉVALUATION (Testeur de mots DFA)
// ==========================================
function evaluateWordDFA(word) {
    // 1. Trouver l'état de départ
    let currentState = automataNodes.find(n => n.isInitial);
    
    if (!currentState) {
        return { accepted: false, error: "Aucun état initial défini !", trace: [] };
    }

    let trace = [currentState.id]; // Garde l'historique des états visités

    // 2. Parcourir chaque lettre du mot
    for (let char of word) {
        // Chercher une transition valide depuis l'état courant
        let validTransition = automataEdges.find(e => {
            if (e.from !== currentState.id) return false;
            // On sépare le label "a,b" en tableau ["a", "b"]
            let letters = e.label.split(',').map(s => s.trim());
            return letters.includes(char);
        });

        // S'il n'y a pas de chemin pour cette lettre (Puits)
        if (!validTransition) {
            return { 
                accepted: false, 
                error: `Bloqué à l'état ${currentState.id} : pas de transition pour la lettre '${char}'.`,
                trace 
            };
        }

        // 3. Avancer à l'état suivant
        currentState = automataNodes.find(n => n.id === validTransition.to);
        trace.push(currentState.id);
    }

    // 4. Vérifier à la fin du mot si l'état actuel est acceptant
    if (currentState.isFinal) {
        return { accepted: true, message: "Mot accepté !", trace };
    } else {
        return { accepted: false, error: `Le mot se termine sur l'état ${currentState.id} qui n'est pas final.`, trace };
    }
}

// =========================================
// AUTOMATA-ENGINE.JS (Données et Logique)
// =========================================

// Variables d'état isolées pour les automates
let autoNodes = [];
let autoEdges = [];
let autoNodeIdCounter = 0;

// Historique pour Undo / Redo
let autoUndoStack = [];
let autoRedoStack = [];

// Sauvegarde l'état pour annuler (Undo)
function saveAutoState() {
    autoUndoStack.push(JSON.stringify({ autoNodes, autoEdges, autoNodeIdCounter }));
    autoRedoStack = []; // Réinitialise le redo si nouvelle action
}

function undoAuto() {
    if (autoUndoStack.length > 0) {
        autoRedoStack.push(JSON.stringify({ autoNodes, autoEdges, autoNodeIdCounter }));
        const state = JSON.parse(autoUndoStack.pop());
        autoNodes = state.autoNodes;
        autoEdges = state.autoEdges;
        autoNodeIdCounter = state.autoNodeIdCounter;
        renderAutomata();
    }
}

function redoAuto() {
    if (autoRedoStack.length > 0) {
        autoUndoStack.push(JSON.stringify({ autoNodes, autoEdges, autoNodeIdCounter }));
        const state = JSON.parse(autoRedoStack.pop());
        autoNodes = state.autoNodes;
        autoEdges = state.autoEdges;
        autoNodeIdCounter = state.autoNodeIdCounter;
        renderAutomata();
    }
}

// Nettoyage complet
function clearAutomataData() {
    saveAutoState();
    autoNodes = [];
    autoEdges = [];
    autoNodeIdCounter = 0;
}

// ==========================================
// TESTEUR DE MOT (DFA)
// ==========================================
function evaluateWordDFA(word) {
    let currentState = autoNodes.find(n => n.isInitial);
    
    if (!currentState) {
        return { accepted: false, error: "Aucun état initial défini !", trace: [] };
    }

    let trace = [currentState.id];

    for (let char of word) {
        let validTransition = autoEdges.find(e => {
            if (e.from !== currentState.id) return false;
            let letters = e.label.split(',').map(s => s.trim());
            return letters.includes(char);
        });

        if (!validTransition) {
            return { accepted: false, error: `Bloqué à l'état ${currentState.id} : pas de transition pour '${char}'.`, trace };
        }

        currentState = autoNodes.find(n => n.id === validTransition.to);
        trace.push(currentState.id);
    }

    if (currentState.isFinal) {
        return { accepted: true, message: "Mot accepté !", trace };
    } else {
        return { accepted: false, error: `Le mot se termine sur ${currentState.id} qui n'est pas acceptant.`, trace };
    }
}