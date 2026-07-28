class ArrayAlgorithms {
    /**
     * Fonction utilitaire pour créer une "photo" de l'état actuel
     */
    static createFrame(array, colors, message) {
        return {
            array: [...array],
            colors: { ...colors },
            message: message
        };
    }

    // --- BUBBLE SORT ---
    static bubbleSort(initialArray) {
        const history = [];
        let arr = [...initialArray];
        let n = arr.length;
        let colors = {}; // Pour stocker les couleurs temporaires (ex: { 0: "#F59E0B" })

        history.push(this.createFrame(arr, colors, "Starting Bubble Sort..."));

        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                // Étape 1 : Comparaison (Orange)
                colors[j] = '#F59E0B';
                colors[j + 1] = '#F59E0B';
                history.push(this.createFrame(arr, colors, `Comparing ${arr[j]} and ${arr[j+1]}`));

                if (arr[j] > arr[j + 1]) {
                    // Étape 2 : Échange nécessaire (Rouge)
                    colors[j] = '#EF4444';
                    colors[j + 1] = '#EF4444';
                    history.push(this.createFrame(arr, colors, `${arr[j]} > ${arr[j+1]}, swapping...`));

                    // On fait l'échange mathématiquement
                    let temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                    
                    history.push(this.createFrame(arr, colors, `Swapped!`));
                }
                
                // On nettoie les couleurs pour la prochaine boucle
                delete colors[j];
                delete colors[j + 1];
            }
            // L'élément tout à la fin est maintenant trié (Vert)
            colors[n - i - 1] = '#10B981';
        }
        // Le premier élément est garanti d'être trié à la fin
        colors[0] = '#10B981';
        history.push(this.createFrame(arr, colors, "Bubble Sort complete!"));

        return history;
    }

    // --- INSERTION SORT ---
    static insertionSort(initialArray) {
        const history = [];
        let arr = [...initialArray];
        let n = arr.length;
        let colors = {};

        history.push(this.createFrame(arr, colors, "Starting Insertion Sort..."));
        
        colors[0] = '#10B981'; // Le premier élément est virtuellement trié

        for (let i = 1; i < n; i++) {
            let key = arr[i];
            colors[i] = '#F59E0B'; // Élément en cours de traitement (Orange)
            history.push(this.createFrame(arr, colors, `Inserting element ${key} into sorted portion...`));

            let j = i - 1;
            while (j >= 0 && arr[j] > key) {
                colors[j] = '#EF4444'; // Élément décalé (Rouge)
                history.push(this.createFrame(arr, colors, `${arr[j]} > ${key}. Shifting ${arr[j]} to the right.`));

                arr[j + 1] = arr[j];
                
                // Remise en vert de la portion triée
                colors[j + 1] = '#10B981';
                j--;
            }

            arr[j + 1] = key;
            colors[j + 1] = '#10B981';
            
            // Harmoniser la couleur verte sur tout le sous-tableau
            for (let k = 0; k <= i; k++) {
                colors[k] = '#10B981';
            }
            
            history.push(this.createFrame(arr, colors, `Element ${key} inserted.`));
        }

        history.push(this.createFrame(arr, colors, "Insertion Sort complete!"));
        return history;
    }
}