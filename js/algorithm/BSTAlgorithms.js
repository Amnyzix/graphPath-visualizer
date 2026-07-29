const DSColors = {
    default: { fill: 'var(--circle-fill)', stroke: 'var(--circle-stroke)' },
    current: { fill: 'var(--current-fill)', stroke: 'var(--current-stroke)' },
    visited: { fill: 'var(--visited-fill)', stroke: 'var(--visited-stroke)' },
    error:   { fill: '#FEE2E2', stroke: '#EF4444' }                           
};

class BSTAlgorithms {
    /**
     * Crée une copie profonde de l'arbre pour que chaque frame soit isolée.
     */
    static snapshot(node) {
        if (!node) return null;
        const newNode = { value: node.value, x: node.x, y: node.y };
        newNode.left = this.snapshot(node.left);
        newNode.right = this.snapshot(node.right);
        return newNode;
    }

    /**
     * Crée une frame d'historique.
     */
    static createFrame(root, highlightedNode, message, theme = DSColors.current, visitedSequence = null, traversalType = null) {
        return {
            root: this.snapshot(root),
            highlightedNode,
            message,
            fill: theme.fill,
            stroke: theme.stroke,
            // On copie le tableau pour figer l'état à cet instant précis
            visitedSequence: visitedSequence ? [...visitedSequence] : null, 
            traversalType
        };
    }

    // --- SEARCH ---
    static search(root, value) {
        const history = [];
        let current = root;
        
        history.push(this.createFrame(root, null, `Starting search for value: ${value}`));

        if (!root) {
            history.push(this.createFrame(root, null, `The tree is empty. Value ${value} not found.`, DSColors.error));
            return history;
        }

        while (current !== null) {
            history.push(this.createFrame(root, current.value, `Checking node ${current.value}...`));

            if (value === current.value) {
                history.push(this.createFrame(root, current.value, `Target found! ${value} is in the tree.`, 'var(--visited-fill)', 'var(--visited-stroke)'));
                return history;
            } else if (value < current.value) {
                history.push(this.createFrame(root, current.value, `${value} < ${current.value}. Searching left.`));
                current = current.left;
            } else {
                history.push(this.createFrame(root, current.value, `${value} > ${current.value}. Searching right.`));
                current = current.right;
            }
        }

        history.push(this.createFrame(root, null, `Reached a dead end. Value ${value} not found.`, DSColors.error));
        return history;
    }

    static insert(root, value) {
        const history = [];
        let currentRoot = this.snapshot(root); 
        
        history.push(this.createFrame(currentRoot, null, `Starting insertion of ${value}...`));

        if (!currentRoot) {
            currentRoot = { value, left: null, right: null, x:0, y:0 };
            history.push(this.createFrame(currentRoot, value, `Tree empty. ${value} becomes root.`, DSColors.visited));
            return history;
        }

        let curr = currentRoot;
        while (true) {
            history.push(this.createFrame(currentRoot, curr.value, `Comparing ${value} with ${curr.value}`));

            if (value === curr.value) {
                history.push(this.createFrame(currentRoot, curr.value, `Value ${value} exists!`, DSColors.error));
                break;
            } else if (value < curr.value) {
                if (!curr.left) {
                    curr.left = { value, left: null, right: null, x:0, y:0 };
                    history.push(this.createFrame(currentRoot, value, `Inserted ${value} to the left.`, DSColors.visited));
                    break;
                }
                curr = curr.left;
            } else {
                if (!curr.right) {
                    curr.right = { value, left: null, right: null, x:0, y:0 };
                    history.push(this.createFrame(currentRoot, value, `Inserted ${value} to the right.`, DSColors.visited));
                    break;
                }
                curr = curr.right;
            }
        }
        return history;
    }

