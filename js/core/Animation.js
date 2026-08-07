import { AnimationFrame } from "./AnimationFrame.js";

export class Animation {
  /**
   * @param {string} algorithmId - Le nom de l'algo (ex: 'bfs', 'quicksort')
   * @param {Object} metadata - Informations supplémentaires (ex: complexité, temps d'exécution)
   */
  constructor(algorithmId, metadata = {}) {
    this.algorithmId = algorithmId;
    this.metadata = metadata;
    this.frames = [];
  }

  addFrame(frame) {
    if (!(frame instanceof AnimationFrame)) {
      throw new Error("Invalid frame: Must be an instance of AnimationFrame");
    }
    this.frames.push(frame);
  }

  getFrame(index) {
    if (index < 0 || index >= this.frames.length) return null;
    return this.frames[index];
  }

  get length() {
    return this.frames.length;
  }
}
