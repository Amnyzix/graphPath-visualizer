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
    
    editor.setValue("def main():\n   \nmain()");
};



const logDisplay = document.getElementById('log-display');

function getActiveGraphEditor() {
    if (window.AppRegistry) return window.AppRegistry.get('graphs');
    if (window.graphsApp) return window.graphsApp;
    return null;
}

function getGraphData() {
    const app = getActiveGraphEditor();
    if (app) {
        return app.getGraphData(); // Cette fonction renvoie déjà { nodes: this.document.nodes, ... } dans ton GraphEditor
    }
    return { nodes: [], edges: [], nodeIdCounter: 1 };
}

// Initialisation du terminal
const term = new Terminal({
    cursorBlink: true,
    fontFamily: 'Consolas, "Courier New", monospace',
    fontSize: 14,
    theme: {
        background: '#1e1e1e',
        foreground: '#cccccc'
    },
    convertEol: true
});

const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);

// Attacher le terminal au conteneur HTML
term.open(document.getElementById('terminal-container'));

fitAddon.fit();

// 4. (Optionnel mais recommandé) Réajuster si l'utilisateur redimensionne la fenêtre
window.addEventListener('resize', () => {
    fitAddon.fit();
});



// Variable globale pour stocker l'instance Python
let pyodideReady = null;

let activeVisualization = null;

// ==========================================
// 2. MODIFICATION DE INIT PYTHON ENGINE
// ==========================================
async function initPythonEngine() {
    console.log("Chargement de Python...");
    pyodideReady = await loadPyodide({
        stdout: (text) => { 
            term.write(text + '\r\n'); 
        },
        stderr: (text) => { 
            term.write('\x1b[31m' + text + '\x1b[0m\r\n'); 
        }
    });
    console.log("Python est prêt !");
}

initPythonEngine();

// La fonction pour extraire le dictionnaire d'adjacence pour Python
function getGraphEdgesAsObject() {
    const adjacencyList = {};
    const app = getActiveGraphEditor();
    
    // On cible spécifiquement app.document.nodes et app.document.edges
    const currentNodes = app ? app.document.nodes : [];
    const currentEdges = app ? app.document.edges : [];
    
    currentNodes.forEach(node => {
        adjacencyList[String(node.id)] = {};
    });

    currentEdges.forEach(edge => {
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


async function runScript(customCode = null) {
    const code = customCode !== null ? customCode : editor.getValue();
    const compileBtn = document.querySelector('.btn-compile');

    if (compileBtn) compileBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running...';

    try {
        if (!pyodideReady) {
            throw new Error("Le moteur Python est encore en cours de chargement...");
        }

        term.clear();

        // 1. On récupère le graphe formaté pour l'API Python
        const graphEdges = getGraphEdgesAsObject();

        const graphData = getGraphData();
        const graphNodesIds = graphData.nodes.map(node => String(node.id));

        // 2. On prépare l'API cachée
        const apiCode = `
import json
import sys

# On injecte le graphe JS directement dans Python
GRAPH_EDGES = ${JSON.stringify(graphEdges)}
GRAPH_NODES = ${JSON.stringify(graphNodesIds)}

class GraphAPI:
    def __init__(self, edges, nodes):
        self.edges = edges
        self.nodes = nodes
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
    
    def get_all_nodes(self):
        return self.nodes
    
    def color_node(self, node, color,message=None):
        step = {
            "id": str(node), 
            "action": "color_node", 
            "color": color, 
            "variables": self._capture_memory()
        }
        if message: 
            step["message"] = str(message)
        self.history.append(step)

    def color_edge(self, u, v, color,message=None):
        step = {
            "id": str(u), 
            "target": str(v), 
            "action": "color_edge", 
            "color": color, 
            "variables": self._capture_memory()
        }
        if message: 
            step["message"] = str(message)
        self.history.append(step)

    def draw_path(self, path, color):
        self.history.append({"path": [str(p) for p in path], "action": "draw_path", "color": color, "variables": self._capture_memory()})

    def select(self, node):
        step = {"id": str(node), "action": "select", "variables": self._capture_memory()}
        self.history.append(step)

    def neighbors(self, node):
        return self.edges.get(str(node), [])

    def weight(self, node_a, node_b):
        neighbors_dict = self.edges.get(str(node_a), {})
        return neighbors_dict.get(str(node_b), float('inf'))

_api = GraphAPI(GRAPH_EDGES, GRAPH_NODES)
def visit(node, msg=None): _api.visit(node, msg)
def color_node(node, color, msg=None): _api.color_node(node, color, msg)
def color_edge(u, v, color, msg=None): _api.color_edge(u, v, color, msg)
def draw_path(path, color="#e74c3c"): _api.draw_path(path, color)
def select(node): _api.select(node)
def neighbors(node): return _api.neighbors(node)
def weight(a, b): return _api.weight(a, b)
def get_all_nodes(): return _api.get_all_nodes()
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

        const editor = window.AppRegistry.get('graphs'); 
        window.activeVisualization = VisualizationFactory.create('python_trace', editor);
        window.activeVisualization.init();

        //loadPlayer(animationData); 
        window.player.load(animationData);

    } catch (err) {
        console.error(err);
        const errorLines = err.toString().split('\n');
        errorLines.forEach(line => {
            term.write('\x1b[31m' + line + '\x1b[0m\r\n');
        });
    } finally {
        if (compileBtn) compileBtn.innerHTML = '<i class="fa-solid fa-play"></i> Run script';
    }
}

