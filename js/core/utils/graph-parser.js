export class GraphDataParser {
  // ==========================================
  // TEXT -> GRAPH DATA
  // ==========================================
  static textToGraph(text, format, isDirected) {
    const lines = text.split("\n");
    const uniqueNodeIds = new Set();
    const parsedEdges = [];

    // --- NOUVEAU : Fonction de sécurité anti-doublon ---
    const addEdge = (u, v, weight) => {
      if (!isDirected) {
        // Si le graphe est non-orienté, on vérifie que l'arête n'a pas déjà été ajoutée dans l'autre sens
        const exists = parsedEdges.some(
          (e) => (e.from === u && e.to === v) || (e.from === v && e.to === u)
        );
        if (exists) return; // On ignore ce doublon !
      }
      parsedEdges.push({
        from: u,
        to: v,
        weight: isNaN(weight) ? null : weight,
        directed: isDirected,
      });
    };
    // ---------------------------------------------------

    if (format === "edge_list") {
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#")) return;

        const tokens = trimmed.split(/\s+/);
        if (tokens.length === 1) {
          uniqueNodeIds.add(tokens[0]);
        } else if (tokens.length >= 2) {
          const u = tokens[0];
          const v = tokens[1];
          let weight = tokens.length >= 3 ? parseInt(tokens[2], 10) : null;

          uniqueNodeIds.add(u);
          uniqueNodeIds.add(v);
          addEdge(u, v, weight); // Utilisation du filtre
        }
      });
    } else if (format === "adj_list") {
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#")) return;

        const parts = trimmed.split(":");
        if (parts.length !== 2) return;

        const u = parts[0].trim();
        uniqueNodeIds.add(u);

        const targets = parts[1].trim().match(/([a-zA-Z0-9_]+)(?:\(([-0-9]+)\))?/g);
        if (targets) {
          targets.forEach((t) => {
            const match = t.match(/([a-zA-Z0-9_]+)(?:\(([-0-9]+)\))?/);
            if (match) {
              const v = match[1];
              const weightStr = match[2];
              let weight = weightStr ? parseInt(weightStr, 10) : null;

              uniqueNodeIds.add(v);
              addEdge(u, v, weight); // Utilisation du filtre
            }
          });
        }
      });
    } else if (format === "adj_matrix") {
      let rowIdx = 1;
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#")) return;

        const values = trimmed.split(/[\s,]+/);
        const u = String(rowIdx);
        uniqueNodeIds.add(u);

        values.forEach((valStr, colIdx) => {
          const val = parseInt(valStr, 10);
          const v = String(colIdx + 1);

          if (!isNaN(val) && val !== 0) {
            uniqueNodeIds.add(v);
            addEdge(u, v, val); // Utilisation du filtre
          }
        });
        rowIdx++;
      });
    }

    return { uniqueNodeIds, edges: parsedEdges };
  }
  // ==========================================
  // GRAPH DATA -> TEXT
  // ==========================================
  static graphToText(nodes, edges, format) {
    let text = "";

    if (format === "edge_list") {
      edges.forEach((e) => {
        text += `${e.from} ${e.to}`;
        if (e.weight !== null && e.weight !== undefined) text += ` ${e.weight}`;
        text += "\n";
      });
      // Nœuds isolés
      nodes.forEach((n) => {
        const hasEdge = edges.some((e) => e.from === n.id || e.to === n.id);
        if (!hasEdge) text += `${n.id}\n`;
      });
    } else if (format === "adj_list") {
      nodes.forEach((n) => {
        let neighborsLine = [];
        edges.forEach((e) => {
          if (e.from === n.id) {
            let edgeText = e.to;
            if (e.weight !== null && e.weight !== undefined) edgeText += `(${e.weight})`;
            neighborsLine.push(edgeText);
          } else if (!e.directed && e.to === n.id) {
            let edgeText = e.from;
            if (e.weight !== null && e.weight !== undefined) edgeText += `(${e.weight})`;
            neighborsLine.push(edgeText);
          }
        });
        text += `${n.id}: ${neighborsLine.join(", ")}\n`;
      });
    } else if (format === "adj_matrix") {
      if (nodes.length === 0) return "";

      const sortedNodes = [...nodes].sort((a, b) => {
        const numA = parseInt(a.id, 10);
        const numB = parseInt(b.id, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.id.localeCompare(b.id);
      });

      const n = sortedNodes.length;
      let matrix = Array(n)
        .fill(0)
        .map(() => Array(n).fill(0));

      edges.forEach((e) => {
        const fromIdx = sortedNodes.findIndex((node) => node.id === e.from);
        const toIdx = sortedNodes.findIndex((node) => node.id === e.to);

        if (fromIdx !== -1 && toIdx !== -1) {
          const val = e.weight !== null && e.weight !== undefined ? e.weight : 1;
          matrix[fromIdx][toIdx] = val;
          if (!e.directed) matrix[toIdx][fromIdx] = val;
        }
      });

      matrix.forEach((row) => {
        text += row.join(" ") + "\n";
      });
    }

    return text.trim();
  }
}
