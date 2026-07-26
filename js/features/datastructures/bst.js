class BSTNode {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
        this.x = 0;
        this.y = 0;
    }
}

class BinarySearchTree {
    constructor() {
        this.root = null;
        this.isAnimating = false; // Lock to prevent multiple simultaneous insertions
    }

    async insert(value) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        this.updateStatus(`Starting insertion for value: ${value}`, 'header');
        
        const newNode = new BSTNode(value);

        if (!this.root) {
            this.root = newNode;
            this.updatePositions();
            this.render();
            this.updateStatus(`Tree is empty. Inserted ${value} as the root node.`, 'success');
            this.isAnimating = false;
            return;
        }

        let current = this.root;
        this.updatePositions();
        this.render();

        while (true) {
            this.highlightNode(current.value, 'var(--current-fill)', 'var(--current-stroke)');
            this.updateStatus(`Comparing ${value} with ${current.value}...`);
            await sleep(800);

            // NOUVEAU : Gestion des doublons
            if (value === current.value) {
                this.updateStatus(`Value ${value} already exists! Insertion cancelled.`, 'error');
                // Petit effet d'erreur (rouge) sur le nœud existant
                this.highlightNode(current.value, 'rgba(239, 68, 68, 0.15)', '#EF4444'); 
                await sleep(1500);
                this.resetNodeStyle(current.value);
                break; // On arrête l'insertion
            } 
            else if (value < current.value) {
                this.updateStatus(`${value} < ${current.value}. Moving to the left branch.`);
                await sleep(600);
                this.resetNodeStyle(current.value);

                if (!current.left) {
                    current.left = newNode;
                    this.updateStatus(`Found empty spot! Inserted ${value} to the left of ${current.value}.`, 'success');
                    break;
                } else {
                    current = current.left;
                }
            } else {
                // Modifié ici : ce n'est plus "greater or equal", mais juste "greater"
                this.updateStatus(`${value} > ${current.value}. Moving to the right branch.`);
                await sleep(600);
                this.resetNodeStyle(current.value);

                if (!current.right) {
                    current.right = newNode;
                    this.updateStatus(`Found empty spot! Inserted ${value} to the right of ${current.value}.`, 'success');
                    break;
                } else {
                    current = current.right;
                }
            }
        }

        this.updatePositions();
        this.render();
        
        // On ne fait l'animation de succès finale que si le noeud n'était pas un doublon
        if (value !== current.value) {
            this.highlightNode(value, 'var(--visited-fill)', 'var(--visited-stroke)');
            await sleep(1000);
            this.resetNodeStyle(value);
        }
        
