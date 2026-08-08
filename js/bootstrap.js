// Bootstrap module: central import point to initialize ES modules and
// ensure functions used by inline `onclick` handlers are available on window.

import AppRegistry from "./core/AppRegistry.js";
import "./ui/main-ui.js"; // attaches DOM handlers, initializes registry on DOMContentLoaded
import "./ui/editor.js"; // exposes runScript, parseGraphData, updateGraphDataText
import "./ui/ui-controls.js"; // exposes rename/edit/delete, switchTab, dropdowns
import "./ui/ds-ui.js"; // data-structures UI
import "./ui/automata-ui.js"; // automata UI actions
import "./core/algorithm-runner.js"; // loadAlgorithm, runDirectly, theory modal
import "./core/ExportManager.js"; // Export utilities
import "./core/recorder.js"; // recording helpers
import "./features/graphs/graphGenerator.js"; // openGeneratorModal
import "./core/storage.js";

// Re-attach AppRegistry just in case
window.AppRegistry = AppRegistry;

// Export nothing: this module's job is side-effects and global wiring
