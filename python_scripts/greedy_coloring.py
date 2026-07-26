def greedy_coloring():
    PALETTE = [
        "#EF4444",  # 0: Red
        "#3B82F6",  # 1: Blue
        "#10B981",  # 2: Green
        "#F59E0B",  # 3: Orange
        "#8B5CF6",  # 4: Purple
        "#EC4899",  # 5: Pink
        "#14B8A6",  # 6: Cyan
    ]

    all_nodes = get_all_nodes()
    colors = {}

    if len(all_nodes) > 0:
        visit(all_nodes[0], "Starting Global Greedy Coloring...")

    for node in all_nodes:
        select(node)

        undirected_neighbors = set(neighbors(node))
        for other_node in all_nodes:
            if node in neighbors(other_node):
                undirected_neighbors.add(other_node)

        used_colors = set()
        for neighbor in undirected_neighbors:
            if neighbor in colors:
                used_colors.add(colors[neighbor])

        color_index = 0
        while color_index in used_colors:
            color_index += 1

        colors[node] = color_index
        hex_color = PALETTE[color_index % len(PALETTE)]

        # Utilisation de la commande unifiée !
        color_node(node, hex_color, f"Node {node} is assigned to Color {color_index}")


greedy_coloring()
