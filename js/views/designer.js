/* PanelCraft — designer view */
(function () {
  "use strict";

  const esc = UI.esc;
  const fmt = (n) => Utils.formatMm(n);
  let previewMode = "front";
  let previewGeometry = null;
  let hoverShelfSlot = null;
  let resizeObserver = null;
  let requestRedraw = () => {};

  /* ---------------------------------------------------------------- markup */

  function materialOptions(project, selectedId) {
    return project.materials.map((mat) => {
      const thicknessLabel = `${fmt(mat.thickness)} ${I18n.t("common.mm")}`;
      const thicknessPattern = new RegExp(`(^|[^0-9])${fmt(mat.thickness).replace(/[.,]/g, "[.,]")}\\s*(мм|mm)(?![а-яa-z])`, "i");
      const label = thicknessPattern.test(String(mat.name || ""))
        ? mat.name
        : `${mat.name} · ${thicknessLabel}`;
      return `<option value="${esc(mat.id)}" ${mat.id === selectedId ? "selected" : ""}>${esc(label)}</option>`;
    }).join("");
  }

  function dimensionField(item, key) {
    const ranges = Data.PARAM_RANGES[item.template];
    const [min, max, step] = ranges[key];
    const value = item.params[key];
    return `<div class="field">
      <div class="dimension-head">
        <span>${esc(I18n.t(`params.${key}`))}</span>
        <span class="value" data-value-for="${key}">${fmt(value)} ${esc(I18n.t("common.mm"))}</span>
      </div>
      <div class="range-row">
        <input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-param="${key}" aria-label="${esc(I18n.t(`params.${key}`))}">
        <input type="number" class="input" min="${min}" max="${max}" step="${step}" value="${value}" data-param="${key}" aria-label="${esc(I18n.t(`params.${key}`))}">
      </div>
    </div>`;
  }

  function stepperRow(item, key) {
    const ranges = Data.PARAM_RANGES[item.template];
    const [min, max] = ranges[key];
    const value = item.params[key];
    return `<div class="param-row">
      <span class="field-label">${esc(I18n.t(`params.${key}`))}</span>
      <div class="stepper">
        <button type="button" data-step-key="${key}" data-step="-1" aria-label="−" ${value <= min ? "disabled" : ""}>${UI.icon("minus")}</button>
        <input type="number" min="${min}" max="${max}" value="${value}" data-param="${key}" aria-label="${esc(I18n.t(`params.${key}`))}">
        <button type="button" data-step-key="${key}" data-step="1" aria-label="+" ${value >= max ? "disabled" : ""}>${UI.icon("plus")}</button>
      </div>
    </div>`;
  }

  function numberRow(item, key, suffix, min, max, labelKey) {
    const value = item.params[key];
    return `<div class="field">
      <label class="field-label" for="param-${key}">${esc(I18n.t(labelKey || `params.${key}`))} <span class="field-hint">${esc(suffix || I18n.t("common.mm"))}</span></label>
      <input id="param-${key}" type="number" class="input" min="${min}" max="${max}" step="1" value="${value}" data-param="${key}">
    </div>`;
  }

  function previewNote(item) {
    if (previewMode === "layout") return I18n.t("designer.layoutNote");
    const hasFronts = item.params.doors > 0 || item.params.drawers > 0;
    return hasFronts ? I18n.t("designer.previewNote") : I18n.t("designer.itemToolbarHint");
  }

  function previewHint(item) {
    const hasShelves = item.template === "cabinet" || item.template === "rack";
    if (previewMode === "layout" && hasShelves && Number(item.params.shelves) > 0) {
      return I18n.t("designer.layoutShelfHint");
    }
    return I18n.t("designer.resizeHint");
  }

  function previewControls(item) {
    const ranges = Data.PARAM_RANGES[item.template];
    const rows = [];
    if (item.template === "cabinet" || item.template === "rack") rows.push("shelves", "shelfSections");
    if (item.template === "cabinet") rows.push("doors", "doorSections");
    if (item.template === "chest") rows.push("drawers");
    return rows.map((key) => {
      const [min, max] = ranges[key];
      const value = Number(item.params[key]) || 0;
      const label = I18n.t(`params.${key}`);
      const hidden = (key === "doorSections" && !(Number(item.params.doors) > 0))
        || (key === "shelfSections" && !(Number(item.params.shelves) > 0));
      return `<div class="preview-stepper" data-preview-stepper="${key}"${hidden ? " hidden" : ""}>
        <span class="ps-label">${esc(label)}</span>
        <button type="button" class="ps-btn" data-preview-step="${key}" data-dir="-1" aria-label="${esc(`${label} −`)}" ${value <= min ? "disabled" : ""}>${UI.icon("minus")}</button>
        <b data-preview-count="${key}">${value}</b>
        <button type="button" class="ps-btn" data-preview-step="${key}" data-dir="1" aria-label="${esc(`${label} +`)}" ${value >= max ? "disabled" : ""}>${UI.icon("plus")}</button>
      </div>`;
    }).join("");
  }

  function previewCountSummary(item) {
    const rows = [];
    if (item.template === "cabinet" || item.template === "rack") {
      const total = Number(item.params.shelves) || 0;
      const removed = Data.shelfRemovalSet(item).size;
      const active = Math.max(0, total - removed);
      const extra = removed > 0 ? ` <span class="preview-count-total">/ ${total}</span>` : "";
      rows.push(`<span>${esc(I18n.t("params.shelves"))} <b>${active}</b>${extra}</span>`);
    }
    if (item.template === "cabinet") {
      rows.push(`<span>${esc(I18n.t("params.doors"))} <b>${Number(item.params.doors) || 0}</b></span>`);
    }
    if (item.template === "chest") {
      rows.push(`<span>${esc(I18n.t("params.drawers"))} <b>${Number(item.params.drawers) || 0}</b></span>`);
    }
    return rows.join("");
  }

  function paramsMarkup(project, item) {
    const ranges = Data.PARAM_RANGES[item.template];
    const isCabinet = item.template === "cabinet";
    const isChest = item.template === "chest";
    const isRack = item.template === "rack";
    const showsFacade = isCabinet || isChest;
    const hasFacade = item.params.doors > 0 || item.params.drawers > 0;
    return `
      <section class="param-section">
        <div class="param-section-head"><h3>${esc(I18n.t("params.dimensions"))}</h3><span class="badge badge-outline">${esc(I18n.t("params.allMm"))}</span></div>
        <div class="param-rows">
          ${dimensionField(item, "width")}
          ${dimensionField(item, "height")}
          ${dimensionField(item, "depth")}
        </div>
      </section>

      <section class="param-section">
        <div class="param-section-head"><h3>${esc(I18n.t("params.construction"))}</h3></div>
        <div class="param-rows">
          <div class="field">
            <label class="field-label">${esc(I18n.t("params.bodyMaterial"))}</label>
            <select class="select" data-material="bodyMaterialId">${materialOptions(project, item.bodyMaterialId)}</select>
            <span class="param-note">${esc(I18n.t("params.bodyHint"))}</span>
          </div>
          <div class="field">
            ${UI.switchRow({ title: I18n.t("params.backPanel"), checked: item.params.back, data: 'data-toggle="back"' })}
          </div>
          ${item.params.back ? `<div class="field">
            <label class="field-label">${esc(I18n.t("params.backMaterial"))} <span class="field-hint">${esc(I18n.t("common.optional"))}</span></label>
            <select class="select" data-material="backMaterialId">${materialOptions(project, item.backMaterialId)}</select>
            <span class="param-note">${esc(I18n.t("params.backThicknessHint"))}</span>
          </div>` : ""}
          ${isChest ? "" : stepperRow(item, "shelves")}
          ${isChest ? "" : `<div class="shelf-sections-group" data-shelf-sections-group ${item.params.shelves > 0 ? "" : "hidden"}>
            ${stepperRow(item, "shelfSections")}
            <span class="param-note">${esc(I18n.t("params.shelfSectionsHint"))}</span>
          </div>`}
          ${item.params.shelves > 0 && !isChest ? `<span class="param-note">${esc(I18n.t("params.shelvesHint"))}</span>` : ""}
          ${numberRow(item, "plinth", `${I18n.t("common.mm")} · 0–200`, 0, 200, "params.plinthHeight")}
        </div>
      </section>

      ${showsFacade ? `<section class="param-section">
        <div class="param-section-head"><h3>${esc(I18n.t("params.facades"))}</h3></div>
        <div class="param-rows">
          <div class="field">
            <label class="field-label">${esc(I18n.t("params.facadeMaterial"))}</label>
            <select class="select" data-material="facadeMaterialId">${materialOptions(project, item.facadeMaterialId)}</select>
          </div>
          ${isCabinet ? stepperRow(item, "doors") : ""}
          ${isCabinet ? `<div class="door-sections-group" data-door-sections-group ${item.params.doors > 0 ? "" : "hidden"}>
            ${stepperRow(item, "doorSections")}
            <span class="param-note">${esc(I18n.t("params.doorSectionsHint"))}</span>
          </div>` : ""}
          ${isCabinet ? `<div class="door-size-group" data-door-size-group ${item.params.doors > 0 ? "" : "hidden"}>
            ${numberRow(item, "doorWidth", `${I18n.t("common.mm")} · ${I18n.t("params.autoZero")}`, 0, ranges.doorWidth[1])}
            ${numberRow(item, "doorHeight", `${I18n.t("common.mm")} · ${I18n.t("params.autoZero")}`, 0, ranges.doorHeight[1])}
            <span class="param-note">${esc(I18n.t("params.doorSizeHint"))}</span>
          </div>` : ""}
          ${isChest ? stepperRow(item, "drawers") : ""}
          ${hasFacade ? numberRow(item, "doorGap", `${I18n.t("common.mm")} · 2–8`, 2, 8) : ""}
          ${hasFacade ? `<span class="param-note">${esc(I18n.t("params.doorGapHint"))}</span>` : ""}
        </div>
      </section>` : `<section class="param-section">
        <div class="param-section-head"><h3>${esc(I18n.t("params.facades"))}</h3></div>
        <div class="param-rows"><span class="param-note">${esc(I18n.t("designer.noFacades"))} — ${esc(I18n.t("templates.rackDesc").toLowerCase())}.</span></div>
      </section>`}
    `;
  }

  function itemButton(project, item, active) {
    const totals = Model.itemTotals(project, item);
    return `<button type="button" class="item-card ${active ? "active" : ""}" data-item-id="${esc(item.id)}">
      <span class="item-thumb">${UI.templateThumb(item.template)}</span>
      <span class="item-info">
        <span class="item-name" data-item-name-id="${esc(item.id)}">${esc(item.name)}</span>
        <span class="item-meta" data-rail-meta="${esc(item.id)}">${esc(`${fmt(item.params.width)} × ${fmt(item.params.height)} × ${fmt(item.params.depth)} · ${I18n.count(totals.units, "part")}`)}</span>
      </span>
    </button>`;
  }

  function miniPartsRows(project, parts) {
    if (!parts.length) return `<tr><td colspan="5" class="muted text-center" style="padding:22px">${esc(I18n.t("designer.emptyParts"))}</td></tr>`;
    return parts.map((part) => {
      const mat = Utils.materialById(project, part.materialId);
      return `<tr>
        <td><span class="part-name">${esc(I18n.partName(part))}</span></td>
        <td class="dim-cell">${fmt(part.length)} × ${fmt(part.width)} × ${fmt(part.thickness)}</td>
        <td class="num">${part.qty}</td>
        <td>${mat ? `<span class="material-dot" style="background:${esc(mat.color)}"></span>${esc(mat.name)}` : "—"}</td>
        <td>${UI.edgeDots(part)}</td>
      </tr>`;
    }).join("");
  }

  function previewFooter(item, totals) {
    return `<div class="preview-dim">
        <span>${esc(I18n.t("common.width"))} <b>${fmt(item.params.width)}</b></span>
        <span>${esc(I18n.t("common.height"))} <b>${fmt(item.params.height)}</b></span>
        <span>${esc(I18n.t("common.depth"))} <b>${fmt(item.params.depth)}</b></span>
      </div>
      <div class="preview-dim preview-dim-counts">${previewCountSummary(item)}</div>
      <div class="preview-dim">
        <span>${esc(I18n.t("designer.statArea"))} <b>${I18n.area(totals.areaM2)}</b></span>
        <span class="badge badge-outline">${item.params.back ? esc(I18n.t("designer.backType")) : esc(I18n.t("common.none"))}</span>
      </div>`;
  }

  function partsTable(project, parts, totals) {
    return miniPartsRows(project, parts);
  }

  function itemStats(item, totals) {
    return `${I18n.count(totals.units, "part")} · ${I18n.area(totals.areaM2)}`;
  }

  function render() {
    const project = App.project();
    const items = project.items || [];
    const headActions = items.length
      ? `<button class="btn" data-route="parts">${UI.icon("parts")}${esc(I18n.t("designer.openParts"))}</button>
         <button class="btn btn-primary" data-designer-action="new-item">${UI.icon("plus")}${esc(I18n.t("designer.addItem"))}</button>`
      : `<button class="btn btn-primary" data-designer-action="new-item">${UI.icon("plus")}${esc(I18n.t("designer.addItem"))}</button>`;
    const head = UI.pageHead(I18n.t("page.designer.title"), I18n.t("page.designer.subtitle"), headActions);

    if (!items.length) {
      const choices = Data.TEMPLATES.map((template) => `<button type="button" class="template-choice" data-quick-template="${template}">
        <span class="t-icon">${UI.templateThumb(template)}</span>
        <b>${esc(I18n.t(`templates.${template}`))}</b>
        <span>${esc(I18n.t(`templates.${template}Desc`))}</span>
      </button>`).join("");
      return `${head}
        <div class="empty" style="margin-bottom:16px">
          <div class="empty-icon">${UI.icon("designer")}</div>
          <h3>${esc(I18n.t("designer.noItemsTitle"))}</h3>
          <p>${esc(I18n.t("designer.noItemsHint"))}</p>
          <button class="btn btn-primary" data-designer-action="new-item">${UI.icon("plus")}${esc(I18n.t("designer.createFirst"))}</button>
        </div>
        <div class="template-grid" style="max-width:560px">${choices}</div>`;
    }

    const item = App.activeItem();
    if (!item) return head;
    const totals = Model.itemTotals(project, item);
    const parts = Model.itemParts(project, item);

    return `${head}
      <div class="designer-layout">
        <aside class="rail">
          <div class="rail-card">
            <div class="rail-head">
              <h3>${esc(I18n.t("designer.itemsTitle"))}</h3>
              <span class="rail-count">${items.length}</span>
            </div>
            <div class="item-list">
              ${items.map((candidate) => itemButton(project, candidate, candidate.id === item.id)).join("")}
            </div>
            <div class="rail-add">
              <button type="button" class="add-template" data-designer-action="new-item">
                <span class="plus-box">${UI.icon("plus")}</span>
                ${esc(I18n.t("designer.addItem"))}
              </button>
            </div>
          </div>
          <div class="rail-tip">${UI.icon("ruler")}<span>${esc(I18n.t("designer.tip"))}</span></div>
        </aside>

        <div class="designer-main">
          <div class="item-toolbar">
            <div class="item-title-wrap">
              <input class="item-title-input" id="designer-item-name" value="${esc(item.name)}" maxlength="120" aria-label="${esc(I18n.t("designer.itemName"))}">
            </div>
            <div class="toolbar-meta">
              <span class="badge badge-accent">${esc(I18n.t(`templates.${item.template}`))}</span>
              <span class="badge" data-item-dims>${fmt(item.params.width)} × ${fmt(item.params.height)} × ${fmt(item.params.depth)} ${esc(I18n.t("common.mm"))}</span>
              <span class="badge badge-outline" data-toolbar-parts>${esc(itemStats(item, totals))}</span>
            </div>
            <div class="toolbar-actions">
              <button class="icon-btn" data-designer-action="duplicate-item" title="${esc(I18n.t("common.duplicate"))}" aria-label="${esc(I18n.t("common.duplicate"))}">${UI.icon("copy")}</button>
              <button class="icon-btn" data-designer-action="delete-item" title="${esc(I18n.t("designer.deleteItem"))}" aria-label="${esc(I18n.t("designer.deleteItem"))}">${UI.icon("trash")}</button>
            </div>
          </div>

          <div class="designer-grid">
            <div class="card params">${paramsMarkup(project, item)}</div>

            <div class="card preview-card">
              <div class="preview-head">
                <div class="preview-title">
                  <strong>${esc(I18n.t("designer.previewTitle"))}</strong>
                  <span>${esc(I18n.t("designer.previewSub"))}</span>
                </div>
                <div class="preview-tools">
                  <div class="segmented" role="group">
                    <button type="button" data-preview-mode="front" class="${previewMode === "front" ? "active" : ""}">${UI.icon("designer")}${esc(I18n.t("designer.front"))}</button>
                    <button type="button" data-preview-mode="layout" class="${previewMode === "layout" ? "active" : ""}">${UI.icon("ruler")}${esc(I18n.t("designer.layout"))}</button>
                    <button type="button" data-preview-mode="iso" class="${previewMode === "iso" ? "active" : ""}">${UI.icon("box")}${esc(I18n.t("designer.iso"))}</button>
                  </div>
                </div>
              </div>
              <div class="preview-canvas-wrap" data-preview-wrap data-mode="${esc(previewMode)}">
                <canvas data-preview-canvas role="img" aria-label="${esc(I18n.t("designer.previewTitle"))}"></canvas>
                <span class="preview-badge badge badge-outline" data-preview-note>${esc(previewNote(item))}</span>
                <button type="button" class="preview-resize-handle preview-resize-handle--w" data-resize="width" title="${esc(I18n.t("designer.resizeWidth"))}" aria-label="${esc(I18n.t("designer.resizeWidth"))}"></button>
                <button type="button" class="preview-resize-handle preview-resize-handle--h" data-resize="height" title="${esc(I18n.t("designer.resizeHeight"))}" aria-label="${esc(I18n.t("designer.resizeHeight"))}"></button>
                <button type="button" class="preview-resize-handle preview-resize-handle--w preview-resize-handle--door" data-resize="doorWidth" title="${esc(I18n.t("designer.resizeDoorWidth"))}" aria-label="${esc(I18n.t("designer.resizeDoorWidth"))}"></button>
                <button type="button" class="preview-resize-handle preview-resize-handle--h preview-resize-handle--door" data-resize="doorHeight" title="${esc(I18n.t("designer.resizeDoorHeight"))}" aria-label="${esc(I18n.t("designer.resizeDoorHeight"))}"></button>
              </div>
              <div class="preview-controls" data-preview-controls>
                ${previewControls(item)}
                <span class="preview-resize-hint">${UI.icon("ruler")}<span data-preview-hint>${esc(previewHint(item))}</span></span>
              </div>
              <div class="preview-foot" data-preview-foot>${previewFooter(item, totals)}</div>
            </div>
          </div>

          <div class="card parts-strip">
            <div class="parts-strip-head">
              <div>
                <h3>${esc(I18n.t("designer.generatedTitle"))}</h3>
                <p data-parts-count>${esc(I18n.t("designer.generatedSub", { rows: I18n.count(parts.length, "row"), parts: I18n.count(totals.units, "part") }))}</p>
              </div>
              <button class="btn btn-sm" data-route="parts">${esc(I18n.t("designer.openParts"))} ${UI.icon("arrow-right")}</button>
            </div>
            <div class="table-scroll">
              <table class="mini-table">
                <thead><tr>
                  <th>${esc(I18n.t("parts.tablePart"))}</th>
                  <th>${esc(I18n.t("parts.tableSize"))}</th>
                  <th>${esc(I18n.t("common.quantity"))}</th>
                  <th>${esc(I18n.t("common.material"))}</th>
                  <th>${esc(I18n.t("parts.tableEdges"))}</th>
                </tr></thead>
                <tbody data-parts-table-body>${partsTable(project, parts, totals)}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>`;
  }

  /* --------------------------------------------------------------- drawing */

  function setupCanvas(canvas) {
    const wrap = canvas.parentElement;
    const W = wrap.clientWidth;
    const H = wrap.clientHeight;
    if (!W || !H) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    return { ctx, W, H };
  }

  function panelGeom(item) {
    const p = item.params;
    const body = item._bodyMat;
    const t = body ? body.thickness : 16;
    return { W: p.width, H: p.height, D: p.depth, t, plinth: p.plinth || 0, gap: p.doorGap || 0 };
  }

  function drawFront(canvas, project, item, mode) {
    const schematic = mode === "layout";
    const surface = setupCanvas(canvas);
    if (!surface) return null;
    const { ctx, W, H } = surface;
    const isDark = document.documentElement.dataset.theme === "dark";
    const ink = isDark ? "#d9dcd4" : "#3b3f38";
    const faint = isDark ? "#878e84" : "#94968d";
    const bodyMat = Utils.materialById(project, item.bodyMaterialId) || project.materials[0];
    const facadeMat = Utils.materialById(project, item.facadeMaterialId) || bodyMat;
    const backMat = Utils.materialById(project, item.backMaterialId) || bodyMat;
    item._bodyMat = bodyMat;
    const g = panelGeom(item);
    const p = item.params;
    if (!bodyMat) return null;
    const bodyColor = bodyMat.color;
    const facadeColor = facadeMat.color;
    const backColor = backMat.color;

    const marginL = 30;
    const marginR = 72;
    const marginT = 36;
    const marginB = 54;
    const availW = W - marginL - marginR;
    const availH = H - marginT - marginB;
    if (availW < 40 || availH < 40) return null;
    const scale = Math.min(availW / g.W, availH / g.H);
    const drawW = g.W * scale;
    const drawH = g.H * scale;
    const ox = marginL + (availW - drawW) / 2;
    const floorY = marginT + availH;
    const oy = floorY - drawH;
    const tx = (x) => ox + x * scale;
    const ty = (z) => oy + (g.H - z) * scale;
    const sw = (mm) => Math.max(0.8, mm * scale);
    const isLightBody = Utils.isLight(bodyColor);
    const interior = Utils.isLight(backColor) ? Utils.shade(backColor, -7) : Utils.shade(backColor, 10);
    const edgeInk = isLightBody ? Utils.shade(bodyColor, -42) : Utils.shade(bodyColor, 28);

    ctx.save();
    ctx.shadowColor = "rgba(42, 32, 18, 0.20)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 7;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(ox, oy, drawW, drawH);
    ctx.restore();

    ctx.fillStyle = bodyColor;
    ctx.fillRect(ox, oy, drawW, drawH);

    /* Interior */
    ctx.fillStyle = interior;
    ctx.fillRect(tx(g.t), ty(g.H - g.t), (g.W - 2 * g.t) * scale, Math.max(0, (g.H - 2 * g.t) * scale));

    /* Shelves & vertical sections */
    const nShelves = Math.max(0, Math.round(Number(p.shelves) || 0));
    const removedShelves = Data.shelfRemovalSet(item);
    const shelfHits = [];
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#c1541c";
    const shelfComp = Model.shelfSectionMetrics(item, g.W - 2 * g.t, g.t);
    if (item.template !== "chest" && nShelves > 0) {
      for (let k = 1; k < shelfComp.count; k += 1) {
        const dx = g.t + k * shelfComp.width + (k - 1) * g.t;
        ctx.fillStyle = Utils.shade(bodyColor, isLightBody ? (schematic ? -8 : -3) : (schematic ? 12 : 6));
        ctx.fillRect(tx(dx), ty(g.H - g.t), Math.max(1, g.t * scale), Math.max(0, (g.H - 2 * g.t) * scale));
        if (schematic) {
          ctx.strokeStyle = Utils.rgba(edgeInk, 0.7);
          ctx.lineWidth = 1;
          ctx.strokeRect(tx(dx) + 0.5, ty(g.H - g.t) + 0.5, Math.max(1, g.t * scale) - 1, Math.max(1, (g.H - 2 * g.t) * scale) - 1);
        }
      }
    }
    if (item.template !== "chest") {
      for (let slot = 1; slot <= nShelves; slot += 1) {
        const z = g.t + (g.H - 2 * g.t) * (slot / (nShelves + 1));
        const removed = removedShelves.has(slot);
        const hovered = schematic && hoverShelfSlot === slot;
        const sH = Math.max(1, g.t * scale);
        if (schematic) {
          const hitH = Math.max(18, sH + 12);
          shelfHits.push({ slot, x: tx(g.t + 1), y: ty(z + g.t / 2) + sH / 2 - hitH / 2, w: Math.max(0, (g.W - 2 * g.t - 2) * scale), h: hitH });
        }
        for (let k = 0; k < shelfComp.count; k += 1) {
          const sx = tx(g.t + k * (shelfComp.width + g.t) + 1);
          const sy = ty(z + g.t / 2);
          const sW = Math.max(0, (shelfComp.width - 2) * scale);
          if (hovered && !removed) {
            ctx.fillStyle = Utils.rgba(accentColor, isDark ? 0.18 : 0.1);
            ctx.fillRect(sx - 2, sy - 8, sW + 4, sH + 16);
          }
          if (!removed) {
            ctx.fillStyle = Utils.shade(bodyColor, isLightBody ? (schematic ? -13 : -4) : (schematic ? 16 : 8));
            ctx.fillRect(sx, sy, sW, sH);
            if (schematic) {
              ctx.strokeStyle = hovered ? accentColor : Utils.rgba(edgeInk, 0.7);
              ctx.lineWidth = hovered ? 1.4 : 1;
              ctx.strokeRect(sx + 0.5, sy + 0.5, Math.max(0, sW - 1), Math.max(0, sH - 1));
            }
          } else if (schematic) {
            ctx.strokeStyle = hovered ? accentColor : Utils.rgba(faint, 0.55);
            ctx.lineWidth = hovered ? 1.4 : 1;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.moveTo(sx, sy + sH / 2);
            ctx.lineTo(sx + sW, sy + sH / 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }
    }

    if (g.plinth > 0) {
      ctx.fillStyle = Utils.shade(bodyColor, isLightBody ? -14 : 14);
      ctx.fillRect(ox, ty(g.plinth), drawW, Math.max(1, g.plinth * scale));
      ctx.strokeStyle = Utils.rgba(edgeInk, 0.4);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox, ty(g.plinth));
      ctx.lineTo(ox + drawW, ty(g.plinth));
      ctx.stroke();
    }

    /* Door / drawer fronts */
    const doorLayout = item.template === "cabinet" ? Model.doorMetrics(item, g.t) : null;
    if (item.template === "cabinet" && doorLayout) {
      const { count, sections, width, sectionH } = doorLayout;
      const facadeEdge = Utils.isLight(facadeColor) ? Utils.shade(facadeColor, -35) : Utils.shade(facadeColor, 22);
      for (let i = 0; i < count; i += 1) {
        const x = doorLayout.xAt(i);
        const handleX = count === 1
          ? x + width - Math.min(28, width * 0.12)
          : i < count / 2 ? x + width - Math.min(26, width * 0.12) : x + Math.min(26, width * 0.12);
        for (let s = 0; s < sections; s += 1) {
          const z = doorLayout.zBase + s * (sectionH + g.gap);
          const y = ty(z + sectionH);
          ctx.fillStyle = Utils.rgba(facadeColor, schematic ? 0.07 : 0.82);
          ctx.fillRect(tx(x), y, Math.max(1, width * scale), Math.max(1, sectionH * scale));
          ctx.strokeStyle = facadeEdge;
          ctx.lineWidth = 1.2;
          if (schematic) ctx.setLineDash([6, 4]);
          ctx.strokeRect(tx(x) + 0.5, y + 0.5, Math.max(1, width * scale) - 1, Math.max(1, sectionH * scale) - 1);
          ctx.setLineDash([]);

          if (!schematic) {
            const handleZ = z + sectionH / 2;
            const handleH = Math.min(120, sectionH * 0.3) * scale;
            ctx.strokeStyle = isDark ? "#d9dcd4" : "#3a3e37";
            ctx.lineWidth = 2.4;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(tx(handleX), ty(handleZ) - Math.max(9, handleH / 2));
            ctx.lineTo(tx(handleX), ty(handleZ) + Math.max(9, handleH / 2));
            ctx.stroke();
          }
        }
      }
    } else if (item.template === "chest" && p.drawers > 0) {
      const n = Math.max(1, Math.round(Number(p.drawers)));
      const frontH = (g.H - g.plinth - (n + 1) * g.gap) / n;
      const frontW = g.W - 2 * g.gap;
      for (let i = 0; i < n; i += 1) {
        const z = g.plinth + g.gap + i * (frontH + g.gap);
        ctx.fillStyle = Utils.rgba(facadeColor, schematic ? 0.07 : 0.93);
        ctx.fillRect(tx(g.gap), ty(z + frontH), Math.max(1, frontW * scale), Math.max(1, frontH * scale));
        ctx.strokeStyle = Utils.isLight(facadeColor) ? Utils.shade(facadeColor, -35) : Utils.shade(facadeColor, 22);
        ctx.lineWidth = 1.1;
        if (schematic) ctx.setLineDash([6, 4]);
        ctx.strokeRect(tx(g.gap) + 0.5, ty(z + frontH) + 0.5, Math.max(1, frontW * scale) - 1, Math.max(1, frontH * scale) - 1);
        ctx.setLineDash([]);
        if (!schematic) {
          /* horizontal handle */
          const cx = tx(g.W / 2);
          const cy = ty(z + frontH / 2);
          const hw = Math.max(12, Math.min(110, frontW * 0.16) * scale);
          ctx.strokeStyle = isDark ? "#d9dcd4" : "#353a33";
          ctx.lineWidth = 2.5;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(cx - hw, cy);
          ctx.lineTo(cx + hw, cy);
          ctx.stroke();
        }
      }
    }

    /* Outer frame lines */
    ctx.strokeStyle = edgeInk;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(ox + 0.5, oy + 0.5, drawW - 1, drawH - 1);
    ctx.lineWidth = 1;
    ctx.strokeStyle = Utils.rgba(edgeInk, 0.45);
    ctx.strokeRect(tx(g.t) + 0.5, ty(g.H - g.t) + 0.5, Math.max(0, (g.W - 2 * g.t) * scale) - 1, Math.max(0, (g.H - 2 * g.t) * scale) - 1);

    /* Floor */
    ctx.strokeStyle = Utils.rgba(ink, 0.18);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox - 18, floorY + 0.5);
    ctx.lineTo(ox + drawW + 18, floorY + 0.5);
    ctx.stroke();

    /* Dimensions */
    ctx.fillStyle = faint;
    ctx.strokeStyle = Utils.rgba(faint, 0.8);
    ctx.lineWidth = 1;
    ctx.font = '11px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const dimY = floorY + 30;
    ctx.beginPath();
    ctx.moveTo(ox, dimY);
    ctx.lineTo(ox + drawW, dimY);
    ctx.moveTo(ox, dimY - 4);
    ctx.lineTo(ox, dimY + 4);
    ctx.moveTo(ox + drawW, dimY - 4);
    ctx.lineTo(ox + drawW, dimY + 4);
    ctx.stroke();
    ctx.fillText(`${fmt(g.W)} ${I18n.t("common.mm")}`, ox + drawW / 2, dimY - 9);

    const dimX = ox + drawW + 30;
    ctx.beginPath();
    ctx.moveTo(dimX, oy);
    ctx.lineTo(dimX, oy + drawH);
    ctx.moveTo(dimX - 4, oy);
    ctx.lineTo(dimX + 4, oy);
    ctx.moveTo(dimX - 4, oy + drawH);
    ctx.lineTo(dimX + 4, oy + drawH);
    ctx.stroke();
    ctx.save();
    ctx.translate(dimX + 9, oy + drawH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${fmt(g.H)} ${I18n.t("common.mm")}`, 0, 0);
    ctx.restore();

    /* depth pill */
    ctx.textAlign = "left";
    const depthText = `${fmt(g.D)} ${I18n.t("common.mm")}`;
    ctx.font = '10px "Segoe UI", system-ui, sans-serif';
    const textW = ctx.measureText(depthText).width + 14;
    ctx.fillStyle = isDark ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.72)";
    ctx.strokeStyle = Utils.rgba(faint, 0.35);
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(ox + drawW - textW, oy - 25, textW, 18, 9);
    } else {
      ctx.rect(ox + drawW - textW, oy - 25, textW, 18);
    }
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = faint;
    ctx.fillText(depthText, ox + drawW - textW + 7, oy - 16);

    let doorHandles = null;
    if (doorLayout && doorLayout.width > 30 && doorLayout.height > 30) {
      const firstX = doorLayout.xAt(0);
      doorHandles = {
        width: { x: tx(firstX), y: ty(doorLayout.zBase + doorLayout.height / 2), value: doorLayout.width, max: doorLayout.slotW },
        height: { x: tx(firstX + doorLayout.width / 2), y: ty(doorLayout.zBase + doorLayout.height), value: doorLayout.height, max: doorLayout.openH },
      };
    }

    return { ox, oy, drawW, drawH, scale, shelfHits, doorHandles };
  }

  function drawIso(canvas, project, item) {
    const surface = setupCanvas(canvas);
    if (!surface) return;
    const { ctx, W, H } = surface;
    const isDark = document.documentElement.dataset.theme === "dark";
    const boxes = Model.boxes(project, item);
    if (!boxes.length) return;
    const COS = Math.cos(Math.PI / 6);
    const SIN = 0.5;
    const proj = (x, y, z) => ({ x: (x + y) * COS, y: (x - y) * SIN - z });
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const cornerCache = [];
    boxes.forEach((b) => {
      const pts = [];
      for (const dx of [0, b.w]) {
        for (const dy of [0, b.d]) {
          for (const dz of [0, b.h]) {
            const pt = proj(b.x + dx, b.y + dy, b.z + dz);
            pts.push(pt);
            minX = Math.min(minX, pt.x); maxX = Math.max(maxX, pt.x);
            minY = Math.min(minY, pt.y); maxY = Math.max(maxY, pt.y);
          }
        }
      }
      cornerCache.push(pts);
    });
    const rawW = Math.max(1, maxX - minX);
    const rawH = Math.max(1, maxY - minY);
    const margin = 46;
    const scale = Math.min((W - margin * 2) / rawW, (H - margin * 2) / rawH);
    const offX = (W - rawW * scale) / 2 - minX * scale;
    const offY = (H - rawH * scale) / 2 - minY * scale + 8;
    const pt = (x, y, z) => {
      const p2 = proj(x, y, z);
      return { x: p2.x * scale + offX, y: p2.y * scale + offY };
    };

    /* floor shadow */
    const shadowPts = [pt(0, 0, 0), pt(item.params.width, 0, 0), pt(item.params.width, item.params.depth, 0), pt(0, item.params.depth, 0)];
    ctx.save();
    ctx.filter = "blur(9px)";
    ctx.fillStyle = isDark ? "rgba(0,0,0,.45)" : "rgba(40,32,20,.16)";
    ctx.beginPath();
    shadowPts.forEach((point, i) => { if (i === 0) ctx.moveTo(point.x + 5, point.y + 9); else ctx.lineTo(point.x + 5, point.y + 9); });
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const ordered = boxes.map((box, index) => ({ box, index }))
      .sort((a, b) => {
        const ka = (a.box.x + a.box.w / 2) - (a.box.y + a.box.d / 2) + (a.box.z + a.box.h / 2);
        const kb = (b.box.x + b.box.w / 2) - (b.box.y + b.box.d / 2) + (b.box.z + b.box.h / 2);
        return ka - kb || a.index - b.index;
      });

    const paintFace = (points, color, opacity) => {
      ctx.globalAlpha = opacity == null ? 1 : opacity;
      ctx.fillStyle = color;
      ctx.beginPath();
      points.forEach((point, i) => { if (i === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y); });
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = Utils.isLight(color) ? "rgba(30,26,18,.24)" : "rgba(255,255,255,.16)";
      ctx.lineWidth = 0.7;
      ctx.stroke();
    };

    ordered.forEach(({ box }) => {
      const b = box;
      const front = [pt(b.x, b.y, b.z), pt(b.x + b.w, b.y, b.z), pt(b.x + b.w, b.y, b.z + b.h), pt(b.x, b.y, b.z + b.h)];
      const right = [pt(b.x + b.w, b.y, b.z), pt(b.x + b.w, b.y + b.d, b.z), pt(b.x + b.w, b.y + b.d, b.z + b.h), pt(b.x + b.w, b.y, b.z + b.h)];
      const top = [pt(b.x, b.y, b.z + b.h), pt(b.x + b.w, b.y, b.z + b.h), pt(b.x + b.w, b.y + b.d, b.z + b.h), pt(b.x, b.y + b.d, b.z + b.h)];
      const base = b.color || "#d6d0c2";
      const opacity = b.opacity == null ? 1 : b.opacity;
      /* paint back faces first for translucency */
      if (opacity < 1) {
        const back = [pt(b.x, b.y + b.d, b.z), pt(b.x + b.w, b.y + b.d, b.z), pt(b.x + b.w, b.y + b.d, b.z + b.h), pt(b.x, b.y + b.d, b.z + b.h)];
        paintFace(back, Utils.shade(base, -28), opacity * 0.5);
        paintFace(right, Utils.shade(base, -17), opacity);
        paintFace(top, Utils.shade(base, 15), opacity);
        paintFace(front, Utils.shade(base, 2), opacity);
      } else {
        paintFace(right, Utils.shade(base, -17), 1);
        paintFace(top, Utils.shade(base, 15), 1);
        paintFace(front, Utils.shade(base, 2), 1);
      }
    });
    ctx.globalAlpha = 1;

    /* dimension caption */
    ctx.fillStyle = isDark ? "rgba(220,224,214,.55)" : "rgba(60,64,58,.55)";
    ctx.font = '10.5px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${fmt(item.params.width)} × ${fmt(item.params.height)} × ${fmt(item.params.depth)} ${I18n.t("common.mm")}`, W / 2, H - 18);
  }

  function updateResizeHandles() {
    const wrap = document.querySelector("[data-preview-wrap]");
    if (!wrap) return;
    const widthHandle = wrap.querySelector("[data-resize='width']");
    const heightHandle = wrap.querySelector("[data-resize='height']");
    const doorWidthHandle = wrap.querySelector("[data-resize='doorWidth']");
    const doorHeightHandle = wrap.querySelector("[data-resize='doorHeight']");
    const show = Boolean(previewGeometry);
    const hide = (handle) => {
      if (!handle) return;
      handle.style.display = "none";
    };
    if (!show) {
      hide(widthHandle);
      hide(heightHandle);
      hide(doorWidthHandle);
      hide(doorHeightHandle);
      return;
    }
    if (widthHandle) {
      widthHandle.style.display = "";
      widthHandle.style.left = `${previewGeometry.ox + previewGeometry.drawW}px`;
      widthHandle.style.top = `${previewGeometry.oy + previewGeometry.drawH / 2}px`;
    }
    if (heightHandle) {
      heightHandle.style.display = "";
      heightHandle.style.left = `${previewGeometry.ox + previewGeometry.drawW / 2}px`;
      heightHandle.style.top = `${previewGeometry.oy}px`;
    }
    const doorHandles = previewGeometry.doorHandles;
    if (doorWidthHandle) {
      if (!doorHandles) {
        hide(doorWidthHandle);
      } else {
        doorWidthHandle.style.display = "";
        doorWidthHandle.style.left = `${doorHandles.width.x}px`;
        doorWidthHandle.style.top = `${doorHandles.width.y}px`;
      }
    }
    if (doorHeightHandle) {
      if (!doorHandles) {
        hide(doorHeightHandle);
      } else {
        doorHeightHandle.style.display = "";
        doorHeightHandle.style.left = `${doorHandles.height.x}px`;
        doorHeightHandle.style.top = `${doorHandles.height.y}px`;
      }
    }
  }

  function drawPreview() {
    const canvas = document.querySelector("[data-preview-canvas]");
    if (!canvas) return;
    const project = App.project();
    const item = App.activeItem();
    if (!item) return;
    const wrap = canvas.parentElement;
    if (wrap) wrap.dataset.mode = previewMode;
    if (previewMode === "iso") {
      previewGeometry = null;
      drawIso(canvas, project, item);
    } else {
      previewGeometry = drawFront(canvas, project, item, previewMode);
    }
    updateResizeHandles();
  }

  /* --------------------------------------------------------------- partial */

  function syncStepperStates(view, item) {
    const ranges = Data.PARAM_RANGES[item.template];
    view.querySelectorAll("[data-step-key]").forEach((btn) => {
      const key = btn.getAttribute("data-step-key");
      const range = ranges[key];
      if (!range) return;
      const value = item.params[key];
      btn.disabled = (btn.getAttribute("data-step") === "-1" && value <= range[0]) || (btn.getAttribute("data-step") === "1" && value >= range[1]);
    });
  }

  function syncPreviewControls(view, item) {
    const ranges = Data.PARAM_RANGES[item.template];
    view.querySelectorAll("[data-preview-step]").forEach((btn) => {
      const key = btn.getAttribute("data-preview-step");
      const range = ranges[key];
      if (!range) return;
      const value = Number(item.params[key]) || 0;
      const dir = Number(btn.getAttribute("data-dir")) || 0;
      btn.disabled = dir < 0 ? value <= range[0] : value >= range[1];
    });
    view.querySelectorAll("[data-preview-count]").forEach((el) => {
      const key = el.getAttribute("data-preview-count");
      el.textContent = String(Number(item.params[key]) || 0);
    });
    const sectionStepper = view.querySelector("[data-preview-stepper='doorSections']");
    if (sectionStepper) sectionStepper.hidden = !(Number(item.params.doors) > 0);
    const shelfSectionStepper = view.querySelector("[data-preview-stepper='shelfSections']");
    if (shelfSectionStepper) shelfSectionStepper.hidden = !(Number(item.params.shelves) > 0);
  }

  function updatePreviewModeUi(view, item) {
    const note = view.querySelector("[data-preview-note]");
    if (note) note.textContent = previewNote(item);
    const hint = view.querySelector("[data-preview-hint]");
    if (hint) hint.textContent = previewHint(item);
    view.querySelectorAll("[data-door-sections-group], [data-door-size-group]").forEach((group) => {
      group.hidden = !(Number(item.params.doors) > 0);
    });
    view.querySelectorAll("[data-shelf-sections-group]").forEach((group) => {
      group.hidden = !(Number(item.params.shelves) > 0);
    });
  }

  function updateItemDerived(view) {
    const project = App.project();
    const item = App.activeItem();
    if (!item) return;
    const totals = Model.itemTotals(project, item);
    const parts = Model.itemParts(project, item);
    const dims = `${fmt(item.params.width)} × ${fmt(item.params.height)} × ${fmt(item.params.depth)} ${I18n.t("common.mm")}`;
    view.querySelectorAll("[data-item-dims]").forEach((el) => { el.textContent = dims; });
    const toolbar = view.querySelector("[data-toolbar-parts]");
    if (toolbar) toolbar.textContent = itemStats(item, totals);
    const count = view.querySelector("[data-parts-count]");
    if (count) count.textContent = I18n.t("designer.generatedSub", { rows: I18n.count(parts.length, "row"), parts: I18n.count(totals.units, "part") });
    const tbody = view.querySelector("[data-parts-table-body]");
    if (tbody) tbody.innerHTML = partsTable(project, parts, totals);
    const foot = view.querySelector("[data-preview-foot]");
    if (foot) foot.innerHTML = previewFooter(item, totals);
    const railMeta = view.querySelector(`[data-rail-meta="${item.id}"]`);
    if (railMeta) railMeta.textContent = `${fmt(item.params.width)} × ${fmt(item.params.height)} × ${fmt(item.params.depth)} · ${I18n.count(totals.units, "part")}`;
    updatePreviewModeUi(view, item);
    view.querySelectorAll("[data-value-for]").forEach((el) => {
      const key = el.getAttribute("data-value-for");
      if (key in item.params) el.textContent = `${fmt(item.params[key])} ${I18n.t("common.mm")}`;
    });
    syncStepperStates(view, item);
    syncPreviewControls(view, item);
    requestRedraw();
    App.persist(false);
  }

  function shelfSlotAt(canvas, clientX, clientY) {
    if (!previewGeometry || !Array.isArray(previewGeometry.shelfHits)) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best = null;
    let bestDistance = Infinity;
    previewGeometry.shelfHits.forEach((hit) => {
      if (x < hit.x || x > hit.x + hit.w || y < hit.y || y > hit.y + hit.h) return;
      const distance = Math.abs(y - (hit.y + hit.h / 2));
      if (distance < bestDistance) {
        best = hit;
        bestDistance = distance;
      }
    });
    return best ? best.slot : null;
  }

  function toggleShelf(view, slot) {
    const item = App.activeItem();
    if (!item) return;
    const total = Math.max(0, Math.round(Number(item.params.shelves) || 0));
    if (slot < 1 || slot > total) return;
    const removed = Data.shelfRemovalSet(item);
    if (removed.has(slot)) removed.delete(slot);
    else removed.add(slot);
    item.params.removedShelves = Array.from(removed).sort((a, b) => a - b);
    updateItemDerived(view);
  }

  function bodyThickness(item) {
    const project = App.project();
    const body = Utils.materialById(project, item.bodyMaterialId) || (project.materials || [])[0];
    return body ? body.thickness : 16;
  }

  function clampDoorDimension(item, key) {
    const value = Number(item.params[key]) || 0;
    if (value <= 0) return 0;
    const metrics = Model.doorMetrics(item, bodyThickness(item));
    if (!metrics) return 0;
    const limit = key === "doorWidth" ? metrics.slotW : metrics.openH;
    return Math.min(value, Math.max(1, limit));
  }

  function setParam(view, key, raw) {
    const item = App.activeItem();
    if (!item) return;
    const ranges = Data.PARAM_RANGES[item.template];
    const range = ranges[key];
    if (!range) return;
    let value = UI.parseNumber(raw, item.params[key]);
    value = Math.round(Utils.clamp(value, range[0], range[1]) / range[2]) * range[2];
    item.params[key] = value;
    if (key === "doorWidth" || key === "doorHeight") {
      value = clampDoorDimension(item, key);
      item.params[key] = value;
    }
    if (key === "shelves") {
      item.params.removedShelves = Data.normalizeShelfRemoval(item.params.removedShelves, value);
    }
    const doorAffecting = key === "width" || key === "height" || key === "doors" || key === "doorGap" || key === "plinth";
    if (doorAffecting) {
      ["doorWidth", "doorHeight"].forEach((sizeKey) => {
        if ((Number(item.params[sizeKey]) || 0) > 0) item.params[sizeKey] = clampDoorDimension(item, sizeKey);
      });
    }
    view.querySelectorAll(`[data-param="${key}"]`).forEach((input) => {
      if (input.value !== String(value)) input.value = value;
    });
    if (doorAffecting) {
      ["doorWidth", "doorHeight"].forEach((sizeKey) => {
        view.querySelectorAll(`[data-param="${sizeKey}"]`).forEach((input) => {
          if (input.value !== String(item.params[sizeKey])) input.value = item.params[sizeKey];
        });
      });
    }
    updateItemDerived(view);
  }

  /* ------------------------------------------------------------- templates */

  function createItemFromTemplate(template) {
    const project = App.project();
    const mats = project.materials || [];
    if (!mats.length) {
      UI.toast(I18n.t("materials.errorName"), "error");
      return;
    }
    const body = mats[0];
    const facade = mats.find((m) => m.thickness >= 18) || mats[1] || body;
    const back = mats.find((m) => m.thickness <= 6) || mats[mats.length - 1] || body;
    const baseName = I18n.t(`templates.${template}`);
    const same = project.items.filter((candidate) => candidate.template === template).length;
    const name = same > 0 ? `${baseName} ${same + 1}` : baseName;
    const item = Data.createItem(template, {
      name,
      bodyMaterialId: body.id,
      facadeMaterialId: facade.id,
      backMaterialId: back.id,
    });
    project.items.push(item);
    App.setActiveItem(item.id);
    App.persist(true);
    App.render({ animate: false });
    UI.toast(I18n.t("designer.added"));
  }

  function openTemplateDialog() {
    const choices = Data.TEMPLATES.map((template) => `<button type="button" class="template-choice" data-template="${template}">
      <span class="t-icon">${UI.templateThumb(template)}</span>
      <b>${esc(I18n.t(`templates.${template}`))}</b>
      <span>${esc(I18n.t(`templates.${template}Desc`))}</span>
    </button>`).join("");
    const modal = UI.openModal({
      title: I18n.t("templates.choose"),
      subtitle: I18n.t("templates.chooseHint"),
      body: `<div class="template-grid">${choices}</div>`,
      footer: `<button type="button" class="btn" data-modal-close>${esc(I18n.t("common.cancel"))}</button>`,
    });
    modal.el.querySelectorAll("[data-template]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const template = btn.getAttribute("data-template");
        modal.close();
        createItemFromTemplate(template);
      });
    });
  }

  function deleteItem() {
    const item = App.activeItem();
    if (!item) return;
    UI.confirm({
      title: I18n.t("designer.deleteTitle"),
      message: esc(I18n.t("designer.deleteConfirm", { name: item.name })),
      confirmLabel: I18n.t("common.delete"),
      danger: true,
    }).then((confirmed) => {
      if (!confirmed) return;
      const project = App.project();
      const index = project.items.findIndex((candidate) => candidate.id === item.id);
      project.items = project.items.filter((candidate) => candidate.id !== item.id);
      const next = project.items[Math.min(index, project.items.length - 1)];
      App.setActiveItem(next ? next.id : null);
      App.persist(true);
      App.render({ animate: false });
      UI.toast(I18n.t("designer.deleted"));
    });
  }

  function duplicateItem() {
    const item = App.activeItem();
    if (!item) return;
    const project = App.project();
    const copy = Utils.clone(item);
    copy.id = Utils.uid("item");
    copy.name = `${item.name} (${I18n.t("common.copySuffix")})`;
    copy.createdAt = new Date().toISOString();
    const index = project.items.findIndex((candidate) => candidate.id === item.id);
    project.items.splice(index + 1, 0, copy);
    App.setActiveItem(copy.id);
    App.persist(true);
    App.render({ animate: false });
    UI.toast(I18n.t("designer.duplicated"));
  }

  function doorResizeInfo(axis) {
    if (!previewGeometry || !previewGeometry.doorHandles) return null;
    if (axis === "doorWidth") return previewGeometry.doorHandles.width;
    if (axis === "doorHeight") return previewGeometry.doorHandles.height;
    return null;
  }

  function attachResizeHandle(handle, view) {
    let drag = null;

    const finish = (event) => {
      if (!drag) return;
      if (event && event.pointerId != null && event.pointerId !== drag.pointerId) return;
      try { handle.releasePointerCapture(drag.pointerId); } catch (_) {}
      drag = null;
      handle.classList.remove("dragging");
      document.body.classList.remove("pc-resizing");
      delete document.body.dataset.resizeAxis;
      App.persist(false);
    };

    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || !previewGeometry) return;
      const item = App.activeItem();
      if (!item) return;
      const axis = handle.getAttribute("data-resize");
      const range = Data.PARAM_RANGES[item.template][axis];
      if (!range) return;
      const isDoorResize = axis === "doorWidth" || axis === "doorHeight";
      const doorInfo = isDoorResize ? doorResizeInfo(axis) : null;
      if (isDoorResize && !doorInfo) return;
      event.preventDefault();
      drag = {
        pointerId: event.pointerId,
        axis,
        itemId: item.id,
        startX: event.clientX,
        startY: event.clientY,
        value: doorInfo ? doorInfo.value : Number(item.params[axis]) || 0,
        min: doorInfo ? Math.min(30, doorInfo.max) : range[0],
        max: doorInfo ? doorInfo.max : range[1],
        scale: previewGeometry.scale,
      };
      try { handle.setPointerCapture(event.pointerId); } catch (_) {}
      handle.classList.add("dragging");
      document.body.classList.add("pc-resizing");
      document.body.dataset.resizeAxis = axis;
    });

    handle.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const item = App.activeItem();
      if (!item || item.id !== drag.itemId) return;
      const range = Data.PARAM_RANGES[item.template][drag.axis];
      if (!range) return;
      let delta;
      if (drag.axis === "doorWidth") delta = drag.startX - event.clientX;
      else if (drag.axis === "width") delta = event.clientX - drag.startX;
      else delta = drag.startY - event.clientY;
      const raw = drag.value + delta / Math.max(0.05, drag.scale);
      const step = range[2];
      const next = Utils.clamp(Math.round(raw / step) * step, drag.min, drag.max);
      if (next !== item.params[drag.axis]) setParam(view, drag.axis, next);
    });

    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", finish);
    handle.addEventListener("lostpointercapture", finish);

    handle.addEventListener("keydown", (event) => {
      const forward = event.key === "ArrowRight" || event.key === "ArrowUp";
      const back = event.key === "ArrowLeft" || event.key === "ArrowDown";
      if (!forward && !back) return;
      const axis = handle.getAttribute("data-resize");
      const item = App.activeItem();
      if (!item) return;
      const range = Data.PARAM_RANGES[item.template][axis];
      if (!range) return;
      const isDoorResize = axis === "doorWidth" || axis === "doorHeight";
      const doorInfo = isDoorResize ? doorResizeInfo(axis) : null;
      if (isDoorResize && !doorInfo) return;
      event.preventDefault();
      const base = doorInfo ? doorInfo.value : Number(item.params[axis]) || 0;
      const min = doorInfo ? Math.min(30, doorInfo.max) : range[0];
      const max = doorInfo ? doorInfo.max : range[1];
      setParam(view, axis, Utils.clamp(base + (forward ? range[2] : -range[2]), min, max));
    });
  }

  function onViewInput(event) {
    const view = event.currentTarget;
    const target = event.target;
    if (target.matches("input[type='range'][data-param]")) {
      setParam(view, target.getAttribute("data-param"), target.value);
    }
  }

  function onViewChange(event) {
    const view = event.currentTarget;
    const target = event.target;
    if (target.matches("input[type='number'][data-param]")) {
      setParam(view, target.getAttribute("data-param"), target.value);
      return;
    }
    if (target.matches("select[data-material]")) {
      const current = App.activeItem();
      const field = target.getAttribute("data-material");
      if (current && field) {
        current[field] = target.value;
        App.persist(true);
        App.render({ animate: false });
        UI.toast(I18n.t("toast.saved"));
      }
      return;
    }
    if (target.matches("input[data-toggle='back']")) {
      const current = App.activeItem();
      if (current) {
        current.params.back = target.checked;
        App.persist(true);
        App.render({ animate: false });
      }
    }
  }

  function onViewClick(event) {
    const view = event.currentTarget;
    const step = event.target.closest("[data-step-key]");
    if (step) {
      const key = step.getAttribute("data-step-key");
      const current = App.activeItem();
      if (!current) return;
      const range = Data.PARAM_RANGES[current.template][key];
      if (!range) return;
      const next = Utils.clamp(current.params[key] + Number(step.getAttribute("data-step")), range[0], range[1]);
      setParam(view, key, next);
      return;
    }
    const previewStep = event.target.closest("[data-preview-step]");
    if (previewStep) {
      const key = previewStep.getAttribute("data-preview-step");
      const dir = Number(previewStep.getAttribute("data-dir")) || 0;
      const current = App.activeItem();
      if (!current || !dir) return;
      setParam(view, key, (Number(current.params[key]) || 0) + dir);
      return;
    }
    const canvas = event.target.closest("[data-preview-canvas]");
    if (canvas && previewMode === "layout") {
      const slot = shelfSlotAt(canvas, event.clientX, event.clientY);
      if (slot) {
        toggleShelf(view, slot);
        return;
      }
    }
    const mode = event.target.closest("[data-preview-mode]");
    if (mode) {
      previewMode = mode.getAttribute("data-preview-mode");
      hoverShelfSlot = null;
      view.querySelectorAll("[data-preview-mode]").forEach((btn) => btn.classList.toggle("active", btn === mode));
      const wrap = view.querySelector("[data-preview-wrap]");
      if (wrap) wrap.dataset.mode = previewMode;
      const previewCanvas = view.querySelector("[data-preview-canvas]");
      if (previewCanvas) previewCanvas.style.cursor = "";
      const current = App.activeItem();
      if (current) updatePreviewModeUi(view, current);
      requestRedraw();
    }
  }

  function onViewPointerMove(event) {
    const canvas = event.target.closest ? event.target.closest("[data-preview-canvas]") : null;
    if (!canvas) {
      if (hoverShelfSlot !== null) {
        hoverShelfSlot = null;
        requestRedraw();
      }
      return;
    }
    if (previewMode !== "layout") {
      if (canvas.style.cursor) canvas.style.cursor = "";
      return;
    }
    const slot = shelfSlotAt(canvas, event.clientX, event.clientY);
    canvas.style.cursor = slot ? "pointer" : "";
    if (slot !== hoverShelfSlot) {
      hoverShelfSlot = slot;
      requestRedraw();
    }
  }

  /* ----------------------------------------------------------------- mount */

  function mount(view) {
    const project = App.project();
    const item = App.activeItem();
    if (!item) {
      view.querySelectorAll("[data-designer-action='new-item']").forEach((btn) => btn.addEventListener("click", openTemplateDialog));
      view.querySelectorAll("[data-quick-template]").forEach((btn) => btn.addEventListener("click", () => createItemFromTemplate(btn.getAttribute("data-quick-template"))));
      return;
    }

    view.querySelectorAll("[data-designer-action='new-item']").forEach((btn) => btn.addEventListener("click", openTemplateDialog));
    view.querySelectorAll("[data-quick-template]").forEach((btn) => btn.addEventListener("click", () => createItemFromTemplate(btn.getAttribute("data-quick-template"))));

    view.querySelectorAll(".item-card[data-item-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        App.setActiveItem(btn.getAttribute("data-item-id"));
        App.render({ animate: false });
      });
    });

    const dup = view.querySelector("[data-designer-action='duplicate-item']");
    if (dup) dup.addEventListener("click", duplicateItem);
    const del = view.querySelector("[data-designer-action='delete-item']");
    if (del) del.addEventListener("click", deleteItem);

    const title = view.querySelector("#designer-item-name");
    if (title) {
      title.addEventListener("input", () => {
        const current = App.activeItem();
        if (!current) return;
        current.name = title.value;
        const railName = view.querySelector(`[data-item-name-id="${current.id}"]`);
        if (railName) railName.textContent = title.value;
        App.persist(false);
      });
      title.addEventListener("change", () => {
        const current = App.activeItem();
        if (!current) return;
        if (!title.value.trim()) {
          current.name = I18n.t(`templates.${current.template}`);
          title.value = current.name;
          const railName = view.querySelector(`[data-item-name-id="${current.id}"]`);
          if (railName) railName.textContent = current.name;
          App.persist(false);
        }
      });
    }

    /* The #view element survives re-renders, so re-bind stable handlers idempotently. */
    view.removeEventListener("input", onViewInput);
    view.removeEventListener("change", onViewChange);
    view.removeEventListener("click", onViewClick);
    view.removeEventListener("pointermove", onViewPointerMove);
    view.addEventListener("input", onViewInput);
    view.addEventListener("change", onViewChange);
    view.addEventListener("click", onViewClick);
    view.addEventListener("pointermove", onViewPointerMove);

    hoverShelfSlot = null;
    view.querySelectorAll("[data-resize]").forEach((handle) => attachResizeHandle(handle, view));

    const wrap = view.querySelector("[data-preview-wrap]");
    if (resizeObserver) resizeObserver.disconnect();
    if (wrap && "ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(() => {
        if (requestRedraw) requestRedraw();
      });
      resizeObserver.observe(wrap);
    }
    let frame = 0;
    requestRedraw = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(drawPreview);
    };
    requestRedraw();
  }

  window.Views = window.Views || {};
  window.Views.designer = { render, mount };
})();
