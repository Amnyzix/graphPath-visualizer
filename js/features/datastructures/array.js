import { ArrayEditor } from "../../core/Documents/ArrayDocument.js";
import { ArrayVisualization } from "../../visualizations/ArrayVisualization.js";
import { AnimationPlayer } from "../../animation/AnimationPlayer.js";
import { ArrayAlgorithms } from "../../algorithm/ArrayAlgorithms.js";

let arrayEditor = null;
let arrayVisualization = null;
let arrayPlayer = null;

window.addEventListener("DOMContentLoaded", () => {
  console.log("1. DOM chargé. Initialisation du module Array...");

  arrayEditor = new ArrayEditor();

  arrayVisualization = new ArrayVisualization(arrayEditor);

  arrayPlayer = new AnimationPlayer(arrayVisualization, "array");

  // Générer un premier tableau au chargement
  generateRandomArray();
  console.log("2. Module Array prêt !");
});

export function generateRandomArray() {
  const size = parseInt(document.getElementById("slider-array-size").value, 10);
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

export function updateArraySize(val) {
  document.getElementById("array-size-val").innerText = val;
  generateRandomArray();
}

// --- DÉCLENCHEMENT DES TRIS ---

export function startBubbleSort() {
  console.log("3. Lancement du Bubble Sort...");

  const currentData = arrayEditor.document.getArray();
  arrayVisualization.init(currentData);

  const animation = ArrayAlgorithms.bubbleSort(currentData);
  console.log(`4. Historique généré : ${animation.length} étapes.`);

  arrayPlayer.load(animation);
  arrayPlayer.play();
  console.log("5. Lecture démarrée !");
}

export function startInsertionSort() {
  const currentData = arrayEditor.document.getArray();
  arrayVisualization.init(currentData);

  const animation = ArrayAlgorithms.insertionSort(currentData);

  arrayPlayer.load(animation);
  arrayPlayer.play();
}
