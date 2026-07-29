// ==========================================
// GESTION GLOBALE DE L'UI (Onglets & Thème)
// ==========================================

function switchGlobalMode(mode) {
    document.querySelectorAll('.mode-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active-view'));
    
    const targetBtn = document.querySelector(`.mode-tab-btn[data-target="${mode}"]`);
    if (targetBtn) targetBtn.classList.add('active');
    
    const targetView = document.getElementById(`view-${mode}`);
    if (targetView) targetView.classList.add('active-view');
    
    const editor = window.AppRegistry.get(mode);

    
    if (editor) {
        window.activeEditor = editor;
        window.activeEditorType = mode;
        console.log(`Éditeur actif : ${mode}`, window.activeEditor);
    } else {
        console.warn(`L'éditeur ${mode} n'est pas enregistré.`);
    }

    console.log(`editor: ${window.activeEditor}`);
}

document.addEventListener('DOMContentLoaded', () => {
    window.AppRegistry.init();

    // Au démarrage de l'application
    window.player = new AnimationPlayer();

    Object.values(window.AppRegistry.editors).forEach(editor => {
        if (editor.render) editor.render();
    });

    if (window.syncLegacyStateToGraphApp) {
        syncLegacyStateToGraphApp();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const themeToggleBtn = document.getElementById("theme-toggle");
    
    const currentTheme = localStorage.getItem("theme") || "light";
    
    if (currentTheme === "dark") {
        document.body.classList.add("dark");
        document.body.classList.remove("light");
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i> Light Mode';
    } else {
        document.body.classList.add("light");
        document.body.classList.remove("dark");
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i> Dark Mode';
    }

    themeToggleBtn.addEventListener("click", () => {
        const isDark = document.body.classList.toggle("dark");
        document.body.classList.toggle("light", !isDark);
        
        themeToggleBtn.innerHTML = isDark 
            ? '<i class="fa-solid fa-sun"></i> Light Mode' 
            : '<i class="fa-solid fa-moon"></i> Dark Mode';

        localStorage.setItem("theme", isDark ? "dark" : "light");
    });

    const payload = ShareManager.loadFromUrl();
    
    if (payload) {
        const editor = window.AppRegistry.get(payload.type);
        if (editor) {
            switchGlobalMode(payload.type);

            editor.nodes = payload.data.nodes || [];
            editor.edges = payload.data.edges || [];
            
            if (editor.nodes.length > 0) {
                const maxId = Math.max(...editor.nodes.map(n => parseInt(n.id, 10) || 0));
                editor.nodeCounter = maxId + 1;
            }

            window.__legacyEdges = editor.edges;
            

            setTimeout(() => {
                editor.render();
            }, 10);
        }
    }else {
        const defaultMode = 'graphs';
        const defaultEditor = window.AppRegistry.get(defaultMode);
        
        if (defaultEditor) {
            window.activeEditor = defaultEditor;
            window.activeEditorType = defaultMode;
        }
    }
});


function handleShareButtonClick(event) {
    if (!window.activeEditor) {
        console.error("No active editor found.");
        return;
    }
    console.log(window.activeEditor);

    const data = window.activeEditor.getExportData();
    const shareLink = ShareManager.generateShareLink(data, window.activeEditorType);

    navigator.clipboard.writeText(shareLink).then(() => {
        const btn = event.target; 
    
        const actualBtn = btn.closest('button'); 

        const originalContent = actualBtn.innerHTML;
        actualBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied !';

        setTimeout(() => {
            actualBtn.innerHTML = originalContent;
            actualBtn.disabled = false;
        }, 2000);
    }).catch(err => {
        console.error("Copy error : ", err);
    });
}

function exportCurrentAnimation(format) {
    // 1. On identifie le lecteur actif
    let activePlayer = null;

    if (window.currentAlgoName && window.currentAlgoName.includes('bst')) {
        activePlayer = window.bstPlayer;
    } else if (window.graphPlayer) {
        activePlayer = window.graphPlayer;
    } else if (window.heapPlayer) {
        activePlayer = window.heapPlayer;
    }

    // 2. On lance l'export correspondant
    if (activePlayer) {
        if (format === 'gif') {
            ExportManager.exportGIF(activePlayer);
        } else if (format === 'mp4') {
            ExportManager.exportVideo(activePlayer);
        }
    } else {
        alert("No active animation player found to export.");
    }
}