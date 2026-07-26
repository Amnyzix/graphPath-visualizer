class BinaryHeap {
    constructor(type = 'max') {
        this.heap = [];
        this.positions = [];
        this.isAnimating = false;
        this.type = type; // 'max' ou 'min'
    }

    setType(type) {
        this.type = type;
        this.clear();
    }

    // Helper de comparaison dynamique selon le mode
    compare(a, b) {
        return this.type === 'max' ? a > b : a < b;
    }

    get typeName() {
        return this.type === 'max' ? 'Max-Heap' : 'Min-Heap';
    }

    get rootLabel() {
        return this.type === 'max' ? 'Max' : 'Min';
    }

    async insert(value) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        this.updateStatus(`Starting insertion of ${value} into ${this.typeName}...`, 'header');

        this.heap.push(value);
        let currentIndex = this.heap.length - 1;

        this.updatePositions();
        this.render();

        this.updateStatus(`Inserted ${value} at the bottom of the heap.`);
        this.highlightNode(currentIndex, 'var(--current-fill)', 'var(--current-stroke)');
        await sleep(800);

        // Bubble Up
        while (currentIndex > 0) {
            let parentIndex = Math.floor((currentIndex - 1) / 2);

            this.updateStatus(`Comparing ${this.heap[currentIndex]} with parent ${this.heap[parentIndex]}...`);
            this.highlightNode(parentIndex, 'var(--visited-fill)', 'var(--visited-stroke)');
            await sleep(800);

            if (this.compare(this.heap[currentIndex], this.heap[parentIndex])) {
                const op = this.type === 'max' ? '>' : '<';
                this.updateStatus(`${this.heap[currentIndex]} ${op} ${this.heap[parentIndex]}. Swapping values!`);

                let temp = this.heap[currentIndex];
                this.heap[currentIndex] = this.heap[parentIndex];
                this.heap[parentIndex] = temp;

                this.render();
                this.highlightNode(parentIndex, 'var(--current-fill)', 'var(--current-stroke)');
                this.highlightNode(currentIndex, 'var(--visited-fill)', 'var(--visited-stroke)');
                await sleep(800);

                this.resetNodeStyle(currentIndex);
                currentIndex = parentIndex;
            } else {
                this.updateStatus(`Heap property satisfied.`, 'success');
                this.resetNodeStyle(parentIndex);
                break;
            }
        }

        this.render();
        this.highlightNode(currentIndex, '#D1FAE5', '#10B981');
        await sleep(800);
        this.resetNodeStyle(currentIndex);

        this.isAnimating = false;
    }

    async extractRoot() {
        if (this.isAnimating) return;
        this.isAnimating = true;

        if (this.heap.length === 0) {
            this.updateStatus(`The heap is empty. Nothing to extract.`, 'error');
            this.isAnimating = false;
            return;
        }

        this.updateStatus(`Starting Extract ${this.rootLabel} operation...`, 'header');

        const rootVal = this.heap[0];
        this.highlightNode(0, '#FEE2E2', '#EF4444');
        this.updateStatus(`Removing the root node (${rootVal}).`);
        await sleep(1000);

        const lastVal = this.heap.pop();

        if (this.heap.length > 0) {
            this.heap[0] = lastVal;
            this.updateStatus(`Moving last element (${lastVal}) to root.`);
            this.updatePositions();
            this.render();
            this.highlightNode(0, 'var(--current-fill)', 'var(--current-stroke)');
            await sleep(800);

            // Bubble Down
            let currentIndex = 0;
            while (true) {
                let left = 2 * currentIndex + 1;
                let right = 2 * currentIndex + 2;
                let target = currentIndex;

                if (left < this.heap.length && this.compare(this.heap[left], this.heap[target])) {
                    target = left;
                }
                if (right < this.heap.length && this.compare(this.heap[right], this.heap[target])) {
                    target = right;
                }

                if (target !== currentIndex) {
                    this.updateStatus(`Swapping ${this.heap[currentIndex]} with higher priority child ${this.heap[target]}.`);

                    let temp = this.heap[currentIndex];
                    this.heap[currentIndex] = this.heap[target];
                    this.heap[target] = temp;

                    this.render();
                    this.highlightNode(target, 'var(--current-fill)', 'var(--current-stroke)');
                    await sleep(800);

                    currentIndex = target;
                } else {
                    this.updateStatus(`Node satisfies heap property. Restoration complete!`, 'success');
                    break;
                }
            }
        } else {
            this.updateStatus(`Extracted last node. Heap is now empty.`, 'success');
            this.updatePositions();
            this.render();
        }

        this.resetNodeStyle(currentIndex);
        this.isAnimating = false;
    }

    async deleteValue(value) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        this.updateStatus(`Starting deletion for value: ${value}`, 'header');

        if (this.heap.length === 0) {
            this.updateStatus(`The heap is empty.`, 'error');
            this.isAnimating = false;
            return;
        }

        // Étape 1 : Recherche (Recherche visuelle simple)
        let targetIndex = -1;
        this.updateStatus(`Searching the array for ${value}...`);
        
        for (let i = 0; i < this.heap.length; i++) {
            this.highlightNode(i, 'var(--current-fill)', 'var(--current-stroke)');
            await sleep(400);
            
            if (this.heap[i] === value) {
                targetIndex = i;
                this.updateStatus(`Target found at index ${i}!`, 'success');
                this.highlightNode(i, '#FEE2E2', '#EF4444'); // Surbrillance rouge pour suppression
                await sleep(1000);
                break;
            }
            this.resetNodeStyle(i);
        }

        if (targetIndex === -1) {
            this.updateStatus(`Value ${value} not found in the heap.`, 'error');
            this.isAnimating = false;
            return;
        }

        // Étape 2 : Remplacement par le dernier élément
        const lastIndex = this.heap.length - 1;
        if (targetIndex !== lastIndex) {
            this.updateStatus(`Swapping target with the last element (${this.heap[lastIndex]}).`);
            
            let temp = this.heap[targetIndex];
            this.heap[targetIndex] = this.heap[lastIndex];
            this.heap[lastIndex] = temp;

            this.render();
            this.highlightNode(targetIndex, 'var(--current-fill)', 'var(--current-stroke)');
            this.highlightNode(lastIndex, '#FEE2E2', '#EF4444');
            await sleep(1000);
        }

        // Étape 3 : Suppression (Pop)
        this.updateStatus(`Removing the target node from memory.`);
        this.heap.pop();
        this.updatePositions();
        this.render();
        await sleep(800);

        // Étape 4 : Restauration (Bubble Up OU Bubble Down)
        if (targetIndex < this.heap.length) {
            let currentIndex = targetIndex;
            let parentIndex = Math.floor((currentIndex - 1) / 2);

            // Condition A : Doit-il monter (Bubble Up) ?
            if (currentIndex > 0 && this.compare(this.heap[currentIndex], this.heap[parentIndex])) {
                this.updateStatus(`New node violates parent property. Bubbling UP!`);
                
                while (currentIndex > 0) {
                    parentIndex = Math.floor((currentIndex - 1) / 2);
                    if (this.compare(this.heap[currentIndex], this.heap[parentIndex])) {
                        this.updateStatus(`Swapping with parent...`);
                        let temp = this.heap[currentIndex];
                        this.heap[currentIndex] = this.heap[parentIndex];
                        this.heap[parentIndex] = temp;

                        this.render();
                        this.highlightNode(parentIndex, 'var(--current-fill)', 'var(--current-stroke)');
                        await sleep(800);
                        currentIndex = parentIndex;
                    } else {
                        break;
                    }
                }
            } 
            // Condition B : Doit-il descendre (Bubble Down) ?
            else {
                this.updateStatus(`Checking if node needs to bubble DOWN...`);
                
                while (true) {
                    let left = 2 * currentIndex + 1;
                    let right = 2 * currentIndex + 2;
                    let target = currentIndex;

                    if (left < this.heap.length && this.compare(this.heap[left], this.heap[target])) {
                        target = left;
                    }
                    if (right < this.heap.length && this.compare(this.heap[right], this.heap[target])) {
                        target = right;
                    }

                    if (target !== currentIndex) {
                        this.updateStatus(`Swapping with higher priority child...`);
                        let temp = this.heap[currentIndex];
                        this.heap[currentIndex] = this.heap[target];
                        this.heap[target] = temp;

                        this.render();
                        this.highlightNode(target, 'var(--current-fill)', 'var(--current-stroke)');
                        await sleep(800);
                        currentIndex = target;
                    } else {
                        break;
                    }
                }
            }
            this.updateStatus(`Heap property restored!`, 'success');
            this.resetNodeStyle(currentIndex);
        } else {
            this.updateStatus(`Deleted the last node. Heap property maintained.`, 'success');
        }

        this.isAnimating = false;
    }

    async bulkInsert(count = 7) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        this.updateStatus(`Generating random ${this.typeName} with ${count} nodes...`, 'header');

        this.heap = [];

        const uniqueValues = new Set();
        while (uniqueValues.size < count) {
            uniqueValues.add(Math.floor(Math.random() * 99) + 1);
        }
        const valuesArray = Array.from(uniqueValues);

        for (let value of valuesArray) {
            this.heap.push(value);
            let curr = this.heap.length - 1;
            while (curr > 0) {
                let parent = Math.floor((curr - 1) / 2);
                if (this.compare(this.heap[curr], this.heap[parent])) {
                    let temp = this.heap[curr];
                    this.heap[curr] = this.heap[parent];
                    this.heap[parent] = temp;
                    curr = parent;
                } else {
                    break;
                }
            }
        }

        this.updatePositions(); // Repositionnement indispensable
        this.render();

        this.updateStatus(`Successfully generated a valid ${this.typeName}.`, 'success');
        this.isAnimating = false;
    }

    async search(value) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        this.updateStatus(`Searching for value ${value} in ${this.typeName}...`, 'header');

        if (this.heap.length === 0) {
            this.updateStatus(`The heap is empty.`, 'error');
            this.isAnimating = false;
            return;
        }

        let queue = [0];
        let found = false;

        while (queue.length > 0) {
            let currentIndex = queue.shift();

            this.highlightNode(currentIndex, 'var(--current-fill)', 'var(--current-stroke)');
            this.updateStatus(`Checking node at index ${currentIndex} (${this.heap[currentIndex]})...`);
            await sleep(800);

            if (this.heap[currentIndex] === value) {
                this.updateStatus(`Found ${value} at index ${currentIndex}!`, 'success');
                this.highlightNode(currentIndex, '#D1FAE5', '#10B981');
                await sleep(1500);
                this.resetNodeStyle(currentIndex);
                found = true;
                break;
            }

            // Élagage optimisé :
            // Max-Heap : Si value > nœud actuel, inutile de chercher dans les enfants
            // Min-Heap : Si value < nœud actuel, inutile de chercher dans les enfants
            const pruneCondition = this.type === 'max' ? (value > this.heap[currentIndex]) : (value < this.heap[currentIndex]);

            if (pruneCondition) {
                this.updateStatus(`Value violates subtree property. Pruning children.`);
                this.highlightNode(currentIndex, '#FEE2E2', '#EF4444');
                await sleep(800);
            } else {
                let left = 2 * currentIndex + 1;
                let right = 2 * currentIndex + 2;
                if (left < this.heap.length) queue.push(left);
                if (right < this.heap.length) queue.push(right);
            }

            this.resetNodeStyle(currentIndex);
        }

        if (!found) {
            this.updateStatus(`Value ${value} not found in the heap.`, 'error');
        }

        this.isAnimating = false;
    }

    updatePositions() {
        const svgCanvas = document.getElementById('ds-svg-canvas');
        const canvasWidth = svgCanvas.clientWidth || 800;
        this.positions = [];
        this._calculatePosition(0, canvasWidth / 2, 60, canvasWidth / 4);
    }

    _calculatePosition(index, x, y, horizontalOffset) {
        if (index >= this.heap.length) return;
        this.positions[index] = { x, y };

        this._calculatePosition(2 * index + 1, x - horizontalOffset, y + 80, Math.max(horizontalOffset / 2, 40));
        this._calculatePosition(2 * index + 2, x + horizontalOffset, y + 80, Math.max(horizontalOffset / 2, 40));
    }

    render() {
        const svg = document.getElementById('ds-svg-canvas');
        const placeholder = document.getElementById('ds-placeholder-text');

        if (this.heap.length === 0) {
            svg.style.display = 'none';
            placeholder.style.display = 'block';
            return;
        }

        svg.style.display = 'block';
        placeholder.style.display = 'none';

        const viewport = document.getElementById('ds-viewport');
        viewport.innerHTML = '';

        for (let i = 0; i < this.heap.length; i++) {
            let leftChild = 2 * i + 1;
            let rightChild = 2 * i + 2;

            if (leftChild < this.heap.length) {
                viewport.innerHTML += `<line x1="${this.positions[i].x}" y1="${this.positions[i].y}" x2="${this.positions[leftChild].x}" y2="${this.positions[leftChild].y}" stroke="var(--circle-stroke)" stroke-width="3"></line>`;
            }
            if (rightChild < this.heap.length) {
                viewport.innerHTML += `<line x1="${this.positions[i].x}" y1="${this.positions[i].y}" x2="${this.positions[rightChild].x}" y2="${this.positions[rightChild].y}" stroke="var(--circle-stroke)" stroke-width="3"></line>`;
            }
        }

        for (let i = 0; i < this.heap.length; i++) {
            viewport.innerHTML += `
                <g id="heap-node-${i}" transform="translate(${this.positions[i].x}, ${this.positions[i].y})">
                    <circle r="20" fill="var(--circle-fill)" stroke="var(--circle-stroke)" stroke-width="3" style="transition: fill 0.3s, stroke 0.3s, transform 0.3s; transform-origin: center;"></circle>
                    <text y="2" font-family="Nunito" font-size="15" font-weight="800" fill="var(--text-primary)" text-anchor="middle" dominant-baseline="middle">${this.heap[i]}</text>
                </g>
            `;
        }
    }

    highlightNode(index, fill, stroke) {
        if (index >= this.heap.length) return;
        const group = document.getElementById(`heap-node-${index}`);
        if (group) {
            const circle = group.querySelector('circle');
            circle.style.fill = fill;
            circle.style.stroke = stroke;
        }
    }

    resetNodeStyle(index) {
        if (index >= this.heap.length) return;
        const group = document.getElementById(`heap-node-${index}`);
        if (group) {
            const circle = group.querySelector('circle');
            circle.style.fill = 'var(--circle-fill)';
            circle.style.stroke = 'var(--circle-stroke)';
        }
    }

    updateStatus(message, type = 'normal') {
        const infoPanel = document.getElementById('ds-info-panel');
        if (infoPanel) {
            const msgDiv = document.createElement('div');
            msgDiv.style.padding = '8px 12px';
            msgDiv.style.borderRadius = '6px';
            msgDiv.style.fontSize = '0.85rem';
            msgDiv.style.lineHeight = '1.4';
            msgDiv.style.animation = 'modalPop 0.2s ease-out';

            if (type === 'header') {
                msgDiv.style.background = 'var(--brand-main)';
                msgDiv.style.color = 'white';
                msgDiv.style.fontWeight = '800';
                msgDiv.innerHTML = `<i class="fa-solid fa-play" style="margin-right: 8px;"></i> ${message}`;
            } else if (type === 'success') {
                msgDiv.style.background = '#D1FAE5';
                msgDiv.style.borderLeft = '4px solid #10B981';
                msgDiv.style.color = 'var(--text-primary)';
                msgDiv.innerHTML = `<i class="fa-solid fa-check" style="color: #10B981; margin-right: 8px;"></i> ${message}`;
            } else if (type === 'error') {
                msgDiv.style.background = '#FEE2E2';
                msgDiv.style.borderLeft = '4px solid #EF4444';
                msgDiv.style.color = 'var(--text-primary)';
                msgDiv.innerHTML = `<i class="fa-solid fa-xmark" style="color: #EF4444; margin-right: 8px;"></i> ${message}`;
            } else {
                msgDiv.style.background = 'var(--brand-light)';
                msgDiv.style.borderLeft = '4px solid var(--brand-main)';
                msgDiv.style.color = 'var(--text-primary)';
                msgDiv.innerHTML = `<i class="fa-solid fa-arrow-right" style="color: var(--brand-main); margin-right: 8px;"></i> ${message}`;
            }

            infoPanel.appendChild(msgDiv);
            infoPanel.scrollTop = infoPanel.scrollHeight;
        }
    }

    clear() {
        if (this.isAnimating) return;
        this.heap = [];
        const viewport = document.getElementById('ds-viewport');
        if (viewport) viewport.innerHTML = '';
        document.getElementById('ds-placeholder-text').style.display = 'block';
        document.getElementById('ds-svg-canvas').style.display = 'none';

        const infoPanel = document.getElementById('ds-info-panel');
        if (infoPanel) infoPanel.innerHTML = '';

        this.updateStatus(`${this.typeName} cleared.`, 'header');
    }
}

