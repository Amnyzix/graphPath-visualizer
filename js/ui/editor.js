let codeEditor;
let pythonEngine;
let term;

window.onload = function() {
    // 1. Initialize CodeMirror
    const textArea = document.getElementById('script-input');
    codeEditor = CodeMirror.fromTextArea(textArea, {
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
    codeEditor.setSize("100%", "400px");
    codeEditor.setValue("def main():\n    pass\n\nmain()");

    // 2. Initialize XTerm.js
    term = new Terminal({
        cursorBlink: true,
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: 14,
        theme: { background: '#1e1e1e', foreground: '#cccccc' },
        convertEol: true
    });
    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(document.getElementById('terminal-container'));
    fitAddon.fit();

    window.addEventListener('resize', () => fitAddon.fit());

    // 3. Initialize the Python Engine with Terminal callbacks
    pythonEngine = new PythonEngine(
        (text) => term.write(text),          // stdout
        (text) => term.write(text)           // stderr (colorized in PythonEngine)
    );
    pythonEngine.init();
};

function getActiveGraphEditor() {
    if (window.AppRegistry) return window.AppRegistry.get('graphs');
    if (window.graphsApp) return window.graphsApp;
    return null;
}

// =========================================
// RUN EXECUTION
// =========================================

async function runScript(customCode = null) {
    const code = customCode !== null ? customCode : codeEditor.getValue();
    const compileBtn = document.querySelector('.btn-compile');
    const graphEditor = getActiveGraphEditor();

    if (!graphEditor) {
        console.error("Graph editor not found.");
        return;
    }

    if (compileBtn) compileBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running...';
    term.clear();

    try {
        // Retrieve current graph state
        const { nodes, edges } = graphEditor.getGraphData();

        // Run the Python code via the Engine
        const animationData = await pythonEngine.run(code, nodes, edges);

        // --- SECTION MODIFIÉE ---
        
        // 1. On pointe sur la visualisation créée par l'AppRegistry
        window.activeVisualization = window.pythonTraceVis;
        window.activeVisualization.clear(); // Nettoie le graphe avant la nouvelle animation
        
        // 2. On utilise graphPlayer au lieu de player
        if (window.graphPlayer) {
            window.graphPlayer.load(animationData);
            window.graphPlayer.play(); // On lance la lecture automatiquement
        } else {
            console.warn("Graph Animation player is not initialized.");
        }
        
        // ------------------------

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