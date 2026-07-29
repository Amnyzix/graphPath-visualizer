class HeapAlgorithms {
    static compare(a, b, type) {
        return type === 'max' ? a > b : a < b;
    }

    static snapshot(heap) {
        return [...heap]; // Copie pure du tableau
    }

    static createFrame(heap, highlights = [], message = '') {
        return {
            heap: this.snapshot(heap),
            highlights, // Exemple: [{ index: 0, theme: DSColors.current }]
            message
        };
    }

    // --- INSERTION ---
    static insert(heapState, type, value) {
        const history = [];
        let heap = this.snapshot(heapState);
        const typeName = type === 'max' ? 'Max-Heap' : 'Min-Heap';

        history.push(this.createFrame(heap, [], `Starting insertion of ${value} into ${typeName}...`));

        heap.push(value);
        let currentIndex = heap.length - 1;

        history.push(this.createFrame(heap, [{index: currentIndex, theme: DSColors.visited}], `Inserted ${value} at the bottom of the heap.`));

        // Bubble Up
        while (currentIndex > 0) {
            let parentIndex = Math.floor((currentIndex - 1) / 2);

            history.push(this.createFrame(heap, [
                {index: currentIndex, theme: DSColors.current},
                {index: parentIndex, theme: DSColors.visited}
            ], `Comparing ${heap[currentIndex]} with parent ${heap[parentIndex]}...`));

            if (this.compare(heap[currentIndex], heap[parentIndex], type)) {
                const op = type === 'max' ? '>' : '<';
                history.push(this.createFrame(heap, [
                    {index: currentIndex, theme: DSColors.current},
                    {index: parentIndex, theme: DSColors.error} // Rouge bref avant l'échange
                ], `${heap[currentIndex]} ${op} ${heap[parentIndex]}. Swapping values!`));

                let temp = heap[currentIndex];
                heap[currentIndex] = heap[parentIndex];
                heap[parentIndex] = temp;

                history.push(this.createFrame(heap, [
                    {index: parentIndex, theme: DSColors.current},
                    {index: currentIndex, theme: DSColors.visited}
                ], `Swap complete.`));

                currentIndex = parentIndex;
            } else {
                history.push(this.createFrame(heap, [{index: parentIndex, theme: DSColors.visited}], `Heap property satisfied.`));
                break;
            }
        }

        history.push(this.createFrame(heap, [{index: currentIndex, theme: DSColors.visited}], `Insertion finished!`));
        return history;
    }

    // --- EXTRACTION ---
    static extractRoot(heapState, type) {
        const history = [];
        let heap = this.snapshot(heapState);
        const rootLabel = type === 'max' ? 'Max' : 'Min';

        if (heap.length === 0) {
            history.push(this.createFrame(heap, [], `Heap is empty. Nothing to extract.`));
            return history;
        }

        history.push(this.createFrame(heap, [], `Starting Extract ${rootLabel} operation...`));
        
        const rootVal = heap[0];
        history.push(this.createFrame(heap, [{index: 0, theme: DSColors.error}], `Removing the root node (${rootVal}).`));

        const lastVal = heap.pop();
        if (heap.length > 0) {
            heap[0] = lastVal;
            history.push(this.createFrame(heap, [{index: 0, theme: DSColors.current}], `Moved last element (${lastVal}) to root.`));

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
                    history.push(this.createFrame(heap, [
                        {index: currentIndex, theme: DSColors.current},
                        {index: target, theme: DSColors.visited}
                    ], `Swapping ${heap[currentIndex]} with higher priority child ${heap[target]}.`));

                    let temp = heap[currentIndex];
                    heap[currentIndex] = heap[target];
                    heap[target] = temp;

                    history.push(this.createFrame(heap, [
                        {index: target, theme: DSColors.current},
                        {index: currentIndex, theme: DSColors.visited}
                    ], `Swap complete.`));

                    currentIndex = target;
                } else {
                    history.push(this.createFrame(heap, [{index: currentIndex, theme: DSColors.visited}], `Node satisfies heap property. Restoration complete!`));
                    break;
                }
            }
        } else {
            history.push(this.createFrame(heap, [], `Extracted last node. Heap is now empty.`));
        }
        
        return history;
    }
}