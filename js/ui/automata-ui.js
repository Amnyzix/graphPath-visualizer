import { GraphLayout } from "../core/GraphLayout.js";
import { RegexParser } from "../features/automata/RegexParser.js";
import { RegexCompiler } from "../features/automata/RegexCompiler.js";
import { EpsilonRemover } from "../features/automata/EpsilonRemover.js";
import { Determinizer } from "../features/automata/Determinizer.js";

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
  document.getElementById("tab-build").style.display = "none";

  // 2. Retirer la classe 'active' de tous les boutons
  const btns = document.querySelectorAll(".tab-btn");
  btns.forEach((btn) => btn.classList.remove("active"));

  // 3. Afficher le contenu ciblé et activer le bouton cliqué
  document.getElementById("tab-" + tabId).style.display = "block";
  clickedBtn.classList.add("active");
}

// expose automata handlers to inline HTML
window.relayoutAutomaton = relayoutAutomaton;
window.testAutomataWord = testAutomataWord;
window.clearAutomata = clearAutomata;
window.generateAutomatonFromRegex = generateAutomatonFromRegex;
window.removeEpsilonFromAutomaton = removeEpsilonFromAutomaton;
window.determinizeAutomaton = determinizeAutomaton;
window.switchAutomataTab = switchAutomataTab;

document.addEventListener("DOMContentLoaded", () => {
  // Force l'activation du premier onglet au chargement de la page
  const defaultTabBtn = document.querySelector(".tabs-header .tab-btn");
  if (defaultTabBtn) {
    switchAutomataTab("test", defaultTabBtn);
  }
});
