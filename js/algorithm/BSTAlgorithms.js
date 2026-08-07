export const DSColors = {
  default: { fill: "var(--circle-fill)", stroke: "var(--circle-stroke)" },
  current: { fill: "var(--current-fill)", stroke: "var(--current-stroke)" },
  visited: { fill: "var(--visited-fill)", stroke: "var(--visited-stroke)" },
  error: { fill: "#FEE2E2", stroke: "#EF4444" },
};

import { Animation } from "../core/Animation.js";
import { AnimationFrame } from "../core/AnimationFrame.js";

export class BSTAlgorithms {
  static snapshot(node) {
    if (!node) return null;
    const newNode = { value: node.value, x: node.x, y: node.y };
    newNode.left = this.snapshot(node.left);
    newNode.right = this.snapshot(node.right);
    return newNode;
  }

  /**
   * Nouvelle version : Retourne un objet AnimationFrame pur !
   */
  static createFrame(
    root,
    highlightedNode,
    message,
    theme = DSColors.current,
    visitedSequence = null,
    traversalType = null
  ) {
    return new AnimationFrame(
      "update_bst", // L'action générique pour les arbres
      {
        root: this.snapshot(root),
        highlightedNode: highlightedNode,
        fill: theme.fill,
        stroke: theme.stroke,
        visitedSequence: visitedSequence ? [...visitedSequence] : null,
        traversalType: traversalType,
      }, // Le payload (les données visuelles)
      null, // lineId
      null, // variables
      message // Le texte affiché dans les logs
    );
  }

  // --- SEARCH ---
  static search(root, value) {
    const animation = new Animation("bst_search");
    let current = root;

    animation.addFrame(this.createFrame(root, null, `Starting search for value: ${value}`));

    if (!root) {
      animation.addFrame(
        this.createFrame(root, null, `The tree is empty. Value ${value} not found.`, DSColors.error)
      );
      return animation;
    }

    while (current !== null) {
      animation.addFrame(
        this.createFrame(root, current.value, `Checking node ${current.value}...`)
      );

      if (value === current.value) {
        animation.addFrame(
          this.createFrame(root, current.value, `Target found! ${value} is in the tree.`, {
            fill: "var(--visited-fill)",
            stroke: "var(--visited-stroke)",
          })
        );
        return animation;
      } else if (value < current.value) {
        animation.addFrame(
          this.createFrame(root, current.value, `${value} < ${current.value}. Searching left.`)
        );
        current = current.left;
      } else {
        animation.addFrame(
          this.createFrame(root, current.value, `${value} > ${current.value}. Searching right.`)
        );
        current = current.right;
      }
    }

    animation.addFrame(
      this.createFrame(root, null, `Reached a dead end. Value ${value} not found.`, DSColors.error)
    );
    return animation;
  }

  // --- INSERT ---
  static insert(root, value) {
    const animation = new Animation("bst_insert");
    let currentRoot = this.snapshot(root);

    animation.addFrame(this.createFrame(currentRoot, null, `Starting insertion of ${value}...`));

    if (!currentRoot) {
      currentRoot = { value, left: null, right: null, x: 0, y: 0 };
      animation.addFrame(
        this.createFrame(currentRoot, value, `Tree empty. ${value} becomes root.`, DSColors.visited)
      );
      return { animation, newRoot: currentRoot }; // On renvoie aussi la nouvelle racine pour MAJ le document
    }

    let curr = currentRoot;
    while (true) {
      animation.addFrame(
        this.createFrame(currentRoot, curr.value, `Comparing ${value} with ${curr.value}`)
      );

      if (value === curr.value) {
        animation.addFrame(
          this.createFrame(currentRoot, curr.value, `Value ${value} exists!`, DSColors.error)
        );
        break;
      } else if (value < curr.value) {
        if (!curr.left) {
          curr.left = { value, left: null, right: null, x: 0, y: 0 };
          animation.addFrame(
            this.createFrame(currentRoot, value, `Inserted ${value} to the left.`, DSColors.visited)
          );
          break;
        }
        curr = curr.left;
      } else {
        if (!curr.right) {
          curr.right = { value, left: null, right: null, x: 0, y: 0 };
          animation.addFrame(
            this.createFrame(
              currentRoot,
              value,
              `Inserted ${value} to the right.`,
              DSColors.visited
            )
          );
          break;
        }
        curr = curr.right;
      }
    }
    return { animation, newRoot: currentRoot };
  }

