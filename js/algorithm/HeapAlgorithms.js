class HeapAlgorithms {
    static compare(a, b, type) {
        return type === 'max' ? a > b : a < b;
    }

    static snapshot(heap) {
        return [...heap]; 
    }

    // 1. Nouvelle version de createFrame
    static createFrame(heap, highlights = [], message = '') {
        return new AnimationFrame(
            'update_heap', // L'action
            {
                heap: this.snapshot(heap),
                highlights: highlights
            }, // Le Payload
            null, null, message
        );
    }

    // --- INSERTION ---
    static insert(heapState, type, value) {
        // 2. On instancie une Animation
        const animation = new Animation('heap_insert');
        let heap = this.snapshot(heapState);
        const typeName = type === 'max' ? 'Max-Heap' : 'Min-Heap';

        animation.addFrame(this.createFrame(heap, [], `Starting insertion of ${value} into ${typeName}...`));

        heap.push(value);
        let currentIndex = heap.length - 1;

        animation.addFrame(this.createFrame(heap, [{index: currentIndex, theme: DSColors.visited}], `Inserted ${value} at the bottom of the heap.`));

        // Bubble Up
        while (currentIndex > 0) {
            let parentIndex = Math.floor((currentIndex - 1) / 2);

            animation.addFrame(this.createFrame(heap, [
                {index: currentIndex, theme: DSColors.current},
                {index: parentIndex, theme: DSColors.visited}
            ], `Comparing ${heap[currentIndex]} with parent ${heap[parentIndex]}...`));

            if (this.compare(heap[currentIndex], heap[parentIndex], type)) {
                const op = type === 'max' ? '>' : '<';
                animation.addFrame(this.createFrame(heap, [
                    {index: currentIndex, theme: DSColors.current},
                    {index: parentIndex, theme: DSColors.error}
                ], `${heap[currentIndex]} ${op} ${heap[parentIndex]}. Swapping values!`));

                let temp = heap[currentIndex];
                heap[currentIndex] = heap[parentIndex];
                heap[parentIndex] = temp;

                animation.addFrame(this.createFrame(heap, [
                    {index: parentIndex, theme: DSColors.current},
                    {index: currentIndex, theme: DSColors.visited}
                ], `Swap complete.`));

                currentIndex = parentIndex;
            } else {
                animation.addFrame(this.createFrame(heap, [{index: parentIndex, theme: DSColors.visited}], `Heap property satisfied.`));
                break;
            }
        }

        animation.addFrame(this.createFrame(heap, [{index: currentIndex, theme: DSColors.visited}], `Insertion finished!`));
        
        // 3. On retourne l'animation ET le nouveau tas !
        return { animation, newHeap: heap };
    }

    // --- EXTRACTION ---
    static extractRoot(heapState, type) {
        const animation = new Animation('heap_extract');
        let heap = this.snapshot(heapState);
        const rootLabel = type === 'max' ? 'Max' : 'Min';

        if (heap.length === 0) {
            animation.addFrame(this.createFrame(heap, [], `Heap is empty. Nothing to extract.`));
            return { animation, newHeap: heap };
        }

        animation.addFrame(this.createFrame(heap, [], `Starting Extract ${rootLabel} operation...`));
        
        const rootVal = heap[0];
        animation.addFrame(this.createFrame(heap, [{index: 0, theme: DSColors.error}], `Removing the root node (${rootVal}).`));

        const lastVal = heap.pop();
        if (heap.length > 0) {
            heap[0] = lastVal;
            animation.addFrame(this.createFrame(heap, [{index: 0, theme: DSColors.current}], `Moved last element (${lastVal}) to root.`));

            // Bubble Down
            let currentIndex = 0;
            while (true) {
                let left = 2 * currentIndex + 1;
                let right = 2 * currentIndex + 2;
                let target = currentIndex;

                if (left < heap.length && this.compare(heap[left], heap[target], type)) {
                    target = left;
                }
                if (right < heap.length && this.compare(heap[right], heap[target], type)) {
                    target = right;
                }

                if (target !== currentIndex) {
                    animation.addFrame(this.createFrame(heap, [
                        {index: currentIndex, theme: DSColors.current},
                        {index: target, theme: DSColors.visited}
                    ], `Swapping ${heap[currentIndex]} with higher priority child ${heap[target]}.`));

                    let temp = heap[currentIndex];
                    heap[currentIndex] = heap[target];
                    heap[target] = temp;

                    animation.addFrame(this.createFrame(heap, [
                        {index: target, theme: DSColors.current},
                        {index: currentIndex, theme: DSColors.visited}
                    ], `Swap complete.`));

                    currentIndex = target;
                } else {
                    animation.addFrame(this.createFrame(heap, [{index: currentIndex, theme: DSColors.visited}], `Node satisfies heap property. Restoration complete!`));
                    break;
                }
            }
        } else {
            animation.addFrame(this.createFrame(heap, [], `Extracted last node. Heap is now empty.`));
        }
        
        return { animation, newHeap: heap };
    }

    // --- SEARCH ---
    static search(heapState, type, value) {
        const animation = new Animation('heap_search');
        let heap = this.snapshot(heapState);

        animation.addFrame(this.createFrame(heap, [], `Starting search for ${value}...`));

        let foundIndex = -1;
        // Dans un tas, la recherche simple se fait souvent de manière linéaire 
        // (bien qu'on puisse l'optimiser partiellement selon le type de tas)
        for (let i = 0; i < heap.length; i++) {
            animation.addFrame(this.createFrame(heap, [{index: i, theme: DSColors.current}], `Checking index ${i} (value: ${heap[i]})...`));
            
            if (heap[i] === value) {
                foundIndex = i;
                animation.addFrame(this.createFrame(heap, [{index: i, theme: DSColors.visited}], `Target found at index ${i}!`));
                break;
            }
        }

        if (foundIndex === -1) {
            animation.addFrame(this.createFrame(heap, [], `Value ${value} not found in the heap.`));
        }

        // On renvoie l'animation et le tas (inchangé)
        return { animation, newHeap: heap };
    }

    // --- DELETE (Nœud arbitraire) ---
    static delete(heapState, type, value) {
        const animation = new Animation('heap_delete');
        let heap = this.snapshot(heapState);

        animation.addFrame(this.createFrame(heap, [], `Starting deletion of ${value}...`));

        // 1. Trouver l'index de l'élément à supprimer
        let targetIndex = -1;
        for (let i = 0; i < heap.length; i++) {
            animation.addFrame(this.createFrame(heap, [{index: i, theme: DSColors.current}], `Searching for ${value}...`));
            if (heap[i] === value) {
                targetIndex = i;
                animation.addFrame(this.createFrame(heap, [{index: i, theme: DSColors.error}], `Value found at index ${i}.`));
                break;
            }
        }

        if (targetIndex === -1) {
            animation.addFrame(this.createFrame(heap, [], `Value ${value} not found.`));
            return { animation, newHeap: heap };
        }

        // 2. Échanger avec le dernier élément
        const lastIndex = heap.length - 1;
        if (targetIndex !== lastIndex) {
            animation.addFrame(this.createFrame(heap, [
                {index: targetIndex, theme: DSColors.error},
                {index: lastIndex, theme: DSColors.current}
            ], `Swapping with the last element (${heap[lastIndex]}).`));

            let temp = heap[targetIndex];
            heap[targetIndex] = heap[lastIndex];
            heap[lastIndex] = temp;

            animation.addFrame(this.createFrame(heap, [
                {index: targetIndex, theme: DSColors.current},
                {index: lastIndex, theme: DSColors.error}
            ], `Swap complete.`));
        }

        // 3. Supprimer le dernier élément
        const removedValue = heap.pop();
        animation.addFrame(this.createFrame(heap, [{index: targetIndex, theme: DSColors.current}], `Removed ${removedValue} from the heap.`));

        // 4. Rétablir la propriété du Tas (Bubble Up ou Bubble Down)
        if (targetIndex < heap.length) {
            let parentIndex = Math.floor((targetIndex - 1) / 2);
            
            // Si la nouvelle valeur est prioritaire par rapport à son parent, on la remonte (Bubble Up)
            if (targetIndex > 0 && this.compare(heap[targetIndex], heap[parentIndex], type)) {
                animation.addFrame(this.createFrame(heap, [{index: targetIndex, theme: DSColors.current}], `Element might be too prioritized. Bubbling up...`));
                
                let curr = targetIndex;
                while (curr > 0) {
                    let p = Math.floor((curr - 1) / 2);
                    animation.addFrame(this.createFrame(heap, [
                        {index: curr, theme: DSColors.current},
                        {index: p, theme: DSColors.visited}
                    ], `Comparing ${heap[curr]} with parent ${heap[p]}...`));

                    if (this.compare(heap[curr], heap[p], type)) {
                        animation.addFrame(this.createFrame(heap, [
                            {index: curr, theme: DSColors.current},
                            {index: p, theme: DSColors.error}
                        ], `Swapping!`));

                        let t = heap[curr];
                        heap[curr] = heap[p];
                        heap[p] = t;
                        curr = p;
                    } else {
                        break;
                    }
                }
            } 
            // Sinon, on la redescend (Bubble Down)
            else {
                animation.addFrame(this.createFrame(heap, [{index: targetIndex, theme: DSColors.current}], `Element might violate children. Bubbling down...`));
                
                let curr = targetIndex;
                while (true) {
                    let left = 2 * curr + 1;
                    let right = 2 * curr + 2;
                    let target = curr;

                    if (left < heap.length && this.compare(heap[left], heap[target], type)) target = left;
                    if (right < heap.length && this.compare(heap[right], heap[target], type)) target = right;

                    if (target !== curr) {
                        animation.addFrame(this.createFrame(heap, [
                            {index: curr, theme: DSColors.current},
                            {index: target, theme: DSColors.visited}
                        ], `Swapping ${heap[curr]} with child ${heap[target]}.`));

                        let t = heap[curr];
                        heap[curr] = heap[target];
                        heap[target] = t;
                        curr = target;
                    } else {
                        break;
                    }
                }
            }
        }

        animation.addFrame(this.createFrame(heap, [], `Deletion of ${value} finished!`));
        return { animation, newHeap: heap };
    }
}