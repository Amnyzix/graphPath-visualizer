def kosaraju():
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
    stack = []

    visit(
        all_nodes[0] if len(all_nodes) > 0 else 0,
        "Phase 1: Filling stack based on finish times",
    )

    # -------------------------------------------------------------
    # ETAPE 1 : Premier DFS pour remplir la pile (Post-order)
    # -------------------------------------------------------------
    def dfs_first_pass(u):
        visited.add(u)
        select(u)
        for v in neighbors(u):
            if v not in visited:
                dfs_first_pass(v)
        stack.append(u)  # On empile à la fin

    for node in all_nodes:
        if node not in visited:
            dfs_first_pass(node)

    # -------------------------------------------------------------
    # ETAPE 2 : Inversion de toutes les arêtes (Graphe Transposé)
    # -------------------------------------------------------------
    reversed_graph = {node: [] for node in all_nodes}
    for u in all_nodes:
        for v in neighbors(u):
            reversed_graph[v].append(u)

    # -------------------------------------------------------------
    # ETAPE 3 : Second DFS sur le graphe inversé
    # -------------------------------------------------------------
    visited.clear()
    scc_count = 0

    # On dépile dans l'ordre inverse de la première passe
    while len(stack) > 0:
        root = stack.pop()

        if root not in visited:
            scc_count += 1
            hex_color = PALETTE[(scc_count - 1) % len(PALETTE)]

            # DFS d'exploration de la composante forte
            component_nodes = []

            def dfs_second_pass(u):
                visited.add(u)
                component_nodes.append(u)
                color_node(
                    u,
                    hex_color,
                    f"Node {u} belongs to Strongly Connected Component #{scc_count}",
                )

                for v in reversed_graph[u]:
                    if v not in visited:
                        color_edge(v, u, hex_color)  # Animation de l'arête inversée
                        dfs_second_pass(v)

            dfs_second_pass(root)


kosaraju()
