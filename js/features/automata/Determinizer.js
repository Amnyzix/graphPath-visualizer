// =========================================
// automata/Determinizer.js
// Convertit un NFA (sans epsilon) en DFA via l'algorithme des sous-ensembles
// =========================================

class Determinizer {
    static determinize(nodes, edges) {
        // 1. Trouver l'alphabet (tous les symboles utilisés, hors epsilon)
        let alphabet = new Set();
        edges.forEach(e => {
            e.label.split(',').forEach(sym => {
                let s = sym.trim();
                if (s && s !== 'ε') alphabet.add(s);
            });
        });
        alphabet = Array.from(alphabet);

        // 2. Outils de manipulation des sous-ensembles d'états
        
        // Transforme un tableau d'IDs ["q0", "q1"] en une chaîne de signature ordonnée "q0,q1"
        const getSignature = (stateArray) => {
            return [...stateArray].sort().join(',');
        };

        // Trouve les états de destination depuis un ensemble d'états d'origine avec un symbole donné
        const getDestinations = (fromStates, symbol) => {
            let dests = new Set();
            fromStates.forEach(fromId => {
                edges.filter(e => e.from === fromId).forEach(e => {
                    if (e.label.split(',').map(s => s.trim()).includes(symbol)) {
                        dests.add(e.to);
                    }
                });
            });
            return Array.from(dests);
        };

        // 3. Initialisation de l'algorithme
        let initialNode = nodes.find(n => n.isInitial);
        if (!initialNode) return { nodes, edges }; // Sécurité

        let dfaNodesMap = {}; // Clé: Signature, Valeur: Objet Node
        let dfaEdges = [];
        
        let initialStateSig = getSignature([initialNode.id]);
        dfaNodesMap[initialStateSig] = {
            id: `D_${initialNode.id}`, // Nouveau nom d'ID
            originalStates: [initialNode.id],
            isInitial: true,
            isFinal: initialNode.isFinal,
            x: initialNode.x, // On garde une trace pour un layout potentiel
            y: initialNode.y
        };

        let queue = [initialStateSig];
        let dfaCounter = 0; // Pour donner des jolis noms "S0, S1..." plus tard

        // 4. Boucle principale (Subset Construction)
        while (queue.length > 0) {
            let currentSig = queue.shift();
            let currentDfaNode = dfaNodesMap[currentSig];
            let currentStates = currentDfaNode.originalStates;

            // Pour chaque lettre de l'alphabet...
            alphabet.forEach(symbol => {
                let nextStates = getDestinations(currentStates, symbol);
                
                if (nextStates.length > 0) {
                    let nextSig = getSignature(nextStates);

                    // Si on découvre un nouveau sous-ensemble d'états
                    if (!dfaNodesMap[nextSig]) {
                        // Est-il final ? (S'il contient au moins un état final du NFA d'origine)
                        let isFinal = nextStates.some(id => nodes.find(n => n.id === id).isFinal);
                        
                        dfaNodesMap[nextSig] = {
                            id: `D_${dfaCounter++}`, // Nom temporaire
                            originalStates: nextStates,
                            isInitial: false,
                            isFinal: isFinal,
                            // Placement basique (on améliorera avec un layout)
                            x: currentDfaNode.x + 150, 
                            y: currentDfaNode.y + (Math.random() * 60 - 30) 
                        };
                        queue.push(nextSig);
                    }

                    // On crée la transition du DFA
                    dfaEdges.push({
                        from: currentDfaNode.id,
                        to: dfaNodesMap[nextSig].id,
                        label: symbol
                    });
                }
            });
        }

        // 5. Mise au propre des données pour l'éditeur
        let finalNodes = [];
        let finalEdges = [];
        
        // Renommer les nœuds proprement (S0, S1, S2...)
        let idMapping = {}; // Ancienne clé D_x -> Nouveau nom S0
        let niceCounter = 0;

        Object.values(dfaNodesMap).forEach(n => {
            let niceId = `S${niceCounter++}`;
            idMapping[n.id] = niceId;
            finalNodes.push({
                id: niceId,
                x: n.x,
                y: n.y,
                isInitial: n.isInitial,
                isFinal: n.isFinal
            });
        });

        // Regrouper les arêtes multiples entre mêmes nœuds (ex: une flèche pour 'a', une pour 'b' -> flèche 'a,b')
        let edgeMap = {};
        dfaEdges.forEach(e => {
            let newFrom = idMapping[e.from];
            let newTo = idMapping[e.to];
            let key = `${newFrom}_${newTo}`;
            
            if (!edgeMap[key]) {
                edgeMap[key] = new Set([e.label]);
            } else {
                edgeMap[key].add(e.label);
            }
        });

        Object.keys(edgeMap).forEach(key => {
            let [from, to] = key.split('_');
            finalEdges.push({
                from: from,
                to: to,
                label: Array.from(edgeMap[key]).join(',')
            });
        });

        GraphLayout.applyLayout(finalNodes, finalEdges);
        
        return { nodes: finalNodes, edges: finalEdges };
    }
}