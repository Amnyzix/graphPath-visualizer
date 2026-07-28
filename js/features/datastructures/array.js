// javascript/ui/array-app.js

// Déclaration correcte de TOUTES les variables globales
let arrayEditor = null;
let arrayVisualization = null;
let arrayPlayer = null; 

window.addEventListener('DOMContentLoaded', () => {
    console.log("1. DOM chargé. Initialisation du module Array...");
    
    arrayPlayer = new AnimationPlayer('array');
    arrayEditor = new ArrayEditor();
    arrayVisualization = new ArrayVisualization(arrayEditor);
    
    // Définir cette visualisation comme active pour que AnimationPlayer interagisse avec
    window.activeVisualization = arrayVisualization;

    // Générer un premier tableau au chargement
    generateRandomArray();
    console.log("2. Module Array prêt !");
});

function generateRandomArray() {
    const size = parseInt(document.getElementById('slider-array-size').value, 10);
    const newArray = [];
    for (let i = 0; i < size; i++) {
        newArray.push(Math.floor(Math.random() * 90) + 10);
    }
    
    // On sauvegarde la donnée dans le Document
    arrayEditor.document.setArray(newArray);
    
    // On met à jour l'interface visuelle en lisant depuis le Document
    arrayVisualization.init(arrayEditor.document.getArray());
    
    // On stoppe le lecteur s'il était en cours
    if (arrayPlayer) {
        arrayPlayer.hide();
    }
}

function updateArraySize(val) {
    document.getElementById('array-size-val').innerText = val;
    generateRandomArray();
}

// --- DÉCLENCHEMENT DES TRIS ---

function startBubbleSort() {
    console.log("3. Lancement du Bubble Sort...");
    
    const currentData = arrayEditor.document.getArray();
    arrayVisualization.init(currentData); 
    
    const history = ArrayAlgorithms.bubbleSort(currentData);
    console.log(`4. Historique généré : ${history.length} étapes.`);
    
    arrayPlayer.load(history);
    arrayPlayer.play();
    console.log("5. Lecture démarrée !");
}

function startInsertionSort() {
    const currentData = arrayEditor.document.getArray();
    arrayVisualization.init(currentData);
    
    const history = ArrayAlgorithms.insertionSort(currentData);
    
    arrayPlayer.load(history);
    arrayPlayer.play();
}