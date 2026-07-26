// =========================================
// automata/GraphLayout.js
// Utilitaire de placement automatique des nœuds (Layout BFS)
// =========================================

class GraphLayout {
    /**
     * Repositionne les nœuds de gauche à droite à partir de l'état initial.
     * @param {Array} nodes - Tableau d'objets Node {id, x, y, isInitial, ...}
     * @param {Array} edges - Tableau d'objets Edge {from, to, label, ...}
     * @param {Object} options - Configuration du placement (espacement, origine)
     */
    static applyLayout(nodes, edges, options = {}) {
        if (!nodes || nodes.length === 0) return { nodes, edges };

        const config = {
            startX: options.startX || 100,
            startY: options.startY || 250,
            stepX: options.stepX || 140,
            stepY: options.stepY || 80,
            ...options
        };

        // 1. Trouver le point de départ (état initial ou 1er nœud)
        let initial = nodes.find(n => n.isInitial) || nodes[0];
        
        let queue = [initial.id];
        let visited = new Set([initial.id]);
        let depths = { [initial.id]: 0 };

        // 2. Parcours BFS pour assigner une colonne (profondeur) à chaque nœud
        while (queue.length > 0) {
            let curr = queue.shift();
            let outgoing = edges.filter(e => e.from === curr);
            
            outgoing.forEach(e => {
                if (!visited.has(e.to)) {
                    visited.add(e.to);
                    depths[e.to] = depths[curr] + 1;
                    queue.push(e.to);
                }
            });
        }

        // Pour les nœuds isolés non atteints par le BFS
        nodes.forEach(n => {
            if (depths[n.id] === undefined) {
                depths[n.id] = 0;
            }
        });

        // 3. Regrouper les nœuds par colonne (profondeur)
        let byDepth = {};
        nodes.forEach(n => {
            let d = depths[n.id];
            if (!byDepth[d]) byDepth[d] = [];
            byDepth[d].push(n);
        });

        // 4. Calculer les nouvelles coordonnées (x, y)
        Object.keys(byDepth).forEach(d => {
            let levelNodes = byDepth[d];
            levelNodes.forEach((n, idx) => {
                n.x = config.startX + parseInt(d) * config.stepX;
                
                // Centrage vertical des nœuds de la même colonne
                let offset = (idx - (levelNodes.length - 1) / 2) * config.stepY;
                n.y = config.startY + offset;
            });
        });

        return { nodes, edges };
    }
}