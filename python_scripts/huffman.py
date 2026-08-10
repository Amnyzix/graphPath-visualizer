import heapq
import json


class Node:
    def __init__(self, char, freq, id_node):
        self.char = char
        self.freq = freq
        self.left = None
        self.right = None
        self.id = id_node

    def __lt__(self, other):
        return self.freq < other.freq


def tree_to_dict(node):
    if node is None:
        return None
    name = f"'{node.char}' ({node.freq})" if node.char else f"{node.freq}"
    children = []
    if node.left:
        children.append(tree_to_dict(node.left))
    if node.right:
        children.append(tree_to_dict(node.right))

    res = {"id": node.id, "name": name, "freq": node.freq, "char": node.char}
    if children:
        res["children"] = children
    return res


text = globals().get("text_input", "ALGOVIZOR")

# Step 1 : Calcul des fréquences
freqs = {}
for c in text:
    freqs[c] = freqs.get(c, 0) + 1

# Step 2 : Création des feuilles
node_counter = 0
heap = []
for c, f in sorted(freqs.items(), key=lambda x: x[1]):
    node_counter += 1
    heap.append(Node(c, f, node_counter))

heapq.heapify(heap)

frames = []

# Frame 0 : État initial (file de priorité)
frames.append(
    {
        "step": 0,
        "desc": "1. Compute frequencies and initialization of the priority queue.",
        "forest": [tree_to_dict(n) for n in heap],
        "merged_ids": [],
    }
)

step_idx = 0
# Step 3 : Fusions successives
while len(heap) > 1:
    step_idx += 1
    left = heapq.heappop(heap)
    right = heapq.heappop(heap)

    node_counter += 1
    parent = Node(None, left.freq + right.freq, node_counter)
    parent.left = left
    parent.right = right

    heapq.heappush(heap, parent)

    left_lbl = f"'{left.char}'" if left.char else f"({left.freq})"
    right_lbl = f"'{right.char}'" if right.char else f"({right.freq})"

    frames.append(
        {
            "step": step_idx,
            "desc": f"Fusion of the 2 smallest frequencies : {left_lbl} et {right_lbl} → New node ({parent.freq}).",
            "forest": [tree_to_dict(n) for n in heap],
            "active_parent": parent.id,
            "merged_ids": [left.id, right.id],
        }
    )

root = heap[0] if heap else None

# Step 4 : Génération des codes binaires
codes = {}


def extract_codes(node, current_code):
    if not node:
        return
    if node.char is not None:
        codes[node.char] = current_code
    extract_codes(node.left, current_code + "0")
    extract_codes(node.right, current_code + "1")


extract_codes(root, "")

encoded_text = "".join(codes[c] for c in text)
orig_size = len(text) * 8
comp_size = len(encoded_text)
ratio = round((1 - comp_size / orig_size) * 100, 2) if orig_size > 0 else 0

result = {
    "frequencies": freqs,
    "codes": codes,
    "original_size": orig_size,
    "compressed_size": comp_size,
    "ratio": ratio,
    "frames": frames,
    "final_tree": tree_to_dict(root),
}

json.dumps(result)
