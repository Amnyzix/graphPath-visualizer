def cycle_detection():
    visited = set()
    recursion_stack = set()

    all_nodes = get_all_nodes()

    def dfs(u):
        visited.add(u)
        recursion_stack.add(u)
        color_node(u, "#F59E0B", f"Exploring node {u}")

        for v in neighbors(u):
            if v not in visited:
                if dfs(v):
                    return True
            elif v in recursion_stack:
                # Cycle détecté !
                color_edge(u, v, "#EF4444")
                color_node(u, "#EF4444", f"Cycle detected! Back-edge to {v}")
                return True

        # On a fini d'explorer ce nœud
        recursion_stack.remove(u)
        color_node(u, "#10B981", f"Node {u} is safe")
        return False

    for node in all_nodes:
        if node not in visited:
            if dfs(node):
                return  # Cycle trouvé, on arrête

    visit(all_nodes[0], "No cycles found in the graph!")


cycle_detection()
