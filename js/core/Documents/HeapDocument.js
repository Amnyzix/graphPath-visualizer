export class HeapDocument {
  constructor(type = "max") {
    this.heap = [];
    this.type = type; // 'max' ou 'min'
  }

  clear() {
    this.heap = [];
  }
}
