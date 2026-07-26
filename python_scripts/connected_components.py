def connected_components():
    PALETTE = [
        "#3B82F6",  # Blue
        "#10B981",  # Green
        "#F59E0B",  # Orange
        "#8B5CF6",  # Purple
        "#EC4899",  # Pink
        "#14B8A6",  # Cyan
        "#EF4444",  # Red
    ]

    all_nodes = get_all_nodes()
    visited = set()
    component_id = 0

    if len(all_nodes) > 0:
        visit(all_nodes[0], "Starting Connected Components discovery...")

    # Fonction utilitaire pour traiter le graphe comme non-orienté
    def get_undirected_neighbors(u):
        undirected = set(neighbors(u))
        for other in all_nodes:
            if u in neighbors(other):
                undirected.add(other)
        return undirected

    for node in all_nodes:
        # Si on trouve un nœud non visité, c'est le début d'une NOUVELLE composante
        if node not in visited:
            component_id += 1
            hex_color = PALETTE[(component_id - 1) % len(PALETTE)]

            # On lance un BFS (Parcours en largeur) pour cartographier toute l'île
            queue = [node]
            visited.add(node)

            while len(queue) > 0:
                current = queue.pop(0)
                # On colorie le nœud avec la couleur de son groupe
                color_node(
                    current,
                    hex_color,
                    f"Node {current} belongs to Component {component_id}",
                )

                for neighbor in get_undirected_neighbors(current):
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append(neighbor)


connected_components()
