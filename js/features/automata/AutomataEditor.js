const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class AutomataEditor extends CanvasEngine {
    constructor(svgId) {
        super(svgId);
        this.nodeCounter = 0;
        
        this.selectedStateForEdge = null; 
        this.draggingNodeId = null;
        this.isDraggingNode = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.selectedEdgeIndex = null;
        
        this.svg.insertAdjacentHTML('afterbegin', `
            <defs>
                <marker id="auto-arrow" markerUnits="userSpaceOnUse" viewBox="0 -5 10 10" refX="22" refY="0" markerWidth="14" markerHeight="14" orient="auto">
                    <path d="M 0,-4 L 8,0 L 0,4 Z" fill="context-stroke" />
                </marker>
            </defs>
        `);

        this.svg.addEventListener('contextmenu', (e) => e.preventDefault());

        this.svg.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.svg.addEventListener('mouseup', this.onMouseUp.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        
        this.svg.addEventListener('click', (e) => {
            if ((e.target === this.svg || e.target.id === this.svg.id) && this.selectedStateForEdge !== null) {
                this.selectedStateForEdge = null;
                this.selectedEdgeIndex = null;
                this.render();
            }
        });

        this.svg.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            const isBackgroundClick = (e.target === this.svg || e.target === this.container || e.target.id === this.svg.id);

            if (isBackgroundClick) {
                const hadSelection = (this.selectedStateForEdge !== null || this.selectedEdgeIndex !== null);

                this.selectedStateForEdge = null;
                this.selectedEdgeIndex = null;

                if (this.startNode || this.tempEdge) {
                    this.startNode = null;
                    this.tempEdge = null;
                    this.isDrawingEdge = false;
                }

                if (hadSelection || this.tempEdge) {
                    this.render();
                }
            }
        });
    }

    getExportData() {
        return { nodes: this.nodes, edges: this.edges };
    }

    // --- 1. GESTION DU DÉPLACEMENT (DRAG & DROP) ---

    onMouseMove(e) {
        if (this.draggingNodeId) {
            const dx = e.clientX - this.dragStartX;
            const dy = e.clientY - this.dragStartY;
            
            if (Math.hypot(dx, dy) > 3) {
                this.isDraggingNode = true;
            }

            if (this.isDraggingNode) {
                const node = this.nodes.find(n => n.id === this.draggingNodeId);
                if (node) {
                    node.x += dx / this.zoomLevel;
                    node.y += dy / this.zoomLevel;
                    this.render();
                }
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
            }
        }
    }

    onMouseUp(e) {
        if (this.draggingNodeId) {
            if (!this.isDraggingNode) {
                // CLIC SIMPLE
                const nodeId = this.draggingNodeId;
                this.selectedEdgeIndex = null;
                
                if (this.selectedStateForEdge === null) {
                    // 1er Clic : Sélection pour le départ
                    this.selectedStateForEdge = nodeId;
                } else {
                    // 2ème Clic : Création de la transition
                    const fromId = this.selectedStateForEdge;
                    this.selectedStateForEdge = null;
                    this.createEdge(fromId, nodeId);
                }
                this.render(); 
            } else {
                // GLISSER-DÉPLACER TERMINÉ
                this.saveState();
            }
            
            this.draggingNodeId = null;
            this.isDraggingNode = false;
        }
    }

    // --- 2. GESTION DES NŒUDS ---

    createNode(x, y) {
        this.saveState();
        this.nodes.push({
            id: "q" + this.nodeCounter++,
            x: x,
            y: y,
            isInitial: this.nodes.length === 0,
            isFinal: false
        });
        this.render();
    }

    toggleFinalState(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) {
            this.saveState();
            node.isFinal = !node.isFinal;
            this.render();
        }
    }

    setInitialState(nodeId) {
        this.saveState();
        this.nodes.forEach(n => n.isInitial = false);
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) node.isInitial = true;
        this.render();
    }

    // --- 3. GESTION DES TRANSITIONS ---
    // --- WRAPPER DE LA MODALE EN PROMISE ---
    async openLabelModal(defaultValue = "a") {
        return new Promise((resolve) => {
            const modal = document.getElementById('edge-label-modal');
            const input = document.getElementById('edge-label-input');
            const btnSave = document.getElementById('btn-save-edge');
            const btnCancel = document.getElementById('btn-cancel-edge');
            const btnClose = document.getElementById('btn-close-edge'); // Le bouton X

            // Afficher et préparer l'input
            modal.style.display = 'flex'; // flex pour bien centrer via tes styles modal-overlay
            input.value = defaultValue;
            input.focus();
            input.select(); // Surligne le texte pour l'effacer facilement

            // Fonction de nettoyage
            const cleanup = () => {
                modal.style.display = 'none';
                btnSave.onclick = null;
                btnCancel.onclick = null;
                btnClose.onclick = null;
                input.onkeydown = null;
                modal.onmousedown = null; // Nettoyer l'event du clic en dehors
            };

            // Validation
            const confirm = () => {
                cleanup();
                resolve(input.value || "ε"); // Retourne "ε" si vide
            };

            // Annulation
            const cancel = () => {
                cleanup();
                resolve(null);
            };

            // Branchement des clics sur les boutons
            btnSave.onclick = confirm;
            btnCancel.onclick = cancel;
            btnClose.onclick = cancel;

            // NOUVEAU : Fermer si on clique EN DEHORS de la modale (.modal-content)
            modal.onmousedown = (e) => {
                if (e.target === modal) { // S'assure qu'on a cliqué sur l'overlay sombre, pas sur la modale elle-même
                    cancel();
                }
            };

            // Raccourcis clavier
            input.onkeydown = (e) => {
                if (e.key === 'Enter') confirm();
                if (e.key === 'Escape') cancel();
            };
        });
    }

    // --- 3. GESTION DES TRANSITIONS (Modifiées pour être async) ---

    async createEdge(fromId, toId) {
        // Remplacement du prompt() par la modale !
        const label = await this.openLabelModal("a");
        
        if (label !== null) {
            this.saveState();
            const trimmedLabel = label.trim() || "ε";
            
            const existingEdge = this.edges.find(e => e.from === fromId && e.to === toId);
            if (existingEdge) {
                const currentLabels = existingEdge.label.split(',').map(s => s.trim());
                if (!currentLabels.includes(trimmedLabel)) {
                    existingEdge.label = existingEdge.label ? `${existingEdge.label},${trimmedLabel}` : trimmedLabel;
                }
            } else {
                this.edges.push({ from: fromId, to: toId, label: trimmedLabel });
            }
            this.render();
        }
    }

    async editEdgeLabel(edgeIndex) {
        const edge = this.edges[edgeIndex];
        if (!edge) return;

        // Remplacement du prompt() par la modale !
        const newLabel = await this.openLabelModal(edge.label);
        
        if (newLabel === null) return; // Annulé

        this.saveState();
        if (newLabel.trim() === '') {
            this.edges.splice(edgeIndex, 1);
        } else {
            edge.label = newLabel.trim();
        }
        this.render();
    }

    // --- 4. RENDU VISUEL ---

    render() {
        this.container.innerHTML = ''; 
        this.container.setAttribute('transform', `translate(${this.panX}, ${this.panY}) scale(${this.zoomLevel})`);

        // A. DESSINER LES TRANSITIONS
        this.edges.forEach((edge, index) => {
            const fromNode = this.nodes.find(n => n.id === edge.from);
            const toNode = this.nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return;

            // 1. CALCULER D D'ABORD !
            let dAttr = '';
            let textX, textY;

            const hasReverseEdge = this.edges.some(e => e.from === edge.to && e.to === edge.from);

            if (edge.from === edge.to) {
                const r = 20;
                dAttr = `M ${fromNode.x - 10},${fromNode.y - r + 2} C ${fromNode.x - 30},${fromNode.y - 70} ${fromNode.x + 30},${fromNode.y - 70} ${fromNode.x + 10},${fromNode.y - r + 2}`;                textX = fromNode.x;
                textX = fromNode.x;
                textY = fromNode.y - 65; 
            } else if (hasReverseEdge) {
                // 2. Arête bidirectionnelle (On dessine une courbe)
                const dx = toNode.x - fromNode.x;
                const dy = toNode.y - fromNode.y;
                const dist = Math.hypot(dx, dy);

                // Vecteur normal (perpendiculaire à la ligne droite)
                const nx = -dy / dist;
                const ny = dx / dist;

                // Puissance de la courbure (en pixels)
                const curveOffset = 35;

                // Point central de la ligne droite
                const mx = (fromNode.x + toNode.x) / 2;
                const my = (fromNode.y + toNode.y) / 2;

                // Point de contrôle de la courbe de Bézier (décalé par le vecteur normal)
                const cx = mx + nx * curveOffset;
                const cy = my + ny * curveOffset;

                // Q = Courbe de Bézier quadratique en SVG
                dAttr = `M ${fromNode.x},${fromNode.y} Q ${cx},${cy} ${toNode.x},${toNode.y}`;
                
                // On place le texte exactement sur le point de contrôle (qui est à l'extérieur de la courbe)
                textX = cx;
                textY = cy - 5;

            } else {
                // 3. Ligne droite classique (Unidirectionnelle)
                dAttr = `M ${fromNode.x},${fromNode.y} L ${toNode.x},${toNode.y}`;
                textX = (fromNode.x + toNode.x) / 2;
                textY = ((fromNode.y + toNode.y) / 2) - 8; 
            }

            // 2. CRÉER LES ÉLÉMENTS AVEC LE D DÉJÀ CALCULÉ
            const edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            edgeGroup.setAttribute('class', 'edge-group');
            edgeGroup.dataset.index = index;
            edgeGroup.style.cursor = 'pointer';

            
            const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            hitPath.setAttribute('d', dAttr); // Maintenant dAttr est rempli
            hitPath.setAttribute('stroke', 'transparent');
            hitPath.setAttribute('stroke-width', '20');
            hitPath.setAttribute('fill', 'none');
            hitPath.style.pointerEvents = 'stroke'; // Important pour que le clic fonctionne sur le "hit area"

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('id', `edge-path-${index}`);
            path.setAttribute('stroke', 'var(--circle-stroke, #334155)');
            path.setAttribute('stroke-width', '3');
            path.setAttribute('fill', 'none');
            path.setAttribute('marker-end', 'url(#auto-arrow)');
            path.setAttribute('d', dAttr); // Maintenant dAttr est rempli
            path.style.pointerEvents = 'none';

            const isSelected = this.selectedEdgeIndex === index;
            path.setAttribute('stroke', isSelected ? '#F59E0B' : 'var(--circle-stroke, #334155)');
            path.setAttribute('stroke-width', isSelected ? '5' : '3');
            path.setAttribute('marker-end', isSelected ? 'url(#auto-arrow-active)' : 'url(#auto-arrow)');

            // 3. TEXTE
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', textX);
            text.setAttribute('y', textY);
            text.setAttribute('fill', 'var(--brand-main, #6366F1)');
            text.setAttribute('font-weight', '800');
            text.setAttribute('font-size', '16px');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('paint-order', 'stroke');
            text.setAttribute('stroke', 'var(--container-bg, #FFFFFF)');
            text.setAttribute('stroke-width', '4');
            text.textContent = edge.label || "ε";

            edgeGroup.appendChild(hitPath);
            edgeGroup.appendChild(path);
            edgeGroup.appendChild(text);
            this.container.appendChild(edgeGroup);



            // 1. CLIC GAUCHE : Ouvre la modale d'édition
            hitPath.addEventListener("click", (e) => {
                e.stopPropagation();
                this.editEdgeLabel(index);
            });

            // 2. CLIC DROIT : Sélectionne l'arête (pour la supprimer)
            hitPath.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                this.selectedEdgeIndex = index;
                this.selectedStateForEdge = null; 
                this.render(); 
            });

            this.container.appendChild(edgeGroup);
        });

        // B. DESSINER LES ÉTATS (NŒUDS)
        this.nodes.forEach(node => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('class', 'node-group');
            group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
            group.dataset.id = node.id;
            group.style.cursor = 'grab';

            if (node.isInitial) {
                const initArrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                initArrow.setAttribute('d', `M -50,0 L -23,0`);
                initArrow.setAttribute('stroke', 'var(--circle-stroke, #334155)');
                initArrow.setAttribute('stroke-width', '3');
                initArrow.setAttribute('marker-end', 'url(#auto-arrow)');
                group.appendChild(initArrow);
            }

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', '20');
            circle.setAttribute('id', `auto-node-${node.id}`);
            
            if (this.selectedStateForEdge === node.id) {
                circle.classList.add('selected-state');
                circle.style.fill = '#FEF3C7';
                circle.style.stroke = '#F59E0B';
                circle.style.strokeWidth = '5px';
            } else {
                circle.style.fill = 'var(--container-bg, #FFFFFF)';
                circle.style.stroke = 'var(--circle-stroke, #334155)';
                circle.style.strokeWidth = '3px';
            }
            
            group.appendChild(circle);

            if (node.isFinal) {
                const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                innerCircle.setAttribute('r', '14');
                innerCircle.setAttribute('fill', 'none');
                innerCircle.setAttribute('id', `auto-node-inner-${node.id}`);
                innerCircle.style.stroke = this.selectedStateForEdge === node.id ? '#F59E0B' : 'var(--circle-stroke, #334155)';
                innerCircle.style.strokeWidth = '2px';
                group.appendChild(innerCircle);
            }

            // Nom du nœud (q0, q1...)
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '0');
            text.setAttribute('y', '0');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'central');
            text.setAttribute('font-weight', '700');
            text.setAttribute('fill', 'var(--text-primary, #334155)');
            text.style.pointerEvents = 'none';
            text.textContent = node.id;
            group.appendChild(text);

            group.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                e.stopPropagation();
                
                this.draggingNodeId = node.id;
                this.isDraggingNode = false;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
            });

            group.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.shiftKey) {
                    this.setInitialState(node.id);
                } else {
                    this.toggleFinalState(node.id);
                }
            });

            this.container.appendChild(group);
        });
    }

    deleteNode(nodeId) {
        this.saveState();
        // 1. Supprimer le nœud
        this.nodes = this.nodes.filter(n => n.id !== nodeId);
        // 2. Supprimer les arêtes entrantes et sortantes
        this.edges = this.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
        
        this.selectedStateForEdge = null;
        
        // Sécurité : Si on a supprimé l'état initial, on donne le rôle au premier venu
        if (this.nodes.length > 0 && !this.nodes.some(n => n.isInitial)) {
            this.nodes[0].isInitial = true;
        }
        
        this.render();
    }

    // Supprimer une arête
    deleteEdge(edgeIndex) {
        this.saveState();
        this.edges.splice(edgeIndex, 1);
        this.selectedEdgeIndex = null;
        this.render();
    }

    // Écouteur global pour le clavier
    onKeyDown(e) {
        // Sécurité vitale : Ne rien faire si l'utilisateur est en train de taper dans un champ texte (Regex, Tester, Modale...)
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

        // Touches Suppr (Delete) ou Retour Arrière (Backspace)
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.selectedStateForEdge !== null) {
                this.deleteNode(this.selectedStateForEdge);
            } else if (this.selectedEdgeIndex !== null && this.selectedEdgeIndex !== undefined) {
                this.deleteEdge(this.selectedEdgeIndex);
            }
        }
    }

    // --- 5. ANIMATION TEST DE MOT (VIA LE MOTEUR NFA) ---

    // Petite fonction utilitaire pour tout remettre en blanc
    resetAllColors() {
        this.nodes.forEach(n => {
            const el = document.getElementById(`auto-node-${n.id}`);
            if (el) {
                el.className.baseVal = '';
                el.style.fill = 'var(--container-bg, #FFFFFF)';
                el.style.stroke = 'var(--circle-stroke, #334155)';
                el.style.strokeWidth = '3px';
            }
            const inner = document.getElementById(`auto-node-inner-${n.id}`);
            if (inner) inner.style.stroke = 'var(--circle-stroke, #334155)';
        });
    }

    // Allume plusieurs nœuds simultanément (Magie du NFA !)
    async highlightMultipleNodes(nodeIds, className, fallbackFill, fallbackStroke) {
        nodeIds.forEach(nodeId => {
            const circle = document.getElementById(`auto-node-${nodeId}`);
            if (circle) {
                circle.className.baseVal = className;
                circle.style.fill = fallbackFill;
                circle.style.stroke = fallbackStroke;
                circle.style.strokeWidth = '4px';

                const inner = document.getElementById(`auto-node-inner-${nodeId}`);
                if (inner) inner.style.stroke = fallbackStroke;
            }
        });
    }

    async testWord(word) {
        this.resetAllColors();

        // 1. Initialiser le simulateur NFA avec les données actuelles
        const simulator = new NFASimulator(this.nodes, this.edges);
        const result = simulator.simulateStepByStep(word);

        if (result.trace.length === 0) {
            return { accepted: false, error: result.error };
        }

        // 2. Jouer l'animation pas à pas à partir de la trace générée
        for (let i = 0; i < result.trace.length; i++) {
            const step = result.trace[i];
            
            // Allumer tous les états actifs à cette étape
            await this.highlightMultipleNodes(step.activeStates, 'state-active', '#FEF3C7', '#F59E0B');
            
            await sleep(500); // Temps de pause

            // On efface les couleurs avant le prochain pas (sauf si c'est la fin)
            if (i < result.trace.length - 1) {
                this.resetAllColors();
            }
        }

        // 3. Affichage visuel du résultat final
        const finalActiveStates = result.finalActiveStates || [];
        
        if (result.accepted) {
            // Surligner en VERT uniquement les états actifs qui sont FINAUX
            const winningStates = finalActiveStates.filter(id => this.nodes.find(n => n.id === id).isFinal);
            await this.highlightMultipleNodes(winningStates, 'state-success', '#D1FAE5', '#10B981');
            return { accepted: true, message: result.message };
        } else {
            // Surligner en ROUGE les états où on a échoué
            const failedStates = result.trace[result.trace.length - 1].activeStates;
            await this.highlightMultipleNodes(failedStates, 'state-error', '#FECACA', '#EF4444');
            return { accepted: false, error: result.error || result.message };
        }
    }

    

   
}
