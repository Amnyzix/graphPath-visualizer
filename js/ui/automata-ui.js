import { GraphLayout } from "../core/GraphLayout.js";
import { RegexParser } from "../features/automata/RegexParser.js";
import { RegexCompiler } from "../features/automata/RegexCompiler.js";
import { EpsilonRemover } from "../features/automata/EpsilonRemover.js";
import { Determinizer } from "../features/automata/Determinizer.js";
import { RegexExtractor } from "../features/automata/RegexExtractor.js";
import { DFAMinimizer } from "../features/automata/DFAMinimizer.js";
import { NFASimulator } from "../features/automata/NFASimulator.js";
import { AutomataEquivalence } from "../features/automata/AutomataEquivalence.js";

const getAutomataApp = () => window.automataApp;

export function relayoutAutomaton() {
  const automataApp = getAutomataApp();
  if (!automataApp || automataApp.nodes.length === 0) return;

  automataApp.saveState();
  GraphLayout.applyLayout(automataApp.nodes, automataApp.edges);
  automataApp.render();
}

// 1. Fonction pour tester le mot avec l'animation
export async function testAutomataWord() {
  const automataApp = getAutomataApp();
  if (!automataApp || automataApp.nodes.length === 0) {
    alert("Veuillez d'abord dessiner un automate !");
    return;
  }

  const word = document.getElementById("automata-word-input").value.trim();
  const badge = document.getElementById("test-result-badge");

  // Affiche l'état "En cours de calcul"
  badge.style.display = "block";
  badge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Test en cours...';
  badge.style.color = "var(--text-muted)";
  badge.style.backgroundColor = "transparent";

  // Lance l'animation asynchrone depuis AutomataEditor.js
  const result = await automataApp.testWord(word);

  // Met à jour le badge selon le succès ou l'échec
  if (result.accepted) {
    badge.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${result.message}`;
    badge.style.color = "#065F46"; // Texte Vert
    badge.style.backgroundColor = "#D1FAE5"; // Fond Vert
  } else {
    badge.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${result.error}`;
    badge.style.color = "#991B1B"; // Texte Rouge
    badge.style.backgroundColor = "#FEE2E2"; // Fond Rouge
  }
}

// 2. Fonction pour nettoyer complètement le canvas de l'automate
export function clearAutomata() {
  const automataApp = getAutomataApp();
  if (automataApp) {
    automataApp.nodes = [];
    automataApp.edges = [];
    automataApp.nodeCounter = 0;
    automataApp.render();

    // Cache le badge de résultat
    document.getElementById("test-result-badge").style.display = "none";
    document.getElementById("automata-word-input").value = "";
  }
}

export function generateAutomatonFromRegex() {
  const regexInput = document.getElementById("regex-input").value.trim();
  if (!regexInput) {
    alert("Please enter a Regular Expression.");
    return;
  }

  try {
    // 1. Transformation Infix -> Postfix
    const postfix = RegexParser.toPostfix(regexInput);

    // 2. Compilation Postfix -> NFA
    const compiler = new RegexCompiler();
    const generatedAutomaton = compiler.compile(postfix);

    // 3. Injection dans l'éditeur visuel !
    const automataApp = getAutomataApp();
    if (automataApp) {
      automataApp.saveState(); // Sauvegarde l'état pour pouvoir annuler (Ctrl+Z)

      automataApp.nodes = generatedAutomaton.nodes;
      automataApp.edges = generatedAutomaton.edges;
      automataApp.nodeCounter = generatedAutomaton.nodes.length; // Met à jour le compteur d'ID

      // Recentrer la caméra pour voir le graphe généré
      automataApp.panX = 0;
      automataApp.panY = 0;
      automataApp.zoomLevel = 1;

      automataApp.render();

      // Petit bonus visuel : nettoyer les résultats de tests précédents
      document.getElementById("test-result-badge").style.display = "none";
    }
  } catch (error) {
    alert("Syntax Error in Regular Expression. Please check your parentheses and operators.");
    console.error(error);
  }
}

export function removeEpsilonFromAutomaton() {
  const automataApp = getAutomataApp();
  if (!automataApp || automataApp.nodes.length === 0) return;

  // 1. Sauvegarde pour le "Ctrl+Z" (si tu as implémenté saveState)
  automataApp.saveState();

  // 2. Appel de l'algorithme
  const result = EpsilonRemover.remove(automataApp.nodes, automataApp.edges);

  // 3. Mise à jour des données
  automataApp.nodes = result.nodes;
  automataApp.edges = result.edges;

  // 4. On relance l'affichage
  automataApp.render();

  // Petit log ou feedback utilisateur (optionnel)
  console.log("Epsilon transitions supprimées avec succès !");
}

