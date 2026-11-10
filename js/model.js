/* PanelCraft — parametric furniture model & parts generation */
(function () {
  "use strict";

  const r1 = (value) => Math.round(value * 10) / 10;
  const positive = (value) => Number.isFinite(value) && value > 1;

  function material(project, id) {
    return (project.materials || []).find((m) => m.id === id) || (project.materials || [])[0] || null;
  }

  function part(item, key, length, width, qty, materialObj, edges, options) {
    if (!positive(length) || !positive(width) || !(qty > 0)) return null;
    const opts = options || {};
    return {
      id: `${item.id}:${key}`,
      nameKey: opts.nameKey === null ? null : (opts.nameKey || key),
      name: opts.name || null,
      length: r1(length),
      width: r1(width),
      qty: Math.max(1, Math.round(qty)),
      thickness: materialObj ? r1(materialObj.thickness) : 0,
      materialId: materialObj ? materialObj.id : "",
      edges: Object.assign({ t: false, b: false, l: false, r: false }, edges || {}),
      grainLock: Boolean(materialObj && materialObj.textured),
      itemId: item.id,
      itemName: item.name,
      kind: "generated",
    };
  }

  function itemParts(project, item) {
    if (!item) return [];
    const p = item.params || {};
    const body = material(project, item.bodyMaterialId);
    const facade = material(project, item.facadeMaterialId) || body;
    const back = material(project, item.backMaterialId) || body;
    if (!body) return [];
    const t = body.thickness;
    const tb = back.thickness;
    const tf = facade.thickness;
    const W = Number(p.width) || 0;
    const H = Number(p.height) || 0;
    const D = Number(p.depth) || 0;
    const nShelves = Math.max(0, Math.round(Number(p.shelves) || 0));
    const nDoors = Math.max(0, Math.round(Number(p.doors) || 0));
    const nDrawers = Math.max(0, Math.round(Number(p.drawers) || 0));
    const plinth = Math.max(0, Number(p.plinth) || 0);
    const gap = Math.max(0, Number(p.doorGap) || 0);
    const innerW = W - 2 * t;
    const withBack = Boolean(p.back);
    const result = [];
    const push = (entry) => { if (entry) result.push(entry); };

    if (item.template === "chest") {
      const sideH = H - t;
      push(part(item, "side", D, sideH, 2, body, { r: true }));
      push(part(item, "bottom", innerW, D, 1, body, { t: true }));
      push(part(item, "topOverlay", W, D, 1, body, { t: true }));
      if (withBack) push(part(item, "back", innerW, sideH - t, 1, back, {}, { nameKey: "back" }));

      if (nDrawers > 0) {
        const frontH = (H - plinth - (nDrawers + 1) * gap) / nDrawers;
        const frontW = W - 2 * gap;
        if (frontH > 40) {
          push(part(item, "drawerFront", frontW, frontH, nDrawers, facade, { t: true, b: true, l: true, r: true }));
          const boxH = Math.max(60, frontH - 36);
          const boxD = Math.max(150, D - 55);
          const boxW = Math.max(150, innerW - 30);
          push(part(item, "drawerSide", boxD, boxH, nDrawers * 2, body, {}));
          push(part(item, "drawerBox", boxW, boxH, nDrawers * 2, body, {}));
          push(part(item, "drawerBottom", Math.max(80, boxW - 20), Math.max(80, boxD - 20), nDrawers, back, {}));
        }
      }
      if (plinth > 0) push(part(item, "plinth", W, plinth, 1, body, { t: true, b: true }, { nameKey: "plinth" }));
      return result;
    }

    if (item.template === "rack") {
      const sideH = H - t;
      push(part(item, "side", D, sideH, 2, body, { r: true }));
      push(part(item, "bottom", innerW, D, 1, body, { t: true }));
      push(part(item, "topOverlay", W, D, 1, body, { t: true }));
      if (withBack) push(part(item, "back", innerW, sideH - t, 1, back, {}, { nameKey: "back" }));
      if (nShelves > 0) {
        push(part(item, "shelf", Math.max(50, innerW - 2), Math.max(50, D - 20), nShelves, body, { t: true }));
      }
      if (plinth > 0) push(part(item, "plinth", W, plinth, 1, body, { t: true, b: true }, { nameKey: "plinth" }));
      return result;
    }

    /* Case cabinet: full-height sides, inset top and bottom */
    push(part(item, "side", D, H, 2, body, { r: true }));
    push(part(item, "bottom", innerW, D, 1, body, { t: true }));
    push(part(item, "top", innerW, D, 1, body, { t: true }));
    if (withBack) push(part(item, "back", innerW, H - 2 * t, 1, back, {}, { nameKey: "back" }));
    if (nShelves > 0) {
      push(part(item, "shelf", Math.max(50, innerW - 2), Math.max(50, D - 30), nShelves, body, { t: true }));
    }
    if (nDoors > 0) {
      const doorW = (W - (nDoors + 1) * gap) / nDoors;
      const doorH = H - plinth - 2 * gap;
      if (doorW > 30 && doorH > 30) {
        push(part(item, "door", doorW, doorH, nDoors, facade, { t: true, b: true, l: true, r: true }));
      }
    }
    if (plinth > 0) push(part(item, "plinth", W, plinth, 1, body, { t: true, b: true }, { nameKey: "plinth" }));
    return result;
  }

  function projectRows(project) {
    const rows = [];
    (project.items || []).forEach((item) => {
      itemParts(project, item).forEach((entry) => rows.push(entry));
    });
    (project.customParts || []).forEach((custom) => {
      const mat = material(project, custom.materialId);
      if (!mat) return;
      rows.push({
        id: custom.id,
        nameKey: null,
        name: custom.name,
        length: r1(custom.length),
        width: r1(custom.width),
        qty: Math.max(1, Math.round(custom.qty)),
        thickness: r1(mat.thickness),
        materialId: mat.id,
        edges: Object.assign({ t: false, b: false, l: false, r: false }, custom.edges || {}),
        grainLock: Boolean(custom.grainLock || mat.textured),
        itemId: null,
        itemName: null,
        kind: "custom",
      });
    });
    return rows;
  }

  function bandingLength(part) {
    let total = 0;
    if (part.edges.t) total += part.length;
    if (part.edges.b) total += part.length;
    if (part.edges.l) total += part.width;
    if (part.edges.r) total += part.width;
    return (total * part.qty) / 1000;
  }

  function totals(rows) {
    let positions = rows.length;
    let units = 0;
    let areaMm2 = 0;
    let banding = 0;
    const materialIds = new Set();
    rows.forEach((entry) => {
      units += entry.qty;
      areaMm2 += entry.length * entry.width * entry.qty;
      banding += bandingLength(entry);
      materialIds.add(entry.materialId);
    });
    return {
      positions,
      units,
      areaM2: areaMm2 / 1e6,
      bandingM: banding,
      materialCount: materialIds.size,
    };
  }

  function itemTotals(project, item) {
    return totals(itemParts(project, item));
  }

  function materialUsage(project, materialId) {
    const items = (project.items || []).filter((item) =>
      item.bodyMaterialId === materialId || item.facadeMaterialId === materialId || item.backMaterialId === materialId);
    const custom = (project.customParts || []).filter((part) => part.materialId === materialId);
    return { items, customParts: custom, count: items.length + custom.length };
  }

  function boxes(project, item) {
    const p = item.params || {};
    const body = material(project, item.bodyMaterialId);
    const facade = material(project, item.facadeMaterialId) || body;
    const backMat = material(project, item.backMaterialId) || body;
    if (!body) return [];
    const t = body.thickness;
    const tb = backMat.thickness;
    const tf = facade.thickness;
    const W = Number(p.width) || 0;
    const H = Number(p.height) || 0;
    const D = Number(p.depth) || 0;
    const plinth = Math.max(0, Number(p.plinth) || 0);
    const gap = Math.max(0, Number(p.doorGap) || 0);
    const innerW = W - 2 * t;
    const list = [];
    const add = (x, y, z, w, d, h, color, kind, opacity) => {
      if (w <= 0 || d <= 0 || h <= 0) return;
      list.push({ x, y, z, w, d, h, color, kind: kind || "panel", opacity: opacity == null ? 1 : opacity });
    };
    const light = Utils.shade(body.color, 16);

    if (item.template === "cabinet") {
      add(0, 0, 0, t, D, H, body.color, "side");
      add(W - t, 0, 0, t, D, H, body.color, "side");
      add(t, 0, 0, innerW, D, t, body.color, "panel");
      add(t, 0, H - t, innerW, D, t, body.color, "panel");
      if (p.back) add(t, D - tb, t, innerW, tb, H - 2 * t, backMat.color, "back");
      const n = Math.max(0, Math.round(Number(p.shelves) || 0));
      for (let i = 1; i <= n; i += 1) {
        const z = t + (H - 2 * t) * (i / (n + 1)) - t / 2;
        add(t + 1, 20, z, innerW - 2, Math.max(50, D - 30), t, light, "shelf");
      }
      if (Number(p.doors) > 0) {
        const nd = Math.max(1, Math.round(Number(p.doors)));
        const doorW = (W - (nd + 1) * gap) / nd;
        const doorH = H - plinth - 2 * gap;
        for (let i = 0; i < nd; i += 1) {
          add(gap + i * (doorW + gap), -tf, plinth + gap, doorW, tf, doorH, facade.color, "door", 0.88);
        }
      }
      if (plinth > 0) add(12, 30, 0, W - 24, t, plinth, Utils.shade(body.color, -12), "plinth");
    } else if (item.template === "chest") {
      const sideH = H - t;
      add(0, 0, 0, t, D, sideH, body.color, "side");
      add(W - t, 0, 0, t, D, sideH, body.color, "side");
      add(t, 0, 0, innerW, D, t, body.color, "panel");
      add(0, 0, H - t, W, D, t, light, "top");
      if (p.back) add(t, D - tb, t, innerW, tb, sideH - t, backMat.color, "back");
      const n = Math.max(0, Math.round(Number(p.drawers) || 0));
      if (n > 0) {
        const frontH = (H - plinth - (n + 1) * gap) / n;
        const frontW = W - 2 * gap;
        if (frontH > 40) {
          const boxH = Math.max(60, frontH - 36);
          const boxD = Math.max(150, D - 55);
          const boxW = Math.max(150, innerW - 30);
          for (let i = 0; i < n; i += 1) {
            const z = plinth + gap + i * (frontH + gap);
            add(gap, -tf, z, frontW, tf, frontH, facade.color, "drawerFront", 0.94);
            add(t + 15, 28, z + 18, boxW, boxD, boxH, light, "drawerBox", 0.5);
            add(t + 15, 28, z + 18, boxW, t, boxH, Utils.shade(body.color, -5), "drawerBox", 0.8);
          }
        }
      }
      if (plinth > 0) add(12, 30, 0, W - 24, t, plinth, Utils.shade(body.color, -12), "plinth");
    } else {
      const sideH = H - t;
      add(0, 0, 0, t, D, sideH, body.color, "side");
      add(W - t, 0, 0, t, D, sideH, body.color, "side");
      add(t, 0, 0, innerW, D, t, body.color, "panel");
      add(0, 0, H - t, W, D, t, light, "top");
      if (p.back) add(t, D - tb, t, innerW, tb, sideH - t, backMat.color, "back");
      const n = Math.max(0, Math.round(Number(p.shelves) || 0));
      for (let i = 1; i <= n; i += 1) {
        const z = t + (H - 2 * t) * (i / (n + 1)) - t / 2;
        add(t + 1, 0, z, innerW - 2, Math.max(50, D - 20), t, light, "shelf");
      }
      if (plinth > 0) add(12, 30, 0, W - 24, t, plinth, Utils.shade(body.color, -12), "plinth");
    }
    return list;
  }

  window.Model = {
    itemParts,
    projectRows,
    totals,
    itemTotals,
    bandingLength,
    materialUsage,
    boxes,
    material,
  };
})();
