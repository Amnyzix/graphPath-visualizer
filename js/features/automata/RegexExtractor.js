// =========================================
// automata/RegexExtractor.js
// Convertit un NFA/DFA en Expression Régulière
// =========================================

export class RegexExtractor {
  constructor(nodes, edges) {
    // Clonage profond pour ne pas altérer le graphe de l'éditeur
    this.nodes = JSON.parse(JSON.stringify(nodes));
    this.edges = JSON.parse(JSON.stringify(edges));
    this.stateIdCounter = 0;
  }

  generateId() {
    return "gnfa_" + this.stateIdCounter++;
  }

  // Fonctions utilitaires pour manipuler algébriquement les regex
  star(r) {
    if (!r || r === "ε") return "ε";
    if (r === "∅") return "ε";
    // Si la regex a déjà des parenthèses englobantes ou fait un seul caractère
    if (
      r.length === 1 ||
      (r.startsWith("(") && r.endsWith(")") && this.isBalanced(r.slice(1, -1)))
    ) {
      return r + "*";
    }
    return "(" + r + ")*";
  }

  concat(r1, r2) {
    if (r1 === "∅" || r2 === "∅") return "∅";
    if (r1 === "ε") return r2;
    if (r2 === "ε") return r1;

    // Ajout de parenthèses si un OU est présent au premier niveau
    const w1 = r1.includes("|") && !this.isWrapped(r1) ? "(" + r1 + ")" : r1;
    const w2 = r2.includes("|") && !this.isWrapped(r2) ? "(" + r2 + ")" : r2;
    return w1 + w2;
  }

  union(r1, r2) {
    if (r1 === "∅") return r2;
    if (r2 === "∅") return r1;
    if (r1 === r2) return r1;
    return r1 + "|" + r2;
  }

  isWrapped(r) {
    return r.startsWith("(") && r.endsWith(")") && this.isBalanced(r.slice(1, -1));
  }

  isBalanced(str) {
    let depth = 0;
    for (let char of str) {
      if (char === "(") depth++;
      if (char === ")") depth--;
      if (depth < 0) return false;
    }
    return depth === 0;
  }

  getRegex() {
    const initialNodes = this.nodes.filter((n) => n.isInitial);
    const finalNodes = this.nodes.filter((n) => n.isFinal);

    if (initialNodes.length === 0 || finalNodes.length === 0) return "∅";

    // 1. Normalisation (Création d'un Start et End uniques)
    const startState = this.generateId();
    const endState = this.generateId();

    this.nodes.push({ id: startState });
    this.nodes.push({ id: endState });

    // Relier le nouveau Start aux anciens initials
    initialNodes.forEach((n) => {
      this.edges.push({ from: startState, to: n.id, label: "ε" });
    });

    // Relier les anciens finals au nouveau End
    finalNodes.forEach((n) => {
      this.edges.push({ from: n.id, to: endState, label: "ε" });
    });

    // 2. Fusionner les arêtes parallèles en appliquant des OU (|)
    let gnfaEdges = {};
    for (let edge of this.edges) {
      let key = edge.from + "->" + edge.to;
      // Convertir "a, b" en "a|b" pour le traitement
      let labelRegex = edge.label
        .split(",")
        .map((s) => s.trim())
        .join("|");

      if (!gnfaEdges[key]) {
        gnfaEdges[key] = { from: edge.from, to: edge.to, regex: labelRegex };
      } else {
        gnfaEdges[key].regex = this.union(gnfaEdges[key].regex, labelRegex);
      }
    }
    let currentEdges = Object.values(gnfaEdges);

    // 3. Élimination des états (tous sauf le Start et End virtuels)
    const statesToRemove = this.nodes
      .filter((n) => n.id !== startState && n.id !== endState)
      .map((n) => n.id);

    for (let q of statesToRemove) {
      const incoming = currentEdges.filter((e) => e.to === q && e.from !== q);
      const outgoing = currentEdges.filter((e) => e.from === q && e.to !== q);
      const selfLoop = currentEdges.find((e) => e.from === q && e.to === q);

      const loopRegex = selfLoop ? this.star(selfLoop.regex) : "ε";

      for (let inEdge of incoming) {
        for (let outEdge of outgoing) {
          // Construction du nouveau chemin : p -> q -> r
          const newRegex = this.concat(this.concat(inEdge.regex, loopRegex), outEdge.regex);

          // Vérifier si une arête p -> r existe déjà
          const existingEdge = currentEdges.find(
            (e) => e.from === inEdge.from && e.to === outEdge.to
          );

          if (existingEdge) {
            existingEdge.regex = this.union(existingEdge.regex, newRegex);
          } else {
            currentEdges.push({ from: inEdge.from, to: outEdge.to, regex: newRegex });
          }
        }
      }

      // Supprimer toutes les arêtes liées à l'état q éliminé
      currentEdges = currentEdges.filter((e) => e.from !== q && e.to !== q);
    }

    // 4. Résultat final
    const finalEdge = currentEdges.find((e) => e.from === startState && e.to === endState);
    return finalEdge ? finalEdge.regex : "∅";
  }
}
