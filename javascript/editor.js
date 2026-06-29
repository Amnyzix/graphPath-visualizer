let editor;

window.onload = function() {
    const textArea = document.getElementById('script-input');
    editor = CodeMirror.fromTextArea(textArea, {
    mode: "python",
    lineNumbers: true,
    theme: "default",
    extraKeys: {
        Tab: function(cm) {
            let spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
            cm.replaceSelection(spaces);
        }
    }
});
    editor.setSize("100%", "400px");
    
    render();
    editor.setValue("def main():\n   \nmain()");
};



function getGraphData() {
    return { nodes, edges, nodeIdCounter };
}



// Variable globale pour stocker l'instance Python
let pyodideReady = null;

// Initialisation au chargement de la page
async function initPythonEngine() {
    console.log("Chargement de Python...");
    pyodideReady = await loadPyodide();
    console.log("Python est prêt !");
}

initPythonEngine();

// La fonction pour extraire le dictionnaire d'adjacence pour Python
function getGraphEdgesAsObject() {
    const adjacencyList = {};
    
    nodes.forEach(node => {
        adjacencyList[String(node.id)] = {};
    });

    edges.forEach(edge => {
        const source = String(edge.from || edge.source);
        const target = String(edge.to || edge.target);
        const edgeWeight = Number(edge.weight) || 1;
        const directed = Boolean(edge.directed) || false;

        if (adjacencyList[source]){
            adjacencyList[source][target] = edgeWeight;
            
            if (!directed && adjacencyList[target]){
                adjacencyList[target][source] = edgeWeight;
            }
        }
        
    });

    return adjacencyList;
}


async function runScript() {
    const code = editor.getValue(); // On récupère le code Python de l'éditeur
    const compileBtn = document.querySelector('.btn-compile');

    if (compileBtn) compileBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running...';

    try {
        if (!pyodideReady) {
            throw new Error("Le moteur Python est encore en cours de chargement...");
        }

        // 1. On récupère le graphe formaté pour l'API Python
        const graphEdges = getGraphEdgesAsObject();

        // 2. On prépare l'API cachée
        const apiCode = `
import json
import sys

# On injecte le graphe JS directement dans Python
GRAPH_EDGES = ${JSON.stringify(graphEdges)}

class GraphAPI:
    def __init__(self, edges):
        self.edges = edges
        self.history = []

    def _capture_memory(self):
        try:
            frame = sys._getframe(2)
            mem = {}
            for key, val in frame.f_locals.items():
                if isinstance(val, (int, float, str, list, dict, bool)):
                    mem[key] = str(val)
            return mem
        except Exception:
            return {}

    def visit(self, node, message=None):
        step = {"id": str(node), "action": "visit", "variables": self._capture_memory()}
        if message: step["message"] = str(message)
        self.history.append(step)

    def select(self, node):
        step = {"id": str(node), "action": "select", "variables": self._capture_memory()}
        self.history.append(step)

    def neighbors(self, node):
        return self.edges.get(str(node), [])

    def weight(self, node_a, node_b):
        neighbors_dict = self.edges.get(str(node_a), {})
        return neighbors_dict.get(str(node_b), float('inf'))

_api = GraphAPI(GRAPH_EDGES)
def visit(node, msg=None): _api.visit(node, msg)
def select(node): _api.select(node)
def neighbors(node): return _api.neighbors(node)
def weight(a, b): return _api.weight(a, b)
`;

        // 3. On assemble l'API + le code utilisateur + le retour de l'historique
        const fullCode = `
${apiCode}

# --- Code Utilisateur ---
${code}

# --- Retour ---
json.dumps(_api.history)
`;

        // 4. Exécution dans Pyodide
        const jsonTrace = await pyodideReady.runPythonAsync(fullCode);
        
        // 5. On parse le résultat et on l'envoie à ton lecteur
        const animationData = JSON.parse(jsonTrace);
        loadPlayer(animationData); 

    } catch (err) {
        console.error(err);
        alert("❌ Erreur d'exécution Python :\n" + err.message);
    } finally {
        if (compileBtn) compileBtn.innerHTML = '<i class="fa-solid fa-play"></i> Run script';
    }
}


// --- LECTEUR D'ANIMATION ---
let animationHistory = [];
let currentStepIndex = -1;
let playInterval = null;

function loadPlayer(history) {
    pauseAnimation();
    animationHistory = history;
    currentStepIndex = -1;
    document.getElementById('player-controls').style.display = 'flex';
    resetGraph(); 
    updatePlayerUI();
}

function renderStateAtCurrentStep() {
    resetGraph();
    if (currentStepIndex === -1) {
        logDisplay.style.opacity = 0;
        return;
    }

    for (let i = 0; i <= currentStepIndex; i++) {
        const item = animationHistory[i];
        const nodeId = typeof item === 'object' ? item.id : item;
        const message = typeof item === 'object' ? item.message : null;
        const action = typeof item === 'object' ? item.action : null;
        
        const circle = document.querySelector(`circle[data-id="${nodeId}"]`);
        if (!circle) continue;

        showOrderBadge(nodeId, i + 1);

        if (i === currentStepIndex) {
            if (action === 'select') circle.classList.add('selected');
            else circle.classList.add('current');
            
            if (message) {
                logDisplay.textContent = message;
                logDisplay.style.opacity = 1;
            } else {
                logDisplay.style.opacity = 0;
            }
        } else {
            if (action === 'select') circle.classList.add('selected');
            else circle.classList.add('visited');
        }
    }

    // ==========================================
    // NOUVEAU : Inspection des variables en direct
    // ==========================================
    const currentStep = animationHistory[currentStepIndex];
    const memoryPanel = document.getElementById('memory-panel');
    
    if (memoryPanel && currentStep && currentStep.variables) {
        let htmlContent = "<h3><i class='fa-solid fa-memory'></i> Variables State</h3><ul>";
        
        for (const [varName, varValue] of Object.entries(currentStep.variables)) {
            htmlContent += `<li><strong>${varName}</strong>: <code>${varValue}</code></li>`;
        }
        
        htmlContent += "</ul>";
        memoryPanel.innerHTML = htmlContent;
    }
}

function playAnimation() {
    if (currentStepIndex >= animationHistory.length - 1) {
        currentStepIndex = -1;
    }
    
    const playBtn = document.getElementById('btn-play');
    if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    
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
    if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i> Play';
}

document.getElementById('btn-play').addEventListener('click', () => {
    if (playInterval) pauseAnimation();
    else playAnimation();
});

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

function updatePlayerUI() {
    const counter = document.getElementById('step-counter');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    counter.textContent = `Step ${currentStepIndex + 1} / ${animationHistory.length}`;
    btnPrev.disabled = (currentStepIndex === -1);
    btnNext.disabled = (currentStepIndex >= animationHistory.length - 1);
    btnPrev.style.opacity = btnPrev.disabled ? 0.5 : 1;
    btnNext.style.opacity = btnNext.disabled ? 0.5 : 1;
}