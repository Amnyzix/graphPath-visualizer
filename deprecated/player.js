


// --- LECTEUR D'ANIMATION ---
let animationHistory = [];
let currentStepIndex = -1;
let playInterval = null;



function loadPlayer(history) {
    pauseAnimation();
    animationHistory = history;
    currentStepIndex = -1;
    document.getElementById('player-controls').style.display = 'flex';
    
    // Ciblage propre du resetGraph
    const app = getActiveGraphEditor();
    if (app) app.resetGraph(); 
    
    updatePlayerUI();
}

/*
function renderStateAtCurrentStep() {
    const app = getActiveGraphEditor();
    if (app) app.resetGraph();

    if (currentStepIndex === -1) {
        if (logDisplay) logDisplay.style.opacity = 0;
        return;
    }

    for (let i = 0; i <= currentStepIndex; i++) {
        const item = animationHistory[i];
        
        // Extraction sécurisée
        const action = typeof item === 'object' ? item.action : null;
        const nodeId = typeof item === 'object' ? item.id : item;
        const message = typeof item === 'object' ? item.message : null;
        const color = typeof item === 'object' ? item.color : null;

        if (nodeId && (action === 'visit' || action === 'select' || action === 'color_node')) {
            const circle = document.querySelector(`circle[data-id="${nodeId}"]`);
            if (circle) {

                if (action === 'visit' || action === 'select') {
                    circle.style.fill = '';
                    circle.style.stroke = '';
                }

                if (i === currentStepIndex) {
                    if (action === 'select') circle.classList.add('selected');
                    else if (action === 'visit') circle.classList.add('visited');
                    
                    if (message && logDisplay) {
                        logDisplay.textContent = message;
                        logDisplay.style.opacity = 1;
                    } else if (logDisplay) {
                        logDisplay.style.opacity = 0;
                    }
                } else {
                    if (action === 'select') circle.classList.add('selected');
                    else if (action === 'visit') circle.classList.add('visited');
                }

                if (action === 'color_node' && color) {
                    circle.style.fill = color;
                    circle.style.stroke = `color-mix(in srgb, ${color}, black 30%)`;
                    circle.style.strokeWidth = "3.5px";
                }
            }
        }

        if (action === 'color_edge' && item.target) {
                console.debug('color_edge step:', nodeId, '->', item.target, 'color=', color);
                const selector = [
                    `line.edge[data-from="${nodeId}"][data-to="${item.target}"]`,
                    `line.edge-line[data-from="${nodeId}"][data-to="${item.target}"]`,
                    `line[data-from="${nodeId}"][data-to="${item.target}"]`,
                    `path.edge[data-from="${nodeId}"][data-to="${item.target}"]`,
                    `line.edge[data-from="${item.target}"][data-to="${nodeId}"]`,
                    `line.edge-line[data-from="${item.target}"][data-to="${nodeId}"]`,
                    `line[data-from="${item.target}"][data-to="${nodeId}"]`,
                    `path.edge[data-from="${item.target}"][data-to="${nodeId}"]`
                ].join(', ');
                const edgePaths = Array.from(document.querySelectorAll(selector));
                if (edgePaths.length === 0) {
                    const allEdges = Array.from(document.querySelectorAll('line.edge, line.edge-line, path.edge, line')); 
                    console.debug('available edges count:', allEdges.length, 'examples:', allEdges.slice(0,5).map(e => ({tag:e.tagName, from:e.getAttribute('data-from'), to:e.getAttribute('data-to'), classes:e.className})));
                }
                const highlightColor = color || "#3498db";
                edgePaths.forEach(edgePath => {
                    edgePath.style.stroke = highlightColor;
                    edgePath.style.strokeWidth = "4px";
                    edgePath.style.strokeLinecap = "round";
                    edgePath.style.color = highlightColor;
                });
        }

        if (action === 'draw_path' && item.path) {
            for (let j = 0; j < item.path.length - 1; j++) {
                const u = item.path[j];
                const v = item.path[j+1];
                const selector = [
                    `line.edge[data-from="${u}"][data-to="${v}"]`,
                    `line.edge-line[data-from="${u}"][data-to="${v}"]`,
                    `line[data-from="${u}"][data-to="${v}"]`,
                    `path.edge[data-from="${u}"][data-to="${v}"]`,
                    `line.edge[data-from="${v}"][data-to="${u}"]`,
                    `line.edge-line[data-from="${v}"][data-to="${u}"]`,
                    `line[data-from="${v}"][data-to="${u}"]`,
                    `path.edge[data-from="${v}"][data-to="${u}"]`
                ].join(', ');
                const edgePaths = Array.from(document.querySelectorAll(selector));
                const highlightColor = color || "#e74c3c";
                edgePaths.forEach(edgePath => {
                    edgePath.style.stroke = highlightColor;
                    edgePath.style.strokeWidth = "5px";
                    edgePath.style.strokeLinecap = "round";
                    edgePath.style.color = highlightColor;
                });
            }
        }
    }
}
*/

