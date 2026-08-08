import io
import os
from contextlib import redirect_stdout

from tests.mock_graph_api import PYTHON_API_MOCK


# 2. Fonction utilitaire pour simuler Pyodide ET capturer les prints
def run_simulated_bipartite(mock_nodes, mock_edges):
    global_env = {"GRAPH_NODES": mock_nodes, "GRAPH_EDGES": mock_edges}

    exec(PYTHON_API_MOCK, global_env)

    path = os.path.join(os.path.dirname(__file__), "../python_scripts/bipartite.py")
    with open(path, "r") as f:
        code = f.read()

    lines = code.split("\n")
    lines = [line for line in lines if line.strip() != "bipartite()"]
    code = "\n".join(lines)

    exec(code, global_env)

    # On capture tout ce que ton script "print" dans le terminal
    f_out = io.StringIO()
    with redirect_stdout(f_out):
        global_env["bipartite"]()

    terminal_output = f_out.getvalue()
    history = global_env["_api"].history

    return history, terminal_output


# ==========================================
# LES TESTS POUR BIPARTITE
# ==========================================


def test_bipartite_valid_graph():
    """Cas 1: Un graphe biparti classique (Ligne 1-2-3-4)"""
    nodes = ["1", "2", "3", "4"]
    # 1(B) -> 2(Y) -> 3(B) -> 4(Y)
    edges = {"1": {"2": 1}, "2": {"1": 1, "3": 1}, "3": {"2": 1, "4": 1}, "4": {"3": 1}}

    history, terminal = run_simulated_bipartite(nodes, edges)

    # 1. Vérifier le terminal
    assert "The graph is bipartite!" in terminal
    assert "NOT bipartite" not in terminal

    # 2. Vérifier l'animation (Aucun conflit rouge ne doit exister)
    red_edges = [step for step in history if step.get("color") == "#EF4444"]
    assert len(red_edges) == 0


def test_bipartite_invalid_graph_odd_cycle():
    """Cas 2: Un graphe NON-biparti (Un cycle impair / Triangle 1-2-3-1)"""
    nodes = ["1", "2", "3"]
    edges = {"1": {"2": 1, "3": 1}, "2": {"1": 1, "3": 1}, "3": {"1": 1, "2": 1}}

    history, terminal = run_simulated_bipartite(nodes, edges)

    # 1. Vérifier le terminal
    assert "NOT bipartite" in terminal

    # 2. Vérifier l'animation (L'arête de conflit DOIT être colorée en rouge)
    conflict_steps = [step for step in history if step.get("color") == "#EF4444"]
    assert len(conflict_steps) > 0
    assert conflict_steps[0]["action"] == "color_edge"


def test_bipartite_disconnected_graph():
    """Cas 3: Un graphe biparti séparé en deux morceaux (1-2) et (3-4)"""
    nodes = ["1", "2", "3", "4"]
    edges = {"1": {"2": 1}, "2": {"1": 1}, "3": {"4": 1}, "4": {"3": 1}}

    history, terminal = run_simulated_bipartite(nodes, edges)

    # L'algorithme doit réussir à analyser les deux morceaux sans s'arrêter
    assert "The graph is bipartite!" in terminal

    # Il doit y avoir au moins 2 messages "Starting bipartite check" (un par composante)
    start_messages = [
        s for s in history if "Starting bipartite check" in s.get("message", "")
    ]
    assert len(start_messages) == 2


def test_bipartite_isolated_node():
    """Cas 4: Un graphe avec un nœud tout seul (sans arêtes)"""
    nodes = ["1"]
    edges = {"1": {}}  # Nœud présent dans les arêtes mais vide

    _, terminal = run_simulated_bipartite(nodes, edges)

    # Un nœud seul est considéré biparti par définition
    assert "The graph is bipartite!" in terminal
    assert "Group A (Blue): ['1']" in terminal
