// javascript/utils/ShareManager.js

export class ShareManager {
  /**
   * Encode l'état d'un graphe ou automate dans l'URL
   * @param {Object} data - L'objet contenant { nodes, edges }
   * @param {String} type - 'automata' ou 'graph' pour savoir quel éditeur charger
   */
  static generateShareLink(data, type) {
    const payload = {
      type: type,
      data: data,
    };

    const jsonString = JSON.stringify(payload);
    const compressed = window.LZString.compressToEncodedURIComponent(jsonString);
    return window.location.origin + window.location.pathname + "?data=" + compressed;
  }

  /**
   * Lit et décompresse les données depuis l'URL
   */
  static loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const data = params.get("data");
    if (!data) return null;

    try {
      const decompressed = window.LZString.decompressFromEncodedURIComponent(data);
      return JSON.parse(decompressed);
    } catch (err) {
      console.error("Erreur de décodage:", err);
      return null;
    }
  }
}
