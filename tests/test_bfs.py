import os

from tests.mock_graph_api import PYTHON_API_MOCK


# 2. Fonction utilitaire pour lancer le BFS sur n'importe quel graphe
def run_simulated_bfs(mock_nodes, mock_edges):
    global_env = {"GRAPH_NODES": mock_nodes, "GRAPH_EDGES": mock_edges}

    # Injection de l'API
    exec(PYTHON_API_MOCK, global_env)

    # Lecture et exécution de ton vrai script BFS
    bfs_path = os.path.join(os.path.dirname(__file__), "../python_scripts/bfs.py")
    with open(bfs_path, "r") as f:
        bfs_user_code = f.read()

    exec(bfs_user_code, global_env)

    # Extraction de l'historique des visites
    history = global_env["_api"].history
    return [step["id"] for step in history if step["action"] == "visit"]


# ==========================================
# LES TESTS EXHAUSTIFS
# ==========================================


def test_bfs_simple_tree():
    """Cas 1: Un graphe simple (1 -> 2, 1 -> 3)"""
    nodes = ["1", "2", "3"]
    edges = {"1": {"2": 1, "3": 1}}

    visited = run_simulated_bfs(nodes, edges)

    assert visited[0] == "1"
    assert set(visited[1:3]) == {"2", "3"}
    assert len(visited) == 3


def test_bfs_with_cycles():
    """Cas 2: Un graphe avec un cycle (1-2-3-1) pour éviter les boucles infinies"""
    nodes = ["1", "2", "3"]
    edges = {
        "1": {"2": 1},
        "2": {"3": 1},
        "3": {"1": 1},  # Retour au point de départ
    }

    visited = run_simulated_bfs(nodes, edges)

    # Tous les nœuds doivent être visités exactement 1 fois
    assert len(visited) == 3
    assert set(visited) == {"1", "2", "3"}


def test_bfs_disconnected_graph():
    """Cas 3: Un graphe en plusieurs morceaux isolés"""
    nodes = ["1", "2", "3", "4"]
    edges = {
        "1": {"2": 1},
        "2": {"1": 1},
        "3": {"4": 1},  # 3 et 4 ne sont pas reliés à 1
    }

    visited = run_simulated_bfs(nodes, edges)

    # Le BFS partant de 1 ne doit jamais atteindre 3 ou 4
    assert "3" not in visited
    assert "4" not in visited
    assert set(visited) == {"1", "2"}


def test_bfs_isolated_start_node():
    """Cas 4: Départ sur un nœud sans voisins"""
    nodes = ["1", "2"]
    edges = {
        "2": {"3": 1}  # 1 n'a aucun lien
    }

    visited = run_simulated_bfs(nodes, edges)

    # Il ne visite que lui-même
    assert visited == ["1"]


def test_bfs_directed_graph():
    """Cas 5: Respect du sens des flèches (Orienté)"""
    nodes = ["1", "2", "3", "4"]
    edges = {
        "1": {"2": 1},  # 1 pointe vers 2
        "2": {"3": 1},  # 2 pointe vers 3
        "4": {"1": 1},  # 4 pointe vers 1 (mais 1 ne peut pas remonter à 4)
    }

    visited = run_simulated_bfs(nodes, edges)

    # Le parcours doit être 1 -> 2 -> 3. Le nœud 4 doit être ignoré.
    assert visited == ["1", "2", "3"]


def test_bfs_empty_graph():
    """Cas 6: Un graphe complètement vide"""
    nodes = []
    edges = {}

    visited = run_simulated_bfs(nodes, edges)

    # S'il n'y a pas de nœuds, le BFS ne doit rien visiter du tout
    assert visited == []


def test_bfs_non_existent_start_node():
    """Cas 7: Le nœud de départ n'existe pas dans le graphe"""
    # Le graphe contient 2 et 3, mais le BFS cherche à partir de "1"
    nodes = ["2", "3"]
    edges = {"2": {"3": 1}}

    visited = run_simulated_bfs(nodes, edges)

    # Puisque "1" n'existe pas, rien ne doit être visité
    assert visited == []
