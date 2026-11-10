/* PanelCraft — project & settings view */
(function () {
  "use strict";

  const esc = UI.esc;
  const fmt = (n) => Utils.formatMm(n);

  function dataAction(action, iconName, title, hint) {
    return `<button type="button" class="data-action" data-project-action="${action}">
      <span class="empty-icon">${UI.icon(iconName)}</span>
      <span class="data-action-copy"><b>${esc(title)}</b><span>${esc(hint)}</span></span>
    </button>`;
  }

  function render() {
    const project = App.project();
    const rows = Model.projectRows(project);
    const totals = Model.totals(rows);
    const result = Optimizer.optimize(project);
    const head = UI.pageHead(
      I18n.t("page.project.title"),
      I18n.t("page.project.subtitle"),
      `<button class="btn" data-project-action="new">${UI.icon("plus")}${esc(I18n.t("project.newProject"))}</button>
       <button class="btn btn-primary" data-project-action="download">${UI.icon("download")}${esc(I18n.t("project.downloadJson"))}</button>`
    );

    const stats = `<div class="metric-grid" style="margin-bottom:16px">
      ${UI.metric(I18n.t("project.statsItems"), I18n.number(project.items.length, 0), I18n.count(project.items.length, "item"), "designer")}
      ${UI.metric(I18n.t("project.statsParts"), I18n.number(totals.units, 0), I18n.area(totals.areaM2), "parts")}
      ${UI.metric(I18n.t("project.statsSheets"), I18n.number(result.totals.sheets, 0), esc(I18n.t("project.statsSheetsHint")), "cut")}
      ${UI.metric(I18n.t("project.statsCost"), UI.money(project, result.totals.cost), esc(I18n.t("cutting.statsCostHint")), "euro")}
    </div>`;

    const hero = `<div class="card project-hero">
      <div class="project-hero-icon">${UI.icon("folder")}</div>
      <div class="project-hero-main">
        <input class="project-name-input" id="project-name" value="${esc(project.name)}" maxlength="120" placeholder="${esc(I18n.t("project.titlePlaceholder"))}" aria-label="${esc(I18n.t("project.name"))}">
        <div class="project-hero-sub">
          <span>${esc(I18n.t("project.created", { date: I18n.date(project.createdAt) }))}</span>
          <span>${esc(I18n.t("project.updated", { date: I18n.date(project.updatedAt) }))}</span>
          <span>${esc(I18n.t("project.savedLocal"))}</span>
        </div>
      </div>
      <div class="project-hero-actions">
        <button class="btn btn-sm" data-route="cutting">${UI.icon("cut")}${esc(I18n.t("nav.cutting"))}</button>
        <button class="btn btn-sm btn-primary" data-route="designer">${UI.icon("designer")}${esc(I18n.t("nav.designer"))}</button>
      </div>
    </div>`;

    const settingsCard = `<div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${esc(I18n.t("project.settingsTitle"))}</div>
          <div class="card-sub">${esc(I18n.t("project.settingsSub"))}</div>
        </div>
      </div>
      <div class="settings-list">
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="project-edge">${esc(I18n.t("project.edgeThickness"))}</label>
            <input id="project-edge" class="input" type="number" min="0.3" max="10" step="0.5" value="${project.edgeThickness}" data-project-field="edgeThickness">
            <span class="param-note">${esc(I18n.t("project.edgeThicknessHint"))}</span>
          </div>
          <div class="field">
            <label class="field-label" for="project-currency">${esc(I18n.t("project.currency"))}</label>
            <select id="project-currency" class="select" data-project-field="currency">
              ${Data.CURRENCIES.map((currency) => `<option value="${currency.code}" ${currency.code === project.currency ? "selected" : ""}>${currency.code} · ${currency.symbol}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="project-language">${esc(I18n.t("project.language"))}</label>
            <select id="project-language" class="select" data-project-field="language">
              <option value="ru" ${App.state().ui.lang === "ru" ? "selected" : ""}>Русский</option>
              <option value="en" ${App.state().ui.lang === "en" ? "selected" : ""}>English</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">${esc(I18n.t("project.theme"))}</label>
            <div class="segmented">
              <button type="button" data-set-theme="light" class="${App.state().ui.theme === "light" ? "active" : ""}">${UI.icon("sun")}${esc(I18n.t("project.light"))}</button>
              <button type="button" data-set-theme="dark" class="${App.state().ui.theme === "dark" ? "active" : ""}">${UI.icon("moon")}${esc(I18n.t("project.dark"))}</button>
            </div>
          </div>
        </div>
        <div class="field">
          <label class="field-label">${esc(I18n.t("project.units"))}</label>
          <div class="input-prefix"><span>${esc(I18n.t("common.mm"))}</span><input value="${esc(I18n.t("project.unitsValue"))}" readonly></div>
          <span class="param-note">${esc(I18n.t("project.unitsHint"))}</span>
        </div>
      </div>
    </div>`;

    const dataCard = `<div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${esc(I18n.t("project.dataTitle"))}</div>
          <div class="card-sub">${esc(I18n.t("project.dataSub"))}</div>
        </div>
      </div>
      <div class="data-actions">
        ${dataAction("download", "download", I18n.t("project.downloadJson"), I18n.t("project.downloadJsonHint"))}
        ${dataAction("import", "upload", I18n.t("project.importJson"), I18n.t("project.importJsonHint"))}
        ${dataAction("new", "plus", I18n.t("project.newProject"), I18n.t("project.newProjectHint"))}
        ${dataAction("sample", "box", I18n.t("project.sample"), I18n.t("project.sampleHint"))}
        <input type="file" id="project-file" accept=".json,application/json" hidden>
      </div>
    </div>`;

    const aboutCard = `<div class="card about-card">
      <div class="card-head">
        <div>
          <div class="card-title">${esc(I18n.t("project.aboutTitle"))}</div>
          <div class="card-sub">${esc(I18n.t("project.version"))}</div>
        </div>
        <span class="badge badge-accent">PanelCraft</span>
      </div>
      <div class="card-body">
        <p>${esc(I18n.t("project.aboutText"))}</p>
        <p style="margin-top:10px">${esc(I18n.t("project.localOnly"))}</p>
        <div class="tech-list">
          ${UI.badge(I18n.t("cutting.algorithmMR"), "outline")}
          ${UI.badge(I18n.t("cutting.algorithmG"), "outline")}
          ${UI.badge("JSON / CSV", "outline")}
          ${UI.badge(I18n.t("project.tech"), "outline")}
        </div>
      </div>
    </div>`;

    const dangerCard = `<div class="card danger-zone" style="margin-top:16px">
      <div class="card-head">
        <div>
          <div class="card-title">${esc(I18n.t("project.dangerTitle"))}</div>
          <div class="card-sub">${esc(I18n.t("project.dangerHint"))}</div>
        </div>
      </div>
      <div class="danger-actions">
        <button class="btn btn-danger" data-project-action="reset">${UI.icon("rotate")}${esc(I18n.t("project.reset"))}</button>
        <button class="btn btn-danger" data-project-action="clear">${UI.icon("trash")}${esc(I18n.t("project.clearAll"))}</button>
      </div>
      <div class="card-foot" style="font-size:11px;color:var(--faint)">${esc(I18n.t("project.backupTip"))}</div>
    </div>`;

    return `${head}${hero}${stats}
      <div class="settings-grid">
        ${settingsCard}
        ${dataCard}
        ${aboutCard}
      </div>
      ${dangerCard}`;
  }

  function downloadProject() {
    Exporters.downloadProject(App.project());
    UI.toast(I18n.t("project.exported"));
  }

  async function importProject(file) {
    try {
      const text = await Utils.readFile(file);
      const parsed = JSON.parse(text);
      App.replaceProject(parsed);
    } catch (error) {
      console.error("PanelCraft import failed", error);
      UI.toast(I18n.t("project.importError"), "error");
    }
  }

  function mount(view) {
    const project = App.project();
    const name = view.querySelector("#project-name");
    if (name) {
      name.addEventListener("input", () => {
        project.name = name.value;
        const topbar = document.getElementById("topbar-project-name");
        const sidebar = document.getElementById("sidebar-project-name");
        if (topbar) topbar.textContent = name.value || I18n.t("common.unnamed");
        if (sidebar) sidebar.textContent = name.value || I18n.t("common.unnamed");
        document.title = `${name.value || "PanelCraft"} · ${I18n.t("page.project.title")}`;
        App.persist(false);
      });
      name.addEventListener("change", () => {
        if (!name.value.trim()) {
          project.name = I18n.t("project.name");
          name.value = project.name;
          App.persist(true);
        } else {
          project.name = name.value.trim();
          App.persist(true);
        }
      });
    }

    view.querySelectorAll("[data-project-field]").forEach((field) => {
      field.addEventListener("change", () => {
        const key = field.getAttribute("data-project-field");
        if (key === "edgeThickness") {
          project.edgeThickness = Utils.clamp(UI.parseNumber(field.value, 2), 0.3, 10);
          field.value = project.edgeThickness;
          App.persist(true);
        } else if (key === "currency") {
          project.currency = field.value;
          App.persist(true);
          App.render({ animate: false });
        } else if (key === "language") {
          App.state().ui.lang = field.value;
          App.applyAppearance();
          App.persist(true);
          App.render({ animate: false });
        }
      });
    });

    view.querySelectorAll("[data-set-theme]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const theme = btn.getAttribute("data-set-theme");
        App.state().ui.theme = theme;
        App.applyAppearance();
        App.persist(true);
        App.render({ animate: false });
      });
    });

    view.querySelectorAll("[data-project-action]").forEach((btn) => {
      const action = btn.getAttribute("data-project-action");
      if (action === "download") btn.addEventListener("click", downloadProject);
      if (action === "import") {
        btn.addEventListener("click", () => {
          const input = view.querySelector("#project-file");
          if (input) input.click();
        });
      }
      if (action === "new") {
        btn.addEventListener("click", () => {
          UI.confirm({
            title: I18n.t("project.newProject"),
            message: esc(I18n.t("project.newConfirm")),
            confirmLabel: I18n.t("common.create"),
            danger: true,
          }).then((confirmed) => { if (confirmed) App.newProject(); });
        });
      }
      if (action === "sample") {
        btn.addEventListener("click", () => {
          UI.confirm({
            title: I18n.t("project.sample"),
            message: esc(I18n.t("project.resetConfirm")),
            confirmLabel: I18n.t("common.reset"),
          }).then((confirmed) => { if (confirmed) App.loadSample(); });
        });
      }
      if (action === "reset") {
        btn.addEventListener("click", () => {
          UI.confirm({
            title: I18n.t("project.reset"),
            message: esc(I18n.t("project.resetConfirm")),
            confirmLabel: I18n.t("common.reset"),
            danger: true,
          }).then((confirmed) => { if (confirmed) App.loadSample(); });
        });
      }
      if (action === "clear") {
        btn.addEventListener("click", () => {
          UI.confirm({
            title: I18n.t("project.clearAll"),
            message: esc(I18n.t("project.clearAllConfirm")),
            confirmLabel: I18n.t("common.delete"),
            danger: true,
          }).then((confirmed) => {
            if (!confirmed) return;
            try {
              localStorage.removeItem("panelcraft.state.v1");
              localStorage.removeItem("panelcraft.theme");
              localStorage.removeItem("panelcraft.lang");
            } catch (_) {}
            location.hash = "#/designer";
            location.reload();
          });
        });
      }
    });

    const file = view.querySelector("#project-file");
    if (file) {
      file.addEventListener("change", () => {
        if (file.files && file.files[0]) importProject(file.files[0]);
        file.value = "";
      });
    }
  }

  window.Views = window.Views || {};
  window.Views.project = { render, mount };
})();
