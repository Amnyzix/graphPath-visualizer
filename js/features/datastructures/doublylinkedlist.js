class DoublyListNode {
    constructor(value) {
        this.value = value;
        this.next = null;
        this.prev = null;
    }
}

class DoublyLinkedList {
    constructor() {
        this.head = null;
        this.isAnimating = false;
    }

    async append(value) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        this.updateStatus(`Starting append operation for value: ${value}`, 'header');
        const newNode = new DoublyListNode(value);

        if (!this.head) {
            this.head = newNode;
            this.render();
            this.updateStatus(`List was empty. Created head node with value ${value}.`, 'success');
            this.highlightNode(0, '#D1FAE5', '#10B981'); 
            await sleep(1000);
            this.resetNodeStyle(0);
            this.isAnimating = false;
            return;
        }

        let current = this.head;
        let index = 0;

        this.updateStatus(`Traversing the list to find the tail...`);
        
        while (current.next !== null) {
            this.highlightNode(index, 'var(--current-fill)', 'var(--current-stroke)');
            this.updateStatus(`Node ${index} has a next pointer. Moving forward.`);
            await sleep(800);
            this.resetNodeStyle(index);
            
            current = current.next;
            index++;
        }

        this.highlightNode(index, 'var(--current-fill)', 'var(--current-stroke)');
        this.updateStatus(`Reached the tail (Node ${index}). Wiring new node...`);
        await sleep(1000);

        // Double câblage
        current.next = newNode;
        newNode.prev = current;
        
        this.render();
        this.resetNodeStyle(index);
        
        this.updateStatus(`Successfully appended ${value}. Both 'next' and 'prev' pointers set.`, 'success');
        this.highlightNode(index + 1, '#D1FAE5', '#10B981');
        await sleep(1000);
        this.resetNodeStyle(index + 1);

