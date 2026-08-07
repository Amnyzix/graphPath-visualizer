// =========================================
// automata/NFASimulator.js
// Moteur de simulation pour Automates Finis Non-Déterministes (NFA)
// =========================================

// On définit le symbole de la transition epsilon (peut être "ε", "e", ou vide)
const EPSILON = "ε";

export class NFASimulator {
  constructor(nodes, edges) {
    this.nodes = nodes;
    this.edges = edges;
  }

  // 1. Trouver l'état initial
  getInitialState() {
    const initialNode = this.nodes.find((n) => n.isInitial);
    return initialNode ? initialNode.id : null;
  }

  // 2. Vérifier si un ensemble d'états contient un état final
  isFinal(stateIds) {
    return stateIds.some((id) => {
      const node = this.nodes.find((n) => n.id === id);
      return node && node.isFinal;
    });
  }

  // 3. LA CLÔTURE EPSILON : Trouve tous les états atteignables "gratuitement"
  getEpsilonClosure(stateIds) {
    let closure = new Set(stateIds); // Set évite les doublons
    let stack = [...stateIds];

    while (stack.length > 0) {
      let currentState = stack.pop();

      // Trouver toutes les transitions sortantes qui sont des epsilons
      let epsilonTransitions = this.edges.filter((e) => {
        if (e.from !== currentState) return false;
        let labels = e.label.split(",").map((s) => s.trim());
        return labels.includes(EPSILON) || labels.includes("");
      });

      for (let t of epsilonTransitions) {
        if (!closure.has(t.to)) {
          closure.add(t.to);
          stack.push(t.to); // On l'ajoute à la pile pour explorer plus loin en cascade !
        }
      }
    }
    return Array.from(closure);
  }

  // 4. LE DÉPLACEMENT : Trouve les états atteignables en lisant UNE lettre
  move(stateIds, char) {
    let nextStates = new Set();

    for (let state of stateIds) {
      let validTransitions = this.edges.filter((e) => {
        if (e.from !== state) return false;
        let labels = e.label.split(",").map((s) => s.trim());
        return labels.includes(char);
      });

      for (let t of validTransitions) {
        nextStates.add(t.to);
      }
    }
    return Array.from(nextStates);
  }

  // 5. SIMULATION COMPLÈTE (Génère la trace pour l'animation)
  simulateStepByStep(word) {
    const initialState = this.getInitialState();
    if (!initialState) {
      return { accepted: false, error: "Aucun état initial défini.", trace: [] };
    }

    let trace = [];

    // Étape 0 : On démarre à l'état initial + tous les états atteignables par Epsilon
    let currentStates = this.getEpsilonClosure([initialState]);
    trace.push({ char: null, activeStates: [...currentStates] });

    for (let i = 0; i < word.length; i++) {
      const char = word[i];

      // A. Lire la lettre (Déplacement)
      let nextStates = this.move(currentStates, char);

      // Puits (Échec immédiat si on ne peut plus bouger)
      if (nextStates.length === 0) {
        return {
          accepted: false,
          error: `Bloqué au caractère '${char}' (aucun chemin possible).`,
          trace,
        };
      }

      // B. Appliquer la Clôture Epsilon sur les nouveaux états d'arrivée
      currentStates = this.getEpsilonClosure(nextStates);
      trace.push({ char: char, activeStates: [...currentStates] });
    }

    // Vérification du succès
    const accepted = this.isFinal(currentStates);
    return {
      accepted: accepted,
      message: accepted
        ? `Le mot "${word}" est accepté !`
        : `Le mot est lu, mais aucun état actif n'est final.`,
      trace: trace,
      finalActiveStates: currentStates,
    };
  }
}
