import Shepherd from "https://cdn.jsdelivr.net/npm/shepherd.js@15.2.2/dist/js/shepherd.mjs";

document.addEventListener("DOMContentLoaded", () => {
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      scrollTo: true,
      cancelIcon: { enabled: true },
    },
  });

  // Step 1: Canvas Overview
  tour.addStep({
    id: "intro-canvas",
    title: "Drawing Area",
    text: "This is your main workspace where graphs are rendered and manipulated visually.",
    attachTo: { element: "#canvas", on: "left" },
    buttons: [
      { text: "Skip", action: tour.cancel, classes: "shepherd-button-secondary" },
      { text: "Next", action: tour.next },
    ],
  });

  // Step 2: Adding Nodes
  tour.addStep({
    id: "intro-add-nodes",
    title: "Creating Nodes",
    text: "Double-click anywhere on the empty canvas to create a new state or node instantly.",
    attachTo: { element: "#canvas", on: "left" },
    buttons: [
      { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
      { text: "Next", action: tour.next },
    ],
  });

  // Step 3: Creating Edges / Transitions
  tour.addStep({
    id: "intro-add-edges",
    title: "Connecting Nodes",
    text: "Click once on a starting node, then click on a target node in sequence to create a directed or weighted transition between them.",
    attachTo: { element: "#canvas", on: "left" },
    buttons: [
      { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
      { text: "Next", action: tour.next },
    ],
  });

  // Step 4: Configuring States & Edges
  tour.addStep({
    id: "intro-modify-elements",
    title: "Advanced Interactions",
    text: "Right-click a node to toggle it as Final. Shift + Right-click to set it as Initial. Double-click any transition label to edit its symbol or weight.",
    attachTo: { element: "#canvas", on: "left" },
    buttons: [
      { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
      { text: "Next", action: tour.next },
    ],
  });

  // Step 5: Automatic Generation
  tour.addStep({
    id: "intro-generate",
    title: "Automatic Generation",
    text: "Use this menu to generate complete graphs, binary trees, grids, or random layouts automatically.",
    attachTo: { element: ".dropdown", on: "bottom" },
    buttons: [
      { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
      { text: "Next", action: tour.next },
    ],
  });

  // Step 6: Code Editor
  tour.addStep({
    id: "intro-editor",
    title: "Algorithm Coding",
    text: "Write your Python algorithms here. Use built-in visual functions like visit(node) to animate your logic on the canvas.",
    attachTo: { element: ".editor-panel", on: "right" },
    buttons: [
      { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
      { text: "Finish", action: tour.complete },
    ],
  });

  // Automatically start on the first visit
  if (!localStorage.getItem("tutorial_completed")) {
    setTimeout(() => tour.start(), 1000);
    localStorage.setItem("tutorial_completed", "true");
  }

  // Expose function to restart the tutorial manually from a help button
  window.startTutorial = () => tour.start();
});
