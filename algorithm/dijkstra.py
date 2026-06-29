def dijkstra_shortest_path(start_node, target_node):
    import math

    distances = {}
    previous_nodes = {}
    pq = [(0, start_node)]

    distances[start_node] = 0

    visit(
        start_node, f"Launching Dijkstra pathfinding from {start_node} to {target_node}"
    )

    while len(pq) > 0:
        pq.sort(key=lambda x: x[0])
        current_distance, current_node = pq.pop(0)

        if current_distance > distances.get(current_node, math.inf):
            continue

        select(current_node)

        # Stop condition when we reach our target destination
        if current_node == target_node:
            break

        for neighbor in neighbors(current_node):
            edge_weight = weight(current_node, neighbor)
            distance = current_distance + edge_weight

            if distance < distances.get(neighbor, math.inf):
                distances[neighbor] = distance
                previous_nodes[neighbor] = current_node
                pq.append((distance, neighbor))

    # Reconstruct the shortest path
    path = []
    curr = target_node
    while curr in previous_nodes:
        path.insert(0, curr)
        curr = previous_nodes[curr]

    if path or start_node == target_node:
        path.insert(0, start_node)
        path_str = " -> ".join(path)
        visit(
            target_node,
            f"Shortest path found: {path_str} (Cost: {distances.get(target_node, 'N/A')})",
        )
    else:
        visit(start_node, f"No path found between {start_node} and {target_node}")


# Search path from node '1' to node '4'
dijkstra_shortest_path("1", "2")
