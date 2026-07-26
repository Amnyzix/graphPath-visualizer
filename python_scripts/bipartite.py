def bipartite():
    color_map = {}

    # Colors for the two groups
    color_A = "#3B82F6"  # Blue
    color_B = "#FBBF24"  # Bright Yellow

    for start_node in GRAPH_EDGES.keys():
        if start_node not in color_map:
            color_map[start_node] = color_A
            visit(start_node, f"Starting bipartite check at {start_node}")
            color_node(start_node, color_A)
            queue = [start_node]
            while queue:
                u = queue.pop(0)
                current_color = color_map[u]
                next_color = color_B if current_color == color_A else color_A

                for v in neighbors(u):
                    if v not in color_map:
                        color_map[v] = next_color
                        visit(
                            v,
                            f"Assigned {v} to Group {'B' if next_color == color_B else 'A'}",
                        )
                        color_node(v, next_color)
                        queue.append(v)
                    elif color_map[v] == current_color:
                        color_edge(u, v, "#EF4444")  # Red for conflict
                        visit(v, f"Conflict at edge {u}-{v}! Not bipartite.")
                        print("Result: Graph is NOT bipartite.")
                        return

    # --- VISUAL SEPARATION ---
    # Fade all edges to light gray to make the blue/yellow nodes pop
    for u, dict_voisins in GRAPH_EDGES.items():
        for v in dict_voisins.keys():
            color_edge(u, v, "#E2E8F0")

    # Extract the two groups for the terminal output
    set_a_nodes = [n for n, c in color_map.items() if c == color_A]
    set_b_nodes = [n for n, c in color_map.items() if c == color_B]

    print("Result: The graph is bipartite!")
    print(f"Group A (Blue): {set_a_nodes}")
    print(f"Group B (Yellow): {set_b_nodes}")


bipartite()
