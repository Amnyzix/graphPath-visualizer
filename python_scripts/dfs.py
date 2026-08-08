def dfs(start_node):
    existing_nodes = get_all_nodes()
    if str(start_node) not in existing_nodes:
        return

    stack = [start_node]
    visited = []

    while len(stack) > 0:
        # Pop from the end of the list (Stack behavior)
        current = stack.pop()

        if current not in visited:
            visited.append(current)
            visit(current, f"Diving into node {current}")

            # On cast en liste pour éviter les erreurs avec reversed() sur les dictionnaires Pyodide
            for neighbor in reversed(list(neighbors(current))):
                if neighbor not in visited:
                    stack.append(neighbor)


# Run the algorithm
dfs("1")