        this.isAnimating = false;
    }

    async bulkInsert(count = 7) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        this.updateStatus(`Generating a random tree with ${count} nodes...`, 'header');

        // Étape 1 : Vider l'arbre actuel
        this.root = null;
        document.getElementById('ds-viewport').innerHTML = '';

        // Étape 2 : Générer des nombres aléatoires uniques (entre 1 et 99)
        const uniqueValues = new Set();
        while (uniqueValues.size < count) {
            uniqueValues.add(Math.floor(Math.random() * 99) + 1);
        }
        const valuesArray = Array.from(uniqueValues);

        // Étape 3 : Insérer silencieusement (sans animation ni pause)
        for (let value of valuesArray) {
            const newNode = new BSTNode(value);
            if (!this.root) {
                this.root = newNode;
                continue;
            }

            let current = this.root;
            while (true) {
                if (value < current.value) {
                    if (!current.left) {
                        current.left = newNode;
                        break;
                    }
                    current = current.left;
                } else {
                    if (!current.right) {
                        current.right = newNode;
                        break;
                    }
                    current = current.right;
                }
            }
        }

        // Étape 4 : Calculer les positions et dessiner l'arbre en une seule fois
        this.updatePositions();
        this.render();
        
        this.updateStatus(`Successfully generated a tree with values: ${valuesArray.join(', ')}`, 'success');
        this.isAnimating = false;
    }

    // --- Layout and Rendering ---

    updatePositions() {
        const svgCanvas = document.getElementById('ds-svg-canvas');
        const canvasWidth = svgCanvas.clientWidth || 800;
        this._calculatePosition(this.root, canvasWidth / 2, 60, canvasWidth / 4);
    }

    _calculatePosition(node, x, y, horizontalOffset) {
        if (!node) return;
        node.x = x;
        node.y = y;
        this._calculatePosition(node.left, x - horizontalOffset, y + 80, Math.max(horizontalOffset / 2, 40));
        this._calculatePosition(node.right, x + horizontalOffset, y + 80, Math.max(horizontalOffset / 2, 40));
    }

    render() {
        const svg = document.getElementById('ds-svg-canvas');
        const placeholder = document.getElementById('ds-placeholder-text');
        
        svg.style.display = 'block';
        placeholder.style.display = 'none';
        
        const viewport = document.getElementById('ds-viewport');
        viewport.innerHTML = ''; 

        this._drawEdges(this.root, viewport);
        this._drawNodes(this.root, viewport);
    }

    _drawEdges(node, viewport) {
        if (!node) return;
        if (node.left) {
            viewport.innerHTML += `<line x1="${node.x}" y1="${node.y}" x2="${node.left.x}" y2="${node.left.y}" stroke="var(--circle-stroke)" stroke-width="3"></line>`;
            this._drawEdges(node.left, viewport);
        }
        if (node.right) {
            viewport.innerHTML += `<line x1="${node.x}" y1="${node.y}" x2="${node.right.x}" y2="${node.right.y}" stroke="var(--circle-stroke)" stroke-width="3"></line>`;
            this._drawEdges(node.right, viewport);
        }
    }

    _drawNodes(node, viewport) {
        if (!node) return;
        viewport.innerHTML += `
            <g id="bst-node-${node.value}" transform="translate(${node.x}, ${node.y})">
                <circle r="20" fill="var(--circle-fill)" stroke="var(--circle-stroke)" stroke-width="3" style="transition: fill 0.3s, stroke 0.3s, transform 0.3s; transform-origin: center;"></circle>
                <text y="2" font-family="Nunito" font-size="15" font-weight="800" fill="var(--text-primary)" text-anchor="middle" dominant-baseline="middle">${node.value}</text>
            </g>
        `;
        this._drawNodes(node.left, viewport);
        this._drawNodes(node.right, viewport);
    }

    // --- Animation Helpers ---

    highlightNode(value, fill, stroke) {
        const group = document.getElementById(`bst-node-${value}`);
        if (group) {
            const circle = group.querySelector('circle');
            circle.style.fill = fill;
            circle.style.stroke = stroke;
            
        }
    }

    resetNodeStyle(value) {
        const group = document.getElementById(`bst-node-${value}`);
        if (group) {
            const circle = group.querySelector('circle');
            circle.style.fill = 'var(--circle-fill)';
            circle.style.stroke = 'var(--circle-stroke)';
            
        }
    }

    updateStatus(message, type = 'normal') {
        const infoPanel = document.getElementById('ds-info-panel');
        if (infoPanel) {
            // Transform the panel into a scrollable log container if it isn't already
            if (infoPanel.style.overflowY !== 'auto') {
                infoPanel.style.maxHeight = '300px';
                infoPanel.style.overflowY = 'auto';
                infoPanel.style.display = 'flex';
                infoPanel.style.flexDirection = 'column';
                infoPanel.style.gap = '8px';
                infoPanel.style.paddingRight = '5px';
                infoPanel.innerHTML = ''; // Clear the initial placeholder
            }

            const msgDiv = document.createElement('div');
            msgDiv.style.padding = '8px 12px';
            msgDiv.style.borderRadius = '6px';
            msgDiv.style.fontSize = '0.85rem';
            msgDiv.style.lineHeight = '1.4';
            msgDiv.style.animation = 'modalPop 0.2s ease-out'; // Reuse your popup animation

            if (type === 'header') {
                msgDiv.style.background = 'var(--brand-main)';
                msgDiv.style.color = 'white';
                msgDiv.style.fontWeight = '800';
                msgDiv.innerHTML = `<i class="fa-solid fa-play" style="margin-right: 8px;"></i> ${message}`;
            } else if (type === 'success') {
                msgDiv.style.background = 'rgba(52, 211, 153, 0.15)'; // Mint green background
                msgDiv.style.borderLeft = '4px solid #10B981';
                msgDiv.style.color = 'var(--text-primary)';
                msgDiv.innerHTML = `<i class="fa-solid fa-check" style="color: #10B981; margin-right: 8px;"></i> ${message}`;
            } else if (type === 'error') {
                msgDiv.style.background = 'rgba(239, 68, 68, 0.15)'; 
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
            
            // Auto-scroll to the bottom
            infoPanel.scrollTop = infoPanel.scrollHeight;
        }
    }

    async search(value) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        this.updateStatus(`Starting search for value: ${value}`, 'header');

        if (!this.root) {
            this.updateStatus(`The tree is empty. Value ${value} not found.`, 'error');
            this.isAnimating = false;
            return;
        }

        let current = this.root;
        let found = false;

        while (current !== null) {
            // Surbrillance du nœud en cours d'inspection
            this.highlightNode(current.value, 'var(--current-fill)', 'var(--current-stroke)');
            this.updateStatus(`Checking node ${current.value}...`);
            await sleep(800);

            if (value === current.value) {
                // Valeur trouvée !
                this.updateStatus(`Target found! ${value} is in the tree.`, 'success');
                this.highlightNode(current.value, 'var(--visited-fill)', 'var(--visited-stroke)');
                await sleep(1500);
                this.resetNodeStyle(current.value);
                found = true;
                break;
            } else if (value < current.value) {
                // On part à gauche
                this.updateStatus(`${value} < ${current.value}. Searching the left branch.`);
                await sleep(600);
                this.resetNodeStyle(current.value);
                current = current.left;
            } else {
                // On part à droite
                this.updateStatus(`${value} > ${current.value}. Searching the right branch.`);
                await sleep(600);
                this.resetNodeStyle(current.value);
                current = current.right;
            }
        }

        if (!found) {
            this.updateStatus(`Reached a dead end. Value ${value} is not in the tree.`, 'error');
        }

        this.isAnimating = false;
    }

    async delete(value) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        this.updateStatus(`Starting deletion for value: ${value}`, 'header');

        if (!this.root) {
            this.updateStatus(`The tree is empty. Cannot delete ${value}.`, 'error');
            this.isAnimating = false;
            return;
        }

        let parent = null;
        let current = this.root;
        let found = false;

        // Étape 1 : Recherche visuelle du nœud à supprimer
        while (current !== null) {
            this.highlightNode(current.value, 'var(--current-fill)', 'var(--current-stroke)');
            this.updateStatus(`Searching for ${value}... Checking node ${current.value}.`);
            await sleep(800);

            if (value === current.value) {
                found = true;
                this.updateStatus(`Target found! Node ${value} is ready for deletion.`, 'success');
                this.highlightNode(current.value, '#FEE2E2', '#EF4444'); // Rouge clair pour marquer la suppression
                await sleep(1000);
                break;
            }

            this.resetNodeStyle(current.value);
            parent = current;

            if (value < current.value) {
                this.updateStatus(`${value} < ${current.value}. Moving to the left.`);
                current = current.left;
            } else {
                this.updateStatus(`${value} > ${current.value}. Moving to the right.`);
                current = current.right;
            }
            await sleep(600);
        }

        if (!found) {
            this.updateStatus(`Value ${value} not found in the tree. Nothing to delete.`, 'error');
            this.isAnimating = false;
            return;
        }

        // Étape 2 : Les 3 cas de suppression
        
        // CAS 1 & 2 : Le nœud a 0 ou 1 enfant
        if (!current.left || !current.right) {
            let child = current.left ? current.left : current.right;
            
            if (!child) {
                this.updateStatus(`Case 1: Node ${current.value} is a leaf (no children). Removing it directly.`);
            } else {
                this.updateStatus(`Case 2: Node ${current.value} has 1 child. Wiring parent directly to this child.`);
            }
            await sleep(1500);

            if (!parent) {
                this.root = child; // Si on supprime la racine (Head)
            } else if (parent.left === current) {
                parent.left = child;
            } else {
                parent.right = child;
            }
        } 
        // CAS 3 : Le nœud a 2 enfants
        else {
            this.updateStatus(`Case 3: Node ${current.value} has 2 children. We must find its In-order Successor.`);
            await sleep(1000);

            let successorParent = current;
            let successor = current.right;

            // On va à droite une fois
            this.highlightNode(successor.value, 'var(--current-fill)', 'var(--current-stroke)');
            this.updateStatus(`Moving right once to ${successor.value}...`);
            await sleep(800);

            // Puis tout à gauche pour trouver le plus petit élément
            while (successor.left !== null) {
                this.resetNodeStyle(successor.value);
                successorParent = successor;
                successor = successor.left;
                
                this.highlightNode(successor.value, 'var(--current-fill)', 'var(--current-stroke)');
                this.updateStatus(`Moving left to find the smallest value... Checking ${successor.value}.`);
                await sleep(800);
            }

            this.updateStatus(`Successor found: ${successor.value}. It is the smallest value in the right subtree.`, 'success');
            this.highlightNode(successor.value, '#D1FAE5', '#10B981'); // Vert pour le successeur
            await sleep(1500);

            this.updateStatus(`Swapping values: Node ${current.value} takes the value ${successor.value}.`);
            current.value = successor.value; 
            
            // On redessine l'arbre pour afficher la nouvelle valeur dans l'ancien nœud
            this.updatePositions();
            this.render();
            
            // On remet les couleurs pour bien comprendre ce qu'on va effacer ensuite
            this.highlightNode(current.value, '#D1FAE5', '#10B981'); 
            this.highlightNode(successor.value, '#FEE2E2', '#EF4444');
            await sleep(1500);

            this.updateStatus(`Removing the original successor node (${successor.value}) from its old position.`);
            
            if (successorParent.left === successor) {
                successorParent.left = successor.right;
            } else {
                successorParent.right = successor.right;
            }
        }

        // Nettoyage final
        this.updatePositions();
        this.render();
        this.updateStatus(`Deletion complete! The tree has re-balanced its pointers.`, 'success');
        this.isAnimating = false;
    }

    async findMin() {
        if (this.isAnimating) return;
        this.isAnimating = true;

        this.updateStatus(`Searching for the Minimum value...`, 'header');

        if (!this.root) {
            this.updateStatus(`The tree is empty. No minimum value exists.`, 'error');
            this.isAnimating = false;
            return;
        }

        let current = this.root;
        this.updateStatus(`Rule: Always go left to find the smallest value.`);
        await sleep(1000);

        while (current !== null) {
            this.highlightNode(current.value, 'var(--current-fill)', 'var(--current-stroke)');
            await sleep(800);

            if (current.left === null) {
                // On est arrivé au bout à gauche
                this.updateStatus(`No more left children. Node ${current.value} is the Minimum!`, 'success');
                this.highlightNode(current.value, '#D1FAE5', '#10B981'); // Vert
                await sleep(2000);
                this.resetNodeStyle(current.value);
                break;
            } else {
                this.updateStatus(`Moving left to ${current.left.value}...`);
                await sleep(600);
                this.resetNodeStyle(current.value);
                current = current.left;
            }
        }

        this.isAnimating = false;
    }

    async findMax() {
        if (this.isAnimating) return;
        this.isAnimating = true;

        this.updateStatus(`Searching for the Maximum value...`, 'header');

        if (!this.root) {
            this.updateStatus(`The tree is empty. No maximum value exists.`, 'error');
            this.isAnimating = false;
            return;
        }

        let current = this.root;
        this.updateStatus(`Rule: Always go right to find the largest value.`);
        await sleep(1000);

        while (current !== null) {
            this.highlightNode(current.value, 'var(--current-fill)', 'var(--current-stroke)');
            await sleep(800);

            if (current.right === null) {
                // On est arrivé au bout à droite
                this.updateStatus(`No more right children. Node ${current.value} is the Maximum!`, 'success');
                this.highlightNode(current.value, '#D1FAE5', '#10B981'); // Vert
                await sleep(2000);
                this.resetNodeStyle(current.value);
                break;
            } else {
                this.updateStatus(`Moving right to ${current.right.value}...`);
                await sleep(600);
                this.resetNodeStyle(current.value);
                current = current.right;
            }
        }

        this.isAnimating = false;
    }

    async traverse(type) {
        if (this.isAnimating) return;

        if (!this.root) {
            this.updateStatus(`The tree is empty. Nothing to traverse.`, 'error');
            return;
        }

        this.isAnimating = true;

        const labels = {
            'inorder': 'In-Order (Left ➔ Root ➔ Right)',
            'preorder': 'Pre-Order (Root ➔ Left ➔ Right)',
            'postorder': 'Post-Order (Left ➔ Right ➔ Root)',
            'levelorder': 'Level-Order / BFS (Level by Level)'
        };

        this.updateStatus(`Starting ${labels[type] || type} traversal...`, 'header');

        // Réinitialisation de la zone d'affichage du résultat
        const outputEl = document.getElementById('ds-traversal-output');
        if (outputEl) {
            outputEl.style.display = 'block';
            outputEl.innerHTML = `<div style="font-weight: 700; margin-bottom: 6px; color: var(--text-primary);"><i class="fa-solid fa-list-ol"></i> Sequence (${type.toUpperCase()}):</div><div id="ds-traversal-badges" style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;"></div>`;
        }

        const badgesContainer = document.getElementById('ds-traversal-badges');
        const visitedOrder = [];

        // 1. Détermination de l'ordre des visites selon l'algorithme choisi
        if (type === 'inorder') {
            const getInOrder = (node) => {
                if (!node) return;
                getInOrder(node.left);
                visitedOrder.push(node.value);
                getInOrder(node.right);
            };
            getInOrder(this.root);
        } else if (type === 'preorder') {
            const getPreOrder = (node) => {
                if (!node) return;
                visitedOrder.push(node.value);
                getPreOrder(node.left);
                getPreOrder(node.right);
            };
            getPreOrder(this.root);
        } else if (type === 'postorder') {
            const getPostOrder = (node) => {
                if (!node) return;
                getPostOrder(node.left);
                getPostOrder(node.right);
                visitedOrder.push(node.value);
            };
            getPostOrder(this.root);
        } else if (type === 'levelorder') {
            const queue = [this.root];
            while (queue.length > 0) {
                const curr = queue.shift();
                visitedOrder.push(curr.value);
                if (curr.left) queue.push(curr.left);
                if (curr.right) queue.push(curr.right);
            }
        }

        // 2. Animation étape par étape du parcours
        for (let i = 0; i < visitedOrder.length; i++) {
            const val = visitedOrder[i];

            // Surbrillance du nœud en cours d'exploration
            this.highlightNode(val, 'var(--current-fill)', 'var(--current-stroke)');
            this.updateStatus(`Visiting node ${val} (${i + 1}/${visitedOrder.length})`);

            // Ajout dynamique du badge dans le panneau de résultat
            if (badgesContainer) {
                if (i > 0) {
                    const arrow = document.createElement('span');
                    arrow.style.color = 'var(--text-muted)';
                    arrow.style.fontWeight = 'bold';
                    arrow.innerHTML = '➔';
                    badgesContainer.appendChild(arrow);
                }

                const badge = document.createElement('span');
                badge.style.padding = '4px 10px';
                badge.style.background = 'var(--brand-main)';
                badge.style.color = 'white';
                badge.style.fontWeight = '800';
                badge.style.borderRadius = '6px';
                badge.style.fontSize = '0.9rem';
                badge.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                badge.style.animation = 'modalPop 0.25s ease-out';
                badge.textContent = val;
                badgesContainer.appendChild(badge);
            }

            await sleep(800);

            // Nœud marqué comme traité (vert clair)
            this.highlightNode(val, '#D1FAE5', '#10B981');
            await sleep(300);
        }

        this.updateStatus(`Traversal complete! Processed ${visitedOrder.length} nodes.`, 'success');

        // Pause avant de remettre les couleurs d'origine des nœuds
        await sleep(1800);
        for (let val of visitedOrder) {
            this.resetNodeStyle(val);
        }

        this.isAnimating = false;
    }
}