        this.isAnimating = false;
    }

    async deleteValue(value) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        this.updateStatus(`Starting delete operation for value: ${value}`, 'header');

        if (!this.head) {
            this.updateStatus(`The list is empty. Nothing to delete.`, 'error');
            this.isAnimating = false;
            return;
        }

        let current = this.head;
        let index = 0;
        let found = false;

        while (current !== null) {
            this.highlightNode(index, 'var(--current-fill)', 'var(--current-stroke)');
            this.updateStatus(`Checking Node ${index} (Value: ${current.value})...`);
            await sleep(800);

            if (current.value === value) {
                found = true;
                this.updateStatus(`Target found at Node ${index}!`, 'success');
                this.highlightNode(index, '#FEE2E2', '#EF4444');
                await sleep(1200);

                // Cas 1 : Suppression de la tête
                if (current === this.head) {
                    this.updateStatus(`Removing Head node. Shifting head to the next node.`);
                    this.head = current.next;
                    if (this.head !== null) {
                        this.head.prev = null;
                    }
                } 
                // Cas 2 : Suppression d'un nœud au milieu ou à la fin
                else {
                    this.updateStatus(`Rewiring 'next' and 'prev' pointers to bypass Node ${index}.`);
                    current.prev.next = current.next;
                    if (current.next !== null) {
                        current.next.prev = current.prev;
                    }
                }
                
                this.render();
                this.updateStatus(`Node successfully isolated and removed.`, 'success');
                break;
            }

            this.resetNodeStyle(index);
            current = current.next;
            index++;
        }

        if (!found) {
            this.updateStatus(`Reached the end. Value ${value} not found in the list.`, 'error');
        }

        this.isAnimating = false;
    }

    // --- Layout and Rendering ---

    render() {
        const svg = document.getElementById('ds-svg-canvas');
        const placeholder = document.getElementById('ds-placeholder-text');
        
        if (!this.head) {
            svg.style.display = 'none';
            placeholder.style.display = 'block';
            return;
        }

        svg.style.display = 'block';
        placeholder.style.display = 'none';
        
        const viewport = document.getElementById('ds-viewport');
        viewport.innerHTML = ''; 

        viewport.innerHTML += `
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="var(--circle-stroke)" />
                </marker>
            </defs>
        `;

        const boxWidth = 90;  // Boîte plus large pour les 3 sections
        const boxHeight = 40;
        const spacing = 80;
        const startX = 50;
        const startY = 150;

        let current = this.head;
        let i = 0;

        while (current !== null) {
            let x = startX + i * (boxWidth + spacing);
            let y = startY;

            // 1. Dessiner les flèches vers le nœud suivant
            if (current.next !== null) {
                let nextX = x + boxWidth + spacing;
                
                // Flèche Forward (Next) - Ligne du haut
                viewport.innerHTML += `
                    <line x1="${x + boxWidth - 10}" y1="${y + 12}" x2="${nextX}" y2="${y + 12}" 
                          stroke="var(--circle-stroke)" stroke-width="3" marker-end="url(#arrowhead)"></line>
                `;
                
                // Flèche Backward (Prev) - Ligne du bas (part du nœud suivant vers le nœud actuel)
                viewport.innerHTML += `
                    <line x1="${nextX + 10}" y1="${y + 28}" x2="${x + boxWidth}" y2="${y + 28}" 
                          stroke="var(--circle-stroke)" stroke-width="3" marker-end="url(#arrowhead)"></line>
                `;
            } else {
                // Indicateur Null pour le Tail (Next)
                viewport.innerHTML += `
                    <text x="${x + boxWidth + 20}" y="${y + boxHeight / 2 + 5}" font-family="Nunito" font-weight="700" fill="var(--text-muted)">null</text>
                    <line x1="${x + boxWidth - 10}" y1="${y + boxHeight / 2}" x2="${x + boxWidth + 10}" y2="${y + boxHeight / 2}" stroke="var(--text-muted)" stroke-width="2"></line>
                `;
            }

            // Indicateur Null pour le Head (Prev)
            if (current.prev === null) {
                viewport.innerHTML += `
                    <text x="${x - 25}" y="${y + boxHeight / 2 + 5}" font-family="Nunito" font-weight="700" fill="var(--text-muted)">null</text>
                    <line x1="${x + 10}" y1="${y + boxHeight / 2}" x2="${x - 10}" y2="${y + boxHeight / 2}" stroke="var(--text-muted)" stroke-width="2"></line>
                `;
            }

            // 2. Dessiner la boîte du nœud (Prev | Data | Next)
            viewport.innerHTML += `
                <g id="dll-node-${i}" style="transition: transform 0.3s; transform-origin: ${x + boxWidth/2}px ${y + boxHeight/2}px;">
                    <rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}" rx="4" fill="var(--circle-fill)" stroke="var(--circle-stroke)" stroke-width="3"></rect>
                    
                    <!-- Lignes de séparation -->
                    <line x1="${x + 20}" y1="${y}" x2="${x + 20}" y2="${y + boxHeight}" stroke="var(--circle-stroke)" stroke-width="2"></line>
                    <line x1="${x + 70}" y1="${y}" x2="${x + 70}" y2="${y + boxHeight}" stroke="var(--circle-stroke)" stroke-width="2"></line>
                    
                    <!-- Valeur au centre -->
                    <text x="${x + 45}" y="${y + boxHeight / 2 + 2}" font-family="Nunito" font-size="15" font-weight="800" fill="var(--text-primary)" text-anchor="middle" dominant-baseline="middle">${current.value}</text>
                    
                    <!-- Points de connexion (Prev et Next) -->
                    <circle cx="${x + 10}" cy="${y + boxHeight / 2}" r="3" fill="var(--circle-stroke)"></circle>
                    <circle cx="${x + 80}" cy="${y + boxHeight / 2}" r="3" fill="var(--circle-stroke)"></circle>
                </g>
            `;

            if (i === 0) {
                viewport.innerHTML += `<text x="${x + boxWidth / 2}" y="${y - 15}" font-family="Nunito" font-size="12" font-weight="800" fill="var(--brand-main)" text-anchor="middle">HEAD</text>`;
            }

            current = current.next;
            i++;
        }
    }

    highlightNode(index, fill, stroke) {
        const group = document.getElementById(`dll-node-${index}`);
        if (group) {
            const rect = group.querySelector('rect');
            rect.style.fill = fill;
            rect.style.stroke = stroke;
            group.style.transform = 'scale(1.1)';
        }
    }

    resetNodeStyle(index) {
        const group = document.getElementById(`dll-node-${index}`);
        if (group) {
            const rect = group.querySelector('rect');
            rect.style.fill = 'var(--circle-fill)';
            rect.style.stroke = 'var(--circle-stroke)';
            group.style.transform = 'scale(1)';
        }
    }

    updateStatus(message, type = 'normal') {
        const infoPanel = document.getElementById('ds-info-panel');
        if (infoPanel) {
            // [Le même code de formatage du panneau de logs que dans tes autres structures]
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
}

const doublyLinkedListEngine = new DoublyLinkedList();

async function appendDLLNode() {
    const input = document.getElementById('ds-value-input');
    const val = parseInt(input.value);
    if (!isNaN(val) && !doublyLinkedListEngine.isAnimating) {
        await doublyLinkedListEngine.append(val);
        input.value = '';
    }
}

async function deleteDLLNode() {
    const input = document.getElementById('ds-value-input');
    const val = parseInt(input.value);
    if (!isNaN(val) && !doublyLinkedListEngine.isAnimating) {
        await doublyLinkedListEngine.deleteValue(val);
        input.value = '';
    }
}

function clearDLLDataStructure() {
    if (doublyLinkedListEngine.isAnimating) return;
    doublyLinkedListEngine.head = null;
    document.getElementById('ds-viewport').innerHTML = '';
    document.getElementById('ds-placeholder-text').style.display = 'block';
    document.getElementById('ds-svg-canvas').style.display = 'none';
    
    const infoPanel = document.getElementById('ds-info-panel');
    if (infoPanel) infoPanel.innerHTML = '';
    
    doublyLinkedListEngine.updateStatus('Doubly Linked List cleared. Enter a value to start.', 'header');
}