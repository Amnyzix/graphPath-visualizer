// =========================================
// automata/RegexCompiler.js
// Algorithme de construction de Thompson
// Convertit une expression Postfix en Automate (NFA)
// =========================================

class RegexCompiler {
    constructor() {
        this.nodes = [];
        this.edges = [];
        this.nodeCounter = 0;
    }

    // Outil : Créer un nouveau nœud (État)
    createState() {
        const id = "q" + this.nodeCounter++;
        // Note : x et y sont à 0 pour l'instant, on gèrera l'affichage plus tard
        this.nodes.push({ id: id, x: 0, y: 0, isInitial: false, isFinal: false });
        return id;
    }

    // Outil : Créer une transition
    createEdge(from, to, label) {
        this.edges.push({ from, to, label });
    }


    // La compilation magique
    compile(postfixExp) {
        let stack = [];

        for (let i = 0; i < postfixExp.length; i++) {
            let char = postfixExp[i];

            if (/[a-zA-Z0-9]/.test(char)) {
                // Règle 1 : Un caractère simple
                // (Début) --char--> (Fin)
                let start = this.createState();
                let end = this.createState();
                this.createEdge(start, end, char);
                stack.push({ start: start, end: end });
            } 
            else if (char === '.') {
                // Règle 2 : Concaténation
                // On prend les deux derniers automates et on relie la fin de l'un au début de l'autre
                let f2 = stack.pop(); // Le fragment de droite
                let f1 = stack.pop(); // Le fragment de gauche
                
                this.createEdge(f1.end, f2.start, 'ε');
                stack.push({ start: f1.start, end: f2.end });
            } 
            else if (char === '|') {
                // Règle 3 : Union (OU)
                let f2 = stack.pop();
                let f1 = stack.pop();
                
                let start = this.createState();
                let end = this.createState();

                this.createEdge(start, f1.start, 'ε'); // Chemin du haut
                this.createEdge(start, f2.start, 'ε'); // Chemin du bas
                this.createEdge(f1.end, end, 'ε');     // Sortie du haut
                this.createEdge(f2.end, end, 'ε');     // Sortie du bas

                stack.push({ start: start, end: end });
            } 
            else if (char === '*') {
                // Règle 4 : Étoile de Kleene (Répétition)
                let f = stack.pop();
                
                let start = this.createState();
                let end = this.createState();

                this.createEdge(start, f.start, 'ε'); // Entrer dans la boucle
                this.createEdge(start, end, 'ε');     // Sauter la boucle (zéro fois)
                this.createEdge(f.end, f.start, 'ε'); // Reboucler
                this.createEdge(f.end, end, 'ε');     // Quitter la boucle

                stack.push({ start: start, end: end });
            }
        }

        // À la fin, il ne reste qu'un seul gros automate sur la pile
        let finalAutomaton = stack.pop();

        // On définit le vrai état initial et le vrai état final
        let initialNode = this.nodes.find(n => n.id === finalAutomaton.start);
        let finalNode = this.nodes.find(n => n.id === finalAutomaton.end);
        
        if (initialNode) initialNode.isInitial = true;
        if (finalNode) finalNode.isFinal = true;

        GraphLayout.applyLayout(this.nodes, this.edges);

        return { nodes: this.nodes, edges: this.edges };
    }
}