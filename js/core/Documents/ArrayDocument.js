// javascript/core/ArrayDocument.js

class ArrayDocument {
    constructor() {
        this.array = [];
        this.initialArray = [];
    }

    setArray(newArray) {
        this.array = [...newArray];
        this.initialArray = [...newArray];
    }

    getArray() {
        return this.array;
    }
}

// L'éditeur sert de "contrôleur" principal pour la page des tableaux, 
// exactement comme GraphEditor le fait pour les graphes.
class ArrayEditor {
    constructor() {
        this.document = new ArrayDocument();
    }
}