const bstEngine = new BinarySearchTree();

async function insertNode() {
    const input = document.getElementById('ds-value-input');
    const val = parseInt(input.value);
    
    if (!isNaN(val) && !bstEngine.isAnimating) {
        const btn = document.querySelector('#ds-dynamic-controls .btn-compile');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Inserting...';
        btn.disabled = true;

        await bstEngine.insert(val);
        
        input.value = '';
        btn.innerHTML = '<i class="fa-solid fa-plus"></i> Insert';
        btn.disabled = false;
    }
}

async function searchNode() {
    const input = document.getElementById('ds-value-input');
    const val = parseInt(input.value);
    
    if (!isNaN(val) && !bstEngine.isAnimating) {
        // On récupère le 2ème bouton (Search) pour le bloquer pendant l'animation
        const searchBtn = document.querySelectorAll('#ds-dynamic-controls button')[1];
        const originalHtml = searchBtn.innerHTML;
        
        searchBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Searching...';
        searchBtn.disabled = true;

        await bstEngine.search(val);
        
        // On remet le bouton à son état normal
        searchBtn.innerHTML = originalHtml;
        searchBtn.disabled = false;
    }
}

function clearDataStructure() {
    if (bstEngine.isAnimating) return;
    bstEngine.root = null;
    document.getElementById('ds-viewport').innerHTML = '';
    document.getElementById('ds-placeholder-text').style.display = 'block';
    document.getElementById('ds-svg-canvas').style.display = 'none';
    
    // Clear the log history
    const infoPanel = document.getElementById('ds-info-panel');
    if (infoPanel) infoPanel.innerHTML = '';
    
    bstEngine.updateStatus('Tree cleared. Enter a value to start building.', 'header');
}

async function deleteNode() {
    const input = document.getElementById('ds-value-input');
    const val = parseInt(input.value);
    
    if (!isNaN(val) && !bstEngine.isAnimating) {
        // Sélection du 3ème bouton (Delete)
        const deleteBtn = document.querySelectorAll('#ds-dynamic-controls button')[2];
        const originalHtml = deleteBtn.innerHTML;
        
        deleteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';
        deleteBtn.disabled = true;

        await bstEngine.delete(val);
        
        input.value = '';
        deleteBtn.innerHTML = originalHtml;
        deleteBtn.disabled = false;
    }
}

async function generateRandomBST() {
    // On génère 7 nœuds par défaut (c'est un bon équilibre visuel)
    if (!bstEngine.isAnimating) {
        await bstEngine.bulkInsert(7);
    }
}

async function findBSTMin() {
    if (!bstEngine.isAnimating) {
        await bstEngine.findMin();
    }
}

async function findBSTMax() {
    if (!bstEngine.isAnimating) {
        await bstEngine.findMax();
    }
}

async function traverseBST(type) {
    if (!bstEngine.isAnimating) {
        await bstEngine.traverse(type);
    }
}