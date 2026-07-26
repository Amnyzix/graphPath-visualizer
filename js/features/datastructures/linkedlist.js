class ListNode {
    constructor(value) {
        this.value = value;
        this.next = null;
    }
}

class LinkedList {
    constructor() {
        this.head = null;
        this.isAnimating = false;
    }

    async append(value) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        this.updateStatus(`Starting append operation for value: ${value}`, 'header');
        const newNode = new ListNode(value);

        if (!this.head) {
            this.head = newNode;
            this.render();
            this.updateStatus(`List was empty. Created head node with value ${value}.`, 'success');
            this.highlightNode(0, '#D1FAE5', '#10B981'); // Vert solide
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
            this.updateStatus(`Node ${index} points to another node. Moving to next.`);
            await sleep(800);
            this.resetNodeStyle(index);
            
            current = current.next;
            index++;
        }

        // On est sur le dernier nœud
        this.highlightNode(index, 'var(--current-fill)', 'var(--current-stroke)');
        this.updateStatus(`Reached the tail (Node ${index}). Appending new node here.`);
        await sleep(1000);
        this.resetNodeStyle(index);

        current.next = newNode;
        this.render();
        
        this.updateStatus(`Successfully appended ${value} at the end of the list.`, 'success');
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

        // Cas spécial : suppression de la tête (Head)
        if (this.head.value === value) {
            this.highlightNode(0, '#FEE2E2', '#EF4444');
            this.updateStatus(`Target found at the Head! Re-routing head pointer.`);
            await sleep(1200);
            
            this.head = this.head.next;
            this.render();
            this.updateStatus(`Node deleted. New head established.`, 'success');
            this.isAnimating = false;
            return;
        }

        let current = this.head;
        let previous = null;
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

                this.updateStatus(`Re-routing pointer from Node ${index - 1} to Node ${index + 1}.`);
                previous.next = current.next;
                
                this.render();
                this.updateStatus(`Node successfully bypassed and removed from memory.`, 'success');
                break;
            }

            this.resetNodeStyle(index);
            previous = current;
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

        // Injection du marqueur de flèche (Arrowhead) pour les pointeurs
        viewport.innerHTML += `
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="var(--circle-stroke)" />
                </marker>
            </defs>
        `;

        const boxWidth = 60;
        const boxHeight = 40;
        const spacing = 100;
        const startX = 50;
        const startY = 150;

        let current = this.head;
        let i = 0;

        while (current !== null) {
            let x = startX + i * (boxWidth + spacing);
            let y = startY;

            // Dessiner la flèche vers le nœud suivant
            if (current.next !== null) {
                let nextX = x + boxWidth;
                let targetX = x + boxWidth + spacing - 5; // -5 pour ne pas rentrer dans la boîte
                viewport.innerHTML += `
                    <line x1="${nextX}" y1="${y + boxHeight / 2}" x2="${targetX}" y2="${y + boxHeight / 2}" 
                          stroke="var(--circle-stroke)" stroke-width="3" marker-end="url(#arrowhead)"></line>
                `;
            } else {
                // Indicateur de fin (Null pointer)
                viewport.innerHTML += `
                    <text x="${x + boxWidth + 15}" y="${y + boxHeight / 2 + 5}" font-family="Nunito" font-weight="700" fill="var(--text-muted)">null</text>
                    <line x1="${x + boxWidth}" y1="${y + boxHeight / 2}" x2="${x + boxWidth + 10}" y2="${y + boxHeight / 2}" stroke="var(--text-muted)" stroke-width="2"></line>
                `;
            }

            // Dessiner la boîte du nœud (Rectangle divisé en deux : Data | Next)
            viewport.innerHTML += `
                <g id="ll-node-${i}" style="transition: transform 0.3s; transform-origin: ${x + boxWidth/2}px ${y + boxHeight/2}px;">
                    <rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}" rx="4" fill="var(--circle-fill)" stroke="var(--circle-stroke)" stroke-width="3"></rect>
                    <line x1="${x + boxWidth * 0.7}" y1="${y}" x2="${x + boxWidth * 0.7}" y2="${y + boxHeight}" stroke="var(--circle-stroke)" stroke-width="2"></line>
                    <text x="${x + boxWidth * 0.35}" y="${y + boxHeight / 2 + 2}" font-family="Nunito" font-size="15" font-weight="800" fill="var(--text-primary)" text-anchor="middle" dominant-baseline="middle">${current.value}</text>
                    <circle cx="${x + boxWidth * 0.85}" cy="${y + boxHeight / 2}" r="3" fill="var(--circle-stroke)"></circle>
                </g>
            `;

            // Label "Head" ou "Tail"
            if (i === 0) {
                viewport.innerHTML += `<text x="${x + boxWidth / 2}" y="${y - 15}" font-family="Nunito" font-size="12" font-weight="800" fill="var(--brand-main)" text-anchor="middle">HEAD</text>`;
            }

            current = current.next;
            i++;
        }
    }

    highlightNode(index, fill, stroke) {
        const group = document.getElementById(`ll-node-${index}`);
        if (group) {
            const rect = group.querySelector('rect');
            rect.style.fill = fill;
            rect.style.stroke = stroke;
            group.style.transform = 'scale(1.1)';
        }
    }

    resetNodeStyle(index) {
        const group = document.getElementById(`ll-node-${index}`);
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
            if (infoPanel.style.overflowY !== 'auto') {
                infoPanel.style.maxHeight = '300px';
                infoPanel.style.overflowY = 'auto';
                infoPanel.style.display = 'flex';
                infoPanel.style.flexDirection = 'column';
                infoPanel.style.gap = '8px';
                infoPanel.style.paddingRight = '5px';
                infoPanel.innerHTML = ''; 
            }

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

// Global Engine Instance
const linkedListEngine = new LinkedList();

async function appendLLNode() {
    const input = document.getElementById('ds-value-input');
    const val = parseInt(input.value);
    if (!isNaN(val) && !linkedListEngine.isAnimating) {
        await linkedListEngine.append(val);
        input.value = '';
    }
}

async function deleteLLNode() {
    const input = document.getElementById('ds-value-input');
    const val = parseInt(input.value);
    if (!isNaN(val) && !linkedListEngine.isAnimating) {
        await linkedListEngine.deleteValue(val);
        input.value = '';
    }
}

function clearLLDataStructure() {
    if (linkedListEngine.isAnimating) return;
    linkedListEngine.head = null;
    document.getElementById('ds-viewport').innerHTML = '';
    document.getElementById('ds-placeholder-text').style.display = 'block';
    document.getElementById('ds-svg-canvas').style.display = 'none';
    
    const infoPanel = document.getElementById('ds-info-panel');
    if (infoPanel) infoPanel.innerHTML = '';
    
    linkedListEngine.updateStatus('Linked List cleared. Enter a value to start.', 'header');
}