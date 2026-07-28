const PYTHON_GRAPH_API = `
import json
import sys

class GraphAPI:
    def __init__(self, edges, nodes):
        self.edges = edges
        self.nodes = nodes
        self.history = []

    def _capture_memory(self):
        try:
            frame = sys._getframe(2)
            mem = {}
            for key, val in frame.f_locals.items():
                if isinstance(val, (int, float, str, list, dict, bool)):
                    mem[key] = str(val)
            return mem
        except Exception:
            return {}

    def visit(self, node, message=None):
        step = {"id": str(node), "action": "visit", "variables": self._capture_memory()}
        if message: step["message"] = str(message)
        self.history.append(step)
    
    def get_all_nodes(self):
        return self.nodes
    
    def color_node(self, node, color, message=None):
        step = {
            "id": str(node), 
            "action": "color_node", 
            "color": color, 
            "variables": self._capture_memory()
        }
        if message: 
            step["message"] = str(message)
        self.history.append(step)

    def color_edge(self, u, v, color, message=None):
        step = {
            "id": str(u), 
            "target": str(v), 
            "action": "color_edge", 
            "color": color, 
            "variables": self._capture_memory()
        }
        if message: 
            step["message"] = str(message)
        self.history.append(step)

    def draw_path(self, path, color):
        self.history.append({
            "path": [str(p) for p in path], 
            "action": "draw_path", 
            "color": color, 
            "variables": self._capture_memory()
        })

    def select(self, node):
        step = {"id": str(node), "action": "select", "variables": self._capture_memory()}
        self.history.append(step)

    def neighbors(self, node):
        return self.edges.get(str(node), [])

    def weight(self, node_a, node_b):
        neighbors_dict = self.edges.get(str(node_a), {})
        return neighbors_dict.get(str(node_b), float('inf'))

# GRAPH_EDGES et GRAPH_NODES seront injectés dynamiquement avant ce script
_api = GraphAPI(GRAPH_EDGES, GRAPH_NODES)

def visit(node, msg=None): _api.visit(node, msg)
def color_node(node, color, msg=None): _api.color_node(node, color, msg)
def color_edge(u, v, color, msg=None): _api.color_edge(u, v, color, msg)
def draw_path(path, color="#e74c3c"): _api.draw_path(path, color)
def select(node): _api.select(node)
def neighbors(node): return _api.neighbors(node)
def weight(a, b): return _api.weight(a, b)
def get_all_nodes(): return _api.get_all_nodes()
`;