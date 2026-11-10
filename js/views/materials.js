/* PanelCraft — materials view */
(function () {
  "use strict";

  const esc = UI.esc;
  const fmt = (n) => Utils.formatMm(n);
  const SWATCHES = ["#f0ece2", "#c69b64", "#8a6a4b", "#515752", "#b8b2a6", "#e6d7c3", "#3f4c44", "#a44c3a", "#dfe3e6", "#e8d8a8", "#6c7c8a", "#d8c2c8"];

  function materialCard(project, mat) {
    const usage = Model.materialUsage(project, mat.id);
    const areaM2 = (mat.sheetW * mat.sheetH) / 1e6;
    const thicknessLabel = `${fmt(mat.thickness)} ${I18n.t("common.mm")}`;
    const thicknessPattern = new RegExp(`(^|[^0-9])${fmt(mat.thickness).replace(/[.,]/g, "[.,]")}\\s*(мм|mm)(?![а-яa-z])`, "i");
    const showThickness = !thicknessPattern.test(String(mat.name || ""));
    return `<article class="card material-card">
      <div class="material-preview" style="background:${esc(mat.color)}">
        <div class="material-grain" style="${mat.textured ? "" : "display:none"}"></div>
        <span class="material-badge">${mat.textured ? UI.badge(I18n.t("materials.texturedBadge"), "accent") : ""}${mat.thickness <= 6 ? UI.badge(I18n.t("materials.thinBadge"), "blue") : ""}</span>
      </div>
      <div class="material-card-body">
        <div class="material-card-title">
          <div>
            <h3>${esc(mat.name)}</h3>
            <p>${esc(I18n.t("materials.sheetSpec", { w: fmt(mat.sheetW), h: fmt(mat.sheetH) }))}</p>
          </div>
          ${showThickness ? `<span class="badge">${thicknessLabel}</span>` : ""}
        </div>
        <div class="material-specs">
          <span>${esc(I18n.t("common.area"))}: <b>${I18n.area(areaM2)}</b></span>
          <span>${esc(I18n.t("common.used"))}: <b>${usage.count}</b></span>
        </div>
      </div>
      <div class="material-card-foot">
        <span class="material-price">${UI.money(project, mat.price)} <span class="faint" style="font-weight:400">/ ${esc(I18n.t("common.perSheet"))}</span></span>
        <span class="row-actions">
          <button class="icon-btn" data-edit-material="${esc(mat.id)}" title="${esc(I18n.t("common.edit"))}" aria-label="${esc(I18n.t("common.edit"))}">${UI.icon("pen")}</button>
          <button class="icon-btn" data-delete-material="${esc(mat.id)}" title="${esc(I18n.t("common.delete"))}" aria-label="${esc(I18n.t("common.delete"))}">${UI.icon("trash")}</button>
        </span>
      </div>
    </article>`;
  }

  function render() {
    const project = App.project();
    const head = UI.pageHead(
      I18n.t("page.materials.title"),
      I18n.t("page.materials.subtitle"),
      `<button class="btn btn-primary" data-materials-action="new">${UI.icon("plus")}${esc(I18n.t("materials.add"))}</button>`
    );
    return `${head}
      <div class="metric-grid" style="margin-bottom:16px">
        ${UI.metric(I18n.t("nav.materials"), I18n.number(project.materials.length, 0), I18n.count(project.materials.length, "material"), "layers")}
        ${UI.metric(I18n.t("materials.sheet"), I18n.area(project.materials.reduce((sum, mat) => sum + (mat.sheetW * mat.sheetH) / 1e6, 0)), I18n.t("common.area"), "sheet")}
      </div>
      <div class="material-grid">
        ${project.materials.map((mat) => materialCard(project, mat)).join("")}
        <button class="add-card" type="button" data-materials-action="new">
          <span class="empty-icon">${UI.icon("plus")}</span>
          ${esc(I18n.t("materials.addShort"))}
          <span class="faint" style="font-weight:400;font-size:11px">${esc(I18n.t("materials.addHint"))}</span>
        </button>
      </div>`;
  }

  function openMaterialDialog(mat) {
    const project = App.project();
    const editing = Boolean(mat);
    const draft = mat ? Utils.clone(mat) : {
      id: null,
      name: "",
      color: "#d9d2c3",
      sheetW: 2750,
      sheetH: 1830,
      thickness: 16,
      price: 0,
      textured: false,
    };
    const currency = (Data.CURRENCIES.find((c) => c.code === project.currency) || { symbol: "₽" }).symbol;
    const swatches = SWATCHES.map((color) =>
      `<button type="button" class="swatch ${draft.color.toLowerCase() === color.toLowerCase() ? "active" : ""}" data-swatch="${color}" style="background:${color}" aria-label="${color}"></button>`
    ).join("");
    const modal = UI.openModal({
      title: editing ? I18n.t("materials.editTitle") : I18n.t("materials.newTitle"),
      body: `
        <div class="field">
          <label class="field-label" for="mat-name">${esc(I18n.t("materials.name"))}</label>
          <input id="mat-name" class="input" maxlength="120" value="${esc(draft.name)}" placeholder="${esc(I18n.t("materials.namePlaceholder"))}">
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="mat-sheet-w">${esc(I18n.t("materials.sheetLength"))} <span class="field-hint">${esc(I18n.t("common.mm"))}</span></label>
            <input id="mat-sheet-w" type="number" class="input" min="200" max="6000" step="10" value="${draft.sheetW}">
          </div>
          <div class="field">
            <label class="field-label" for="mat-sheet-h">${esc(I18n.t("materials.sheetWidth"))} <span class="field-hint">${esc(I18n.t("common.mm"))}</span></label>
            <input id="mat-sheet-h" type="number" class="input" min="200" max="6000" step="10" value="${draft.sheetH}">
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="mat-thickness">${esc(I18n.t("materials.thickness"))}</label>
            <input id="mat-thickness" type="number" class="input" min="0.5" max="60" step="0.5" value="${draft.thickness}">
          </div>
          <div class="field">
            <label class="field-label" for="mat-price">${esc(I18n.t("materials.price"))} <span class="field-hint">${esc(currency)}</span></label>
            <input id="mat-price" type="number" class="input" min="0" max="1000000" step="1" value="${draft.price}">
          </div>
        </div>
        <div class="field">
          <label class="field-label" for="mat-color">${esc(I18n.t("materials.color"))}</label>
          <div class="color-field">
            <input id="mat-color" type="color" class="color-input" value="${esc(draft.color)}">
            <div class="color-swatches">${swatches}</div>
          </div>
        </div>
        ${UI.switchRow({ title: I18n.t("materials.textured"), sub: I18n.t("materials.texturedHint"), checked: draft.textured, data: "data-textured" })}
      `,
      footer: `
        <button type="button" class="btn" data-modal-close>${esc(I18n.t("common.cancel"))}</button>
        <button type="button" class="btn btn-primary" data-save-material>${UI.icon("check")}${esc(I18n.t("common.save"))}</button>
      `,
      onMount(el, close) {
        const colorInput = el.querySelector("#mat-color");
        el.querySelectorAll("[data-swatch]").forEach((btn) => {
          btn.addEventListener("click", () => {
            colorInput.value = btn.getAttribute("data-swatch");
            el.querySelectorAll("[data-swatch]").forEach((other) => other.classList.toggle("active", other === btn));
          });
        });
        colorInput.addEventListener("input", () => {
          el.querySelectorAll("[data-swatch]").forEach((btn) => btn.classList.remove("active"));
        });
        el.querySelector("[data-save-material]").addEventListener("click", () => {
          const name = el.querySelector("#mat-name").value.trim();
          const sheetW = UI.parseNumber(el.querySelector("#mat-sheet-w").value, 0);
          const sheetH = UI.parseNumber(el.querySelector("#mat-sheet-h").value, 0);
          const thickness = UI.parseNumber(el.querySelector("#mat-thickness").value, 0);
          const price = UI.parseNumber(el.querySelector("#mat-price").value, 0);
          if (!name) { UI.toast(I18n.t("materials.errorName"), "error"); el.querySelector("#mat-name").focus(); return; }
          if (!(sheetW > 0) || !(sheetH > 0)) { UI.toast(I18n.t("materials.errorSheet"), "error"); return; }
          if (!(thickness > 0)) { UI.toast(I18n.t("materials.errorThickness"), "error"); return; }
          if (!(price >= 0)) { UI.toast(I18n.t("materials.errorPrice"), "error"); return; }
          const payload = {
            id: draft.id || Utils.uid("mat"),
            name,
            color: el.querySelector("#mat-color").value,
            sheetW: Utils.clamp(sheetW, 200, 6000),
            sheetH: Utils.clamp(sheetH, 200, 6000),
            thickness: Utils.clamp(thickness, 0.5, 60),
            price: Utils.clamp(price, 0, 1000000),
            textured: Boolean(el.querySelector("[data-textured]").checked),
          };
          if (editing) {
            const target = project.materials.find((candidate) => candidate.id === draft.id);
            if (target) Object.assign(target, payload);
          } else {
            project.materials.push(payload);
          }
          App.persist(true);
          App.render({ animate: false });
          close();
          UI.toast(editing ? I18n.t("materials.saved") : I18n.t("materials.added"));
        });
      },
    });
    const first = modal.el.querySelector("#mat-name");
    if (first) setTimeout(() => first.focus(), 50);
  }

  function removeMaterial(mat) {
    const project = App.project();
    if (project.materials.length <= 1) {
      UI.toast(I18n.t("materials.cannotDeleteLast"), "error");
      return;
    }
    const usage = Model.materialUsage(project, mat.id);
    if (usage.count > 0) {
      UI.toast(I18n.t("materials.usedWarning", { name: mat.name }), "error");
      return;
    }
    UI.confirm({
      title: I18n.t("common.confirmTitle"),
      message: esc(I18n.t("materials.deleteConfirm", { name: mat.name })),
      confirmLabel: I18n.t("common.delete"),
      danger: true,
    }).then((confirmed) => {
      if (!confirmed) return;
      project.materials = project.materials.filter((candidate) => candidate.id !== mat.id);
      App.persist(true);
      App.render({ animate: false });
      UI.toast(I18n.t("materials.deleted"));
    });
  }

  function mount(view) {
    view.querySelectorAll("[data-materials-action='new']").forEach((btn) => btn.addEventListener("click", () => openMaterialDialog(null)));
    view.querySelectorAll("[data-edit-material]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const project = App.project();
        const mat = project.materials.find((candidate) => candidate.id === btn.getAttribute("data-edit-material"));
        if (mat) openMaterialDialog(mat);
      });
    });
    view.querySelectorAll("[data-delete-material]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const project = App.project();
        const mat = project.materials.find((candidate) => candidate.id === btn.getAttribute("data-delete-material"));
        if (mat) removeMaterial(mat);
      });
    });
  }

  window.Views = window.Views || {};
  window.Views.materials = { render, mount };
})();
