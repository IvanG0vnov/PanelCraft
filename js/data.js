/* PanelCraft — utilities, defaults and project schema */
(function () {
  "use strict";

  let seq = 0;
  function uid(prefix) {
    seq += 1;
    return `${prefix || "id"}_${Date.now().toString(36)}_${seq.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }

  const Utils = {
    uid,
    clone(value) {
      try { return structuredClone(value); } catch (_) { return JSON.parse(JSON.stringify(value)); }
    },
    clamp(value, min, max) {
      return Math.min(max, Math.max(min, Number(value) || 0));
    },
    escapeHtml(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    },
    debounce(fn, wait) {
      let timer = null;
      return function debounced(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), wait);
      };
    },
    download(filename, content, mime) {
      const blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    },
    readFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error || new Error("Read error"));
        reader.readAsText(file, "utf-8");
      });
    },
    slug(value, fallback) {
      const text = String(value || "").trim().toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
      return text || fallback || "panelcraft";
    },
    stamp() {
      const d = new Date();
      const p = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
    },
    formatMm(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) return "—";
      try {
        return new Intl.NumberFormat(I18n.locale(), { maximumFractionDigits: 1, useGrouping: false }).format(n);
      } catch (_) {
        return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
      }
    },
    shade(hex, percent) {
      let h = String(hex || "#cccccc").replace("#", "");
      if (h.length === 3) h = h.split("").map((c) => c + c).join("");
      const num = parseInt(h, 16);
      if (Number.isNaN(num)) return hex || "#cccccc";
      let r = (num >> 16) & 255;
      let g = (num >> 8) & 255;
      let b = num & 255;
      const t = percent < 0 ? 0 : 255;
      const p = Math.abs(percent) / 100;
      r = Math.round((t - r) * p + r);
      g = Math.round((t - g) * p + g);
      b = Math.round((t - b) * p + b);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    },
    rgba(hex, alpha) {
      let h = String(hex || "#cccccc").replace("#", "");
      if (h.length === 3) h = h.split("").map((c) => c + c).join("");
      const num = parseInt(h, 16);
      if (Number.isNaN(num)) return `rgba(200,200,200,${alpha})`;
      return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${alpha})`;
    },
    isLight(hex) {
      let h = String(hex || "#ffffff").replace("#", "");
      if (h.length === 3) h = h.split("").map((c) => c + c).join("");
      const num = parseInt(h, 16);
      if (Number.isNaN(num)) return true;
      const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
      return (r * 299 + g * 587 + b * 114) / 1000 > 150;
    },
    materialById(project, id) {
      return (project.materials || []).find((m) => m.id === id) || null;
    },
    itemById(project, id) {
      return (project.items || []).find((i) => i.id === id) || null;
    },
  };

  function L(ru, en) { return I18n.getLang() === "ru" ? ru : en; }

  const PART_PALETTE = [
    "#e0ad79", "#a7c4a2", "#a7bedc", "#e3c982", "#c7b0d8",
    "#9bcbc6", "#dfa5a0", "#c1ce8c", "#b0b7db", "#d6ae8d",
  ];

  function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function partColor(part) {
    const key = `${part.nameKey || part.name || ""}|${part.id || ""}`;
    if (!key) return PART_PALETTE[0];
    return PART_PALETTE[hashString(key) % PART_PALETTE.length];
  }

  const PARAM_RANGES = {
    cabinet: {
      width: [300, 1600, 10], height: [300, 2400, 10], depth: [250, 700, 10],
      shelves: [0, 8, 1], doors: [0, 4, 1], doorSections: [1, 4, 1], drawers: [0, 0, 1], plinth: [0, 200, 10], doorGap: [2, 8, 1],
    },
    chest: {
      width: [400, 1800, 10], height: [450, 1400, 10], depth: [350, 700, 10],
      shelves: [0, 0, 1], doors: [0, 0, 1], drawers: [1, 6, 1], plinth: [0, 200, 10], doorGap: [2, 8, 1],
    },
    rack: {
      width: [300, 2400, 10], height: [600, 2700, 10], depth: [200, 600, 10],
      shelves: [0, 10, 1], doors: [0, 0, 1], drawers: [0, 0, 1], plinth: [0, 200, 10], doorGap: [2, 8, 1],
    },
  };

  const TEMPLATES = ["cabinet", "chest", "rack"];
  const CURRENCIES = [
    { code: "RUB", symbol: "₽" }, { code: "BYN", symbol: "Br" }, { code: "EUR", symbol: "€" },
    { code: "USD", symbol: "$" }, { code: "KZT", symbol: "₸" }, { code: "UAH", symbol: "₴" }, { code: "GBP", symbol: "£" },
  ];

  function createDefaultMaterials() {
    return [
      { id: uid("mat"), name: L("ЛДСП Белый", "White melamine"), color: "#f0ece2", sheetW: 2750, sheetH: 1830, thickness: 16, price: 3200, textured: false },
      { id: uid("mat"), name: L("ЛДСП Дуб Сонома", "Sonoma oak melamine"), color: "#c69b64", sheetW: 2750, sheetH: 1830, thickness: 16, price: 4100, textured: true },
      { id: uid("mat"), name: L("ХДФ Белый 4 мм", "White HDF 4 mm"), color: "#ebe6da", sheetW: 2440, sheetH: 1220, thickness: 4, price: 780, textured: false },
      { id: uid("mat"), name: L("МДФ Эмаль Графит", "Graphite lacquered MDF"), color: "#515752", sheetW: 2800, sheetH: 1220, thickness: 18, price: 5200, textured: false },
    ];
  }

  function baseParams(template) {
    if (template === "chest") {
      return { width: 900, height: 800, depth: 450, shelves: 0, doors: 0, drawers: 3, plinth: 60, doorGap: 3, back: true };
    }
    if (template === "rack") {
      return { width: 800, height: 1800, depth: 350, shelves: 4, doors: 0, drawers: 0, plinth: 0, doorGap: 0, back: false };
    }
    return { width: 800, height: 860, depth: 560, shelves: 1, doors: 2, doorSections: 1, drawers: 0, plinth: 100, doorGap: 3, back: true };
  }

  function normalizeShelfRemoval(value, shelves) {
    const max = Math.max(0, Math.round(Number(shelves) || 0));
    const seen = new Set();
    const result = [];
    (Array.isArray(value) ? value : []).forEach((entry) => {
      const slot = Math.round(Number(entry));
      if (Number.isFinite(slot) && slot >= 1 && slot <= max && !seen.has(slot)) {
        seen.add(slot);
        result.push(slot);
      }
    });
    return result.sort((a, b) => a - b);
  }

  function shelfRemovalSet(item) {
    const params = item && item.params ? item.params : {};
    return new Set(normalizeShelfRemoval(params.removedShelves, params.shelves));
  }

  function createItem(template, options) {
    const opts = options || {};
    const material = opts.material || null;
    const bodyMaterialId = opts.bodyMaterialId || (material && material.id) || "";
    const facadeMaterialId = opts.facadeMaterialId || bodyMaterialId;
    const backMaterialId = opts.backMaterialId || bodyMaterialId;
    const params = Object.assign(baseParams(template), opts.params || {});
    const ranges = PARAM_RANGES[template] || PARAM_RANGES.cabinet;
    Object.keys(ranges).forEach((key) => {
      if (typeof params[key] === "number") params[key] = Utils.clamp(params[key], ranges[key][0], ranges[key][1]);
    });
    params.removedShelves = normalizeShelfRemoval(params.removedShelves, params.shelves);
    return {
      id: opts.id || uid("item"),
      template: TEMPLATES.includes(template) ? template : "cabinet",
      name: opts.name || I18n.t(`templates.${template}`),
      bodyMaterialId,
      facadeMaterialId,
      backMaterialId,
      params,
      createdAt: opts.createdAt || new Date().toISOString(),
    };
  }

  function pickMaterials(project) {
    const mats = project.materials || [];
    return {
      white: mats[0],
      oak: mats[1] || mats[0],
      hdf: mats.find((m) => m.thickness <= 6) || mats[mats.length - 1],
      facade: mats.find((m) => m.thickness >= 18) || mats[1] || mats[0],
    };
  }

  function createSampleProject() {
    const materials = createDefaultMaterials();
    const project = {
      id: uid("prj"),
      name: L("Кухня «Ольха»", "Alder Kitchen"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currency: "RUB",
      edgeThickness: 2,
      cutting: { kerf: 4, trim: 10, allowRotation: true, algorithm: "maxrects", minOffcut: 200 },
      materials,
      items: [],
      customParts: [],
    };
    const pick = pickMaterials(project);
    const shared = {
      bodyMaterialId: pick.white.id,
      facadeMaterialId: pick.facade.id,
      backMaterialId: pick.hdf.id,
    };

    project.items.push(createItem("cabinet", Object.assign({}, shared, {
      name: L("Тумба под мойку", "Sink base unit"),
      params: { width: 800, height: 860, depth: 560, shelves: 1, doors: 2, plinth: 100, doorGap: 3, back: true },
    })));
    project.items.push(createItem("cabinet", Object.assign({}, shared, {
      name: L("Пенал высокий", "Tall pantry"),
      params: { width: 600, height: 2100, depth: 560, shelves: 4, doors: 2, plinth: 0, doorGap: 3, back: true },
    })));
    project.items.push(createItem("chest", Object.assign({}, shared, {
      name: L("Комод «Три ящика»", "Three-drawer chest"),
      params: { width: 900, height: 800, depth: 450, drawers: 3, plinth: 60, doorGap: 3, back: true },
    })));
    project.items.push(createItem("rack", {
      name: L("Стеллаж дубовый", "Oak shelving"),
      bodyMaterialId: pick.oak.id,
      facadeMaterialId: pick.oak.id,
      backMaterialId: pick.hdf.id,
      params: { width: 800, height: 1800, depth: 350, shelves: 4, plinth: 0, back: false },
    }));
    project.customParts.push({
      id: uid("part"),
      name: L("Полка угловая", "Corner shelf"),
      length: 600,
      width: 350,
      qty: 2,
      materialId: pick.oak.id,
      edges: { t: true, b: false, l: true, r: true },
      grainLock: true,
    });
    return project;
  }

  function createEmptyProject() {
    const materials = createDefaultMaterials();
    return {
      id: uid("prj"),
      name: L("Новый проект", "New project"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currency: "RUB",
      edgeThickness: 2,
      cutting: { kerf: 4, trim: 10, allowRotation: true, algorithm: "maxrects", minOffcut: 200 },
      materials,
      items: [],
      customParts: [],
    };
  }

  function createInitialState() {
    let theme = "light";
    try {
      theme = localStorage.getItem("panelcraft.theme") || theme;
    } catch (_) {}
    if (theme !== "light" && theme !== "dark") theme = "light";
    return {
      schema: 1,
      ui: { lang: I18n.getLang(), theme },
      project: createSampleProject(),
    };
  }

  function normalizeEdges(edges) {
    const e = edges || {};
    return { t: Boolean(e.t), b: Boolean(e.b), l: Boolean(e.l), r: Boolean(e.r) };
  }

  function num(value, fallback, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Utils.clamp(n, min, max);
  }

  function normalizeProject(raw) {
    if (!raw || typeof raw !== "object") throw new Error("Invalid project");
    const source = raw.project && raw.project.materials ? raw.project : raw;
    const materials = Array.isArray(source.materials)
      ? source.materials.filter((m) => m && typeof m === "object").map((m) => ({
          id: String(m.id || uid("mat")),
          name: String(m.name || I18n.t("common.unnamed")).slice(0, 120),
          color: /^#[0-9a-f]{6}$/i.test(String(m.color)) ? m.color : "#cfc8ba",
          sheetW: num(m.sheetW, 2750, 200, 6000),
          sheetH: num(m.sheetH, 1830, 200, 6000),
          thickness: num(m.thickness, 16, 0.5, 60),
          price: num(m.price, 0, 0, 1000000),
          textured: Boolean(m.textured),
        }))
      : [];
    if (!materials.length) materials.push(...createDefaultMaterials());
    const fallbackMaterial = materials[0];

    const items = Array.isArray(source.items) ? source.items.filter((it) => it && TEMPLATES.includes(it.template)).map((it) => {
      const ranges = PARAM_RANGES[it.template];
      const params = Object.assign(baseParams(it.template), it.params || {});
      Object.keys(ranges).forEach((key) => {
        if (typeof params[key] === "number" || key in params) {
          params[key] = num(params[key], baseParams(it.template)[key], ranges[key][0], ranges[key][1]);
        }
      });
      params.back = Boolean(params.back);
      return createItem(it.template, {
        id: String(it.id || uid("item")),
        name: String(it.name || I18n.t(`templates.${it.template}`)).slice(0, 120),
        bodyMaterialId: materials.some((m) => m.id === it.bodyMaterialId) ? it.bodyMaterialId : fallbackMaterial.id,
        facadeMaterialId: materials.some((m) => m.id === it.facadeMaterialId) ? it.facadeMaterialId : fallbackMaterial.id,
        backMaterialId: materials.some((m) => m.id === it.backMaterialId) ? it.backMaterialId : fallbackMaterial.id,
        params,
        createdAt: it.createdAt,
      });
    }) : [];

    const customParts = Array.isArray(source.customParts) ? source.customParts.filter((p) => p && typeof p === "object").map((p) => ({
      id: String(p.id || uid("part")),
      name: String(p.name || I18n.t("common.custom")).slice(0, 120),
      length: num(p.length, 500, 10, 6000),
      width: num(p.width, 300, 10, 6000),
      qty: Math.round(num(p.qty, 1, 1, 999)),
      materialId: materials.some((m) => m.id === p.materialId) ? p.materialId : fallbackMaterial.id,
      edges: normalizeEdges(p.edges),
      grainLock: Boolean(p.grainLock),
    })) : [];

    const cuttingSrc = source.cutting || {};
    const cutting = {
      kerf: num(cuttingSrc.kerf, 4, 0, 30),
      trim: num(cuttingSrc.trim, 10, 0, 100),
      allowRotation: cuttingSrc.allowRotation !== false,
      algorithm: cuttingSrc.algorithm === "guillotine" ? "guillotine" : "maxrects",
      minOffcut: num(cuttingSrc.minOffcut, 200, 40, 2000),
    };
    const currency = CURRENCIES.some((c) => c.code === source.currency) ? source.currency : "RUB";

    return {
      id: String(source.id || uid("prj")),
      name: String(source.name || I18n.t("project.name")).slice(0, 120),
      createdAt: source.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currency,
      edgeThickness: num(source.edgeThickness, 2, 0.3, 10),
      cutting,
      materials,
      items,
      customParts,
    };
  }

  function normalizeState(raw) {
    const state = createInitialState();
    if (!raw || typeof raw !== "object") return state;
    const lang = raw.ui && raw.ui.lang === "en" ? "en" : "ru";
    const theme = raw.ui && raw.ui.theme === "dark" ? "dark" : "light";
    return {
      schema: 1,
      ui: { lang, theme },
      project: normalizeProject(raw),
    };
  }

  window.Utils = Utils;
  window.Data = {
    TEMPLATES,
    PARAM_RANGES,
    CURRENCIES,
    PART_PALETTE,
    partColor,
    createDefaultMaterials,
    createEmptyProject,
    createSampleProject,
    createInitialState,
    createItem,
    baseParams,
    normalizeShelfRemoval,
    shelfRemovalSet,
    normalizeProject,
    normalizeState,
  };
})();