  // --- DELETE ---
  static delete(root, value) {
    const animation = new Animation("bst_delete");
    let tree = this.snapshot(root);

    animation.addFrame(this.createFrame(tree, null, `Starting deletion for: ${value}`));

    let parent = null;
    let current = tree;
    let found = false;

    while (current !== null) {
      animation.addFrame(
        this.createFrame(
          tree,
          current.value,
          `Searching for ${value}... Checking ${current.value}.`
        )
      );
      if (value === current.value) {
        found = true;
        animation.addFrame(this.createFrame(tree, current.value, `Target found!`, DSColors.error));
        break;
      }
      parent = current;
      current = value < current.value ? current.left : current.right;
    }

    if (!found) {
      animation.addFrame(this.createFrame(tree, null, `Value ${value} not found.`, DSColors.error));
      return { animation, newRoot: tree };
    }

    if (!current.left || !current.right) {
      let child = current.left ? current.left : current.right;
      if (!parent) tree = child;
      else if (parent.left === current) parent.left = child;
      else parent.right = child;
      animation.addFrame(this.createFrame(tree, null, `Node removed.`));
    } else {
      animation.addFrame(
        this.createFrame(tree, current.value, `2 children found. Finding successor.`)
      );
      let successorParent = current;
      let successor = current.right;
      while (successor.left) {
        successorParent = successor;
        successor = successor.left;
        animation.addFrame(
          this.createFrame(tree, successor.value, `Moving to successor: ${successor.value}`)
        );
      }
      current.value = successor.value;
      if (successorParent.left === successor) successorParent.left = successor.right;
      else successorParent.right = successor.right;
      animation.addFrame(
        this.createFrame(tree, current.value, `Value updated and successor removed.`)
      );
    }
    return { animation, newRoot: tree };
  }

  // --- MIN / MAX ---
  static findMin(root) {
    const animation = new Animation("bst_min");
    let current = root;
    while (current && current.left) {
      animation.addFrame(
        this.createFrame(root, current.value, `Moving left to ${current.left.value}...`)
      );
      current = current.left;
    }
    if (current)
      animation.addFrame(
        this.createFrame(root, current.value, `Minimum found: ${current.value}`, DSColors.visited)
      );
    return animation;
  }

  static findMax(root) {
    const animation = new Animation("bst_max");
    let current = root;
    while (current && current.right) {
      animation.addFrame(
        this.createFrame(root, current.value, `Moving right to ${current.right.value}...`)
      );
      current = current.right;
    }
    if (current)
      animation.addFrame(
        this.createFrame(root, current.value, `Maximum found: ${current.value}`, DSColors.visited)
      );
    return animation;
  }

  // --- TRAVERSE ---
  static traverse(root, type) {
    const animation = new Animation(`bst_traverse_${type}`);
    let currentRoot = this.snapshot(root);
    const fullOrder = [];

    const getTraverse = (node) => {
      if (!node) return;
      if (type === "preorder") fullOrder.push(node);
      getTraverse(node.left);
      if (type === "inorder") fullOrder.push(node);
      getTraverse(node.right);
      if (type === "postorder") fullOrder.push(node);
    };

    if (type === "levelorder") {
      const queue = [currentRoot];
      while (queue.length > 0) {
        const curr = queue.shift();
        if (curr) {
          fullOrder.push(curr);
          if (curr.left) queue.push(curr.left);
          if (curr.right) queue.push(curr.right);
        }
      }
    } else {
      getTraverse(currentRoot);
    }

    const currentSequence = [];
    animation.addFrame(
      this.createFrame(
        currentRoot,
        null,
        `Starting ${type} traversal...`,
        DSColors.current,
        currentSequence,
        type
      )
    );

    fullOrder.forEach((node, i) => {
      currentSequence.push(node.value);
      animation.addFrame(
        this.createFrame(
          currentRoot,
          node.value,
          `Visiting ${node.value} (${i + 1}/${fullOrder.length})`,
          DSColors.visited,
          currentSequence,
          type
        )
      );
    });

    animation.addFrame(
      this.createFrame(
        currentRoot,
        null,
        `Traversal Complete! Processed ${fullOrder.length} nodes.`,
        DSColors.visited,
        currentSequence,
        type
      )
    );

    return animation;
  }
}
