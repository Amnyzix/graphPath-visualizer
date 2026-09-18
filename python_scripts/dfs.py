def dfs(start_node):
    existing_nodes = get_all_nodes()

    if str(start_node) not in existing_nodes:
        return

    visited = []

    def explore(current):
        visited.append(current)
        # Le nœud exploré passe en vert
        color_node(current, "#2ecc71", f"Visited node {current}")

        for neighbor in neighbors(current):
            if neighbor not in visited:
                # On anime l'arête avant de plonger récursivement vers le voisin
                color_edge(current, neighbor, "#3498db", f"Traversing to {neighbor}")
                explore(neighbor)

    # Lancement de la récursion
    explore(start_node)


# Run the algorithm starting from node '1'
dfs("1")