window.renderStateAtCurrentStep = function() {
    if (window.activeVisualization && typeof animationHistory !== 'undefined' && typeof currentStepIndex !== 'undefined') {
        // La nouvelle classe PythonTraceVisualization s'occupe de tout dessiner !
        window.activeVisualization.applyFrame(null, animationHistory, currentStepIndex);
    }
};

function playAnimation() {
    // Si on est à la fin, on reboucle au début
    if (currentStepIndex >= animationHistory.length - 1) {
        currentStepIndex = -1;
    }
    
    const playBtn = document.getElementById('btn-play');
    if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    
    // NOUVEAU : On force un rendu immédiat pour ne pas avoir un écran "vide" de 800ms
    if (currentStepIndex === -1 && animationHistory.length > 0) {
        currentStepIndex = 0;
        renderStateAtCurrentStep();
        updatePlayerUI();
    }
    
    playInterval = setInterval(() => {
        if (currentStepIndex < animationHistory.length - 1) {
            currentStepIndex++;
            renderStateAtCurrentStep();
            updatePlayerUI();
        } else {
            pauseAnimation(); // S'arrête tout seul à la fin sans rien effacer
        }
    }, 800);
}

function pauseAnimation() {
    // 1. On coupe le minuteur s'il tourne
    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
    }
    
    // 2. On met à jour l'UI du bouton (en anglais)
    const playBtn = document.getElementById('btn-play');
    if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i> Play';
}

function resetAnimation() {
    pauseAnimation();           // On stoppe la lecture en cours
    currentStepIndex = -1;      // On revient à l'état "avant l'algorithme"
    renderStateAtCurrentStep(); // On nettoie le canvas
    updatePlayerUI();           // On remet le compteur à zéro
}


document.getElementById('btn-play').addEventListener('click', () => {
    // Si l'animation est en cours, on la met en pause, sinon on la lance
    if (playInterval) {
        pauseAnimation();
    } else {
        playAnimation();
    }
});

document.getElementById('btn-next').addEventListener('click', () => {
    pauseAnimation(); // Stoppe la lecture automatique lors d'une navigation manuelle
    if (currentStepIndex < animationHistory.length - 1) {
        currentStepIndex++;
        renderStateAtCurrentStep();
        updatePlayerUI();
    }
});

document.getElementById('btn-prev').addEventListener('click', () => {
    pauseAnimation(); // Idem ici
    if (currentStepIndex > -1) {
        currentStepIndex--;
        renderStateAtCurrentStep();
        updatePlayerUI();
    }
});

// NOUVEAU : Ajout de l'écouteur pour le bouton Reset
const btnReset = document.getElementById('btn-reset'); // Assure-toi que l'ID correspond à ton HTML
if (btnReset) {
    btnReset.addEventListener('click', () => {
        resetAnimation();
    });
}

function updatePlayerUI() {
    const counter = document.getElementById('step-counter');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    counter.textContent = `Step ${currentStepIndex + 1} / ${animationHistory.length}`;
    btnPrev.disabled = (currentStepIndex === -1);
    btnNext.disabled = (currentStepIndex >= animationHistory.length - 1);
    btnPrev.style.opacity = btnPrev.disabled ? 0.5 : 1;
    btnNext.style.opacity = btnNext.disabled ? 0.5 : 1;
}

<div id="player-controls" style="margin-top: 15px; text-align: center; display: none; padding: 12px 16px; background: #f3f4f6; border-radius: 8px; align-items: center; justify-content: center; gap: 15px;">
                        <button id="btn-prev" class="player-btn">
                            <i class="fa-solid fa-backward-step"></i> Previous
                        </button>
                        
                        <button id="btn-play" class="player-btn btn-play-active">
                            <i class="fa-solid fa-play"></i> Play
                        </button>
                        
                        <button id="btn-next" class="player-btn">
                            Next <i class="fa-solid fa-forward-step"></i>
                        </button>
                        
                        <span id="step-counter" style="margin-left: 15px; font-weight: bold; font-family: monospace; font-size: 16px; color: #374151;">Step 0 / 0</span>
                    </div>