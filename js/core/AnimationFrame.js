export class AnimationFrame {
  /**
   * @param {string} action - L'action à effectuer (ex: 'visit', 'color_edge', 'swap')
   * @param {Object} payload - Les données de l'action (ex: { id: 1, color: 'red' })
   * @param {string} lineId - (Optionnel) ID de la ligne de pseudo-code associée
   * @param {Object} variables - (Optionnel) L'état de la mémoire à cet instant
   * @param {string} message - (Optionnel) Un message textuel
   */
  constructor(action, payload, lineId = null, variables = null, message = null) {
    this.action = action;
    this.payload = payload;
    this.lineId = lineId;
    this.variables = variables;
    this.message = message;
  }
}
