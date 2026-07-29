class BSTVisualization extends Visualization {
    constructor(editor) {
        super(editor);
        this.svg = document.getElementById('ds-svg-canvas');
        this.viewport = document.getElementById('ds-viewport');

        console.log("BST init");
    }

    // Redessine tout l'arbre à partir du document
    render() {
        const root = this.editor.document.root;
        console.log(root);
        this.viewport.innerHTML = '';
        
        if (!root) return;

        this.updatePositions(root);
        this._drawEdges(root);
        this._drawNodes(root);
    }

    updatePositions(root) {
        const width = this.svg.clientWidth || 800;
        this._calculatePosition(root, width / 2, 60, width / 4);
    }

    _calculatePosition(node, x, y, offset) {
        if (!node) return;
        node.x = x;
        node.y = y;
        this._calculatePosition(node.left, x - offset, y + 80, Math.max(offset / 2, 40));
        this._calculatePosition(node.right, x + offset, y + 80, Math.max(offset / 2, 40));
    }

    _drawEdges(node) {
        if (!node) return;
        if (node.left) {
            this.viewport.innerHTML += `<line x1="${node.x}" y1="${node.y}" x2="${node.left.x}" y2="${node.left.y}" stroke="var(--circle-stroke)" stroke-width="3"></line>`;
            this._drawEdges(node.left);
        }
        if (node.right) {
            this.viewport.innerHTML += `<line x1="${node.x}" y1="${node.y}" x2="${node.right.x}" y2="${node.right.y}" stroke="var(--circle-stroke)" stroke-width="3"></line>`;
            this._drawEdges(node.right);
        }
    }

    _drawNodes(node) {
        if (!node) return;
        this.viewport.innerHTML += `
            <g id="bst-node-${node.value}" transform="translate(${node.x}, ${node.y})">
                <circle r="20" fill="var(--circle-fill)" stroke="var(--circle-stroke)" stroke-width="3" style="transition: fill 0.3s, stroke 0.3s, transform 0.3s;"></circle>
                <text y="2" font-family="Nunito" font-size="15" font-weight="800" fill="var(--text-primary)" text-anchor="middle" dominant-baseline="middle">${node.value}</text>
            </g>
        `;
        this._drawNodes(node.left);
        this._drawNodes(node.right);
    }

    applyFrame(frame, history, currentIndex) {
        const currentFrame = frame || (history && currentIndex >= 0 ? history[currentIndex] : null);
        
        // On s'assure que le HUD flottant est visible car il contient les logs
        const floatingHud = document.getElementById('floating-hud');
        if (floatingHud) floatingHud.style.display = 'block';

        if (!currentFrame) {
            this.clear();
            return; 
        }
        
        if (currentFrame.root !== undefined) {
            this.editor.document.root = currentFrame.root;
            this.render(); 
        }
        
        if (currentFrame.highlightedNode) {
            const group = document.getElementById(`bst-node-${currentFrame.highlightedNode}`);
            if (group) {
                const circle = group.querySelector('circle');
                circle.style.fill = currentFrame.fill || 'var(--current-fill)';
                circle.style.stroke = currentFrame.stroke || 'var(--current-stroke)';
            }
        }

        // --- GESTION DES BADGES DE PARCOURS (Nouveau) ---
        const traversalOutput = document.getElementById('ds-traversal-output');
        if (traversalOutput) {
            if (currentFrame.visitedSequence) {
                traversalOutput.style.display = 'block';
                
                const labels = {
                    'inorder': 'In-Order', 'preorder': 'Pre-Order',
                    'postorder': 'Post-Order', 'levelorder': 'Level-Order (BFS)'
                };
                const typeName = labels[currentFrame.traversalType] || 'Traversal';
                
                let html = `<div style="font-weight: 700; margin-bottom: 6px; color: var(--text-primary);"><i class="fa-solid fa-list-ol"></i> Sequence (${typeName}):</div>`;
                html += `<div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">`;
                
                currentFrame.visitedSequence.forEach((val, idx) => {
                    if (idx > 0) html += `<span style="color: var(--text-muted); font-weight: bold;">➔</span>`;
                    html += `<span style="padding: 4px 10px; background: var(--brand-main); color: white; font-weight: 800; border-radius: 6px; font-size: 0.9rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${val}</span>`;
                });
                
                html += `</div>`;
                traversalOutput.innerHTML = html;
            } else {
                // Si ce n'est pas une animation de type "Traverse", on cache le panneau des badges
                traversalOutput.style.display = 'none';
                traversalOutput.innerHTML = '';
            }
        }

        // --- GESTION DES LOGS ---
        const infoPanel = document.getElementById('ds-info-panel');
        if (currentFrame.message && infoPanel) {
            infoPanel.innerHTML = '';
            const msgDiv = document.createElement('div');
            msgDiv.style.padding = '8px 12px';
            msgDiv.style.borderRadius = '6px';
            msgDiv.style.fontSize = '0.85rem';
            msgDiv.style.lineHeight = '1.4';
            msgDiv.style.color = 'var(--text-primary)';
            msgDiv.innerHTML = `<i class="fa-solid fa-arrow-right" style="color: var(--brand-main); margin-right: 8px;"></i> ${currentFrame.message}`;
            infoPanel.appendChild(msgDiv);
        }
    }

    clear() {
        this.render();
        const infoPanel = document.getElementById('ds-info-panel');
        if (infoPanel) infoPanel.innerHTML = '';
        const traversalOutput = document.getElementById('ds-traversal-output');
        if (traversalOutput) {
            traversalOutput.style.display = 'none';
            traversalOutput.innerHTML = '';
        }
    }

}