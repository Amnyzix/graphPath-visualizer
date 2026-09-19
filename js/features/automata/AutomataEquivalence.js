import { NFASimulator } from "./NFASimulator.js";

export class AutomataEquivalence {
  static check(graphA, graphB) {
    const simA = new NFASimulator(graphA.nodes, graphA.edges);
    const simB = new NFASimulator(graphB.nodes, graphB.edges);

    let initialA = simA.getInitialState();
    let initialB = simB.getInitialState();

    if (!initialA && !initialB) return { equivalent: true };
    if (!initialA || !initialB)
      return {
        equivalent: false,
        counterExample: "ε (Empty Word)",
        acceptedByA: !!initialA,
        acceptedByB: !!initialB,
      };

    // 1. Déduire l'alphabet combiné des deux automates
    let alphabet = new Set();
    [...graphA.edges, ...graphB.edges].forEach((e) => {
      if (e.label !== "ε") {
        e.label.split(",").forEach((char) => alphabet.add(char.trim()));
      }
    });
    alphabet = Array.from(alphabet).filter((c) => c !== "");

    // 2. Initialisation des sous-ensembles (Clôture Epsilon de l'état initial)
    let startSetA = simA.getEpsilonClosure([initialA]);
    let startSetB = simB.getEpsilonClosure([initialB]);

    let queue = [{ setA: startSetA, setB: startSetB, word: "" }];
    let visited = new Set();

    // Fonction de hachage pour mémoriser les paires d'états déjà visitées
    const hash = (setA, setB) => {
      const a = [...setA].sort().join(",");
      const b = [...setB].sort().join(",");
      return `${a}|${b}`;
    };

    visited.add(hash(startSetA, startSetB));

    // 3. BFS (Parcours en largeur) pour trouver la différence symétrique
    while (queue.length > 0) {
      let curr = queue.shift();

      let isFinalA = simA.isFinal(curr.setA);
      let isFinalB = simB.isFinal(curr.setB);

      // Si l'un accepte et l'autre refuse : nous avons notre contre-exemple !
      if (isFinalA !== isFinalB) {
        return {
          equivalent: false,
          counterExample: curr.word === "" ? "ε (Empty Word)" : curr.word,
          acceptedByA: isFinalA,
          acceptedByB: isFinalB,
        };
      }

      // Parcourir chaque lettre de l'alphabet pour générer les états suivants
      for (let char of alphabet) {
        let nextA = simA.getEpsilonClosure(simA.move(curr.setA, char));
        let nextB = simB.getEpsilonClosure(simB.move(curr.setB, char));

        let stateHash = hash(nextA, nextB);
        if (!visited.has(stateHash)) {
          visited.add(stateHash);
          queue.push({ setA: nextA, setB: nextB, word: curr.word + char });
        }
      }
    }

    // Si on a exploré toutes les combinaisons sans différence, ils sont équivalents
    return { equivalent: true };
  }
}
