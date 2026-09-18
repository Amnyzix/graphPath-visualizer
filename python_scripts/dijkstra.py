import math


def dijkstra_shortest_path(start_node, target_node):
    existing_nodes = get_all_nodes()

    if str(start_node) not in existing_nodes or str(target_node) not in existing_nodes:
        return

    distances = {}
    previous_nodes = {}
    pq = [(0, start_node)]

    distances[start_node] = 0

    # Initialisation explicite
    color_node(
        start_node,
        "#2ecc71",
        f"Initialization: Distance to start node {start_node} is 0. All others are ∞.",
    )

    while len(pq) > 0:
        pq.sort(key=lambda x: x[0])
        current_distance, current_node = pq.pop(0)

        # Ignorer les chemins obsolètes silencieusement
        if current_distance > distances.get(current_node, math.inf):
            continue

        # Mise en évidence du nœud sélectionné avec son poids définitif
        select(current_node)
        visit(
            current_node,
            f"Extracting node {current_node}. Its shortest distance is now locked at {current_distance}.",
        )

        # Condition d'arrêt
        if current_node == target_node:
            color_node(
                current_node,
                "#2ecc71",
                f"Target node {target_node} reached! Search can stop.",
            )
            break

        for neighbor in neighbors(current_node):
            edge_weight = weight(current_node, neighbor)
            new_distance = current_distance + edge_weight
            known_distance = distances.get(neighbor, math.inf)

            # Formatage pour un affichage propre dans les logs
            known_str = "∞" if known_distance == math.inf else str(known_distance)

            if new_distance < known_distance:
                distances[neighbor] = new_distance
                previous_nodes[neighbor] = current_node
                pq.append((new_distance, neighbor))

                # Le succès est animé, et le message détaille le calcul
                msg = f"Relaxation: {current_distance} + {edge_weight} = {new_distance}. Since {new_distance} < {known_str}, we update {neighbor}!"
                color_edge(current_node, neighbor, "#3498db", msg)
            else:
                # L'échec n'est PAS animé visuellement pour ne pas surcharger, mais il est loggé en texte pour la compréhension
                msg = f"Check {current_node} -> {neighbor}: {current_distance} + {edge_weight} = {new_distance}. Not better than {known_str}, ignoring."
                visit(neighbor, msg)

    # Reconstruction du chemin
    path = []
    curr = target_node
    while curr in previous_nodes:
        path.insert(0, curr)
        curr = previous_nodes[curr]

    if path or start_node == target_node:
        path.insert(0, start_node)
        path_str = " -> ".join(path)

        # Affichage final
        draw_path(path, "#33bc44")
        visit(
            target_node,
            f"Algorithm finished! Shortest path: {path_str} (Total cost: {distances.get(target_node)})",
        )
    else:
        visit(
            start_node,
            f"Algorithm finished! No valid path exists between {start_node} and {target_node}.",
        )


# Run the algorithm starting from node '1' to '5'
dijkstra_shortest_path("1", "5")