export function determinizeAutomaton() {
  const automataApp = getAutomataApp();
  if (!automataApp || automataApp.nodes.length === 0) return;

  // Avertissement éducatif
  const hasEpsilon = automataApp.edges.some((e) => e.label.includes("ε") || e.label === "");
  if (hasEpsilon) {
    alert(
      "Attention : Cet algorithme s'applique sur un NFA sans epsilon-transitions. Veuillez d'abord cliquer sur 'Remove ε-transitions'."
    );
    return;
  }

  automataApp.saveState();

  const result = Determinizer.determinize(automataApp.nodes, automataApp.edges);

  automataApp.nodes = result.nodes;
  automataApp.edges = result.edges;

  // On réutilise la fonction de layout du compilateur si elle est accessible,
  // sinon l'utilisateur devra réarranger un peu les nœuds à la main.
  // Idéalement, on pourrait extraire l'Auto-Layout dans une classe utilitaire GraphLayout.js !

  automataApp.render();
  console.log("Automate déterminisé !");
}

export function switchAutomataTab(tabId, clickedBtn) {
  // 1. Masquer tout le contenu
  document.getElementById("tab-test").style.display = "none";
  document.getElementById("tab-batch").style.display = "none";
  document.getElementById("tab-build").style.display = "none";
  document.getElementById("tab-analyze").style.display = "none";

  // 2. Retirer la classe 'active' de tous les boutons
  const btns = document.querySelectorAll("#view-automata .tab-btn");
  btns.forEach((btn) => btn.classList.remove("active"));

  // 3. Afficher le contenu ciblé et activer le bouton cliqué
  document.getElementById("tab-" + tabId).style.display = "block";
  clickedBtn.classList.add("active");
}

export function handleRevealRegex() {
  const automataApp = getAutomataApp();
  if (!automataApp || automataApp.nodes.length === 0) return;

  const extractor = new RegexExtractor(automataApp.nodes, automataApp.edges);
  const regex = extractor.getRegex();

  const resultContainer = document.getElementById("regex-result-container");
  const outputElement = document.getElementById("regex-output");

  outputElement.textContent = regex;
  resultContainer.style.display = "block";
}

export function minimizeAutomaton() {
  const automataApp = getAutomataApp();
  if (!automataApp || automataApp.nodes.length === 0) return;

  if (automataApp.nodes.length === 0) return;

  automataApp.saveState(); // Pour le Ctrl+Z ou l'historique si tu l'as implémenté

  // Application mathématique
  const result = DFAMinimizer.minimize(automataApp.nodes, automataApp.edges);

  // Remplacement des données
  automataApp.nodes = result.nodes;
  automataApp.edges = result.edges;

  // Rendu visuel initial (les nœuds fusionnés apparaissent au centre de gravité des anciens)
  automataApp.render();

  // (Optionnel) Ajoute un petit délai puis aère le graphe avec ton layout automatique
  setTimeout(() => {
    if (typeof relayoutAutomaton === "function") {
      relayoutAutomaton();
    }
  }, 400); // 400ms permet de voir la fusion avant que le layout ne fasse le ménage
}

export const runBatchWordTests = () => {
  // Récupération de l'éditeur et des éléments du DOM
  const automataApp = getAutomataApp();
  const textarea = document.getElementById("batch-words-input");
  const resultsContainer = document.getElementById("batch-results-container");
  const tbody = document.getElementById("batch-results-body");

  const rawText = textarea.value;
  if (!rawText.trim()) return;

  // Nettoyage et préparation de la liste de mots (autorise les lignes vides pour tester epsilon)
  const words = rawText.split("\n").map((w) => w.trim());

  // Récupération du graphe expansé pour supporter les macros (séquences)
  const expandedGraph = automataApp.getExpandedGraph();

  const simulator = new NFASimulator(expandedGraph.nodes, expandedGraph.edges);

  tbody.innerHTML = "";

  words.forEach((word) => {
    // Ignorer les sauts de ligne multiples, mais garder un mot vide explicite pour tester epsilon
    if (word === "" && words.length > 1 && !rawText.includes("\n\n")) {
      return;
    }

    const result = simulator.simulateStepByStep(word);

    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid var(--border-color)";

    // Colonne du mot
    const tdWord = document.createElement("td");
    tdWord.style.padding = "8px 4px";
    tdWord.style.fontFamily = "monospace";
    tdWord.textContent = word === "" ? "ε (empty)" : word;

    // Colonne du résultat
    const tdResult = document.createElement("td");
    tdResult.style.padding = "8px 4px";
    tdResult.style.fontWeight = "bold";

    if (result.accepted) {
      tdResult.style.color = "#10B981"; // Vert
      tdResult.innerHTML = '<i class="fa-solid fa-check-circle"></i> Accepted';
    } else {
      tdResult.style.color = "#EF4444"; // Rouge
      tdResult.innerHTML = '<i class="fa-solid fa-times-circle"></i> Rejected';
    }

    tr.appendChild(tdWord);
    tr.appendChild(tdResult);
    tbody.appendChild(tr);
  });

  resultsContainer.style.display = "block";
};

window.referenceAutomatonData = null;
window.referenceAutomatonVisual = null;

