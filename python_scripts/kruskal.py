def kruskal():
    # 1. Extraire et trier toutes les arêtes uniques du graphe
    edges_list = []
    for u, dict_voisins in GRAPH_EDGES.items():
        for v, w in dict_voisins.items():
            # On évite d'ajouter (u,v) et (v,u) en double
            if (v, u, w) not in edges_list:
                edges_list.append((u, v, w))

    # Tri par poids croissant
    edges_list.sort(key=lambda x: x[2])

    # 2. Structure Union-Find pour détecter les cycles
    parent = {n: n for n in GRAPH_EDGES.keys()}

    def find(i):
        if parent[i] == i:
            return i
        parent[i] = find(parent[i])
        return parent[i]

    def union(i, j):
        root_i = find(i)
        root_j = find(j)
        if root_i != root_j:
            parent[root_i] = root_j
            return True
        return False

    mst_weight = 0

    # 3. Animation de la sélection
    for u, v, w in edges_list:
        select(u)
        color_edge(u, v, "#FBBF24")  # Visuel : Jaune (En cours d'évaluation)

        if union(u, v):
            color_edge(u, v, "#34D399")  # Visuel : Vert (Accepté !)
            mst_weight += w
            visit(v, f"Arête {u}-{v} acceptée (poids {w})")
        else:
            color_edge(u, v, "#EF4444")  # Visuel : Rouge (Rejeté, crée un cycle)

    print(f"Poids total de l'arbre couvrant (Kruskal) : {mst_weight}")


kruskal()
