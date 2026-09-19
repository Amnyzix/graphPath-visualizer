// =========================================
// automata/AutomataCompleteness.js
// Validation et complétion de l'alphabet (État Puits)
// =========================================

export class AutomataCompleteness {
  // Convertit la chaîne saisie en un tableau de symboles uniques
  static parseAlphabet(alphabetStr) {
    if (!alphabetStr) return [];
    return Array.from(
      new Set(
        alphabetStr
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== "")
      )
    );
  }

  // Vérifie si chaque état possède une transition sortante pour chaque symbole de l'alphabet
  static check(nodes, edges, alphabet) {
    if (alphabet.length === 0) return { isComplete: true, incompleteStates: [] };

    let incompleteStates = [];

    nodes.forEach((node) => {
      let outgoingSymbols = new Set();

      // Récupérer toutes les arêtes sortant de ce nœud
      edges
        .filter((e) => e.from === node.id)
        .forEach((e) => {
          if (e.label && e.label !== "ε") {
            // On sépare par virgule pour gérer les étiquettes multiples (ex: "a, b")
            e.label.split(",").forEach((sym) => outgoingSymbols.add(sym.trim()));
          }
        });

      // Trouver quels symboles de l'alphabet ne sont pas dans les transitions sortantes
      let missing = alphabet.filter((sym) => !outgoingSymbols.has(sym));

      if (missing.length > 0) {
        incompleteStates.push({ id: node.id, missing: missing });
      }
    });

    return {
      isComplete: incompleteStates.length === 0,
      incompleteStates,
    };
  }

  // Ajoute un état puits et les transitions manquantes
  static makeComplete(nodes, edges, alphabet) {
    const { isComplete, incompleteStates } = this.check(nodes, edges, alphabet);
    if (isComplete) return { nodes, edges, trapAdded: false };

    let newNodes = JSON.parse(JSON.stringify(nodes));
    let newEdges = JSON.parse(JSON.stringify(edges));

    // Génération d'un ID unique pour le Trap State
    const baseTrapId = "qTrap";
    let finalTrapId = baseTrapId;
    let counter = 1;
    while (newNodes.find((n) => n.id === finalTrapId)) {
      finalTrapId = `${baseTrapId}_${counter++}`;
    }

    // Positionnement visuel du Trap State en dessous de l'automate actuel
    const maxY = Math.max(...newNodes.map((n) => n.y), 0);
    const avgX = newNodes.reduce((sum, n) => sum + n.x, 0) / (newNodes.length || 1);

    newNodes.push({
      id: finalTrapId,
      x: avgX,
      y: maxY + 150, // Placé plus bas pour aérer le graphe
      isInitial: false,
      isFinal: false,
    });

    // Création des arêtes manquantes vers le Trap State
    incompleteStates.forEach((info) => {
      newEdges.push({
        from: info.id,
        to: finalTrapId,
        label: info.missing.join(", "),
        isSequence: false,
      });
    });

    // Boucle infinie sur le Trap State contenant tout l'alphabet
    newEdges.push({
      from: finalTrapId,
      to: finalTrapId,
      label: alphabet.join(", "),
      isSequence: false,
    });

    return { nodes: newNodes, edges: newEdges, trapAdded: true };
  }
}
