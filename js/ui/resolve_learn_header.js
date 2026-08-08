document.addEventListener("DOMContentLoaded", () => {
  const isIframe = window.self !== window.top;
  const isModalParam = window.location.search.includes("modal=true");

  const lessonContainer = document.querySelector(".lesson-container");

  if (isIframe || isModalParam) {
    if (lessonContainer) {
      lessonContainer.style.marginTop = "0";
    }
    return;
  }

  const headerHTML = `
    <header id="theory-header" class="theory-navbar">
        <a href="../index.html" class="theory-brand">
            <i class="fa-solid fa-diagram-project"></i> AlgoVizor
        </a>
        <div class="theory-nav-links">
            <a href="../learn.html" class="nav-btn nav-btn-secondary">
                <i class="fa-solid fa-book-open"></i> Learn Library
            </a>
            <a href="../index.html" class="nav-btn nav-btn-primary">
                <i class="fa-solid fa-laptop-code"></i> Open Visualizer
            </a>
        </div>
    </header>
    `;

  document.body.insertAdjacentHTML("afterbegin", headerHTML);
});
