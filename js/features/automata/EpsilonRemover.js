// =========================================
// automata/EpsilonRemover.js
// Algorithme d'élimination des Epsilon-transitions
// =========================================

class EpsilonRemover {
    static remove(nodes, edges) {
        const EPSILON = "ε";
        
        // 1. Fonction interne pour calculer la clôture epsilon d'un état
        function getEpsilonClosure(stateId) {
            let closure = new Set([stateId]);
            let stack = [stateId];
            while (stack.length > 0) {
                let curr = stack.pop();
                let eTransitions = edges.filter(e => e.from === curr && e.label.split(',').map(s => s.trim()).includes(EPSILON));
                for (let t of eTransitions) {
                    if (!closure.has(t.to)) {
                        closure.add(t.to);
                        stack.push(t.to);
                    }
                }
            }
            return Array.from(closure);
        }

        // Calculer les clôtures pour tous les nœuds
        let closures = {};
        nodes.forEach(n => closures[n.id] = getEpsilonClosure(n.id));

        // 2. Copier les nœuds et mettre à jour les états finaux
        let newNodes = nodes.map(n => ({ ...n }));
        newNodes.forEach(n => {
            let reachable = closures[n.id];
            // Si la clôture epsilon de ce nœud contient un état final, il devient final
            let canReachFinal = reachable.some(rId => nodes.find(x => x.id === rId).isFinal);
            if (canReachFinal) n.isFinal = true;
        });

        // 3. Calculer les nouvelles transitions
        let transitionMap = {}; // Clé: "from_to", Valeur: Set de symboles
        
        nodes.forEach(startNode => {
            let startId = startNode.id;
            let closure = closures[startId];
            
            // Pour chaque état atteignable via Epsilon...
            closure.forEach(midId => {
                // ... on cherche les vraies transitions (non-epsilon)
                edges.filter(e => e.from === midId).forEach(t => {
                    let symbols = t.label.split(',').map(s => s.trim()).filter(s => s !== EPSILON && s !== '');
                    
                    if (symbols.length > 0) {
                        // Puis, depuis la destination, on regarde où on peut aller via Epsilon
                        let targets = closures[t.to];
                        targets.forEach(endId => {
                            let key = startId + "_" + endId;
                            if (!transitionMap[key]) transitionMap[key] = new Set();
                            symbols.forEach(sym => transitionMap[key].add(sym));
                        });
                    }
                });
            });
        });

        // Construire le nouveau tableau d'arêtes sans doublons
        let newEdges = [];
        for (let key in transitionMap) {
            let [from, to] = key.split('_');
            let label = Array.from(transitionMap[key]).join(',');
            newEdges.push({ from, to, label });
        }

        // 4. (Bonus Pro) Nettoyer les états devenus inaccessibles
        let initialNode = newNodes.find(n => n.isInitial);
        if (initialNode) {
            let reachableStates = new Set([initialNode.id]);
            let queue = [initialNode.id];
            
            while (queue.length > 0) {
                let curr = queue.shift();
                newEdges.filter(e => e.from === curr).forEach(e => {
                    if (!reachableStates.has(e.to)) {
                        reachableStates.add(e.to);
                        queue.push(e.to);
                    }
                });
            }
            // On ne garde que les nœuds et les arêtes utiles
            newNodes = newNodes.filter(n => reachableStates.has(n.id));
            newEdges = newEdges.filter(e => reachableStates.has(e.from) && reachableStates.has(e.to));
        }

        GraphLayout.applyLayout(newNodes, newEdges);

        return { nodes: newNodes, edges: newEdges };
    }
}