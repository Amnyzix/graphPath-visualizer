import os

from tests.mock_graph_api import PYTHON_API_MOCK


def run_simulated_dijkstra(mock_nodes, mock_edges, start="1", target="2"):
    global_env = {"GRAPH_NODES": mock_nodes, "GRAPH_EDGES": mock_edges}

    exec(PYTHON_API_MOCK, global_env)

    dijkstra_path = os.path.join(
        os.path.dirname(__file__), "../python_scripts/dijkstra.py"
    )
    with open(dijkstra_path, "r") as f:
        code = f.read()

    # ASTUCE : On supprime l'exécution codée en dur à la fin de ton fichier
    # pour pouvoir tester n'importe quels nœuds de départ et d'arrivée
    code = code.replace('dijkstra_shortest_path("1", "2")', "")

    exec(code, global_env)

    # On lance l'algorithme manuellement avec les paramètres du test
    global_env["dijkstra_shortest_path"](start, target)

    return global_env["_api"].history


# ==========================================
# LES TESTS DU DIJKSTRA
# ==========================================


def test_dijkstra_chooses_cheaper_indirect_path():
    """Cas 1: Le chemin le plus direct est trop cher. Il doit prendre le détour."""
    # 1 -> 2 coûte 10
    # 1 -> 3 coûte 2, puis 3 -> 2 coûte 3 (Total: 5)
    # L'algorithme doit choisir 1 -> 3 -> 2.
    nodes = ["1", "2", "3"]
    edges = {"1": {"2": 10, "3": 2}, "3": {"2": 3}}

    history = run_simulated_dijkstra(nodes, edges, start="1", target="2")

    # On vérifie le tout dernier message généré par l'algo
    last_visit = history[-1]
    assert last_visit["action"] == "visit"
    assert last_visit["id"] == "2"
    assert "Shortest path found: 1 -> 3 -> 2" in last_visit.get("message", "")
    assert "Cost: 5" in last_visit.get("message", "")


def test_dijkstra_no_path():
    """Cas 2: Aucun chemin n'existe entre le départ et l'arrivée."""
    nodes = ["1", "2"]
    edges = {"1": {}}  # 1 n'a pas de voisins

    history = run_simulated_dijkstra(nodes, edges, start="1", target="2")
    last_visit = history[-1]

    # Le message d'erreur doit s'afficher sur le nœud de départ
    assert last_visit["action"] == "visit"
    assert last_visit["id"] == "1"
    assert "No path found between 1 and 2" in last_visit.get("message", "")


def test_dijkstra_start_equals_target():
    """Cas 3: Le nœud de départ est le même que le nœud d'arrivée."""
    nodes = ["1", "2"]
    edges = {"1": {"2": 5}}

    history = run_simulated_dijkstra(nodes, edges, start="1", target="1")
    last_visit = history[-1]

    # Doit trouver instantanément avec un coût de 0
    assert "Shortest path found: 1" in last_visit.get("message", "")
    assert "Cost: 0" in last_visit.get("message", "")


def test_dijkstra_guard_clause_missing_target():
    """Cas 4: L'utilisateur a supprimé le nœud cible (Guard Clause)."""
    # Le graphe ne contient que "1", mais l'algo cherche à aller vers "2"
    nodes = ["1"]
    edges = {}

    history = run_simulated_dijkstra(nodes, edges, start="1", target="2")

    # Puisque la Guard Clause s'est déclenchée, l'historique doit être totalement vide
    assert history == []


def test_dijkstra_guard_clause_missing_departure():
    nodes = ["2"]
    edges = {}

    history = run_simulated_dijkstra(nodes, edges, start="1", target="2")

    # Puisque la Guard Clause s'est déclenchée, l'historique doit être totalement vide
    assert history == []


def test_dijkstra_empty_graph():
    nodes = []
    edges = {}

    history = run_simulated_dijkstra(nodes, edges, start="1", target="2")

    assert history == []