// Global Engine Instance
const heapEngine = new BinaryHeap('max');

async function insertHeapNode() {
    const input = document.getElementById('ds-value-input');
    const val = parseInt(input.value);
    if (!isNaN(val) && !heapEngine.isAnimating) {
        await heapEngine.insert(val);
        input.value = '';
    }
}

async function extractHeapRoot() {
    if (!heapEngine.isAnimating) {
        await heapEngine.extractRoot();
    }
}

async function searchHeapNode() {
    const input = document.getElementById('ds-value-input');
    const val = parseInt(input.value);
    if (!isNaN(val) && !heapEngine.isAnimating) {
        await heapEngine.search(val);
    }
}

async function generateRandomHeap() {
    if (!heapEngine.isAnimating) {
        await heapEngine.bulkInsert(7);
    }
}

function clearHeapDataStructure() {
    heapEngine.clear();
}

async function deleteHeapNode() {
    const input = document.getElementById('ds-value-input');
    const val = parseInt(input.value);
    
    if (!isNaN(val) && !heapEngine.isAnimating) {
        // Optionnel : Bloquer le bouton Delete le temps de l'animation
        const deleteBtn = document.querySelectorAll('#ds-dynamic-controls button')[2];
        const originalHtml = deleteBtn.innerHTML;
        deleteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';
        deleteBtn.disabled = true;

        await heapEngine.deleteValue(val);
        
        input.value = '';
        deleteBtn.innerHTML = originalHtml;
        deleteBtn.disabled = false;
    }
}