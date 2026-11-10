/* PanelCraft — application shell */
(function () {
  "use strict";

  const STORAGE_KEY = "panelcraft.state.v1";
  const ROUTES = ["designer", "parts", "cutting", "materials", "project"];
  let state = null;
  let activeItemId = null;
  let currentRoute = "designer";
  let loadError = false;

  const saveSoon = Utils.debounce(() => saveNow(false), 400);

  function project() { return state.project; }
  function getState() { return state; }

  function loadState() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return Data.normalizeState(JSON.parse(raw));
    } catch (error) {
      console.error("PanelCraft: could not load saved state", error);
      loadError = true;
    }
    return Data.createInitialState();
  }

  function saveNow(showToast) {
    try {
      state.project.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (showToast) UI.toast(I18n.t("toast.saved"));
    } catch (error) {
      console.error("PanelCraft: could not save state", error);
      UI.toast(I18n.t("toast.error"), "error");
    }
    updateChrome();
  }

  function persist(immediate) {
    updateChrome();
    if (immediate) saveNow(false);
    else saveSoon();
  }

  function activeItem() {
    const items = project().items || [];
    if (!items.length) return null;
    let item = items.find((candidate) => candidate.id === activeItemId);
    if (!item) {
      item = items[0];
      activeItemId = item.id;
    }
    return item;
  }

  function setActiveItem(id) {
    activeItemId = id;
  }

  function updateChrome() {
    if (!state) return;
    const proj = project();
    const name = proj.name || I18n.t("common.unnamed");
    const sidebarName = document.getElementById("sidebar-project-name");
    const topbarName = document.getElementById("topbar-project-name");
    const chip = document.getElementById("project-chip");
    const partsCount = document.getElementById("nav-parts-count");
    if (sidebarName) sidebarName.textContent = name;
    if (topbarName) topbarName.textContent = name;
    if (chip) chip.title = name;
    document.title = `${name} · PanelCraft`;
    if (partsCount) {
      let units = 0;
      try {
        units = Model.projectRows(proj).reduce((sum, part) => sum + part.qty, 0);
      } catch (_) { units = 0; }
      partsCount.textContent = units > 0 ? String(units) : "";
      partsCount.style.display = units > 0 ? "" : "none";
    }
  }

  function setActiveRoute(route) {
    document.querySelectorAll(".nav-item[data-route], .mobile-nav-item[data-route]").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-route") === route);
    });
  }

  function renderCurrent(options) {
    const opts = options || {};
    if (!ROUTES.includes(currentRoute)) currentRoute = "designer";
    const view = document.getElementById("view");
    const pageTitle = document.getElementById("page-title");
    if (!view) return;
    setActiveRoute(currentRoute);
    if (pageTitle) pageTitle.textContent = I18n.t(`page.${currentRoute}.title`);
    document.title = `${project().name || "PanelCraft"} · ${I18n.t(`page.${currentRoute}.title`)}`;
    updateChrome();
    const definition = window.Views && window.Views[currentRoute];
    try {
      if (!definition) throw new Error(`View "${currentRoute}" is not registered`);
      view.innerHTML = definition.render();
      if (definition.mount) definition.mount(view);
      if (opts.animate) {
        view.style.animation = "none";
        void view.offsetWidth;
        view.style.animation = "";
      }
      if (opts.scroll) window.scrollTo(0, 0);
    } catch (error) {
      console.error(`PanelCraft: could not render ${currentRoute}`, error);
      view.innerHTML = `<div class="empty"><div class="empty-icon">${UI.icon("warning")}</div>
        <h3>${UI.esc(I18n.t("toast.error"))}</h3><p>${UI.esc(error.message || String(error))}</p></div>`;
    }
  }

  function commit(options) {
    const opts = options || {};
    persist(Boolean(opts.immediate));
    if (opts.render !== false) renderCurrent({ animate: false });
  }

  function navigate(route, options) {
    const opts = options || {};
    if (!ROUTES.includes(route)) route = "designer";
    if (opts.itemId) activeItemId = opts.itemId;
    const hash = `#/${route}`;
    currentRoute = route;
    if (location.hash === hash) {
      renderCurrent({ animate: true, scroll: true });
    } else {
      location.hash = hash;
    }
  }

  function routeFromHash() {
    const match = String(location.hash || "").match(/^#\/(\w+)/);
    return match && ROUTES.includes(match[1]) ? match[1] : "designer";
  }

  function applyAppearance() {
    document.documentElement.dataset.theme = state.ui.theme;
    document.documentElement.lang = state.ui.lang;
    try {
      localStorage.setItem("panelcraft.theme", state.ui.theme);
      localStorage.setItem("panelcraft.lang", state.ui.lang);
    } catch (_) {}
    I18n.setLang(state.ui.lang);
    I18n.apply(document);
    const langLabel = document.getElementById("lang-label");
    if (langLabel) langLabel.textContent = state.ui.lang.toUpperCase();
    document.documentElement.dataset.theme = state.ui.theme;
  }

  function toggleLanguage() {
    state.ui.lang = state.ui.lang === "ru" ? "en" : "ru";
    applyAppearance();
    persist(true);
    renderCurrent({ animate: true });
    UI.toast(I18n.t("toast.language"));
  }

  function toggleTheme() {
    state.ui.theme = state.ui.theme === "light" ? "dark" : "light";
    applyAppearance();
    persist(true);
    renderCurrent({ animate: false });
  }

  function replaceProject(rawProject, message) {
    state.project = Data.normalizeProject(rawProject);
    activeItemId = state.project.items[0] ? state.project.items[0].id : null;
    persist(true);
    renderCurrent({ animate: true, scroll: true });
    UI.toast(message || I18n.t("project.imported"));
  }

  function loadSample() {
    state.project = Data.createSampleProject();
    activeItemId = state.project.items[0] ? state.project.items[0].id : null;
    persist(true);
    renderCurrent({ animate: true, scroll: true });
    UI.toast(I18n.t("project.resetDone"));
  }

  function newProject() {
    state.project = Data.createEmptyProject();
    activeItemId = null;
    persist(true);
    renderCurrent({ animate: true, scroll: true });
    UI.toast(I18n.t("project.newDone"));
  }

  function openHelp() {
    const steps = [1, 2, 3, 4].map((n) => `
      <div class="help-step">
        <span class="help-num">${n}</span>
        <div><b>${UI.esc(I18n.t(`help.step${n}Title`))}</b><p>${UI.esc(I18n.t(`help.step${n}Text`))}</p></div>
      </div>`).join("");
    UI.openModal({
      title: I18n.t("help.title"),
      subtitle: I18n.t("help.intro"),
      wide: true,
      body: `<div class="help-steps">${steps}</div>
        <div class="waste-note">${UI.icon("info")}<div><b>${UI.esc(I18n.t("help.tipTitle"))}</b><br>${UI.esc(I18n.t("help.tipText"))}</div></div>`,
      footer: `<button type="button" class="btn btn-primary" data-modal-close>${UI.esc(I18n.t("help.close"))}</button>`,
    });
  }

  function attachGlobalEvents() {
    document.addEventListener("click", (event) => {
      const nav = event.target.closest("[data-route]");
      if (nav) {
        event.preventDefault();
        navigate(nav.getAttribute("data-route"));
        return;
      }
      const action = event.target.closest("[data-action]");
      if (!action) return;
      const name = action.getAttribute("data-action");
      if (name === "toggle-lang") toggleLanguage();
      else if (name === "toggle-theme") toggleTheme();
      else if (name === "open-help") openHelp();
    });

    window.addEventListener("hashchange", () => {
      const route = routeFromHash();
      currentRoute = route;
      renderCurrent({ animate: true, scroll: true });
    });

    window.addEventListener("beforeunload", () => saveNow(false));
  }

  function init() {
    state = loadState();
    applyAppearance();
    activeItemId = state.project.items[0] ? state.project.items[0].id : null;
    attachGlobalEvents();
    currentRoute = routeFromHash();
    if (location.hash !== `#/${currentRoute}`) {
      history.replaceState(null, "", `#/${currentRoute}`);
    }
    if (!localStorage.getItem(STORAGE_KEY)) saveNow(false);
    renderCurrent({ animate: true });
    if (loadError) {
      UI.toast(I18n.t("project.importError"), "error");
    }
  }

  window.App = {
    init,
    project,
    state: getState,
    activeItem,
    activeItemId: () => activeItemId,
    setActiveItem,
    persist,
    commit,
    render: renderCurrent,
    navigate,
    replaceProject,
    loadSample,
    newProject,
    saveNow,
    applyAppearance,
    toggleLanguage,
    toggleTheme,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
