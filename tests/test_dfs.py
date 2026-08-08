import os

from tests.mock_graph_api import PYTHON_API_MOCK


# 2. Fonction utilitaire pour simuler Pyodide
def run_simulated_dfs(mock_nodes, mock_edges):
    global_env = {"GRAPH_NODES": mock_nodes, "GRAPH_EDGES": mock_edges}

    exec(PYTHON_API_MOCK, global_env)

    dfs_path = os.path.join(os.path.dirname(__file__), "../python_scripts/dfs.py")
    with open(dfs_path, "r") as f:
        dfs_user_code = f.read()

    exec(dfs_user_code, global_env)

    history = global_env["_api"].history
    return [step["id"] for step in history if step["action"] == "visit"]


# ==========================================
# TESTS DU DFS
# ==========================================


def test_dfs_simple_tree():
    """Cas 1: L'ordre doit être profond d'abord. 1->2 et 1->3."""
    nodes = ["1", "2", "3"]
    edges = {"1": {"2": 1, "3": 1}}

    visited = run_simulated_dfs(nodes, edges)

    # Grâce au reversed(), 3 est empilé avant 2. Donc 2 est dépilé en premier.
    assert visited == ["1", "2", "3"]


def test_dfs_with_cycles():
    """Cas 2: Cycle (1-2-3-1) pour éviter la boucle infinie"""
    nodes = ["1", "2", "3"]
    edges = {"1": {"2": 1}, "2": {"3": 1}, "3": {"1": 1}}
    visited = run_simulated_dfs(nodes, edges)
    assert len(visited) == 3
    assert visited == ["1", "2", "3"]


def test_dfs_deep_branch():
    """Cas 3: Test de la vraie profondeur (1->2->3 et 1->4)"""
    nodes = ["1", "2", "3", "4"]
    edges = {"1": {"2": 1, "4": 1}, "2": {"3": 1}}
    visited = run_simulated_dfs(nodes, edges)
    # 1 est visité. 4 et 2 empilés. 2 est dépilé. 3 empilé. 3 dépilé. 4 dépilé.
    assert visited == ["1", "2", "3", "4"]


def test_dfs_disconnected_graph():
    """Cas 4: Ne doit pas visiter les nœuds inatteignables"""
    nodes = ["1", "2", "3", "4"]
    edges = {"1": {"2": 1}, "3": {"4": 1}}
    visited = run_simulated_dfs(nodes, edges)
    assert "3" not in visited
    assert "4" not in visited
    assert visited == ["1", "2"]


def test_dfs_isolated_start_node():
    """Cas 5: Un nœud seul"""
    nodes = ["1", "2"]
    edges = {"2": {"3": 1}}
    visited = run_simulated_dfs(nodes, edges)
    assert visited == ["1"]


def test_dfs_empty_graph():
    """Cas 6: Graphe vide (Test de la Guard Clause)"""
    visited = run_simulated_dfs([], {})
    assert visited == []


def test_dfs_non_existent_start_node():
    """Cas 7: Nœud de départ supprimé (Test de la Guard Clause)"""
    nodes = ["2", "3"]
    edges = {"2": {"3": 1}}
    visited = run_simulated_dfs(nodes, edges)
    assert visited == []
