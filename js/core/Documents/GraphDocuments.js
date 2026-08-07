export class GraphDocument {
  constructor() {
    this.nodes = [];
    this.edges = [];
    this.metadata = {
      directed: false,
      weighted: false,
    };
  }

  addNode(node) {
    // node doit ressembler à { id: 'n1', x: 100, y: 150, label: 'A' }
    this.nodes.push(node);
  }

  removeNode(nodeId) {
    this.nodes = this.nodes.filter((n) => n.id !== nodeId);
    this.edges = this.edges.filter((e) => e.from !== nodeId && e.to !== nodeId);
  }

  getNode(nodeId) {
    return this.nodes.find((n) => n.id === nodeId);
  }

  // --- MANIPULATION DES ARÊTES ---

  addEdge(edge) {
    // edge doit ressembler à { id: 'e1', from: 'n1', to: 'n2', weight: null }
    this.edges.push(edge);
  }

  removeEdge(edgeId) {
    this.edges = this.edges.filter((e) => e.id !== edgeId);
  }

  // --- UTILITAIRES ---

  clear() {
    this.nodes = [];
    this.edges = [];
  }

  exportJSON() {
    return JSON.stringify({
      nodes: this.nodes,
      edges: this.edges,
      metadata: this.metadata,
    });
  }

  importJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      this.nodes = data.nodes || [];
      this.edges = data.edges || [];
      this.metadata = data.metadata || { directed: false, weighted: false };
    } catch (error) {
      console.error("Erreur lors de l'import du graphe :", error);
    }
  }
}