    // --- DELETE ---
    static delete(root, value) {
        const history = [];
        let tree = this.snapshot(root); // On travaille sur une copie
        
        history.push(this.createFrame(tree, null, `Starting deletion for: ${value}`));

        // 1. Recherche du nœud
        let parent = null;
        let current = tree;
        let found = false;

        while (current !== null) {
            history.push(this.createFrame(tree, current.value, `Searching for ${value}... Checking ${current.value}.`));
            if (value === current.value) {
                found = true;
                history.push(this.createFrame(tree, current.value, `Target found!`, DSColors.error));
                break;
            }
            parent = current;
            current = (value < current.value) ? current.left : current.right;
        }

        if (!found) {
            history.push(this.createFrame(tree, null, `Value ${value} not found.`, DSColors.error));
            return history;
        }

        // 2. Logique de suppression (simplifiée ici pour la démo)
        if (!current.left || !current.right) {
            let child = current.left ? current.left : current.right;
            if (!parent) tree = child;
            else if (parent.left === current) parent.left = child;
            else parent.right = child;
            history.push(this.createFrame(tree, null, `Node removed.`));
        } else {
            // Cas 2 enfants : Successeur In-order
            history.push(this.createFrame(tree, current.value, `2 children found. Finding successor.`));
            let successorParent = current;
            let successor = current.right;
            while (successor.left) {
                successorParent = successor;
                successor = successor.left;
                history.push(this.createFrame(tree, successor.value, `Moving to successor: ${successor.value}`));
            }
            current.value = successor.value;
            if (successorParent.left === successor) successorParent.left = successor.right;
            else successorParent.right = successor.right;
            history.push(this.createFrame(tree, current.value, `Value updated and successor removed.`));
        }
        return history;
    }

    // --- MIN / MAX ---
    static findMin(root) {
        const history = [];
        let current = root;
        while (current && current.left) {
            history.push(this.createFrame(root, current.value, `Moving left to ${current.left.value}...`));
            current = current.left;
        }
        history.push(this.createFrame(root, current.value, `Minimum found: ${current.value}`, DSColors.visited));
        return history;
    }

    static findMax(root) {
        const history = [];
        let current = root;
        while (current && current.right) {
            history.push(this.createFrame(root, current.value, `Moving right to ${current.right.value}...`));
            current = current.right;
        }
        history.push(this.createFrame(root, current.value, `Maximum found: ${current.value}`, DSColors.visited));
        return history;
    }

    // --- TRAVERSE ---
    // --- TRAVERSE ---
    static traverse(root, type) {
        const history = [];
        let currentRoot = this.snapshot(root);
        const fullOrder = [];
        
        // 1. Calcul de l'ordre complet (Pure logique)
        const getTraverse = (node) => {
            if (!node) return;
            if (type === 'preorder') fullOrder.push(node);
            
            getTraverse(node.left);
            
            if (type === 'inorder') fullOrder.push(node);
            
            getTraverse(node.right);
            
            if (type === 'postorder') fullOrder.push(node);
        };
        
        if (type === 'levelorder') {
            const queue = [currentRoot];
            while (queue.length > 0) {
                const curr = queue.shift();
                if (curr) {
                    fullOrder.push(curr);
                    if (curr.left) queue.push(curr.left);
                    if (curr.right) queue.push(curr.right);
                }
            }
        } else {
            getTraverse(currentRoot);
        }

        // 2. Génération de l'historique (Animation)
        const currentSequence = [];
        
        // Frame d'initialisation
        history.push(this.createFrame(currentRoot, null, `Starting ${type} traversal...`, DSColors.current, currentSequence, type));

        // On ajoute les noeuds un par un dans l'UI
        fullOrder.forEach((node, i) => {
            currentSequence.push(node.value);
            history.push(this.createFrame(currentRoot, node.value, `Visiting ${node.value} (${i+1}/${fullOrder.length})`, DSColors.visited, currentSequence, type));
        });

        // Frame de fin
        history.push(this.createFrame(currentRoot, null, `Traversal Complete! Processed ${fullOrder.length} nodes.`, DSColors.visited, currentSequence, type));
        
        return history;
    }
}