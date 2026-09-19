// =========================================
// automata/DFAMinimizer.js
// Algorithme de minimisation de DFA (Moore / Partitionnement)
// =========================================

export class DFAMinimizer {
  static minimize(nodes, edges) {
    // 1. Extraire l'alphabet (en ignorant les epsilon, on suppose que l'automate est déjà déterministe)
    let alphabet = new Set();
    edges.forEach((e) => {
      if (e.label && e.label !== "ε") {
        e.label.split(",").forEach((char) => alphabet.add(char.trim()));
      }
    });
    alphabet = Array.from(alphabet);

    // 2. Éliminer les états inaccessibles (Parcours BFS)
    let reachable = new Set();
    let initialNode = nodes.find((n) => n.isInitial);

    if (!initialNode) return { nodes, edges }; // Impossible de minimiser sans état initial

    let queue = [initialNode.id];
    reachable.add(initialNode.id);

    while (queue.length > 0) {
      let curr = queue.shift();
      let outEdges = edges.filter((e) => e.from === curr);
      outEdges.forEach((e) => {
        if (!reachable.has(e.to)) {
          reachable.add(e.to);
          queue.push(e.to);
        }
      });
    }

    let validNodes = nodes.filter((n) => reachable.has(n.id));
    let validEdges = edges.filter((e) => reachable.has(e.from) && reachable.has(e.to));

    // 3. Partitions initiales : P = { Finaux, Non-Finaux }
    let finals = validNodes.filter((n) => n.isFinal).map((n) => n.id);
    let nonFinals = validNodes.filter((n) => !n.isFinal).map((n) => n.id);

    let partitions = [];
    if (finals.length > 0) partitions.push(finals);
    if (nonFinals.length > 0) partitions.push(nonFinals);

    const getTarget = (stateId, symbol) => {
      const edge = validEdges.find(
        (e) =>
          e.from === stateId &&
          e.label
            .split(",")
            .map((s) => s.trim())
            .includes(symbol)
      );
      return edge ? edge.to : null; // null si transition manquante (état puits implicite)
    };

    const getPartitionIndex = (stateId, currentPartitions) => {
      if (stateId === null) return -1;
      return currentPartitions.findIndex((p) => p.includes(stateId));
    };

    // 4. Raffinement itératif (Tant que les partitions se divisent)
    let changed = true;
    while (changed) {
      changed = false;
      let newPartitions = [];

      for (let group of partitions) {
        if (group.length === 1) {
          newPartitions.push(group);
          continue;
        }

        // Grouper par "signature" de transition
        let signatureMap = {};
        for (let state of group) {
          let signature = alphabet
            .map((sym) => getPartitionIndex(getTarget(state, sym), partitions))
            .join("|");
          if (!signatureMap[signature]) signatureMap[signature] = [];
          signatureMap[signature].push(state);
        }

        let subGroups = Object.values(signatureMap);
        newPartitions.push(...subGroups);

        if (subGroups.length > 1) changed = true;
      }
      partitions = newPartitions;
    }

    // 5. Reconstruction du graphe fusionné
    let newNodes = [];
    let newEdges = [];
    let stateMap = {}; // Correspondance : Ancien ID -> Nouvel ID

    partitions.forEach((group, index) => {
      let newId = "qM" + index; // Nom distinct pour marquer la fusion

      // Calcul du centre visuel des états fusionnés
      let avgX =
        group.reduce((sum, id) => sum + validNodes.find((n) => n.id === id).x, 0) / group.length;
      let avgY =
        group.reduce((sum, id) => sum + validNodes.find((n) => n.id === id).y, 0) / group.length;

      let isInitial = group.some((id) => validNodes.find((n) => n.id === id).isInitial);
      let isFinal = group.some((id) => validNodes.find((n) => n.id === id).isFinal);

      newNodes.push({ id: newId, x: avgX, y: avgY, isInitial, isFinal });

      group.forEach((id) => (stateMap[id] = newId));
    });

    // Reconstruction des arêtes sans doublons
    let edgeMap = {};
    validEdges.forEach((e) => {
      let fromNew = stateMap[e.from];
      let toNew = stateMap[e.to];
      let key = fromNew + "->" + toNew;

      if (!edgeMap[key]) edgeMap[key] = new Set();
      e.label.split(",").forEach((sym) => edgeMap[key].add(sym.trim()));
    });

    for (let key in edgeMap) {
      let [from, to] = key.split("->");
      newEdges.push({
        from: from,
        to: to,
        label: Array.from(edgeMap[key]).join(", "),
        isSequence: false,
      });
    }

    return { nodes: newNodes, edges: newEdges };
  }
}
