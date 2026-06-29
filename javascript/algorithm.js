// =========================================
//   ALGORITHM.JS (File Fetcher)
// =========================================

async function loadAlgorithm(algoName) {
    try {
        // On va chercher le fichier .py sur le serveur
        const response = await fetch(`algorithm/${algoName}.py`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // On extrait le texte du fichier
        const code = await response.text();
        
        // On l'injecte dans l'éditeur CodeMirror
        if (typeof editor !== 'undefined') {
            editor.setValue(code);
        }
        
        // On ferme le menu proprement
        if (typeof closeAllDropdowns === 'function') {
            closeAllDropdowns();
        }
    } catch (error) {
        console.error("Erreur lors du chargement de l'algorithme :", error);
        alert("Impossible de charger le fichier de l'algorithme.");
    }
}