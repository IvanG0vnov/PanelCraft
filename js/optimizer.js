/* PanelCraft — 2D cutting / nesting optimizer */
(function () {
  "use strict";

  const EPS = 1e-7;

  function expandParts(project, rows) {
    const grouped = new Map();
    const warnings = [];
    rows.forEach((row) => {
      const mat = Utils.materialById(project, row.materialId);
      if (!mat) {
        warnings.push({ type: "material", nameKey: row.nameKey, name: row.name, materialId: row.materialId });
        return;
      }
      if (!grouped.has(mat.id)) grouped.set(mat.id, { material: mat, parts: [] });
      const qty = Math.max(1, Math.round(row.qty || 1));
      for (let i = 0; i < qty; i += 1) {
        grouped.get(mat.id).parts.push({
          row,
          key: `${row.id}#${i}`,
          length: row.length,
          width: row.width,
          grainLock: Boolean(row.grainLock || mat.textured),
        });
      }
    });
    return { grouped, warnings };
  }

  function sortedParts(parts, mode) {
    const list = parts.slice();
    list.sort((a, b) => {
      const areaA = a.length * a.width;
      const areaB = b.length * b.width;
      if (mode === "max") {
        const maxA = Math.max(a.length, a.width);
        const maxB = Math.max(b.length, b.width);
        if (maxB !== maxA) return maxB - maxA;
        if (areaB !== areaA) return areaB - areaA;
      } else if (mode === "height") {
        const minA = Math.min(a.length, a.width);
        const minB = Math.min(b.length, b.width);
        if (minB !== minA) return minB - minA;
        if (areaB !== areaA) return areaB - areaA;
      } else {
        if (areaB !== areaA) return areaB - areaA;
        const maxA = Math.max(a.length, a.width);
        const maxB = Math.max(b.length, b.width);
        if (maxB !== maxA) return maxB - maxA;
      }
      return String(a.key).localeCompare(String(b.key));
    });
    return list;
  }

  function orientations(part, allowRotate, kerf) {
    const list = [{ w: part.length + kerf, h: part.width + kerf, rotated: false }];
    if (allowRotate && !part.grainLock && part.length !== part.width) {
      list.push({ w: part.width + kerf, h: part.length + kerf, rotated: true });
    }
    return list;
  }

  function freeRectPrune(free) {
    const sorted = free.filter((r) => r.w > 0.01 && r.h > 0.01);
    sorted.sort((a, b) => (b.w * b.h) - (a.w * a.h) || b.w - a.w || b.h - a.h);
    const out = [];
    for (let i = 0; i < sorted.length; i += 1) {
      const r = sorted[i];
      let contained = false;
      for (let j = 0; j < out.length; j += 1) {
        const o = out[j];
        if (r.x >= o.x - EPS && r.y >= o.y - EPS && r.x + r.w <= o.x + o.w + EPS && r.y + r.h <= o.y + o.h + EPS) {
          contained = true;
          break;
        }
      }
      if (!contained) out.push(r);
    }
    return out;
  }

  function splitFree(free, placed) {
    const next = [];
    const px2 = placed.x + placed.w;
    const py2 = placed.y + placed.h;
    free.forEach((f) => {
      const fx2 = f.x + f.w;
      const fy2 = f.y + f.h;
      if (px2 <= f.x + EPS || placed.x >= fx2 - EPS || py2 <= f.y + EPS || placed.y >= fy2 - EPS) {
        next.push(f);
        return;
      }
      if (placed.x > f.x + EPS) next.push({ x: f.x, y: f.y, w: placed.x - f.x, h: f.h });
      if (px2 < fx2 - EPS) next.push({ x: px2, y: f.y, w: fx2 - px2, h: f.h });
      const ox1 = Math.max(f.x, placed.x);
      const ox2 = Math.min(fx2, px2);
      if (placed.y > f.y + EPS) next.push({ x: ox1, y: f.y, w: ox2 - ox1, h: placed.y - f.y });
      if (py2 < fy2 - EPS) next.push({ x: ox1, y: py2, w: ox2 - ox1, h: fy2 - py2 });
    });
    return freeRectPrune(next);
  }

  function scoreCandidate(candidate, heuristic) {
    const lw = candidate.f.w - candidate.w;
    const lh = candidate.f.h - candidate.h;
    if (heuristic === "baf") return [lw * lh, Math.min(lw, lh), candidate.f.y, candidate.f.x, candidate.binIndex];
    if (heuristic === "bl") return [candidate.f.y + candidate.h, candidate.f.x, lw * lh];
    return [Math.min(lw, lh), Math.max(lw, lh), candidate.f.y, candidate.f.x, candidate.binIndex];
  }

  function compareScore(a, b) {
    for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
      const av = a[i] == null ? 0 : a[i];
      const bv = b[i] == null ? 0 : b[i];
      if (Math.abs(av - bv) > EPS) return av - bv;
    }
    return 0;
  }

  function packMaxRects(parts, binW, binH, kerf, allowRotate, minOffcut, heuristic, sortMode) {
    const bins = [];
    const skipped = [];
    const ordered = sortedParts(parts, sortMode);
    ordered.forEach((part) => {
      const ors = orientations(part, allowRotate, kerf);
      let best = null;
      bins.forEach((bin, binIndex) => {
        bin.free.forEach((f) => {
          ors.forEach((or) => {
            if (or.w <= f.w + EPS && or.h <= f.h + EPS) {
              const candidate = { bin, binIndex, f, w: or.w, h: or.h, rotated: or.rotated, part };
              if (!best || compareScore(scoreCandidate(candidate, heuristic), scoreCandidate(best, heuristic)) < 0) {
                best = candidate;
              }
            }
          });
        });
      });
      if (!best) {
        let chosen = null;
        const empty = { x: 0, y: 0, w: binW, h: binH };
        ors.forEach((or) => {
          if (or.w <= binW + EPS && or.h <= binH + EPS) {
            const candidate = { bin: { free: [empty], placements: [] }, binIndex: bins.length, f: empty, w: or.w, h: or.h, rotated: or.rotated, part };
            if (!chosen || compareScore(scoreCandidate(candidate, heuristic), scoreCandidate(chosen, heuristic)) < 0) chosen = candidate;
          }
        });
        if (!chosen) { skipped.push(part); return; }
        chosen.bin = { free: [empty], placements: [] };
        bins.push(chosen.bin);
        best = chosen;
      }
      best.bin.placements.push({
        x: best.f.x, y: best.f.y, w: best.w, h: best.h,
        rotated: best.rotated, part, packedW: best.w, packedH: best.h,
      });
      best.bin.free = splitFree(best.bin.free, { x: best.f.x, y: best.f.y, w: best.w, h: best.h });
    });
    return { bins, skipped };
  }

  function guillotineFree(bin, binW, binH) {
    const free = [];
    bin.shelves.forEach((shelf) => {
      if (binW - shelf.usedX > 0.5) free.push({ x: shelf.usedX, y: shelf.y, w: binW - shelf.usedX, h: shelf.h });
    });
    if (binH - bin.usedY > 0.5) free.push({ x: 0, y: bin.usedY, w: binW, h: binH - bin.usedY });
    return freeRectPrune(free);
  }

  function packGuillotine(parts, binW, binH, kerf, allowRotate, minOffcut, sortMode) {
    const bins = [];
    const skipped = [];
    const ordered = sortedParts(parts, sortMode);
    ordered.forEach((part) => {
      const ors = orientations(part, allowRotate, kerf);

      /* 1. Try an existing shelf */
      let candidate = null;
      bins.forEach((bin, binIndex) => {
        bin.shelves.forEach((shelf) => {
          ors.forEach((or) => {
            if (or.w <= binW - shelf.usedX + EPS && or.h <= shelf.h + EPS) {
              const score = [shelf.h - or.h, binW - shelf.usedX - or.w, binIndex];
              if (!candidate || compareScore(score, candidate.score) < 0) {
                candidate = { type: "shelf", bin, binIndex, shelf, or, score };
              }
            }
          });
        });
      });
      if (candidate) {
        const { bin, shelf, or } = candidate;
        bin.placements.push({ x: shelf.usedX, y: shelf.y, w: or.w, h: or.h, rotated: or.rotated, part });
        shelf.usedX += or.w;
        return;
      }

      /* 2. Open a new shelf in an existing sheet */
      let open = null;
      bins.forEach((bin, binIndex) => {
        ors.forEach((or) => {
          if (or.w <= binW + EPS && bin.usedY + or.h <= binH + EPS) {
            const score = [binH - bin.usedY - or.h, binIndex, or.rotated ? 1 : 0];
            if (!open || compareScore(score, open.score) < 0) {
              open = { type: "newShelf", bin, binIndex, or, score };
            }
          }
        });
      });
      if (open) {
        const { bin, or } = open;
        const shelf = { y: bin.usedY, h: or.h, usedX: or.w };
        bin.shelves.push(shelf);
        bin.usedY += or.h;
        bin.placements.push({ x: 0, y: shelf.y, w: or.w, h: or.h, rotated: or.rotated, part });
        return;
      }

      /* 3. New sheet */
      let fresh = null;
      ors.forEach((or) => {
        if (or.w <= binW + EPS && or.h <= binH + EPS) {
          const score = [or.h, or.w, or.rotated ? 1 : 0];
          if (!fresh || compareScore(score, fresh.score) < 0) fresh = { or, score };
        }
      });
      if (!fresh) { skipped.push(part); return; }
      const bin = { shelves: [], usedY: 0, placements: [], free: [] };
      const shelf = { y: 0, h: fresh.or.h, usedX: fresh.or.w };
      bin.shelves.push(shelf);
      bin.usedY = fresh.or.h;
      bin.placements.push({ x: 0, y: 0, w: fresh.or.w, h: fresh.or.h, rotated: fresh.or.rotated, part });
      bins.push(bin);
    });
    bins.forEach((bin) => {
      bin.free = guillotineFree(bin, binW, binH);
    });
    return { bins, skipped };
  }

  function offcutsFromBins(bins, trim, minOffcut) {
    return bins.map((bin) => {
      const list = [];
      const seen = new Set();
      bin.free.forEach((f) => {
        const w = Math.round(f.w * 10) / 10;
        const h = Math.round(f.h * 10) / 10;
        if (w >= minOffcut && h >= minOffcut) {
          const key = `${Math.round(f.x)}:${Math.round(f.y)}:${w}:${h}`;
          if (!seen.has(key)) {
            seen.add(key);
            list.push({ x: Math.round((f.x + trim) * 10) / 10, y: Math.round((f.y + trim) * 10) / 10, w, h });
          }
        }
      });
      list.sort((a, b) => b.w * b.h - a.w * a.h);
      return list;
    });
  }

  function largestOffcutArea(bins, trim, minOffcut) {
    let max = 0;
    bins.forEach((bin) => {
      bin.free.forEach((f) => {
        if (f.w >= minOffcut && f.h >= minOffcut) max = Math.max(max, f.w * f.h);
      });
    });
    return max;
  }

  function betterResult(a, b, trim, minOffcut) {
    if (!b) return true;
    if (a.bins.length !== b.bins.length) return a.bins.length < b.bins.length;
    const aLarge = largestOffcutArea(a.bins, trim, minOffcut);
    const bLarge = largestOffcutArea(b.bins, trim, minOffcut);
    if (Math.abs(aLarge - bLarge) > 1) return aLarge > bLarge;
    let aFree = 0, bFree = 0;
    a.bins.forEach((bin) => bin.free.forEach((f) => { aFree += f.w * f.h; }));
    b.bins.forEach((bin) => bin.free.forEach((f) => { bFree += f.w * f.h; }));
    return aFree > bFree;
  }

  function buildSheets(pack, trim, minOffcut, material, kerf) {
    const offcutsBySheet = offcutsFromBins(pack.bins, trim, minOffcut);
    return pack.bins.map((bin, index) => {
      let usedArea = 0;
      const placements = bin.placements.map((pl) => {
        const part = pl.part;
        const w = pl.rotated ? part.width : part.length;
        const h = pl.rotated ? part.length : part.width;
        usedArea += w * h;
        const row = part.row;
        return {
          partId: row.id,
          name: row.name,
          nameKey: row.nameKey,
          color: Data.partColor(row),
          materialId: row.materialId,
          x: Math.round((pl.x + trim) * 10) / 10,
          y: Math.round((pl.y + trim) * 10) / 10,
          w: Math.round(w * 10) / 10,
          h: Math.round(h * 10) / 10,
          length: row.length,
          width: row.width,
          thickness: row.thickness,
          rotated: pl.rotated,
          grainLock: part.grainLock,
        };
      });
      const sheetArea = material.sheetW * material.sheetH;
      return {
        index: index + 1,
        placements,
        offcuts: offcutsBySheet[index] || [],
        usedArea,
        sheetArea,
        wasteArea: Math.max(0, sheetArea - usedArea),
        wastePct: sheetArea > 0 ? ((sheetArea - usedArea) / sheetArea) * 100 : 0,
        cost: material.price,
      };
    });
  }

  function optimizeRows(project, rows) {
    const settings = Object.assign({
      kerf: 4, trim: 10, allowRotation: true, algorithm: "maxrects", minOffcut: 200,
    }, project.cutting || {});
    const kerf = Math.max(0, Number(settings.kerf) || 0);
    const trim = Math.max(0, Number(settings.trim) || 0);
    const allowRotation = settings.allowRotation !== false;
    const algorithm = settings.algorithm === "guillotine" ? "guillotine" : "maxrects";
    const minOffcut = Math.max(40, Number(settings.minOffcut) || 200);

    const { grouped, warnings: baseWarnings } = expandParts(project, rows);
    const groups = [];
    const warnings = baseWarnings.slice();
    let totalParts = 0;
    let placedParts = 0;

    grouped.forEach((entry) => {
      const mat = entry.material;
      const parts = entry.parts;
      totalParts += parts.length;
      const usableW = mat.sheetW - trim * 2;
      const usableH = mat.sheetH - trim * 2;

      if (usableW <= 10 || usableH <= 10) {
        warnings.push({ type: "sheet", materialName: mat.name, count: parts.length });
        return;
      }

      const variants = [];
      if (algorithm === "guillotine") {
        variants.push({ mode: "guillotine", sortMode: "max" });
        variants.push({ mode: "guillotine", sortMode: "area" });
      } else {
        variants.push({ mode: "maxrects", heuristic: "bssf", sortMode: "area" });
        variants.push({ mode: "maxrects", heuristic: "baf", sortMode: "area" });
        variants.push({ mode: "maxrects", heuristic: "bssf", sortMode: "max" });
        variants.push({ mode: "maxrects", heuristic: "baf", sortMode: "max" });
      }

      let best = null;
      const skippedMap = new Map();
      variants.forEach((variant) => {
        const result = variant.mode === "guillotine"
          ? packGuillotine(parts, usableW, usableH, kerf, allowRotation, minOffcut, variant.sortMode)
          : packMaxRects(parts, usableW, usableH, kerf, allowRotation, minOffcut, variant.heuristic, variant.sortMode);
        result.skipped.forEach((p) => skippedMap.set(p.key, p));
        if (betterResult(result, best, trim, minOffcut)) best = result;
      });

      if (!best) best = { bins: [], skipped: parts };
      const sheets = buildSheets(best, trim, minOffcut, mat, kerf);
      const skipped = Array.from(skippedMap.values());
      skipped.forEach((p) => {
        warnings.push({
          type: "oversized",
          nameKey: p.row.nameKey,
          name: p.row.name,
          width: p.row.length,
          height: p.row.width,
          material: mat.name,
        });
      });

      const placed = sheets.reduce((sum, sheet) => sum + sheet.placements.length, 0);
      placedParts += placed;
      const sheetArea = mat.sheetW * mat.sheetH * sheets.length;
      const usedArea = sheets.reduce((sum, sheet) => sum + sheet.usedArea, 0);
      const wasteArea = Math.max(0, sheetArea - usedArea);
      const allOffcuts = sheets.flatMap((sheet) => sheet.offcuts);
      const offcutArea = allOffcuts.reduce((sum, o) => sum + o.w * o.h, 0);

      groups.push({
        materialId: mat.id,
        materialName: mat.name,
        materialColor: mat.color,
        thickness: mat.thickness,
        sheetW: mat.sheetW,
        sheetH: mat.sheetH,
        price: mat.price,
        textured: mat.textured,
        sheets,
        sheetCount: sheets.length,
        placedParts: placed,
        totalParts: parts.length,
        usedArea,
        sheetArea,
        wasteArea,
        wastePct: sheetArea > 0 ? (wasteArea / sheetArea) * 100 : 0,
        cost: mat.price * sheets.length,
        offcuts: allOffcuts,
        offcutArea,
      });
    });

    const sheetArea = groups.reduce((sum, g) => sum + g.sheetArea, 0);
    const usedArea = groups.reduce((sum, g) => sum + g.usedArea, 0);
    const cost = groups.reduce((sum, g) => sum + g.cost, 0);
    const sheets = groups.reduce((sum, g) => sum + g.sheetCount, 0);
    const wasteArea = Math.max(0, sheetArea - usedArea);

    return {
      groups,
      warnings,
      settings: { kerf, trim, allowRotation, algorithm, minOffcut },
      totals: {
        sheets,
        totalParts,
        placedParts,
        usedArea,
        sheetArea,
        wasteArea,
        wastePct: sheetArea > 0 ? (wasteArea / sheetArea) * 100 : 0,
        cost,
        offcutArea: groups.reduce((sum, g) => sum + g.offcutArea, 0),
      },
    };
  }

  function optimize(project) {
    const rows = Model.projectRows(project);
    return optimizeRows(project, rows);
  }

  window.Optimizer = { optimize, optimizeRows, packMaxRects, packGuillotine };
})();
