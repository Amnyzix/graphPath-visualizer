// La source de vérité unique
window.AppRegistry = {
    editors: {}, // Stockera tes instances : { graphs: ..., automata: ... }
    
    // Initialise tout au démarrage
    init() {
        this.register('graphs', new GraphEditor('canvas'));
        this.register('automata', new AutomataEditor('auto-svg-main'));
        this.register('minimax', new MinimaxEditor('ai-svg-main'));
        this.register('kmeans', new KMeansEditor('ai-svg-main'));
        this.register('knn', new KNNEditor('ai-svg-main'));

        // Pointeur dynamique global pour la vue IA (par défaut : Minimax)
        window.aiApp = this.get('minimax');

        console.log("Registry initialisé :", this.editors);
    },

    register(name, instance) {
        this.editors[name] = instance;
        window[name + 'App'] = instance;
    },

    get(name) {
        return this.editors[name];
    }
};