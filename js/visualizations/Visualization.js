class Visualization {
    constructor(editor) {
        this.editor = editor;
        this.document = editor.document;
        // On récupère le canvas SVG (si editor.svg n'existe pas, on fallback)
        this.svg = editor.svg || document.getElementById('canvas');
    }

    init() {
        console.warn("init() must be implemented by subclass");
    }

    applyFrame(frame, history, currentIndex) {
        console.warn("applyFrame() must be implemented by subclass");
    }

    clear() {
        console.warn("clear() must be implemented by subclass");
    }

    destroy() {
        this.clear();
    }
}