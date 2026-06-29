def cycle_detection(start_node):
    stack = [start_node]
    visited = []

    visit(start_node, "Starting Cycle Detection...")

    while len(stack) > 0:
        current = stack.pop()

        # If we encounter a node we already visited, it's a cycle!
        if current in visited:
            visit(current, f"⚠️ CYCLE DETECTED at node {current}!")
        else:
            visited.append(current)
            select(current)

            for neighbor in reversed(neighbors(current)):
                stack.append(neighbor)


# Run the algorithm
cycle_detection("1")
