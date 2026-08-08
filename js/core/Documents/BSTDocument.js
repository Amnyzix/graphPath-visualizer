// javascript/core/BSTDocument.js
export class BSTNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.x = 0;
    this.y = 0;
  }
}

export class BSTDocument {
  constructor() {
    this.root = null;
  }

  // On stocke ici la logique de base qui ne dépend pas de l'animation
  clear() {
    this.root = null;
  }
}
