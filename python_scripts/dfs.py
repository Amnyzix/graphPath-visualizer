def dfs(start_node):
    stack = [start_node]
    visited = []

    visit(start_node, f"Starting DFS from node {start_node}")

    while len(stack) > 0:
        # Pop from the end of the list (Stack behavior)
        current = stack.pop()

        if current not in visited:
            visited.append(current)
            visit(current, f"Diving into node {current}")

            # Reverse neighbors to explore the first added neighbor first
            for neighbor in reversed(neighbors(current)):
                if neighbor not in visited:
                    stack.append(neighbor)
                    select(neighbor)


# Run the algorithm
dfs("1")
