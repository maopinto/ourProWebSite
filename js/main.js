// Page interactions. Edit the page content in index.html and its design in styles.css.
(function () {
  "use strict";

  const landscapes = [
    { id: "alpine", tag: "ALPINE VALLEY", prompt: "Create an alpine valley with dramatic peaks and winding ridgelines." },
    { id: "desert", tag: "DESERT DUNES", prompt: "Build an endless desert of soft dunes sculpted by the wind." },
    { id: "island", tag: "WILD ISLAND", prompt: "Imagine a remote island with rugged mountains and untouched shores." }
  ];
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const menuButton = document.querySelector(".mobile-menu-button");
  const mobileNavigation = document.getElementById("mobile-navigation");
  const editor = document.querySelector(".editor-frame");
  const fullscreenButton = editor.querySelector(".editor-icon-button");
  const promptField = document.getElementById("world-prompt");
  const promptContainer = document.querySelector(".prompt-composer");
  const rotationButton = document.querySelector(".prompt-rotation-toggle");
  const presetButtons = document.querySelectorAll("[data-landscape]");
  const suggestionButtons = document.querySelectorAll("[data-prompt]");
  let selectedPrompt = "alpine";
  let paused = false;
  let promptVisible = !("IntersectionObserver" in window);
  let exitTimer;
  let changeTimer;
  let terrain;

  // These are fixed SVG paths, never user-provided HTML.
  function setIcon(svg, name) {
    const paths = {
      menu: "M4 6h16M4 12h16M4 18h16",
      close: "m6 6 12 12M6 18 18 6",
      expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"
    };
    svg.querySelector("path").setAttribute("d", paths[name]);
  }

  function closeNavigation(restoreFocus = false) {
    const wasOpen = !mobileNavigation.hidden;
    mobileNavigation.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
    setIcon(menuButton.querySelector("svg"), "menu");
    if (wasOpen && restoreFocus) menuButton.focus();
  }
  menuButton.addEventListener("click", function () {
    if (!mobileNavigation.hidden) return closeNavigation();
    mobileNavigation.hidden = false;
    menuButton.setAttribute("aria-expanded", "true");
    menuButton.setAttribute("aria-label", "Close navigation");
    setIcon(menuButton.querySelector("svg"), "close");
  });
  mobileNavigation.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () { closeNavigation(); });
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeNavigation(true);
  });
  window.matchMedia("(min-width: 1001px)").addEventListener("change", function (event) {
    if (event.matches) closeNavigation();
  });
  document.querySelectorAll("[data-open-account]").forEach(function (button) {
    button.addEventListener("click", function () {
      // Make the menu toggle the focus return target if the mobile link disappears.
      closeNavigation(mobileNavigation.contains(button));
      window.TerraDialogs.openAccount();
    });
  });
  document.querySelectorAll("[data-open-download]").forEach(function (button) {
    button.addEventListener("click", function () { window.TerraDialogs.openDownload(); });
  });

  function setStatus(message) {
    const status = document.querySelector(".editor-status");
    const dot = status.querySelector(".ready-dot");
    status.replaceChildren(dot, document.createTextNode(message));
  }
  fullscreenButton.addEventListener("click", async function () {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (editor.requestFullscreen) await editor.requestFullscreen();
      else setStatus("Full screen is not supported in this browser.");
    } catch {
      setStatus("Full screen is not available in this browser.");
    }
  });
  document.addEventListener("fullscreenchange", function () {
    const fullscreen = document.fullscreenElement === editor;
    const label = fullscreen ? "Exit full screen" : "Expand preview";
    fullscreenButton.setAttribute("aria-label", label);
    fullscreenButton.title = label;
    setIcon(fullscreenButton.querySelector("svg"), fullscreen ? "close" : "expand");
  });

  function selectPrompt(id) {
    selectedPrompt = id;
    promptField.value = landscapes.find(function (item) { return item.id === id; }).prompt;
    document.querySelector(".prompt-counter").textContent =
      String(landscapes.findIndex(function (item) { return item.id === id; }) + 1).padStart(2, "0") + " / 03";
    suggestionButtons.forEach(function (button) {
      const selected = button.dataset.prompt === id;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    // Restart the arrival animation without replacing the focused text field.
    promptField.classList.remove("rotating-prompt", "is-leaving");
    void promptField.offsetWidth;
    promptField.classList.add("rotating-prompt");
    restartRotation();
  }
  function restartRotation() {
    window.clearTimeout(exitTimer);
    window.clearTimeout(changeTimer);
    promptField.classList.remove("is-leaving");
    rotationButton.hidden = motionPreference.matches;
    if (paused || motionPreference.matches || !promptVisible || document.hidden ||
        document.activeElement === promptField || document.querySelector("dialog[open]")) return;
    exitTimer = window.setTimeout(function () { promptField.classList.add("is-leaving"); }, 4200);
    changeTimer = window.setTimeout(function () {
      const index = landscapes.findIndex(function (item) { return item.id === selectedPrompt; });
      selectPrompt(landscapes[(index + 1) % landscapes.length].id);
    }, 4420);
  }
  rotationButton.addEventListener("click", function () {
    paused = !paused;
    rotationButton.setAttribute("aria-label", paused ? "Resume example rotation" : "Pause example rotation");
    rotationButton.innerHTML = paused
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m9 5 11 7-11 7V5Z"/></svg><span>Play</span>'
      : '<span class="pause-symbol" aria-hidden="true">Ⅱ</span><span>Pause</span>';
    restartRotation();
  });
  suggestionButtons.forEach(function (button) {
    button.addEventListener("click", function () { selectPrompt(button.dataset.prompt); });
  });
  promptField.addEventListener("focus", restartRotation);
  promptField.addEventListener("blur", restartRotation);
  document.addEventListener("visibilitychange", restartRotation);
  document.addEventListener("terra:dialogchange", restartRotation);
  motionPreference.addEventListener("change", restartRotation);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      promptVisible = entries[0].isIntersecting;
      restartRotation();
    }, { threshold: 0.15 }).observe(promptContainer);
  }
  restartRotation();

  const checkIcon = document.querySelector(".landscape-preset > svg");
  presetButtons.forEach(function (button) {
    if (!button.querySelector(":scope > svg")) button.append(checkIcon.cloneNode(true));
    button.querySelector(":scope > svg").toggleAttribute("hidden", button.dataset.landscape !== "alpine");
    button.addEventListener("click", function () {
      const id = button.dataset.landscape;
      terrain?.setVariant(id);
      presetButtons.forEach(function (preset) {
        const active = preset.dataset.landscape === id;
        preset.classList.toggle("is-active", active);
        preset.setAttribute("aria-pressed", String(active));
        preset.querySelector(":scope > svg").toggleAttribute("hidden", !active);
      });
      document.querySelector(".landscape-coordinate > span").textContent =
        "01 / " + landscapes.find(function (item) { return item.id === id; }).tag;
      selectPrompt(id);
      setStatus("Sample scene · Drag to look around");
    });
  });
  const viewButtons = document.querySelectorAll(".viewport-tool");
  viewButtons.forEach(function (button, index) {
    button.addEventListener("click", function () {
      const wireframe = index === 1;
      terrain?.setWireframe(wireframe);
      viewButtons.forEach(function (viewButton) {
        viewButton.classList.toggle("is-active", viewButton === button);
        viewButton.setAttribute("aria-pressed", String(viewButton === button));
      });
      document.querySelector(".viewport-shading").firstChild.textContent = wireframe ? "WIREFRAME" : "SHADED";
    });
  });

  // Reveal sections as they enter the viewport, respecting reduced motion.
  const main = document.getElementById("main");
  const revealElements = main.querySelectorAll("[data-reveal]");
  let revealObserver;
  function reveal(element) {
    element.dataset.revealState = "visible";
    revealObserver?.unobserve(element);
  }
  function startReveals() {
    revealObserver?.disconnect();
    if (motionPreference.matches || !("IntersectionObserver" in window)) {
      revealElements.forEach(reveal);
      return;
    }
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) reveal(entry.target); });
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
    revealElements.forEach(function (element) {
      if (element.dataset.revealState === "visible") return;
      if (element.getBoundingClientRect().bottom <= 0) return reveal(element);
      element.dataset.revealState = "waiting";
      revealObserver.observe(element);
    });
  }
  main.addEventListener("focusin", function (event) {
    const element = event.target.closest("[data-reveal]");
    if (element) reveal(element);
  });
  motionPreference.addEventListener("change", startReveals);
  startReveals();
  document.querySelector("[data-current-year]").textContent = new Date().getFullYear();

  terrain = window.TerraTerrain.create(document.querySelector(".terrain-stage canvas"));
})();
