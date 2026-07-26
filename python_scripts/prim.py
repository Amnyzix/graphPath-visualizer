def prim_mst(start_node):
    visited = set([start_node])
    visit(start_node, f"Début de l'arbre couvrant au nœud {start_node}")

    mst_weight = 0

    while True:
        min_edge = None
        min_weight = float("inf")

        # On cherche l'arête la plus courte partant d'un nœud visité vers un nœud non visité
        for u in visited:
            select(u)  # Visuel : Montre le nœud qu'on est en train d'inspecter

            for v in neighbors(u):
                if v not in visited:
                    w = weight(u, v)
                    if w < min_weight:
                        min_weight = w
                        min_edge = (u, v)

        # Si on ne trouve plus d'arête sortante, l'arbre est terminé
        if not min_edge:
            break

        u, v = min_edge
        visited.add(v)
        mst_weight += min_weight

        # Visuel : On colore l'arête en Vert Menthe et on visite le nouveau nœud
        color_edge(u, v, "#34D399")
        visit(v, f"Nœud {v} ajouté à l'arbre (poids: {min_weight})")

    print(f"Poids total de l'arbre couvrant (Prim) : {mst_weight}")


# Assure-toi d'avoir un nœud '1' dans ton graphe et qu'il est pondéré !
prim_mst("1")
