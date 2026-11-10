/* PanelCraft — exporters */
(function () {
  "use strict";

  function csvCell(value) {
    const text = value == null ? "" : String(value);
    if (/[";\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  }

  function toCsv(rows) {
    const body = rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
    return `\uFEFF${body}\r\n`;
  }

  function edgeText(part) {
    const labels = [];
    if (part.edges && part.edges.t) labels.push(I18n.t("parts.edgeTop"));
    if (part.edges && part.edges.b) labels.push(I18n.t("parts.edgeBottom"));
    if (part.edges && part.edges.l) labels.push(I18n.t("parts.edgeLeft"));
    if (part.edges && part.edges.r) labels.push(I18n.t("parts.edgeRight"));
    return labels.length ? labels.join(", ") : I18n.t("parts.edgeNone");
  }

  function partDisplayName(part) {
    return part.nameKey ? I18n.partName(part) : part.name;
  }

  function bomRows(project, rows) {
    const header = [
      I18n.t("parts.tablePart"), I18n.t("parts.tableMaterial"), I18n.t("common.thickness") + ", " + I18n.t("common.mm"),
      I18n.t("parts.length") + ", " + I18n.t("common.mm"), I18n.t("parts.width") + ", " + I18n.t("common.mm"),
      I18n.t("parts.tableQty"), I18n.t("parts.tableEdges"), I18n.t("parts.tableGrain"), I18n.t("parts.tableSource"),
    ];
    const body = rows.map((part) => {
      const material = Utils.materialById(project, part.materialId);
      return [
        partDisplayName(part),
        material ? material.name : "—",
        part.thickness,
        part.length,
        part.width,
        part.qty,
        edgeText(part),
        part.grainLock ? I18n.t("parts.grainLockedShort") : I18n.t("parts.grainFree"),
        part.kind === "custom" ? I18n.t("parts.sourceCustom") : `${I18n.t("parts.sourceItem", { name: part.itemName })}`,
      ];
    });
    return [header].concat(body);
  }

  function cutRows(result) {
    const header = [
      I18n.t("cutting.sheetTitle", { n: "#" }), I18n.t("common.material"), I18n.t("common.thickness") + ", " + I18n.t("common.mm"),
      I18n.t("materials.sheetLength") + ", " + I18n.t("common.mm"),
      I18n.t("materials.sheetWidth") + ", " + I18n.t("common.mm"),
      I18n.t("parts.tablePart"), I18n.t("parts.length") + ", " + I18n.t("common.mm"),
      I18n.t("parts.width") + ", " + I18n.t("common.mm"), "X, " + I18n.t("common.mm"), "Y, " + I18n.t("common.mm"),
      I18n.t("parts.grain"), I18n.t("parts.tableEdges"),
    ];
    const body = [];
    result.groups.forEach((group) => {
      group.sheets.forEach((sheet) => {
        sheet.placements.forEach((pl) => {
          body.push([
            sheet.index,
            group.materialName,
            group.thickness,
            group.sheetW,
            group.sheetH,
            pl.nameKey ? I18n.partName(pl) : pl.name,
            pl.length,
            pl.width,
            pl.x,
            pl.y,
            pl.rotated ? "90°" : "0°",
            edgeText(pl),
          ]);
        });
      });
    });
    return [header].concat(body);
  }

  function downloadBom(project, rows) {
    const csv = toCsv(bomRows(project, rows));
    Utils.download(`${Utils.slug(project.name, "panelcraft")}_parts_${Utils.stamp()}.csv`, csv, "text/csv;charset=utf-8");
  }

  function downloadCut(project, result) {
    const csv = toCsv(cutRows(result));
    Utils.download(`${Utils.slug(project.name, "panelcraft")}_cutting_${Utils.stamp()}.csv`, csv, "text/csv;charset=utf-8");
  }

  function projectJson(project) {
    return JSON.stringify({
      app: "PanelCraft",
      schema: 1,
      exportedAt: new Date().toISOString(),
      project,
    }, null, 2);
  }

  function downloadProject(project) {
    Utils.download(
      `${Utils.slug(project.name, "panelcraft")}_${Utils.stamp()}.json`,
      projectJson(project),
      "application/json;charset=utf-8"
    );
  }

  window.Exporters = { bomRows, cutRows, toCsv, downloadBom, downloadCut, projectJson, downloadProject, partDisplayName, edgeText };
})();
