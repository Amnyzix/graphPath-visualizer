// js/core/Documents/CompressionDocument.js

export class CompressionDocument {
  constructor(text = "ALGOVIZOR COMPRESSION") {
    this.text = text;
    this.frequencies = {};
    this.codes = {};
    this.treeRoot = null;
    this.compressedBitStream = "";
  }

  setText(newText) {
    this.text = newText;
    this.calculateFrequencies();
  }

  calculateFrequencies() {
    this.frequencies = {};
    for (const char of this.text) {
      this.frequencies[char] = (this.frequencies[char] || 0) + 1;
    }
    return this.frequencies;
  }

  getOriginalSizeBytes() {
    // En UTF-8 / ASCII basique : 8 bits par caractère
    return this.text.length * 8;
  }

  toJSON() {
    return {
      text: this.text,
      frequencies: this.frequencies,
      codes: this.codes,
      compressedBitStream: this.compressedBitStream,
    };
  }
}
