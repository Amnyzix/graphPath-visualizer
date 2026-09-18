def bfs(start_node):
    existing_nodes = get_all_nodes()

    if str(start_node) not in existing_nodes:
        return

    queue = [start_node]
    visited = [start_node]

    # Le nœud de départ passe en vert
    color_node(start_node, "#2ecc71", f"Starting BFS from node {start_node}")

    while len(queue) > 0:
        current = queue.pop(0)

        for neighbor in neighbors(current):
            if neighbor not in visited:
                visited.append(neighbor)
                queue.append(neighbor)

                # Le parcours est animé en coloriant l'arête empruntée
                color_edge(current, neighbor, "#3498db", f"Traversing to {neighbor}")

                # Le nouveau nœud visité passe en vert
                color_node(neighbor, "#2ecc71", f"Visited node {neighbor}")


# Run the algorithm starting from node '1'
bfs("1")
