def find_connected_components():
    global_visited = []
    component_count = 0

    # Iterate through all nodes existing in the graph
    for node in GRAPH_EDGES.keys():
        if node not in global_visited:
            component_count += 1
            visit(node, f"Found new component {component_count}. Starting BFS...")

            # Launch a local BFS for this specific component
            queue = [node]
            global_visited.append(node)

            while len(queue) > 0:
                current = queue.pop(0)

                for neighbor in neighbors(current):
                    if neighbor not in global_visited:
                        global_visited.append(neighbor)
                        queue.append(neighbor)
                        select(neighbor)
                        visit(
                            neighbor,
                            f"Component {component_count}: Explored {neighbor}",
                        )


# Run the algorithm (no start node needed)
find_connected_components()
