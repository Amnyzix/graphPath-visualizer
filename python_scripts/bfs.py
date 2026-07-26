def bfs(start_node):
    queue = [start_node]
    visited = [start_node]

    visit(start_node, f"Starting BFS from node {start_node}")

    while len(queue) > 0:
        # Pop from the front of the list (Queue behavior)
        current = queue.pop(0)

        for neighbor in neighbors(current):
            if neighbor not in visited:
                visited.append(neighbor)
                queue.append(neighbor)
                select(neighbor)
                visit(neighbor, f"Exploring {neighbor} from {current}")


# Run the algorithm starting from node '1'
bfs("1")
