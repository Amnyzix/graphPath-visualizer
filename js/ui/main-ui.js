// ==========================================
// GESTION GLOBALE DE L'UI (Onglets & Thème)
// ==========================================
import { ShareManager } from "../core/ShareManager.js";
import { ExportManager } from "../core/ExportManager.js";
import { AnimationPlayer } from "../animation/AnimationPlayer.js";

function switchGlobalMode(mode) {
  document.querySelectorAll(".mode-tab-btn").forEach((btn) => btn.classList.remove("active"));
  document
    .querySelectorAll(".view-section")
    .forEach((view) => view.classList.remove("active-view"));

  const targetBtn = document.querySelector(`.mode-tab-btn[data-target="${mode}"]`);
  if (targetBtn) targetBtn.classList.add("active");

  const targetView = document.getElementById(`view-${mode}`);
  if (targetView) targetView.classList.add("active-view");

  const editorToggleBtn = document.getElementById("toggle-drawer-btn");
  if (editorToggleBtn) {
    editorToggleBtn.style.display = mode === "graphs" ? "flex" : "none";
  }

  const editor = window.AppRegistry.get(mode);

  if (editor) {
    window.activeEditor = editor;
    window.activeEditorType = mode;
    console.log(`Éditeur actif : ${mode}`, window.activeEditor);
  } else {
    console.warn(`L'éditeur ${mode} n'est pas enregistré.`);
  }

  console.log(`editor: ${window.activeEditor}`);
}

window.switchGlobalMode = switchGlobalMode;

document.addEventListener("DOMContentLoaded", () => {
  window.AppRegistry.init();

  // Au démarrage de l'application
  window.player = new AnimationPlayer();

  Object.values(window.AppRegistry.editors).forEach((editor) => {
    if (editor.render) editor.render();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const themeToggleBtn = document.getElementById("theme-toggle");

  const currentTheme = localStorage.getItem("theme") || "light";

  if (currentTheme === "dark") {
    document.body.classList.add("dark");
    document.body.classList.remove("light");
    themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i> Light Mode';
  } else {
    document.body.classList.add("light");
    document.body.classList.remove("dark");
    themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i> Dark Mode';
  }

  themeToggleBtn.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    document.body.classList.toggle("light", !isDark);

    themeToggleBtn.innerHTML = isDark
      ? '<i class="fa-solid fa-sun"></i> Light Mode'
      : '<i class="fa-solid fa-moon"></i> Dark Mode';

    localStorage.setItem("theme", isDark ? "dark" : "light");
  });

  const payload = ShareManager.loadFromUrl();

  if (payload) {
    const editor = window.AppRegistry.get(payload.type);
    if (editor) {
      // 1. On affiche l'onglet pour que le SVG ait une vraie taille (quitte le display: none)
      switchGlobalMode(payload.type);

      // 2. On attend un court instant pour laisser le navigateur calculer les dimensions de l'écran
      setTimeout(() => {
        const nodes = payload.data.nodes || [];
        const edges = payload.data.edges || [];
        const maxId = nodes.length > 0 ? Math.max(...nodes.map((n) => parseInt(n.id, 10) || 0)) : 0;

        // 3. On injecte les données via la méthode officielle de l'éditeur
        if (typeof editor.setGraphData === "function") {
          editor.setGraphData({
            nodes: nodes,
            edges: edges,
            nodeIdCounter: maxId + 1,
          });
        } else {
          // Fallback au cas où c'est un vieil éditeur non migré
          editor.nodes = nodes;
          editor.edges = edges;
          editor.nodeCounter = maxId + 1;
          window.__legacyEdges = edges;
          if (editor.render) editor.render();
        }
      }, 50); // 50ms est suffisant pour que l'interface soit bien rendue avant de dessiner
    }
  } else {
    const defaultMode = "graphs";
    const defaultEditor = window.AppRegistry.get(defaultMode);

    if (defaultEditor) {
      window.activeEditor = defaultEditor;
      window.activeEditorType = defaultMode;
    }
  }
});

export function handleShareButtonClick(event) {
  if (!window.activeEditor) {
    console.error("No active editor found.");
    return;
  }
  console.log(window.activeEditor);

  const data = window.activeEditor.getExportData();
  const shareLink = ShareManager.generateShareLink(data, window.activeEditorType);

  navigator.clipboard
    .writeText(shareLink)
    .then(() => {
      const btn = event.target;

      const actualBtn = btn.closest("button");

      const originalContent = actualBtn.innerHTML;
      actualBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied !';

      setTimeout(() => {
        actualBtn.innerHTML = originalContent;
        actualBtn.disabled = false;
      }, 1000);
    })
    .catch((err) => {
      console.error("Copy error : ", err);
    });
}

window.handleShareButtonClick = handleShareButtonClick;

export function exportCurrentAnimation(format) {
  // 1. On identifie le lecteur actif
  let activePlayer = null;

  if (window.currentAlgoName && window.currentAlgoName.includes("bst")) {
    activePlayer = window.bstPlayer;
  } else if (window.graphPlayer) {
    activePlayer = window.graphPlayer;
  } else if (window.heapPlayer) {
    activePlayer = window.heapPlayer;
  }

  // 2. On lance l'export correspondant
  if (activePlayer) {
    if (format === "gif") {
      ExportManager.exportGIF(activePlayer);
    } else if (format === "mp4") {
      ExportManager.exportVideo(activePlayer);
    }
  } else {
    alert("No active animation player found to export.");
  }
}

window.exportCurrentAnimation = exportCurrentAnimation;

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggle-drawer-btn");
  const editorPanel = document.querySelector(".editor-panel");

  if (toggleBtn && editorPanel) {
    toggleBtn.addEventListener("click", () => {
      // Ajoute ou enlève la classe "open" au clic
      editorPanel.classList.toggle("open");

      // Change l'icône du bouton selon l'état
      const isOpen = editorPanel.classList.contains("open");
      toggleBtn.innerHTML = isOpen
        ? '<i class="fa-solid fa-times"></i> Close'
        : '<i class="fa-solid fa-code"></i> Editor';
    });
  }
});
