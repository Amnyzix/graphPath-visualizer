class PythonTraceVisualization extends GraphVisualization {
    
    init() {
        this.clear();
    }

    // Cette méthode remplace totalement l'ancien "renderStateAtCurrentStep"
    applyFrame(frame, fullHistory, currentIndex) {
        this.clear(); // On repart à zéro

        if (currentIndex === -1) return;

        const item = fullHistory[currentIndex];

        const action = item.action;
        const nodeId = item.id;
        const color = item.color;

        // 1. Actions sur les noeuds
        if (nodeId && (action === 'visit' || action === 'select' || action === 'color_node')) {
            // On ne passe plus de message ici, le HUD s'en occupe !
            this.highlightNode(nodeId, action, color, null); 
        }

        // 2. Actions sur une arête
        if (action === 'color_edge' && item.target) {
            this.highlightEdge(nodeId, item.target, color);
        }

        // 3. Dessin de chemin complet
        if (action === 'draw_path' && item.path) {
            for (let j = 0; j < item.path.length - 1; j++) {
                this.highlightEdge(item.path[j], item.path[j+1], color || "#e74c3c");
            }
        }
    }
}