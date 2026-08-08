import { Algorithm } from "../core/Algorithm.js";
import { Animation } from "../core/Animation.js";
import { AnimationFrame } from "../core/AnimationFrame.js";

export class PythonGraphAlgorithm extends Algorithm {
  /**
   * @param {PythonEngine} engine - Une instance déjà initialisée de ton PythonEngine
   * @param {string} name - Le nom de l'algorithme
   */
  constructor(engine, name = "Custom Python Script") {
    super(name);
    this.engine = engine;
  }

  /**
   * @param {Object} document - Les données pures { nodes: [...], edges: [...] }
   * @param {string} userCode - Le code tapé par l'utilisateur
   * @returns {Promise<Animation>}
   */
  async run(document, userCode) {
    // 1. On lance le calcul via le moteur Python (Plomberie)
    const rawHistory = await this.engine.run(userCode, document.nodes, document.edges);

    // 2. On prépare notre objet Animation pur (Architecture)
    const animation = new Animation(this.name);

    // 3. MAPPING : On traduit le JSON brut en objets AnimationFrame
    for (const step of rawHistory) {
      // Extraction via décomposition (destructuring)
      const { action, line_id, message, variables, ...payload } = step;

      // "payload" contient tout le reste (id, color, target, path...)
      const frame = new AnimationFrame(
        action,
        payload,
        line_id || null,
        variables || null,
        message || null
      );

      animation.addFrame(frame);
    }

    return animation;
  }
}
