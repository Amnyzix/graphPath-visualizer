class PythonEngine {
    constructor(onStdout, onStderr) {
        this.pyodide = null;
        this.isReady = false;
        
        // Callbacks to communicate with the Terminal
        this.onStdout = onStdout || console.log;
        this.onStderr = onStderr || console.error;
    }

    async init() {
        this.onStdout("Loading Python engine...\r\n");
        try {
            this.pyodide = await loadPyodide({
                stdout: (text) => this.onStdout(text + '\r\n'),
                stderr: (text) => this.onStderr('\x1b[31m' + text + '\x1b[0m\r\n')
            });
            this.isReady = true;
            this.onStdout("Python is ready!\r\n");
        } catch (error) {
            this.onStderr('\x1b[31mFailed to load Python engine.\x1b[0m\r\n');
            console.error(error);
        }
    }

    /**
     * Convert graph edges array to a Python-friendly adjacency dictionary
     */
    static formatEdgesForPython(edges, nodes) {
        const adjacencyList = {};
        
        nodes.forEach(node => {
            adjacencyList[String(node.id)] = {};
        });

        edges.forEach(edge => {
            const source = String(edge.from || edge.source);
            const target = String(edge.to || edge.target);
            const edgeWeight = Number(edge.weight) || 1;
            const directed = Boolean(edge.directed) || false;

            if (adjacencyList[source]) {
                adjacencyList[source][target] = edgeWeight;
                
                if (!directed && adjacencyList[target]) {
                    adjacencyList[target][source] = edgeWeight;
                }
            }
        });

        return adjacencyList;
    }

    /**
     * Executes the user code alongside the Graph API
     */
    async run(userCode, nodes, edges) {
        if (!this.isReady) {
            throw new Error("The Python engine is still loading...");
        }

        const graphEdgesFormatted = PythonEngine.formatEdgesForPython(edges, nodes);
        const graphNodesIds = nodes.map(node => String(node.id));

        // Inject the JS variables into Python globals before appending the API
        const injectionCode = `
import json
GRAPH_EDGES = ${JSON.stringify(graphEdgesFormatted)}
GRAPH_NODES = ${JSON.stringify(graphNodesIds)}
`;

        const fullCode = `
${injectionCode}
${PYTHON_GRAPH_API}

# --- User Code ---
${userCode}

# --- Return Statement ---
json.dumps(_api.history)
`;

        const jsonTrace = await this.pyodide.runPythonAsync(fullCode);
        return JSON.parse(jsonTrace);
    }
}