let codeEditor;
let pythonEngine;
let term;

window.onload = function() {
    // Détecte si le body a la classe de ton mode sombre (adapte 'dark-mode' selon ton CSS)
    const isDarkMode = document.body.classList.contains('dark-mode');

    const lightTheme = {
        background: '#f8f9fa',       // Un gris ultra-léger (plus doux que le blanc pur)
        foreground: '#383a42',       // Un gris anthracite bleuté pour le texte
        cursor: '#526fff',           // Un curseur bleu moderne (plus élégant que noir)
        cursorAccent: '#ffffff',
        selectionBackground: '#dce2f2', // Couleur de sélection douce
        
        // Couleurs ANSI (Essentielles si ton moteur Python renvoie du texte coloré)
        black: '#383a42',
        red: '#e45649',              // Rouge plus doux pour les erreurs
        green: '#50a14f',
        yellow: '#986801',
        blue: '#4078f2',
        magenta: '#a626a4',
        cyan: '#0184bc',
        white: '#fafafa',
        
        // Versions "Bright"
        brightBlack: '#a0a1a7',
        brightRed: '#e06c75',
        brightGreen: '#98c379',
        brightYellow: '#d19a66',
        brightBlue: '#61afef',
        brightMagenta: '#c678dd',
        brightCyan: '#56b6c2',
        brightWhite: '#ffffff'
    };

    const darkTheme = {
        background: '#1e1e1e',       // Un gris très foncé pour le fond
        foreground: '#d4d4d4',       // Gris clair pour le texte
        cursor: '#ffffff',           // Curseur blanc pour un contraste maximal
        cursorAccent: '#000000',
        selectionBackground: '#264f78', // Couleur de sélection bleue foncée
        
        // Couleurs ANSI
        black: '#000000',
        red: '#f44747',              // Rouge vif pour les erreurs
        green: '#619955',
        yellow: '#ffcc00',
        blue: '#0a84ff',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#d4d4d4',
        
        // Versions "Bright"
        brightBlack: '#666666',
        brightRed: '#ff6c6b',
        brightGreen: '#98c379',
        brightYellow: '#e5c07b',
        brightBlue: '#61afef',
        brightMagenta: '#c678dd',
        brightCyan: '#56b6c2',
        brightWhite: '#ffffff'
    };

    const termContainer = document.getElementById('terminal-container');
    if (termContainer) {
        termContainer.style.backgroundColor = isDarkMode ? darkTheme.background : lightTheme.background;
        // Optionnel : on adapte aussi la bordure pour un rendu propre
        termContainer.style.borderColor = isDarkMode ? '#181a1f' : '#e1e4e8'; 
    }

    // 1. Initialize CodeMirror
    const textArea = document.getElementById('script-input');
    codeEditor = CodeMirror.fromTextArea(textArea, {
        mode: "python",
        lineNumbers: true,
        // On utilise le bon thème d'entrée de jeu
        theme: isDarkMode ? "dracula" : "default", 
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
        // On utilise le bon thème d'entrée de jeu
        theme: isDarkMode ? darkTheme : lightTheme,
        convertEol: true
    });
    
    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(document.getElementById('terminal-container'));
    fitAddon.fit();

    window.addEventListener('resize', () => fitAddon.fit());

    // 3. Initialize the Python Engine with Terminal callbacks
    pythonEngine = new PythonEngine(
        (text) => term.write(text),
        (text) => term.write(text)
    );
    pythonEngine.init();
};

function getActiveGraphEditor() {
    if (window.AppRegistry) return window.AppRegistry.get('graphs');
    if (window.graphsApp) return window.graphsApp;
    return null;
}

function updateEditorThemes(isDarkMode) {
    if (!codeEditor || !term) return;

    // 1. Thème CodeMirror
    codeEditor.setOption("theme", isDarkMode ? "dracula" : "default");

    // 2. Thème XTerm.js (On redéfinit ou on récupère les objets lightTheme/darkTheme)
    const darkTheme = { background: '#1e1e1e', foreground: '#d4d4d4', cursor: '#ffffff' /* ... reste des couleurs ... */ };
    const lightTheme = { background: '#f8f9fa', foreground: '#383a42', cursor: '#526fff' /* ... reste des couleurs ... */ };
    
    term.options.theme = isDarkMode ? darkTheme : lightTheme;

    // 3. Mise à jour du conteneur parent
    const termContainer = document.getElementById('terminal-container');
    if (termContainer) {
        termContainer.style.backgroundColor = isDarkMode ? darkTheme.background : lightTheme.background;
        termContainer.style.borderColor = isDarkMode ? '#181a1f' : '#e1e4e8';
    }
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
        const graphDocument = { nodes, edges };

        // 1. On instancie notre Traducteur (qui encapsule le moteur Python)
        const algorithm = new PythonGraphAlgorithm(pythonEngine, "Custom Python Script");

        // 2. On récupère notre objet Animation "pur"
        const animation = await algorithm.run(graphDocument, code);
        
        // 3. On nettoie le canvas
        window.activeVisualization = window.pythonTraceVis;
        window.activeVisualization.clear(); 
        
        // 4. On charge le BON objet !
        if (window.graphPlayer) {
            window.graphPlayer.load(animation); // <-- CORRECTION : 'animation' au lieu de 'animationData'
            window.graphPlayer.play(); 
        } else {
            console.warn("Graph Animation player is not initialized.");
        }

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