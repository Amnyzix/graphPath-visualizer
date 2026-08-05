class HeapVisualization extends Visualization {
    constructor(editor) {
        super(editor);
        this.svg = document.getElementById('ds-svg-canvas');
        this.viewport = document.getElementById('ds-viewport');
        this.positions = [];
    }

    updatePositions(heap) {
        if (!this.svg) return;
        const width = this.svg.clientWidth > 0 ? this.svg.clientWidth : 800;
        this.positions = [];
        this._calculatePosition(heap, 0, width / 2, 60, width / 4);
    }

    _calculatePosition(heap, index, x, y, horizontalOffset) {
        if (index >= heap.length) return;
        this.positions[index] = { x, y };
        this._calculatePosition(heap, 2 * index + 1, x - horizontalOffset, y + 80, Math.max(horizontalOffset / 2, 40));
        this._calculatePosition(heap, 2 * index + 2, x + horizontalOffset, y + 80, Math.max(horizontalOffset / 2, 40));
    }

    render(heap) {
        if (this.viewport) this.viewport.innerHTML = '';
        if (!heap || heap.length === 0) return;

        this.updatePositions(heap);

        // Dessiner les arêtes
        for (let i = 0; i < heap.length; i++) {
            let leftChild = 2 * i + 1;
            let rightChild = 2 * i + 2;

            if (leftChild < heap.length) {
                this.viewport.innerHTML += `<line x1="${this.positions[i].x}" y1="${this.positions[i].y}" x2="${this.positions[leftChild].x}" y2="${this.positions[leftChild].y}" stroke="var(--circle-stroke)" stroke-width="3"></line>`;
            }
            if (rightChild < heap.length) {
                this.viewport.innerHTML += `<line x1="${this.positions[i].x}" y1="${this.positions[i].y}" x2="${this.positions[rightChild].x}" y2="${this.positions[rightChild].y}" stroke="var(--circle-stroke)" stroke-width="3"></line>`;
            }
        }

        // Dessiner les nœuds
        for (let i = 0; i < heap.length; i++) {
            this.viewport.innerHTML += `
                <g id="heap-node-${i}" transform="translate(${this.positions[i].x}, ${this.positions[i].y})">
                    <circle r="20" fill="var(--circle-fill)" stroke="var(--circle-stroke)" stroke-width="3" style="transition: fill 0.3s, stroke 0.3s, transform 0.3s;"></circle>
                    <text y="2" font-family="Nunito" font-size="15" font-weight="800" fill="var(--text-primary)" text-anchor="middle" dominant-baseline="middle">${heap[i]}</text>
                </g>
            `;
        }
    }

    applyFrame(frame, history, currentIndex) {
        const currentFrame = frame || (history ? history[currentIndex] : null);
        
        const floatingHud = document.getElementById('floating-hud');
        if (floatingHud) floatingHud.style.display = 'block';

        // Sécurité : On vérifie l'action
        if (!currentFrame || currentFrame.action !== 'update_heap') {
            this.clear();
            return;
        }

        // --- EXTRACTION DU PAYLOAD ---
        const payload = currentFrame.payload || {};
        const message = currentFrame.message;

        if (payload.heap) {
            this.editor.document.heap = payload.heap;
            this.render(payload.heap);
        }

        // Appliquer les couleurs multiples
        if (payload.highlights) {
            payload.highlights.forEach(hl => {
                const group = document.getElementById(`heap-node-${hl.index}`);
                if (group) {
                    const circle = group.querySelector('circle');
                    circle.style.fill = hl.theme.fill;
                    circle.style.stroke = hl.theme.stroke;
                }
            });
        }

        // Afficher les logs
        const infoPanel = document.getElementById('ds-info-panel');
        if (message && infoPanel) {
            infoPanel.innerHTML = '';
            const msgDiv = document.createElement('div');
            msgDiv.style.padding = '8px 12px';
            msgDiv.style.borderRadius = '6px';
            msgDiv.style.fontSize = '0.85rem';
            msgDiv.style.lineHeight = '1.4';
            msgDiv.style.color = 'var(--text-primary)';
            msgDiv.innerHTML = `<i class="fa-solid fa-arrow-right" style="color: var(--brand-main); margin-right: 8px;"></i> ${message}`;
            infoPanel.appendChild(msgDiv);
        }
    }
    
    clear() {
        this.render(this.editor.document.heap);
        const infoPanel = document.getElementById('ds-info-panel');
        if (infoPanel) infoPanel.innerHTML = '';
    }
}