class VisualizationFactory {
    static create(algorithmName, editor) {
        // Plus tard, on pourra ajouter 'bfs', 'dijkstra', etc.
        switch (algorithmName.toLowerCase()) {
            case 'python_trace':
            default:
                return new PythonTraceVisualization(editor);
        }
    }
}