// =========================================
//   ALGORITHM.JS (File Fetcher)
// =========================================

// Variable pour savoir quel algorithme est sélectionné
let currentAlgoName = null;
// On attend que la page soit totalement chargée
// On s'assure que la variable existe globalement
if (typeof currentAlgoName === 'undefined') {
    window.currentAlgoName = null;
}

// 1. Définition GLOBALE des fonctions (le "window." les rend visibles partout)
window.openTheoryModal = function() {    
    if (!window.currentAlgoName) {
        alert("Please select and load an algorithm first!");
        return;
    }

    const modal = document.getElementById('theory-modal');
    const iframe = document.getElementById('theory-iframe');
    
    if (!modal || !iframe) {
        console.error("ERROR: Modal HTML elements not found!");
        return;
    }
    console.log(`theory/${window.currentAlgoName}.html`)
    iframe.src = `/theory/${window.currentAlgoName}.html`;
    modal.style.display = 'flex';
};

window.closeTheoryModal = function() {
    const modal = document.getElementById('theory-modal');
    const iframe = document.getElementById('theory-iframe');
    if (modal) modal.style.display = 'none';
    if (iframe) iframe.src = ""; 
};

// 2. L'écouteur d'événement au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    const theoryBtn = document.getElementById('btn-read-theory');
    
    if (theoryBtn) {
        theoryBtn.addEventListener('click', (event) => {
            event.preventDefault(); 
            window.openTheoryModal(); // Appel sécurisé
        });
    }

    // Fermeture de la modale si on clique à côté
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('theory-modal');
        if (e.target === modal) {
            window.closeTheoryModal();
        }
    });
});
// Optionnel : Fermer la modale si on clique en dehors du cadre blanc
window.addEventListener('click', (e) => {
    const modal = document.getElementById('theory-modal');
    if (e.target === modal) {
        closeTheoryModal();
    }
});



// Ouvre directement la théorie pour un algorithme spécifique
window.openTheory = function(algoName) {
    // On met à jour la variable globale pour que la modale sache quoi ouvrir
    window.currentAlgoName = algoName;
    
    // On utilise la fonction blindée qu'on a créée précédemment
    window.openTheoryModal(); 
};

window.runDirectly = async function(algoName) {
    try {
        // Fetch the .py file from the server
        const response = await fetch(`python_scripts/${algoName}.py`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Extract the code text
        const code = await response.text();
        
        // Ensure theory tracking is updated
        window.currentAlgoName = algoName; 
        const theoryBtn = document.getElementById('btn-read-theory');
        if (theoryBtn) theoryBtn.style.display = 'inline-block';
        
        // Close dropdown neatly
        if (typeof closeAllDropdowns === 'function') {
            closeAllDropdowns();
        }

        console.log(`Executing "${algoName}" directly on canvas...`);
        
        // Execute the script using our fetched code, leaving the editor completely untouched
        await runScript(code);
        
    } catch (error) {
        console.error("Error executing the algorithm directly:", error);
        alert("Unable to fetch and execute the algorithm file.");
    }
};


async function loadAlgorithm(algoName) {
    try {
        // On va chercher le fichier .py sur le serveur
        const response = await fetch(`python_scripts/${algoName}.py`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // On extrait le texte du fichier
        const code = await response.text();
        
        // On l'injecte dans l'éditeur CodeMirror
        if (typeof codeEditor !== 'undefined') {
            codeEditor.setValue(code);
        }
        else{
            console.log(codeEditor)
        }

        window.currentAlgoName = algoName; 
        console.log(`Algorithm "${algoName}" loaded successfully.`);
        const theoryBtn = document.getElementById('btn-read-theory');
        if (theoryBtn) theoryBtn.style.display = 'inline-block';
        
        // On ferme le menu proprement
        if (typeof closeAllDropdowns === 'function') {
            closeAllDropdowns();
        }
    } catch (error) {
        console.error("Erreur lors du chargement de l'algorithme :", error);
        alert("Impossible de charger le fichier de l'algorithme.");
    }
}