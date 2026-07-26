function getCurrentGraphState() {
    if (window.graphApp) {
        return window.graphApp.getGraphData();
    }
    return { nodes: window.nodes || [], edges: window.edges || [], nodeIdCounter: window.nodeIdCounter || 1 };
}

function saveGraph() {
    const graphData = getCurrentGraphState();
    localStorage.setItem('graphData', JSON.stringify(graphData));
    alert('Graph saved to browser storage!');
}

function loadGraph() {
    const data = localStorage.getItem('graphData');
    if (data) {
        const graphData = JSON.parse(data);
        nodes = (graphData.nodes || []).map(n => ({ ...n, id: String(n.id) }));
        edges = (graphData.edges || []).map(e => ({ ...e, from: String(e.from), to: String(e.to) }));
        nodeIdCounter = parseInt(graphData.nodeIdCounter) || 1;
        selectedNodes.clear();
        tempSelectedId = null;
        draggingNode = null;
        render();
        alert('Graph loaded from browser storage!');
    } else {
        alert('No saved graph found.');
    }
}

function exportGraph() {
    const graphData = getCurrentGraphState();
    const dataStr = JSON.stringify(graphData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importGraph() {
    document.getElementById('import-file').click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const graphData = JSON.parse(e.target.result);
                if (window.graphApp) {
                    window.graphApp.setGraphData({
                        nodes: (graphData.nodes || []).map(n => ({ ...n, id: String(n.id) })),
                        edges: (graphData.edges || []).map(e => ({ ...e, from: String(e.from), to: String(e.to) })),
                        nodeIdCounter: parseInt(graphData.nodeIdCounter) || 1
                    });
                    window.graphApp.render();
                } else {
                    nodes = (graphData.nodes || []).map(n => ({ ...n, id: String(n.id) }));
                    edges = (graphData.edges || []).map(e => ({ ...e, from: String(e.from), to: String(e.to) }));
                    nodeIdCounter = parseInt(graphData.nodeIdCounter) || 1;
                    selectedNodes.clear();
                    tempSelectedId = null;
                    draggingNode = null;
                    render();
                }
                alert('Graph imported successfully!');
            } catch (error) {
                alert('Invalid JSON file.');
            }
        };
        reader.readAsText(file);
    }
}