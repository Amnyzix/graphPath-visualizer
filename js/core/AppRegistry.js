import { GraphEditor } from "../features/graphs/GraphEditor.js";
import { PythonTraceVisualization } from "../visualizations/PythonTraceVisualization.js";
import { AnimationPlayer } from "../animation/AnimationPlayer.js";
import { AutomataEditor } from "../features/automata/AutomataEditor.js";
import { MinimaxEditor } from "../features/ai/MinimaxEditor.js";
import { KMeansEditor } from "../features/ai/KMeansEditor.js";
import { KNNEditor } from "../features/ai/KNNEditor.js";

export const AppRegistry = {
  editors: {}, // Stockera tes instances : { graphs: ..., automata: ... }

  // Initialise tout au démarrage
  init() {
    // 1. Initialisation de l'éditeur de graphes existant
    this.register("graphs", new GraphEditor("canvas"));

    // --- NOUVEAU : Initialisation de la Vue et du Lecteur pour les graphes ---
    const graphEditorInstance = this.get("graphs");

    // On crée la visualisation en lui passant l'éditeur
    window.pythonTraceVis = new PythonTraceVisualization(graphEditorInstance);

    // On crée le lecteur en le liant à la visualisation (avec le préfixe '' pour les boutons par défaut)
    window.graphPlayer = new AnimationPlayer(window.pythonTraceVis, "");

    this.register("automata", new AutomataEditor("auto-svg-main"));
    this.register("minimax", new MinimaxEditor("ai-svg-main"));
    this.register("kmeans", new KMeansEditor("ai-svg-main"));
    this.register("knn", new KNNEditor("ai-svg-main"));

    // Pointeur dynamique global pour la vue IA (par défaut : Minimax)
    window.aiApp = this.get("minimax");

    console.log("Registry initialisé :", this.editors);
  },

  register(name, instance) {
    this.editors[name] = instance;
    window[name + "App"] = instance;
  },

  get(name) {
    return this.editors[name];
  },
};

window.AppRegistry = AppRegistry;
export default AppRegistry;
