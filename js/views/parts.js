/* PanelCraft — parts / bill of materials view */
(function () {
  "use strict";

  const esc = UI.esc;
  const fmt = (n) => Utils.formatMm(n);

  function partRow(project, part) {
    const mat = Utils.materialById(project, part.materialId);
    const name = I18n.partName(part);
    const source = part.kind === "custom"
      ? `<span class="badge badge-outline">${esc(I18n.t("parts.sourceCustom"))}</span>`
      : `<button type="button" class="btn btn-ghost btn-xs" data-open-item="${esc(part.itemId)}" title="${esc(I18n.t("parts.goToItem"))}">${UI.icon("arrow-right")}${esc(part.itemName || "")}</button>`;
    const actions = part.kind === "custom"
      ? `<div class="row-actions">
          <button class="icon-btn" data-edit-part="${esc(part.id)}" title="${esc(I18n.t("common.edit"))}" aria-label="${esc(I18n.t("common.edit"))}">${UI.icon("pen")}</button>
          <button class="icon-btn" data-delete-part="${esc(part.id)}" title="${esc(I18n.t("common.delete"))}" aria-label="${esc(I18n.t("common.delete"))}">${UI.icon("trash")}</button>
        </div>`
      : `<div class="row-actions"><button class="icon-btn" data-open-item="${esc(part.itemId)}" title="${esc(I18n.t("parts.linkedTip"))}" aria-label="${esc(I18n.t("parts.goToItem"))}">${UI.icon("arrow-right")}</button></div>`;
    const searchText = `${name} ${part.itemName || ""} ${mat ? mat.name : ""}`.toLowerCase();
    return `<tr data-row data-material="${esc(part.materialId)}" data-search="${esc(searchText)}">
      <td>
        <div class="part-name">${esc(name)} ${part.kind === "generated" ? `<span class="faint" title="${esc(I18n.t("parts.linkedTip"))}">${UI.icon("lock")}</span>` : ""}</div>
        <div class="part-source">${part.kind === "custom" ? esc(I18n.t("parts.customBadge")) : esc(I18n.t("parts.sourceGenerated"))}</div>
      </td>
      <td>${mat ? `<span class="material-dot" style="background:${esc(mat.color)}"></span>${esc(mat.name)}<div class="part-source">${fmt(mat.thickness)} ${esc(I18n.t("common.mm"))}</div>` : "—"}</td>
      <td class="dim-cell">${fmt(part.length)} × ${fmt(part.width)} × ${fmt(part.thickness)}</td>
      <td class="num"><b>${part.qty}</b> <span class="faint">${esc(I18n.t("common.pcs"))}</span></td>
      <td>${UI.edgeDots(part)}</td>
      <td><span class="type-pill">${UI.icon(part.grainLock ? "lock" : "unlock")}${esc(part.grainLock ? I18n.t("parts.grainLockedShort") : I18n.t("parts.grainFree"))}</span></td>
      <td>${source}</td>
      <td class="part-source-hide">${actions}</td>
    </tr>`;
  }

  function render() {
    const project = App.project();
    const rows = Model.projectRows(project);
    const totals = Model.totals(rows);
    const usedMaterials = new Set(rows.map((row) => row.materialId));
    const head = UI.pageHead(
      I18n.t("page.parts.title"),
      I18n.t("page.parts.subtitle"),
      `<button class="btn" data-route="cutting">${UI.icon("cut")}${esc(I18n.t("nav.cutting"))}</button>
       <button class="btn" data-parts-action="export">${UI.icon("download")}${esc(I18n.t("common.export"))} CSV</button>
       <button class="btn btn-primary" data-parts-action="new">${UI.icon("plus")}${esc(I18n.t("parts.addPart"))}</button>`
    );

    if (!rows.length) {
      return `${head}
        ${UI.emptyState(
          "parts",
          I18n.t("parts.emptyTitle"),
          I18n.t("parts.emptyHint"),
          `<div class="page-actions" style="justify-content:center">
            <button class="btn" data-route="designer">${UI.icon("designer")}${esc(I18n.t("nav.designer"))}</button>
            <button class="btn btn-primary" data-parts-action="new">${UI.icon("plus")}${esc(I18n.t("parts.addPart"))}</button>
          </div>`
        )}`;
    }

    const materialOptions = project.materials
      .filter((mat) => usedMaterials.has(mat.id))
      .map((mat) => `<option value="${esc(mat.id)}">${esc(mat.name)}</option>`).join("");

    return `${head}
      <div class="metric-grid" style="margin-bottom:14px">
        ${UI.metric(I18n.t("parts.statRows"), I18n.number(totals.positions, 0), I18n.count(totals.positions, "row"), "parts")}
        ${UI.metric(I18n.t("parts.statParts"), I18n.number(totals.units, 0), I18n.t("common.pcs"), "box")}
        ${UI.metric(I18n.t("parts.statArea"), I18n.area(totals.areaM2), "", "sheet")}
        ${UI.metric(I18n.t("parts.statBanding"), `${I18n.number(totals.bandingM, 1)} <small>${esc(I18n.t("units.m"))}</small>`, "", "ruler")}
      </div>

      <div class="toolbar">
        <div class="search">
          ${UI.icon("search")}
          <input type="search" class="input" id="parts-search" placeholder="${esc(I18n.t("parts.searchPlaceholder"))}" aria-label="${esc(I18n.t("common.search"))}">
        </div>
        <select class="select" id="parts-material-filter" aria-label="${esc(I18n.t("common.material"))}">
          <option value="">${esc(I18n.t("parts.allMaterials"))}</option>
          ${materialOptions}
        </select>
        <div class="toolbar-spacer"></div>
        <span class="toolbar-meta" data-parts-visible>${esc(I18n.t("parts.rowsShown", { shown: totals.positions, total: totals.positions }))}</span>
        <button class="btn btn-sm" data-route="cutting">${UI.icon("cut")}${esc(I18n.t("nav.cutting"))}</button>
      </div>

      <div class="card table-card">
        <div class="table-scroll">
          <table class="data">
            <thead>
              <tr>
                <th>${esc(I18n.t("parts.tablePart"))}</th>
                <th>${esc(I18n.t("parts.tableMaterial"))}</th>
                <th>${esc(I18n.t("parts.tableSize"))}</th>
                <th>${esc(I18n.t("parts.tableQty"))}</th>
                <th>${esc(I18n.t("parts.tableEdges"))}</th>
                <th>${esc(I18n.t("parts.tableGrain"))}</th>
                <th>${esc(I18n.t("parts.tableSource"))}</th>
                <th class="text-right">${esc(I18n.t("common.actions"))}</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((part) => partRow(project, part)).join("")}
              <tr data-no-results hidden><td colspan="8">
                <div class="empty" style="padding:36px 20px;border:0;background:transparent">
                  <div class="empty-icon">${UI.icon("search")}</div>
                  <h3>${esc(I18n.t("parts.searchEmptyTitle"))}</h3>
                  <p>${esc(I18n.t("parts.searchEmptyHint"))}</p>
                </div>
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="cut-footnote">${UI.icon("info")}<span>${esc(I18n.t("parts.lockedNotice"))}</span></div>`;
  }

  function applyFilters(view) {
    const search = view.querySelector("#parts-search");
    const filter = view.querySelector("#parts-material-filter");
    if (!search || !filter) return;
    const term = search.value.trim().toLowerCase();
    const material = filter.value;
    let visible = 0;
    const rows = view.querySelectorAll("tr[data-row]");
    rows.forEach((row) => {
      const matchesTerm = !term || (row.getAttribute("data-search") || "").includes(term);
      const matchesMaterial = !material || row.getAttribute("data-material") === material;
      const show = matchesTerm && matchesMaterial;
      row.hidden = !show;
      if (show) visible += 1;
    });
    const empty = view.querySelector("[data-no-results]");
    if (empty) empty.hidden = visible !== 0;
    const meta = view.querySelector("[data-parts-visible]");
    if (meta) meta.textContent = I18n.t("parts.rowsShown", { shown: visible, total: rows.length });
  }

  function openPartDialog(part) {
    const project = App.project();
    const editing = Boolean(part);
    const draft = part ? Utils.clone(part) : {
      id: null, name: "", length: 600, width: 400, qty: 1,
      materialId: project.materials[0].id,
      edges: { t: false, b: false, l: false, r: false },
      grainLock: false,
    };
    const edgeLabels = { t: "edgeTop", b: "edgeBottom", l: "edgeLeft", r: "edgeRight" };
    const edgeButtons = ["t", "b", "l", "r"].map((key) =>
      `<button type="button" class="edge-btn ${draft.edges && draft.edges[key] ? "on" : ""}" data-edge="${key}">${esc(I18n.t(`parts.${edgeLabels[key]}`))}</button>`
    ).join("");
    const materialOptions = project.materials.map((mat) => {
      const thicknessLabel = `${fmt(mat.thickness)} ${I18n.t("common.mm")}`;
      const thicknessPattern = new RegExp(`(^|[^0-9])${fmt(mat.thickness).replace(/[.,]/g, "[.,]")}\\s*(мм|mm)(?![а-яa-z])`, "i");
      const label = thicknessPattern.test(String(mat.name || ""))
        ? mat.name
        : `${mat.name} · ${thicknessLabel}`;
      return `<option value="${esc(mat.id)}" ${mat.id === draft.materialId ? "selected" : ""}>${esc(label)}</option>`;
    }).join("");
    const modal = UI.openModal({
      title: editing ? I18n.t("parts.editPartTitle") : I18n.t("parts.newPartTitle"),
      subtitle: editing ? "" : I18n.t("parts.newPartHint"),
      body: `
        <div class="field">
          <label class="field-label" for="part-name">${esc(I18n.t("parts.partName"))}</label>
          <input id="part-name" class="input" maxlength="120" value="${esc(draft.name)}" placeholder="${esc(I18n.t("parts.namePlaceholder"))}">
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="part-length">${esc(I18n.t("parts.length"))} <span class="field-hint">${esc(I18n.t("common.mm"))}</span></label>
            <input id="part-length" type="number" class="input" min="10" max="6000" step="1" value="${draft.length}">
          </div>
          <div class="field">
            <label class="field-label" for="part-width">${esc(I18n.t("parts.width"))} <span class="field-hint">${esc(I18n.t("common.mm"))}</span></label>
            <input id="part-width" type="number" class="input" min="10" max="6000" step="1" value="${draft.width}">
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="part-qty">${esc(I18n.t("parts.qty"))}</label>
            <input id="part-qty" type="number" class="input" min="1" max="999" step="1" value="${draft.qty}">
          </div>
          <div class="field">
            <label class="field-label" for="part-material">${esc(I18n.t("parts.material"))}</label>
            <select id="part-material" class="select">${materialOptions}</select>
          </div>
        </div>
        <div class="field">
          <label class="field-label">${esc(I18n.t("parts.edges"))} <span class="field-hint">${esc(I18n.t("parts.edgesHint"))}</span></label>
          <div class="edge-picker">${edgeButtons}</div>
        </div>
        ${UI.switchRow({ title: I18n.t("parts.grainLock"), sub: I18n.t("parts.grainHint"), checked: draft.grainLock, data: "data-grain-lock" })}
      `,
      footer: `
        <button type="button" class="btn" data-modal-close>${esc(I18n.t("common.cancel"))}</button>
        <button type="button" class="btn btn-primary" data-save-part>${UI.icon("check")}${esc(I18n.t("common.save"))}</button>
      `,
      onMount(el, close) {
        const grain = el.querySelector("[data-grain-lock]");
        el.querySelectorAll("[data-edge]").forEach((btn) => {
          btn.addEventListener("click", () => {
            btn.classList.toggle("on");
          });
        });
        el.querySelector("[data-save-part]").addEventListener("click", () => {
          const name = el.querySelector("#part-name").value.trim();
          const length = UI.parseNumber(el.querySelector("#part-length").value, 0);
          const width = UI.parseNumber(el.querySelector("#part-width").value, 0);
          const qty = Math.round(UI.parseNumber(el.querySelector("#part-qty").value, 0));
          const materialId = el.querySelector("#part-material").value;
          if (!name) { UI.toast(I18n.t("parts.errorName"), "error"); el.querySelector("#part-name").focus(); return; }
          if (!(length > 0) || !(width > 0)) { UI.toast(I18n.t("parts.errorSize"), "error"); return; }
          if (!(qty >= 1 && qty <= 999)) { UI.toast(I18n.t("parts.errorQty"), "error"); return; }
          if (!project.materials.some((mat) => mat.id === materialId)) { UI.toast(I18n.t("parts.errorMaterial"), "error"); return; }
          const edges = { t: false, b: false, l: false, r: false };
          el.querySelectorAll("[data-edge].on").forEach((btn) => { edges[btn.getAttribute("data-edge")] = true; });
          const payload = {
            id: draft.id || Utils.uid("part"),
            name,
            length: Utils.clamp(length, 10, 6000),
            width: Utils.clamp(width, 10, 6000),
            qty: Utils.clamp(qty, 1, 999),
            materialId,
            edges,
            grainLock: Boolean(grain && grain.checked),
          };
          if (editing) {
            const target = project.customParts.find((candidate) => candidate.id === draft.id);
            if (target) Object.assign(target, payload);
          } else {
            project.customParts.push(payload);
          }
          App.persist(true);
          App.render({ animate: false });
          close();
          UI.toast(I18n.t("parts.saved"));
        });
      },
    });
    const first = modal.el.querySelector("#part-name");
    if (first) setTimeout(() => first.focus(), 50);
  }

  function mount(view) {
    view.querySelectorAll("[data-parts-action='new']").forEach((btn) => btn.addEventListener("click", () => openPartDialog(null)));
    view.querySelectorAll("[data-parts-action='export']").forEach((btn) => btn.addEventListener("click", () => {
      const project = App.project();
      Exporters.downloadBom(project, Model.projectRows(project));
      UI.toast(I18n.t("toast.saved"));
    }));

    const search = view.querySelector("#parts-search");
    const filter = view.querySelector("#parts-material-filter");
    if (search) search.addEventListener("input", () => applyFilters(view));
    if (filter) filter.addEventListener("change", () => applyFilters(view));

    view.querySelectorAll("[data-open-item]").forEach((btn) => {
      btn.addEventListener("click", () => App.navigate("designer", { itemId: btn.getAttribute("data-open-item") }));
    });

    view.querySelectorAll("[data-edit-part]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const project = App.project();
        const part = project.customParts.find((candidate) => candidate.id === btn.getAttribute("data-edit-part"));
        if (part) openPartDialog(part);
      });
    });

    view.querySelectorAll("[data-delete-part]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const project = App.project();
        const part = project.customParts.find((candidate) => candidate.id === btn.getAttribute("data-delete-part"));
        if (!part) return;
        UI.confirm({
          title: I18n.t("common.confirmTitle"),
          message: esc(I18n.t("parts.deleteConfirm", { name: part.name })),
          confirmLabel: I18n.t("common.delete"),
          danger: true,
        }).then((confirmed) => {
          if (!confirmed) return;
          project.customParts = project.customParts.filter((candidate) => candidate.id !== part.id);
          App.persist(true);
          App.render({ animate: false });
          UI.toast(I18n.t("parts.deleted"));
        });
      });
    });
  }

  window.Views = window.Views || {};
  window.Views.parts = { render, mount };
})();
