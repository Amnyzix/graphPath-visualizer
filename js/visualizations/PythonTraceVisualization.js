class PythonTraceVisualization extends GraphVisualization {
    
    init() {
        this.clear();
    }

    // Cette méthode remplace totalement l'ancien "renderStateAtCurrentStep"
    applyFrame(frame, fullHistory, currentIndex) {
        this.clear(); // On repart à zéro

        if (currentIndex === -1) return;

        // On rejoue l'historique jusqu'à l'étape actuelle
        for (let i = 0; i <= currentIndex; i++) {
            const item = fullHistory[i];
            const action = typeof item === 'object' ? item.action : null;
            const nodeId = typeof item === 'object' ? item.id : item;
            const message = typeof item === 'object' ? item.message : null;
            const color = typeof item === 'object' ? item.color : null;
            const isLastStep = (i === currentIndex);

            // 1. Actions sur les noeuds
            if (nodeId && (action === 'visit' || action === 'select' || action === 'color_node')) {
                // On affiche le message du log seulement si c'est la toute dernière étape (pour ne pas écraser)
                const msgToShow = isLastStep ? message : null; 
                this.highlightNode(nodeId, action, color, msgToShow);
            }

            // 2. Actions sur une arête
            if (action === 'color_edge' && item.target) {
                this.highlightEdge(nodeId, item.target, color);
            }

            // 3. Dessin de chemin complet
            if (action === 'draw_path' && item.path) {
                for (let j = 0; j < item.path.length - 1; j++) {
                    const u = item.path[j];
                    const v = item.path[j+1];
                    this.highlightEdge(u, v, color || "#e74c3c");
                }
            }
        }
    }
}