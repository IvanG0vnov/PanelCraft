/* PanelCraft — cutting / nesting view */
(function () {
  "use strict";

  const esc = UI.esc;
  const fmt = (n) => Utils.formatMm(n);
  let lastResult = null;
  let svgUid = 0;

  function warningText(warning) {
    if (warning.type === "oversized") {
      return I18n.t("cutting.oversized", {
        name: I18n.partName(warning),
        w: fmt(warning.width),
        h: fmt(warning.height),
        material: warning.material,
      });
    }
    if (warning.type === "sheet") {
      return I18n.t("cutting.warningSheet", { material: warning.materialName });
    }
    return I18n.t("cutting.warningMaterial", { name: I18n.partName(warning) });
  }

  function warningsMarkup(warnings) {
    if (!warnings.length) return "";
    return `<div class="waste-note" style="align-items:flex-start;flex-direction:column">
      <div style="display:flex;gap:8px;align-items:center;font-weight:650">${UI.icon("warning")}${esc(I18n.t("cutting.warnings"))} · ${warnings.length}</div>
      <ul style="margin:6px 0 0 20px;padding:0;font-weight:400">
        ${warnings.slice(0, 12).map((warning) => `<li style="margin:2px 0">${esc(warningText(warning))}</li>`).join("")}
      </ul>
    </div>`;
  }

  function labelForPlacement(placement) {
    const name = I18n.partName(placement);
    return name.length > 24 ? `${name.slice(0, 23)}…` : name;
  }

  function sheetSvg(group, sheet) {
    const W = group.sheetW;
    const H = group.sheetH;
    const patternId = `pc-hatch-${++svgUid}`;
    const base = Utils.shade(group.materialColor || "#ded7c8", 82);
    const dimsColor = "#8c887c";
    const offcutRects = sheet.offcuts.map((offcut) =>
      `<rect x="${offcut.x}" y="${offcut.y}" width="${offcut.w}" height="${offcut.h}" fill="url(#${patternId})" stroke="#cec7b8" stroke-width="1" stroke-dasharray="8 6" vector-effect="non-scaling-stroke"><title>${esc(I18n.t("cutting.offcuts"))} ${fmt(offcut.w)} × ${fmt(offcut.h)}</title></rect>`
    ).join("");
    const parts = sheet.placements.map((pl) => {
      const fill = pl.color;
      const stroke = Utils.shade(fill, -32);
      const textColor = Utils.shade(fill, -58);
      const minSide = Math.min(pl.w, pl.h);
      const canLabel = pl.w * pl.h > 42000 && minSide > 95;
      let label = "";
      if (canLabel) {
        const fs = Math.max(22, Math.min(44, minSide * 0.14));
        const cx = pl.x + pl.w / 2;
        const cy = pl.y + pl.h / 2;
        const rotate = pl.h > pl.w * 1.35 && pl.w < 320;
        const name = labelForPlacement(pl);
        const dims = `${fmt(pl.length)} × ${fmt(pl.width)}`;
        label = `<g ${rotate ? `transform="rotate(-90 ${cx} ${cy})"` : ""}>
          <text x="${cx}" y="${cy - fs * 0.38}" text-anchor="middle" dominant-baseline="middle" font-size="${fs}" fill="${textColor}" font-weight="600" font-family="Segoe UI, system-ui, sans-serif">${esc(name)}</text>
          <text x="${cx}" y="${cy + fs * 0.72}" text-anchor="middle" dominant-baseline="middle" font-size="${fs * 0.78}" fill="${textColor}" opacity=".82" font-family="Segoe UI, system-ui, sans-serif">${esc(dims)}</text>
        </g>`;
      }
      return `<g>
        <rect class="part-rect" x="${pl.x}" y="${pl.y}" width="${pl.w}" height="${pl.h}" rx="1.5" fill="${fill}" fill-opacity=".92" stroke="${stroke}" stroke-width="1.1" vector-effect="non-scaling-stroke"><title>${esc(I18n.partName(pl))} · ${fmt(pl.length)} × ${fmt(pl.width)}${pl.rotated ? ` · ${esc(I18n.t("cutting.rotateHintBadge"))}` : ""}</title></rect>
        ${label}
      </g>`;
    }).join("");

    return `<svg class="sheet-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(I18n.t("cutting.sheetTitle", { n: sheet.index }))}">
      <defs>
        <pattern id="${patternId}" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="22" height="22" fill="#f1ede3"></rect>
          <line x1="0" y1="0" x2="0" y2="22" stroke="#d8d1c1" stroke-width="2"></line>
        </pattern>
      </defs>
      <rect x="0" y="0" width="${W}" height="${H}" fill="${base}"></rect>
      <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="#cfc8b8" stroke-width="2" vector-effect="non-scaling-stroke"></rect>
      ${offcutRects}
      ${parts}
      <text x="${W - 24}" y="${H - 20}" text-anchor="end" font-size="26" fill="${dimsColor}" font-family="Segoe UI, system-ui, sans-serif">${fmt(W)} × ${fmt(H)}</text>
    </svg>`;
  }

  function sheetCard(group, sheet) {
    const usedPct = 100 - sheet.wastePct;
    const wasteVariant = sheet.wastePct > 30 ? "danger" : sheet.wastePct > 18 ? "amber" : "green";
    const offcutBlock = sheet.offcuts.length > 0 ? `<details class="offcut-details">
      <summary>${UI.icon("ruler")}${esc(I18n.t("cutting.offcuts"))} · ${I18n.count(sheet.offcuts.length, "offcut")}</summary>
      <div class="offcut-list">
        ${sheet.offcuts.map((offcut) => `<div class="offcut-item"><span>${fmt(offcut.w)} × ${fmt(offcut.h)} ${esc(I18n.t("common.mm"))}</span><b>${I18n.area((offcut.w * offcut.h) / 1e6)}</b></div>`).join("")}
      </div>
    </details>` : "";
    return `<article class="card sheet-card">
      <div class="sheet-card-head">
        <div class="sheet-card-title"><span class="sheet-index">${sheet.index}</span>${esc(I18n.t("cutting.sheetTitle", { n: sheet.index }))}</div>
        <div class="sheet-badges">
          <span class="badge badge-${wasteVariant}">${esc(I18n.t("cutting.wasteShort"))} ${I18n.pct(sheet.wastePct)}</span>
        </div>
      </div>
      ${sheetSvg(group, sheet)}
      <div class="sheet-foot">
        <span>${esc(I18n.t("cutting.sheetUsed", { pct: I18n.pct(usedPct) }))}</span>
        <span>${esc(I18n.count(sheet.placements.length, "part"))} · ${UI.money(App.project(), sheet.cost)}</span>
      </div>
      ${offcutBlock}
    </article>`;
  }

  function groupMarkup(group) {
    const usedSheet = group.sheets.length;
    if (!usedSheet) return "";
    const thicknessLabel = `${fmt(group.thickness)} ${I18n.t("common.mm")}`;
    const thicknessPattern = new RegExp(`(^|[^0-9])${fmt(group.thickness).replace(/[.,]/g, "[.,]")}\\s*(мм|mm)(?![а-яa-z])`, "i");
    const showThickness = !thicknessPattern.test(String(group.materialName || ""));
    return `<section class="material-group">
      <div class="material-group-head">
        <h3><span class="material-dot" style="background:${esc(group.materialColor)};width:10px;height:10px"></span>${esc(group.materialName)}
          ${showThickness ? `<span class="badge">${thicknessLabel}</span>` : ""}</h3>
        <span class="meta">
          <span>${esc(I18n.t("cutting.groupMeta", { sheets: I18n.count(group.sheetCount, "sheet"), parts: I18n.count(group.placedParts, "part") }))}</span>
          <span>${esc(I18n.t("cutting.wasteShort"))} <b>${I18n.pct(group.wastePct)}</b></span>
          <span>${esc(I18n.t("cutting.costShort"))} <b>${UI.money(App.project(), group.cost)}</b></span>
          <span>${fmt(group.sheetW)} × ${fmt(group.sheetH)} ${esc(I18n.t("common.mm"))}</span>
        </span>
      </div>
      <div class="sheet-grid">
        ${group.sheets.map((sheet) => sheetCard(group, sheet)).join("")}
      </div>
    </section>`;
  }

  function render() {
    const project = App.project();
    const result = Optimizer.optimize(project);
    lastResult = result;
    const settings = project.cutting;
    const rows = Model.projectRows(project);
    const hasParts = rows.length > 0;
    const totals = result.totals;
    const actions = hasParts
      ? `<button class="btn" data-route="parts">${UI.icon("parts")}${esc(I18n.t("parts.allParts"))}</button>
         <button class="btn" data-cut-action="export">${UI.icon("download")}${esc(I18n.t("cutting.exportCsv"))}</button>
         <button class="btn btn-primary" data-cut-action="print">${UI.icon("print")}${esc(I18n.t("cutting.printReport"))}</button>`
      : `<button class="btn" data-route="designer">${UI.icon("designer")}${esc(I18n.t("nav.designer"))}</button>`;
    const head = UI.pageHead(I18n.t("page.cutting.title"), I18n.t("page.cutting.subtitle"), actions);

    const settingsCard = `<div class="card cut-settings no-print">
      <div class="card-head">
        <div>
          <div class="card-title">${esc(I18n.t("cutting.paramsTitle"))}</div>
          <div class="card-sub">${esc(I18n.t("cutting.paramsSub"))}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span class="toolbar-meta">${esc(I18n.t("cutting.autoNote"))}</span>
          <button class="btn btn-sm" data-cut-action="recalc">${UI.icon("rotate")}${esc(I18n.t("cutting.recalc"))}</button>
        </div>
      </div>
      <div class="settings-inline">
        <div class="field">
          <label class="field-label" for="cut-kerf">${esc(I18n.t("cutting.kerf"))} <span class="field-hint">${esc(I18n.t("common.mm"))}</span></label>
          <input id="cut-kerf" type="number" class="input" min="0" max="20" step="1" value="${settings.kerf}" data-cut-field="kerf">
        </div>
        <div class="field">
          <label class="field-label" for="cut-trim">${esc(I18n.t("cutting.trim"))} <span class="field-hint">${esc(I18n.t("common.mm"))}</span></label>
          <input id="cut-trim" type="number" class="input" min="0" max="50" step="1" value="${settings.trim}" data-cut-field="trim">
        </div>
        <div class="field">
          <label class="field-label" for="cut-min">${esc(I18n.t("cutting.minOffcut"))} <span class="field-hint">${esc(I18n.t("common.mm"))}</span></label>
          <input id="cut-min" type="number" class="input" min="40" max="1000" step="10" value="${settings.minOffcut}" data-cut-field="minOffcut">
        </div>
        <div class="field">
          <label class="field-label" for="cut-algorithm">${esc(I18n.t("cutting.algorithm"))}</label>
          <select id="cut-algorithm" class="select" data-cut-field="algorithm">
            <option value="maxrects" ${settings.algorithm === "maxrects" ? "selected" : ""}>${esc(I18n.t("cutting.algorithmMR"))}</option>
            <option value="guillotine" ${settings.algorithm === "guillotine" ? "selected" : ""}>${esc(I18n.t("cutting.algorithmG"))}</option>
          </select>
        </div>
        <div class="field">
          ${UI.switchRow({ title: I18n.t("cutting.rotate"), sub: I18n.t("cutting.rotateHint"), checked: settings.allowRotation, data: 'data-cut-toggle="allowRotation"' })}
        </div>
      </div>
    </div>`;

    if (!hasParts) {
      return `${head}${settingsCard}
        ${UI.emptyState("cut", I18n.t("cutting.noResultsTitle"), I18n.t("cutting.noResultsHint"),
          `<button class="btn btn-primary" data-route="designer">${UI.icon("designer")}${esc(I18n.t("cutting.goDesigner"))}</button>`)}`;
    }

    const warningBlock = warningsMarkup(result.warnings);
    const resultsBlock = result.groups.some((group) => group.sheets.length)
      ? `<div class="result-toolbar">
          <div>
            <h3>${esc(I18n.t("cutting.resultsTitle"))}</h3>
            <p>${esc(I18n.t("cutting.resultsSub"))} · ${esc(I18n.t("cutting.algorithmNote"))}</p>
          </div>
        </div>
        ${result.groups.map(groupMarkup).join("")}
        <div class="cut-footnote">${UI.icon("info")}<span>${esc(I18n.t("cutting.printNote"))} · ${esc(I18n.date(new Date().toISOString()))}</span></div>`
      : `${UI.emptyState("cut", I18n.t("cutting.noResultsTitle"), I18n.t("cutting.noResultsHint"),
          `<button class="btn btn-primary" data-route="designer">${UI.icon("designer")}${esc(I18n.t("cutting.goDesigner"))}</button>`)}`;

    const stats = `<div class="metric-grid cut-summary">
      ${UI.metric(I18n.t("cutting.statSheets"), I18n.number(totals.sheets, 0), esc(I18n.t("cutting.areaShort", { n: I18n.number(totals.sheetArea / 1e6, 2) })), "sheet")}
      ${UI.metric(I18n.t("cutting.statWaste"), I18n.pct(totals.wastePct), esc(I18n.t("cutting.statsWasteHint")), "warning")}
      ${UI.metric(I18n.t("cutting.statCost"), UI.money(project, totals.cost), esc(I18n.t("cutting.statsCostHint")), "euro")}
      ${UI.metric(I18n.t("cutting.statParts"), I18n.number(totals.placedParts, 0), esc(I18n.t("cutting.statsSheetsHint", { parts: I18n.count(totals.placedParts, "part") })), "parts")}
    </div>`;

    return `${head}${settingsCard}
      ${warningBlock ? `<div style="margin-top:14px">${warningBlock}</div>` : ""}
      ${stats}
      ${resultsBlock}`;
  }

  function updateSetting(project, field, value) {
    if (field === "kerf") project.cutting.kerf = Utils.clamp(UI.parseNumber(value, 4), 0, 20);
    else if (field === "trim") project.cutting.trim = Utils.clamp(UI.parseNumber(value, 10), 0, 50);
    else if (field === "minOffcut") project.cutting.minOffcut = Utils.clamp(UI.parseNumber(value, 200), 40, 1000);
    else if (field === "algorithm") project.cutting.algorithm = value === "guillotine" ? "guillotine" : "maxrects";
  }

  function mount(view) {
    view.querySelectorAll("[data-cut-field]").forEach((input) => {
      input.addEventListener("change", () => {
        const project = App.project();
        updateSetting(project, input.getAttribute("data-cut-field"), input.value);
        App.persist(true);
        App.render({ animate: false });
      });
    });
    view.querySelectorAll("[data-cut-toggle]").forEach((input) => {
      input.addEventListener("change", () => {
        const project = App.project();
        const field = input.getAttribute("data-cut-toggle");
        if (field === "allowRotation") project.cutting.allowRotation = input.checked;
        App.persist(true);
        App.render({ animate: false });
      });
    });
    view.querySelectorAll("[data-cut-action='recalc']").forEach((btn) => btn.addEventListener("click", () => {
      App.persist(true);
      App.render({ animate: false });
      UI.toast(I18n.t("cutting.recalculatedToast"));
    }));
    view.querySelectorAll("[data-cut-action='export']").forEach((btn) => btn.addEventListener("click", () => {
      const project = App.project();
      const result = lastResult || Optimizer.optimize(project);
      Exporters.downloadCut(project, result);
      UI.toast(I18n.t("common.export"));
    }));
    view.querySelectorAll("[data-cut-action='print']").forEach((btn) => btn.addEventListener("click", () => window.print()));
  }

  window.Views = window.Views || {};
  window.Views.cutting = { render, mount };
})();
