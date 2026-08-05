// javascript/datastructures/array.js (ou ArrayAlgorithms.js)

class ArrayAlgorithms {
    /**
     * Nouvelle version de createFrame qui génère un objet AnimationFrame pur
     */
    static createFrame(array, colors, message) {
        // L'action générique pour les tableaux sera 'update_array'
        // Le payload contiendra l'état du tableau et les couleurs
        return new AnimationFrame(
            'update_array', 
            { array: [...array], colors: { ...colors } }, // Payload
            null, // lineId (pas encore géré ici)
            null, // variables (pas encore gérées ici)
            message
        );
    }

    // --- BUBBLE SORT ---
    static bubbleSort(initialArray) {
        // 1. On crée notre objet Animation pur (au lieu d'un tableau vide)
        const animation = new Animation('bubble_sort');
        
        let arr = [...initialArray];
        let n = arr.length;
        let colors = {}; 

        // 2. On utilise animation.addFrame() au lieu de history.push()
        animation.addFrame(this.createFrame(arr, colors, "Starting Bubble Sort..."));

        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                colors[j] = '#F59E0B';
                colors[j + 1] = '#F59E0B';
                animation.addFrame(this.createFrame(arr, colors, `Comparing ${arr[j]} and ${arr[j+1]}`));

                if (arr[j] > arr[j + 1]) {
                    colors[j] = '#EF4444';
                    colors[j + 1] = '#EF4444';
                    animation.addFrame(this.createFrame(arr, colors, `${arr[j]} > ${arr[j+1]}, swapping...`));

                    let temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                    
                    animation.addFrame(this.createFrame(arr, colors, `Swapped!`));
                }
                
                delete colors[j];
                delete colors[j + 1];
            }
            colors[n - i - 1] = '#10B981';
        }
        colors[0] = '#10B981';
        animation.addFrame(this.createFrame(arr, colors, "Bubble Sort complete!"));

        // 3. On retourne l'objet Animation complet !
        return animation;
    }

    // --- INSERTION SORT ---
    static insertionSort(initialArray) {
        const animation = new Animation('insertion_sort');
        let arr = [...initialArray];
        let n = arr.length;
        let colors = {};

        animation.addFrame(this.createFrame(arr, colors, "Starting Insertion Sort..."));
        colors[0] = '#10B981'; 

        for (let i = 1; i < n; i++) {
            let key = arr[i];
            colors[i] = '#F59E0B'; 
            animation.addFrame(this.createFrame(arr, colors, `Inserting element ${key}...`));

            let j = i - 1;
            while (j >= 0 && arr[j] > key) {
                colors[j] = '#EF4444'; 
                animation.addFrame(this.createFrame(arr, colors, `Shifting ${arr[j]} to the right.`));

                arr[j + 1] = arr[j];
                colors[j + 1] = '#10B981';
                j--;
            }

            arr[j + 1] = key;
            colors[j + 1] = '#10B981';
            
            for (let k = 0; k <= i; k++) {
                colors[k] = '#10B981';
            }
            
            animation.addFrame(this.createFrame(arr, colors, `Element ${key} inserted.`));
        }

        animation.addFrame(this.createFrame(arr, colors, "Insertion Sort complete!"));
        return animation;
    }
}