export const setReferenceAutomaton = () => {
  const automataApp = getAutomataApp();
  // Utiliser le graphe expansé pour inclure la logique des arêtes "séquence"
  window.referenceAutomatonData = automataApp.getExpandedGraph();

  const mainSvg = document.getElementById("auto-svg-main");
  window.referenceAutomatonVisual = mainSvg.innerHTML;

  const btnSave = document.getElementById("btn-save-ref");
  btnSave.innerHTML = '<i class="fa-solid fa-rotate"></i> Update Ref (A)';

  const btnCompare = document.getElementById("btn-compare-automata");
  btnCompare.disabled = false;
  btnCompare.style.opacity = "1";
  btnCompare.style.cursor = "pointer";

  const btnView = document.getElementById("btn-view-ref");
  btnView.style.display = "flex";

  const resultBox = document.getElementById("equiv-result-container");
  resultBox.style.display = "block";
  resultBox.style.backgroundColor = "var(--bg-main)";
  resultBox.style.color = "var(--text-primary)";
  resultBox.innerHTML =
    '<i class="fa-solid fa-check"></i> Automaton A saved in memory. You can now modify the canvas to build Automaton B.';
};

export const compareWithReference = () => {
  if (!window.referenceAutomatonData) return;

  const automataApp = getAutomataApp();
  const currentAutomatonData = automataApp.getExpandedGraph();
  const resultBox = document.getElementById("equiv-result-container");

  const result = AutomataEquivalence.check(window.referenceAutomatonData, currentAutomatonData);

  resultBox.style.display = "block";

  if (result.equivalent) {
    resultBox.style.backgroundColor = "#D1FAE5";
    resultBox.style.color = "#065F46";
    resultBox.innerHTML =
      '<strong><i class="fa-solid fa-check-double"></i> Equivalent!</strong><br>Both automata accept exactly the same language.';
  } else {
    resultBox.style.backgroundColor = "#FEE2E2";
    resultBox.style.color = "#991B1B";

    // Formatage des badges Accepted/Rejected en fonction des booléens retournés
    const statusA = result.acceptedByA
      ? '<span style="color: #10B981; font-weight: bold;"><i class="fa-solid fa-check"></i> Accepted</span>'
      : '<span style="color: #EF4444; font-weight: bold;"><i class="fa-solid fa-xmark"></i> Rejected</span>';

    const statusB = result.acceptedByB
      ? '<span style="color: #10B981; font-weight: bold;"><i class="fa-solid fa-check"></i> Accepted</span>'
      : '<span style="color: #EF4444; font-weight: bold;"><i class="fa-solid fa-xmark"></i> Rejected</span>';

    resultBox.innerHTML = `
            <strong><i class="fa-solid fa-triangle-exclamation"></i> Not Equivalent</strong><br>
            Counter-example found: <span style="font-family: monospace; background: rgba(255,255,255,0.6); padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: 4px;">${result.counterExample}</span>
            
            <div style="margin-top: 10px; background: rgba(255,255,255,0.4); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(153, 27, 27, 0.2); display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; justify-content: space-between;">
                    <span><strong>Automaton A</strong> (Reference):</span>
                    <span>${statusA}</span>
                </div>
                <div style="height: 1px; background: rgba(153, 27, 27, 0.1);"></div>
                <div style="display: flex; justify-content: space-between;">
                    <span><strong>Automaton B</strong> (Current):</span>
                    <span>${statusB}</span>
                </div>
            </div>
        `;
  }
};

export const viewReferenceAutomaton = () => {
  if (!window.referenceAutomatonVisual) return;

  const svgContainer = document.getElementById("ref-automaton-svg");
  // Injection du snapshot dans la modale
  svgContainer.innerHTML = window.referenceAutomatonVisual;

  document.getElementById("ref-automaton-modal").style.display = "flex";
};

// expose automata handlers to inline HTML
window.relayoutAutomaton = relayoutAutomaton;
window.testAutomataWord = testAutomataWord;
window.clearAutomata = clearAutomata;
window.generateAutomatonFromRegex = generateAutomatonFromRegex;
window.removeEpsilonFromAutomaton = removeEpsilonFromAutomaton;
window.determinizeAutomaton = determinizeAutomaton;
window.switchAutomataTab = switchAutomataTab;
window.handleRevealRegex = handleRevealRegex;
window.minimizeAutomaton = minimizeAutomaton;
window.runBatchWordTests = runBatchWordTests;
window.setReferenceAutomaton = setReferenceAutomaton;
window.compareWithReference = compareWithReference;
window.viewReferenceAutomaton = viewReferenceAutomaton;

document.addEventListener("DOMContentLoaded", () => {
  // Force l'activation du premier onglet au chargement de la page
  const defaultTabBtn = document.querySelector(".tabs-header .tab-btn");
  if (defaultTabBtn) {
    switchAutomataTab("test", defaultTabBtn);
  }
});
